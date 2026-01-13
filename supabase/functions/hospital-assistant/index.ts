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
    const { query, hospitalName } = await req.json();
    console.log('Hospital query:', query, 'for hospital:', hospitalName);

    if (!query) {
      throw new Error('Query is required');
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured. Please add it in Supabase Edge Functions Secrets.');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find relevant hospital information
    let hospitalContext = '';
    
    if (hospitalName) {
      // Search for the specific hospital
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('*, hospital_pages(*)')
        .ilike('name', `%${hospitalName}%`)
        .limit(1)
        .single();

      if (hospitals) {
        hospitalContext = formatHospitalContext(hospitals, query);
      }
    } else {
      // Search all hospitals
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('*, hospital_pages(*)');

      if (hospitals && hospitals.length > 0) {
        hospitalContext = hospitals.map(h => formatHospitalContext(h, query)).join('\n\n---\n\n');
      }
    }

    if (!hospitalContext) {
      hospitalContext = 'No hospital data available. Please add and scrape hospital websites first.';
    }

    // Create system prompt with hospital context
    const systemPrompt = `You are a medical assistant helping patients find healthcare services and facilities.

${hospitalContext}

CRITICAL INSTRUCTIONS:
- ONLY provide information about medical services, departments, laboratories, doctors, treatments, and healthcare facilities
- Focus on helping patients: department locations, available services, specialist doctors, lab facilities, medical equipment
- IGNORE and DO NOT mention: historical information, tourism, general city information, educational institutions (unless medical colleges/training)
- If asked about non-medical topics, politely redirect: "I can help you with medical services and facilities at the hospital. What healthcare information do you need?"
- Always include Google Maps links when providing directions: https://www.google.com/maps?q=LATITUDE,LONGITUDE
- Be concise, clear, and patient-focused
- For emergencies, direct to call emergency services immediately

Example good responses:
"The laboratory is located in the main building, 2nd floor. Map: [link]"
"Dr. Ahmed specializes in cardiology. You can find the cardiology department on the 3rd floor, east wing."`;

    // Call Groq AI for response
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: query
      }
    ];

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || 'No response generated';

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in hospital-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatHospitalContext(hospital: any, query: string): string {
  const queryLower = query.toLowerCase();
  let context = `Hospital: ${hospital.name}\n`;
  
  if (hospital.address) context += `Address: ${hospital.address}\n`;
  if (hospital.city) context += `City: ${hospital.city}\n`;
  if (hospital.country) context += `Country: ${hospital.country}\n`;
  if (hospital.phone) context += `Phone: ${hospital.phone}\n`;
  if (hospital.email) context += `Email: ${hospital.email}\n`;
  if (hospital.latitude && hospital.longitude) {
    context += `Google Maps: https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}\n`;
  }

  // Health-related keywords only
  const healthKeywords = [
    'department', 'service', 'lab', 'laboratory', 'doctor', 'physician', 
    'surgeon', 'specialist', 'clinic', 'ward', 'emergency', 'icu', 
    'radiology', 'pathology', 'cardiology', 'pediatric', 'surgery',
    'consultation', 'treatment', 'diagnosis', 'medical', 'health',
    'patient', 'appointment', 'facility', 'equipment', 'staff',
    'nursing', 'pharmacy', 'ambulance', 'operation', 'theatre',
    'ultrasound', 'x-ray', 'ct scan', 'mri', 'blood test', 'opd'
  ];

  // Filter pages for health-related content only
  if (hospital.hospital_pages && hospital.hospital_pages.length > 0) {
    const relevantPages = hospital.hospital_pages.filter((page: any) => {
      const contentLower = (page.content || '').toLowerCase();
      const titleLower = (page.title || '').toLowerCase();
      return healthKeywords.some(keyword => 
        contentLower.includes(keyword) || titleLower.includes(keyword)
      );
    });

    if (relevantPages.length > 0) {
      context += '\n--- Medical Services & Facilities ---\n';
      
      relevantPages.slice(0, 10).forEach((page: any) => {
        // Extract only health-related sentences
        const sentences = (page.content || '').split(/[.!?]+/);
        const relevantSentences = sentences.filter((sentence: string) => 
          healthKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
        ).slice(0, 5); // Limit sentences per page
        
        if (relevantSentences.length > 0) {
          context += `\n${page.title || 'Service'}:\n`;
          context += relevantSentences.join('. ').trim() + '.\n';
        }
      });
    }
  }

  return context;
}
