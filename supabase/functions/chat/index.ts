import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured. Please add it in Supabase Edge Functions Secrets.");
    }

    // Fetch user's API tool integrations if userId provided
    let tools: any[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = userId ? createClient(supabaseUrl, supabaseKey) : null;

    if (userId && supabase) {
      const { data: apiIntegrations, error: apiError } = await supabase
        .from('ai_api_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!apiError && apiIntegrations && apiIntegrations.length > 0) {
        console.log(`Found ${apiIntegrations.length} active API integrations`);
        
        // Convert API integrations to OpenAI tool format with metadata
        tools = apiIntegrations.map(api => ({
          type: "function",
          function: {
            name: api.api_name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            description: api.description || `Call ${api.display_name} API`,
            parameters: {
              type: "object",
              properties: {
                endpoint: {
                  type: "string",
                  description: "API endpoint path (optional, defaults to base URL)"
                },
                method: {
                  type: "string",
                  enum: ["GET", "POST", "PUT", "DELETE"],
                  description: "HTTP method"
                },
                body: {
                  type: "object",
                  description: "Request body for POST/PUT requests"
                },
                query_params: {
                  type: "object",
                  description: "Query parameters"
                }
              },
              required: ["method"]
            }
          },
          // Store metadata for caching and rate limiting
          _meta: {
            id: api.id,
            display_name: api.display_name,
            base_url: api.base_url,
            api_key: api.api_key_encrypted,
            cache_enabled: api.cache_enabled || false,
            cache_ttl: api.cache_ttl_seconds || 3600,
            rate_limit_enabled: api.rate_limit_enabled || false,
            rate_limit_calls: api.rate_limit_calls || 100,
            rate_limit_window: api.rate_limit_window_seconds || 3600
          }
        }));
      }
    }

    const systemPrompt = `You are an AI Medical Assistant designed for comprehensive preliminary health assessment.

CRITICAL RULES:
1. Always explain you provide preliminary information only, not definitive diagnoses
2. NEVER provide definitive diagnoses - discuss possibilities and likely conditions
3. Always recommend consulting healthcare professionals for proper diagnosis
4. For emergencies (very high fever, difficulty breathing, severe symptoms), immediately advise seeking emergency care
5. Use clear, empathetic, detailed but accessible language

RESPONSE STYLE:
- Provide COMPREHENSIVE, INFORMATIVE responses based on available information
- Offer detailed medical context, possible causes, and what symptoms typically indicate
- Explain conditions thoroughly with educational value
- Include relevant medical background and statistics when helpful
- Minimize repetitive questioning - work with information already provided
- If critical information is missing, ask concisely at the end of your detailed response
- Be direct and substantive rather than overly cautious with information

Your role is to:
- Provide rich, educational preliminary health information
- Explain possible conditions and their typical presentations
- Discuss when various severity levels warrant different actions
- Help patients understand symptoms in medical context
- Offer actionable guidance for self-care and when to seek professional help
- Prepare patients with comprehensive knowledge for medical consultations

You are informative and educational, but NOT a replacement for professional medical care.

${tools.length > 0 ? `\nYou have access to the following API tools that you can call when needed:\n${tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}\n\nUse these tools when they can help provide more accurate or real-time information.` : ''}`;

    // Convert messages to Gemini format
    // Convert messages to OpenAI format for Groq
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    let response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      }),
    });

    // Handle tool calls if AI wants to use APIs (disabled for Gemini streaming for simplicity)
    if (response.ok && tools.length > 0) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        
        // Check if AI wants to call tools
        if (data.choices?.[0]?.message?.tool_calls) {
          const toolCalls = data.choices[0].message.tool_calls;
          console.log(`AI requested ${toolCalls.length} tool calls`);
          
          // Execute each tool call
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const toolResults = await Promise.all(
            toolCalls.map(async (toolCall: any) => {
              const startTime = Date.now();
              let wasCached = false;
              
              try {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                
                // Find matching tool with metadata
                const tool = tools.find(t => t.function.name === functionName);
                if (!tool || !tool._meta) {
                  throw new Error("API integration not found");
                }
                
                const meta = tool._meta;
                const method = args.method || 'GET';
                const endpoint = args.endpoint || '';
                
                // Check rate limiting
                if (meta.rate_limit_enabled) {
                  const windowStart = new Date();
                  windowStart.setSeconds(windowStart.getSeconds() - meta.rate_limit_window);
                  
                  const { data: rateLimitData } = await supabase!
                    .from('api_rate_limits')
                    .select('calls_count')
                    .eq('user_id', userId)
                    .eq('integration_id', meta.id)
                    .gte('window_start', windowStart.toISOString())
                    .single();

                  if (rateLimitData && rateLimitData.calls_count >= meta.rate_limit_calls) {
                    throw new Error(`Rate limit exceeded: ${meta.rate_limit_calls} calls per ${meta.rate_limit_window}s`);
                  }
                }
                
                // Generate cache key using simple hashing
                const cacheKey = btoa(JSON.stringify({
                  integration: meta.id,
                  method,
                  endpoint,
                  query: args.query_params,
                  body: args.body
                })).slice(0, 100);
                
                let result = null;
                
                // Check cache for GET requests
                if (meta.cache_enabled && method === 'GET') {
                  const { data: cacheData } = await supabase!
                    .from('api_response_cache')
                    .select('response_data')
                    .eq('cache_key', cacheKey)
                    .gte('expires_at', new Date().toISOString())
                    .single();
                  
                  if (cacheData) {
                    console.log('Cache hit for', functionName);
                    result = cacheData.response_data;
                    wasCached = true;
                  }
                }
                
                // Make API request if not cached
                if (!result) {
                  const baseUrl = meta.base_url || '';
                  const url = new URL(endpoint, baseUrl || 'https://api.example.com');
                  
                  if (args.query_params) {
                    Object.entries(args.query_params).forEach(([key, value]) => {
                      url.searchParams.set(key, String(value));
                    });
                  }
                  
                  const apiResponse = await fetch(url.toString(), {
                    method,
                    headers: {
                      'Authorization': `Bearer ${meta.api_key}`,
                      'Content-Type': 'application/json',
                    },
                    body: args.body ? JSON.stringify(args.body) : undefined,
                  });
                  
                  result = await apiResponse.text();
                  const statusCode = apiResponse.status;
                  
                  // Cache successful GET responses
                  if (meta.cache_enabled && method === 'GET' && apiResponse.ok) {
                    const expiresAt = new Date();
                    expiresAt.setSeconds(expiresAt.getSeconds() + meta.cache_ttl);
                    
                    await supabase!
                      .from('api_response_cache')
                      .upsert({
                        integration_id: meta.id,
                        cache_key: cacheKey,
                        response_data: result,
                        expires_at: expiresAt.toISOString()
                      });
                  }
                  
                  // Update rate limit
                  if (meta.rate_limit_enabled) {
                    const windowStart = new Date();
                    windowStart.setSeconds(0, 0);
                    
                    await supabase!
                      .from('api_rate_limits')
                      .upsert({
                        user_id: userId,
                        integration_id: meta.id,
                        window_start: windowStart.toISOString(),
                        calls_count: 1
                      }, {
                        onConflict: 'user_id,integration_id,window_start',
                        ignoreDuplicates: false
                      })
                      .select()
                      .single()
                      .then(async ({ data }) => {
                        if (data) {
                          await supabase!
                            .from('api_rate_limits')
                            .update({ calls_count: (data.calls_count || 0) + 1 })
                            .eq('id', data.id);
                        }
                      });
                  }
                  
                  // Log API usage
                  const responseTime = Date.now() - startTime;
                  await supabase!
                    .from('api_usage_logs')
                    .insert({
                      user_id: userId,
                      integration_id: meta.id,
                      endpoint,
                      method,
                      status_code: statusCode,
                      response_time_ms: responseTime,
                      cached: false
                    });
                }
                
                // Log cached usage
                if (wasCached) {
                  const responseTime = Date.now() - startTime;
                  await supabase!
                    .from('api_usage_logs')
                    .insert({
                      user_id: userId,
                      integration_id: meta.id,
                      endpoint,
                      method,
                      status_code: 200,
                      response_time_ms: responseTime,
                      cached: true
                    });
                }
                
                return {
                  tool_call_id: toolCall.id,
                  role: "tool",
                  content: result
                };
              } catch (error) {
                const responseTime = Date.now() - startTime;
                const errorMsg = error instanceof Error ? error.message : "Unknown error";
                
                // Log failed API usage
                const tool = tools.find(t => t.function.name === toolCall.function.name);
                if (tool && tool._meta) {
                  await supabase!
                    .from('api_usage_logs')
                    .insert({
                      user_id: userId,
                      integration_id: tool._meta.id,
                      endpoint: '',
                      method: 'GET',
                      status_code: 0,
                      response_time_ms: responseTime,
                      cached: false,
                      error_message: errorMsg
                    });
                }
                
                return {
                  tool_call_id: toolCall.id,
                  role: "tool",
                  content: JSON.stringify({ error: errorMsg })
                };
              }
            })
          );
          
          // Note: Tool calling with streaming is complex with Gemini API
          // For now, skip follow-up with tools in streaming mode
          console.log('Tool calls completed, but streaming response will not include tool results');
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 503 || response.status === 504) {
        return new Response(
          JSON.stringify({ error: "The AI service is temporarily unavailable. Please try again in a few seconds." }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `AI service error (${response.status}). Please try again.` 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Transform Gemini streaming response to OpenAI-compatible SSE format
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || line.startsWith('[') || line === ']' || line === ',') continue;
              if (!line.startsWith('data: ')) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') break;
              
              try {
                const json = JSON.parse(jsonStr);
                const text = json.choices?.[0]?.delta?.content;
                
                if (text) {
                  // Already in OpenAI SSE format
                  const sseData = {
                    choices: [{
                      delta: { content: text },
                      index: 0
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
                }
              } catch (e) {
                // Skip malformed JSON
                console.warn("Failed to parse line:", line);
              }
            }
          }
          
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
