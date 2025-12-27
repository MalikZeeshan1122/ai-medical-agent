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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    console.log(`Twilio webhook received: SID=${messageSid}, Status=${messageStatus}`);

    if (!messageSid || !messageStatus) {
      console.error('Missing required fields');
      return new Response('Missing required fields', { status: 400 });
    }

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'queued': 'queued',
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed',
      'undelivered': 'undelivered',
    };

    const normalizedStatus = statusMap[messageStatus.toLowerCase()] || messageStatus.toLowerCase();

    // Prepare update data
    const updateData: Record<string, any> = {
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    };

    // Add timestamps based on status
    if (normalizedStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (normalizedStatus === 'read') {
      updateData.read_at = new Date().toISOString();
      // Also set delivered_at if not already set
      updateData.delivered_at = new Date().toISOString();
    }

    // Add error info if present
    if (errorCode || errorMessage) {
      updateData.error_message = `${errorCode || ''}: ${errorMessage || ''}`.trim();
    }

    // Update the notification log
    const { data, error } = await supabase
      .from('notification_logs')
      .update(updateData)
      .eq('message_sid', messageSid)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification log:', error);
      // Return 200 anyway to prevent Twilio from retrying
      return new Response(JSON.stringify({ error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Updated notification log for ${messageSid}:`, data);

    return new Response(JSON.stringify({ success: true, status: normalizedStatus }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 to prevent Twilio from retrying
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});