import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwilioResponse {
  sid?: string;
  error_code?: string;
  error_message?: string;
}

async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  console.log('Twilio SMS config check:', { 
    hasAccountSid: !!accountSid, 
    hasAuthToken: !!authToken, 
    hasFromNumber: !!fromNumber,
    fromNumber: fromNumber 
  });

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio SMS credentials not configured');
    return { success: false, error: 'Twilio SMS credentials not configured' };
  }

  try {
    console.log(`Sending SMS to ${to} from ${fromNumber}`);
    
    // Get the webhook URL for status callbacks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const statusCallback = `${supabaseUrl}/functions/v1/twilio-webhook`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: body,
          StatusCallback: statusCallback,
        }),
      }
    );

    const data: TwilioResponse = await response.json();
    console.log('Twilio SMS response:', JSON.stringify(data));
    
    if (data.error_code || !response.ok) {
      console.error('Twilio SMS error:', data.error_message || 'Unknown error');
      return { success: false, error: data.error_message || `HTTP ${response.status}` };
    }

    console.log('SMS sent successfully:', data.sid);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWhatsApp(
  to: string, 
  doctorName: string, 
  appointmentDate: string, 
  appointmentTime: string,
  reason: string,
  location: string | null
): Promise<{ success: boolean; error?: string; sid?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const whatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

  console.log('Twilio WhatsApp config check:', { 
    hasAccountSid: !!accountSid, 
    hasAuthToken: !!authToken, 
    hasWhatsappNumber: !!whatsappNumber,
    whatsappNumber: whatsappNumber 
  });

  if (!accountSid || !authToken || !whatsappNumber) {
    console.error('Twilio WhatsApp credentials not configured');
    return { success: false, error: 'Twilio WhatsApp credentials not configured' };
  }

  try {
    // Format phone number for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = whatsappNumber.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${whatsappNumber}`;
    
    console.log(`Sending WhatsApp to ${whatsappTo} from ${whatsappFrom}`);
    
    // Get the webhook URL for status callbacks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const statusCallback = `${supabaseUrl}/functions/v1/twilio-webhook`;
    
    // Build message with doctor name included in date variable for sandbox compatibility
    const dateWithDetails = `${appointmentDate} with ${doctorName}`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: whatsappTo,
          From: whatsappFrom,
          ContentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
          ContentVariables: JSON.stringify({
            "1": dateWithDetails,
            "2": appointmentTime
          }),
          StatusCallback: statusCallback,
        }),
      }
    );

    const data: TwilioResponse = await response.json();
    console.log('Twilio WhatsApp response:', JSON.stringify(data));
    
    if (data.error_code || !response.ok) {
      console.error('Twilio WhatsApp error:', data.error_message || 'Unknown error');
      return { success: false, error: data.error_message || `HTTP ${response.status}` };
    }

    console.log('WhatsApp sent successfully:', data.sid);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendEmail(
  resend: any, 
  to: string, 
  doctorName: string, 
  appointmentDate: string, 
  appointmentTime: string, 
  reason: string, 
  location: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Sending email to ${to}`);
    
    const result = await resend.emails.send({
      from: 'Health Assistant <onboarding@resend.dev>',
      to: [to],
      subject: `Appointment Reminder: ${doctorName} on ${appointmentDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            📅 Appointment Reminder
          </h1>
          
          <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); padding: 25px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
            <p style="margin: 10px 0;"><strong>📆 Date:</strong> ${appointmentDate}</p>
            <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${appointmentTime}</p>
            <p style="margin: 10px 0;"><strong>📝 Reason:</strong> ${reason}</p>
            ${location ? `<p style="margin: 10px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
          </div>
          
          <p style="color: #555;">Please arrive <strong>15 minutes early</strong> for check-in.</p>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
            If you need to reschedule or cancel, please contact your healthcare provider as soon as possible.
          </p>
        </div>
      `,
    });
    
    console.log('Email result:', JSON.stringify(result));
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!resendKey) {
      console.warn('RESEND_API_KEY not configured - reminders will be limited to SMS/WhatsApp only');
    }
    
    const resend = resendKey ? new Resend(resendKey) : null;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is a test/manual trigger
    let testMode = false;
    let specificAppointmentId: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        testMode = body.testMode === true;
        specificAppointmentId = body.appointmentId || null;
        console.log(`Manual trigger: testMode=${testMode}, appointmentId=${specificAppointmentId}`);
      } catch {
        // No body or invalid JSON, continue normally
      }
    }

    const now = new Date();
    console.log(`Running reminder check at ${now.toISOString()}`);

    // Build query - include both scheduled and confirmed appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        doctor_name,
        appointment_date,
        appointment_time,
        reason,
        location,
        user_id,
        notification_type,
        reminder_minutes_before,
        user_phone
      `)
      .eq('reminder_enabled', true)
      .in('status', ['scheduled', 'confirmed']);

    // If testing specific appointment, filter by ID
    if (specificAppointmentId) {
      query = query.eq('id', specificAppointmentId);
    } else {
      query = query.eq('reminder_sent', false);
    }

    const { data: appointments, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} potential appointments to check`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send', appointments: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter appointments based on their reminder time (unless in test mode)
    const appointmentsToRemind = testMode 
      ? appointments 
      : appointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          const reminderMinutes = apt.reminder_minutes_before || 1440;
          const reminderTime = new Date(appointmentDateTime.getTime() - reminderMinutes * 60 * 1000);
          
          const timeDiff = now.getTime() - reminderTime.getTime();
          const shouldSend = timeDiff >= 0 && timeDiff <= 5 * 60 * 1000;
          
          console.log(`Appointment ${apt.id}: appointmentTime=${appointmentDateTime.toISOString()}, reminderTime=${reminderTime.toISOString()}, timeDiff=${timeDiff}ms, shouldSend=${shouldSend}`);
          return shouldSend;
        });

    console.log(`${appointmentsToRemind.length} appointments need reminders ${testMode ? '(TEST MODE)' : 'now'}`);

    if (appointmentsToRemind.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders due at this time', checkedCount: appointments.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send reminders
    const results = await Promise.allSettled(
      appointmentsToRemind.map(async (apt) => {
        console.log(`Processing appointment ${apt.id} for user ${apt.user_id}`);
        
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(apt.user_id);
        
        if (userError) {
          console.error(`Error fetching user ${apt.user_id}:`, userError);
        }
        
        const userEmail = userData?.user?.email;
        const userPhone = apt.user_phone;
        const notificationType = apt.notification_type || 'both';
        
        console.log(`User email: ${userEmail}, User phone: ${userPhone}, Notification type: ${notificationType}`);

        const appointmentDate = new Date(apt.appointment_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const appointmentTime = apt.appointment_time.substring(0, 5);

        let emailResult: { success: boolean; error?: string } = { success: false, error: 'Not attempted' };
        let smsResult: { success: boolean; error?: string; sid?: string } = { success: false, error: 'Not attempted' };
        let whatsappResult: { success: boolean; error?: string; sid?: string } = { success: false, error: 'Not attempted' };

        // Helper function to log notification
        const logNotification = async (
          type: 'email' | 'sms' | 'whatsapp',
          recipient: string,
          sid: string | undefined,
          success: boolean,
          errorMsg?: string
        ) => {
          try {
            await supabase.from('notification_logs').insert({
              appointment_id: apt.id,
              user_id: apt.user_id,
              message_sid: sid || null,
              notification_type: type,
              recipient: recipient,
              status: success ? 'sent' : 'failed',
              error_message: errorMsg || null,
            });
            console.log(`Logged ${type} notification for appointment ${apt.id}`);
          } catch (logError) {
            console.error(`Failed to log ${type} notification:`, logError);
          }
        };

        // Send email reminder
        if ((notificationType === 'email' || notificationType === 'both' || notificationType === 'all') && userEmail) {
          emailResult = await sendEmail(resend, userEmail, apt.doctor_name, appointmentDate, appointmentTime, apt.reason, apt.location);
          console.log(`Email result for ${apt.id}:`, emailResult);
          await logNotification('email', userEmail, undefined, emailResult.success, emailResult.error);
        } else if (notificationType === 'email' || notificationType === 'both' || notificationType === 'all') {
          emailResult = { success: false, error: 'No email address found' };
          console.log(`Skipping email for ${apt.id}: no email address`);
        }

        // Send SMS reminder
        if ((notificationType === 'sms' || notificationType === 'both' || notificationType === 'all') && userPhone) {
          const smsBody = `Appointment Reminder: You have an appointment with ${apt.doctor_name} on ${appointmentDate} at ${appointmentTime}. ${apt.location ? `Location: ${apt.location}` : ''}`;
          smsResult = await sendSMS(userPhone, smsBody);
          console.log(`SMS result for ${apt.id}:`, smsResult);
          await logNotification('sms', userPhone, smsResult.sid, smsResult.success, smsResult.error);
        } else if (notificationType === 'sms' || notificationType === 'both' || notificationType === 'all') {
          smsResult = { success: false, error: 'No phone number found' };
          console.log(`Skipping SMS for ${apt.id}: no phone number`);
        }

        // Send WhatsApp reminder
        if ((notificationType === 'whatsapp' || notificationType === 'all') && userPhone) {
          whatsappResult = await sendWhatsApp(userPhone, apt.doctor_name, appointmentDate, appointmentTime, apt.reason, apt.location);
          console.log(`WhatsApp result for ${apt.id}:`, whatsappResult);
          await logNotification('whatsapp', userPhone, whatsappResult.sid, whatsappResult.success, whatsappResult.error);
        } else if (notificationType === 'whatsapp' || notificationType === 'all') {
          whatsappResult = { success: false, error: 'No phone number found' };
          console.log(`Skipping WhatsApp for ${apt.id}: no phone number`);
        }

        // Only mark as sent if at least one notification was successful (and not in test mode)
        if ((emailResult.success || smsResult.success || whatsappResult.success) && !testMode) {
          await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', apt.id);
          console.log(`Marked appointment ${apt.id} as reminder_sent`);
        }

        return { 
          id: apt.id,
          doctorName: apt.doctor_name,
          notificationType,
          emailResult,
          smsResult,
          whatsappResult,
          success: emailResult.success || smsResult.success || whatsappResult.success 
        };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as any).success)).length;

    console.log(`Completed: ${successful} successful, ${failed} failed`);

    const detailedResults = results.map(r => {
      if (r.status === 'fulfilled') return r.value;
      return { error: r.reason?.message || 'Unknown error' };
    });

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successful} reminders successfully, ${failed} failed`,
        testMode,
        results: detailedResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
