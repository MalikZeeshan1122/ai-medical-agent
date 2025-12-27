import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, providerId, userId, testConfig } = await req.json();
    console.log('Private AI chat request:', { providerId, userId, messageCount: messages?.length, isTest: !!testConfig });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let provider;
    let healthContext = '';

    // Handle test configuration
    if (testConfig) {
      console.log('Using test configuration');
      provider = {
        provider_name: testConfig.provider_name,
        model_name: testConfig.model_name,
        api_key_encrypted: testConfig.api_key,
        provider_config: testConfig.config || {},
      };
      // Skip health context for test connections
    } else {
      // Get user's AI provider configuration
      let providerQuery = supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (providerId) {
        providerQuery = providerQuery.eq('id', providerId);
      } else {
        providerQuery = providerQuery.eq('is_default', true);
      }

      const { data: providers, error: providerError } = await providerQuery.limit(1);

      if (providerError) {
        console.error('Provider query error:', providerError);
        throw new Error(`Failed to fetch AI provider: ${providerError.message}`);
      }
      if (!providers || providers.length === 0) {
        throw new Error('No active AI provider configured. Please add one in AI Settings at /ai-settings');
      }

      provider = providers[0];
      console.log('Provider config:', JSON.stringify(provider.provider_config));
      console.log('Using provider:', provider.display_name, provider.provider_name, provider.model_name);

      // Fetch user's health context for private assistant (with error handling for missing tables)
      try {
        const [profileData, medicationsData, allergiesData, appointmentsData] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(r => r.error ? { data: null } : r),
          supabase.from('medications').select('*').eq('user_id', userId).eq('is_current', true).then(r => r.error ? { data: [] } : r),
          supabase.from('allergies').select('*').eq('user_id', userId).then(r => r.error ? { data: [] } : r),
          supabase.from('appointments').select('*').eq('user_id', userId)
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true}).limit(5).then(r => r.error ? { data: [] } : r),
        ]);

        // Build context string
        healthContext = buildHealthContext(
          profileData.data,
          medicationsData.data || [],
          allergiesData.data || [],
          appointmentsData.data || []
        );
      } catch (contextError) {
        console.warn('Failed to fetch health context:', contextError);
        healthContext = ''; // Continue without context if tables don\'t exist
      }
    }

    // Route to appropriate AI provider
    let response;
    switch (provider.provider_name) {
      case 'lovable':
        response = await callLovableAI(messages, provider.model_name, healthContext);
        break;
      case 'openai':
        response = await callOpenAI(messages, provider.api_key_encrypted, provider.model_name, healthContext);
        break;
      case 'gemini':
        response = await callGemini(messages, provider.api_key_encrypted, provider.model_name, healthContext);
        break;
      case 'anthropic':
        response = await callAnthropic(messages, provider.api_key_encrypted, provider.model_name, healthContext);
        break;
      case 'groq':
        response = await callCustomProvider(
          messages,
          provider.api_key_encrypted,
          provider.model_name,
          healthContext,
          provider.provider_config || { base_url: 'https://api.groq.com/openai/v1' }
        );
        break;
      case 'custom':
        response = await callCustomProvider(messages, provider.api_key_encrypted, provider.model_name, healthContext, provider.provider_config);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider.provider_name}`);
    }

    // Save conversation to history (skip for test connections)
    if (!testConfig && provider.id) {
      await supabase.from('ai_chat_messages').insert([
        {
          user_id: userId,
          provider_id: provider.id,
          role: 'user',
          content: messages[messages.length - 1].content,
          model_used: provider.model_name,
        },
        {
          user_id: userId,
          provider_id: provider.id,
          role: 'assistant',
          content: response.content,
          model_used: provider.model_name,
          tokens_used: response.tokens || null,
        }
      ]);
    }

    return new Response(
      JSON.stringify({ 
        content: response.content,
        model: provider.model_name,
        provider: provider.provider_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in private-ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildHealthContext(profile: any, medications: any[], allergies: any[], appointments: any[]): string {
  let context = "USER'S PRIVATE HEALTH INFORMATION:\n\n";
  
  if (profile) {
    context += `Patient: ${profile.full_name || 'Unknown'}\n`;
    if (profile.date_of_birth) context += `Age: ${calculateAge(profile.date_of_birth)} years\n`;
    if (profile.blood_type) context += `Blood Type: ${profile.blood_type}\n`;
    if (profile.gender) context += `Gender: ${profile.gender}\n`;
  }

  if (allergies.length > 0) {
    context += `\nAllergies:\n${allergies.map(a => `- ${a.allergen} (${a.severity || 'unknown severity'})`).join('\n')}\n`;
  }

  if (medications.length > 0) {
    context += `\nCurrent Medications:\n${medications.map(m => `- ${m.medication_name}: ${m.dosage}, ${m.frequency}`).join('\n')}\n`;
  }

  if (appointments.length > 0) {
    context += `\nUpcoming Appointments:\n${appointments.map(a => `- ${a.appointment_date} with ${a.doctor_name}`).join('\n')}\n`;
  }

  return context;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

async function callLovableAI(messages: any[], model: string, healthContext: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const systemPrompt = `You are a private health assistant with access to the user's confidential health information. Use this information to provide personalized health advice, reminders, and support. Always maintain privacy and encourage users to consult healthcare professionals for medical decisions.\n\n${healthContext}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
    }),
  });

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again in a moment.');
  }
  if (response.status === 402) {
    throw new Error('Payment required. Please add credits to your workspace.');
  }
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    throw new Error('AI service error');
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage?.total_tokens,
  };
}

async function callOpenAI(messages: any[], apiKey: string, model: string, healthContext: string) {
  const systemPrompt = `You are a private health assistant with access to the user's confidential health information. Use this information to provide personalized health advice, reminders, and support. Always maintain privacy and encourage users to consult healthcare professionals for medical decisions.\n\n${healthContext}`;

  const isNewModel = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o3', 'o4-mini'].some(m => model.includes(m));

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  };

  if (isNewModel) {
    requestBody.max_completion_tokens = 4000;
  } else {
    requestBody.max_tokens = 4000;
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage?.total_tokens,
  };
}

async function callGemini(messages: any[], apiKey: string, model: string, healthContext: string) {
  const systemPrompt = `You are a private health assistant with access to the user's confidential health information. Use this information to provide personalized health advice, reminders, and support. Always maintain privacy and encourage users to consult healthcare professionals for medical decisions.\n\n${healthContext}`;

  // Convert messages format for Gemini
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add system prompt as first message
  contents.unshift({
    role: 'user',
    parts: [{ text: systemPrompt }]
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    tokens: data.usageMetadata?.totalTokenCount,
  };
}

async function callAnthropic(messages: any[], apiKey: string, model: string, healthContext: string) {
  const systemPrompt = `You are a private health assistant with access to the user's confidential health information. Use this information to provide personalized health advice, reminders, and support. Always maintain privacy and encourage users to consult healthcare professionals for medical decisions.\n\n${healthContext}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic error:', response.status, errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    tokens: data.usage?.input_tokens + data.usage?.output_tokens,
  };
}

async function callCustomProvider(messages: any[], apiKey: string, model: string, healthContext: string, config: any) {
  const systemPrompt = `You are a private health assistant with access to the user's confidential health information. Use this information to provide personalized health advice, reminders, and support. Always maintain privacy and encourage users to consult healthcare professionals for medical decisions.\n\n${healthContext}`;

  // Get base URL from config, default to OpenAI-compatible endpoint
  let baseUrl = config?.base_url || 'https://api.groq.com/openai/v1';
  
  // Ensure base URL ends with proper path
  if (!baseUrl.endsWith('/chat/completions') && !baseUrl.endsWith('/v1')) {
    baseUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
  } else if (baseUrl.endsWith('/v1')) {
    baseUrl = `${baseUrl}/chat/completions`;
  }

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: config?.temperature || 0.7,
    max_tokens: config?.max_tokens || 4000,
  };

  if (config?.top_p) requestBody.top_p = config.top_p;
  if (config?.frequency_penalty) requestBody.frequency_penalty = config.frequency_penalty;
  if (config?.presence_penalty) requestBody.presence_penalty = config.presence_penalty;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Custom provider error:', response.status, errorText);
    
    // Try to parse error details
    let errorDetails = '';
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = errorJson.error?.message || errorJson.message || '';
    } catch {
      errorDetails = errorText;
    }
    
    throw new Error(`Custom provider API error (${response.status}): ${errorDetails || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage?.total_tokens,
  };
}
