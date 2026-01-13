import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if ai_providers table exists by trying to query it
    const { data, error: checkError } = await supabase
      .from('ai_providers')
      .select('*')
      .limit(1)

    if (!checkError) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'ai_providers table already exists',
          tableExists: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Table doesn't exist - user needs to run SQL manually
    return new Response(
      JSON.stringify({
        success: false,
        message: 'ai_providers table needs to be created',
        tableExists: false,
        instructions: 'Please run the migration SQL in Supabase Dashboard',
        error: checkError.message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
