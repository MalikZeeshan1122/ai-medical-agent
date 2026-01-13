import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract text from image using Gemini Vision API
async function extractTextFromImage(base64Data: string, mimeType: string, geminiApiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are a medical document analyzer. Extract and summarize ALL text and data from this medical document image. Include:\n- Patient name (if visible)\n- Test names and their results with values and reference ranges\n- Any abnormal values (mark them)\n- Doctor/lab information\n- Date of test\n- Key findings or diagnosis\n\nProvide a clear, structured summary that a health assistant can use to answer patient questions."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return '';
    }

    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Extracted text from image:', extractedText.substring(0, 200) + '...');
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return '';
  }
}

// Function to get MIME type from filename
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { base64, fileName, documentType, userId, bucket = 'medical-documents' } = await req.json();
    if (!base64 || !fileName || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Decode base64 to Uint8Array
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

    const filePath = `${userId}/${documentType || 'other'}/${Date.now()}_${fileName}`;

    // Upload to storage using service-role key
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, bytes, { upsert: false });
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const fileUrl = urlData?.publicUrl || null;

    // Extract text from image if it's an image file and we have Gemini API key
    let summary = '';
    const mimeType = getMimeType(fileName);
    const isImage = mimeType.startsWith('image/');
    
    if (isImage && GEMINI_API_KEY) {
      console.log('Extracting text from image using Gemini Vision...');
      summary = await extractTextFromImage(base64, mimeType, GEMINI_API_KEY);
    }

    // Insert metadata into DB with extracted summary
    const { error: dbError } = await supabase.from('medical_documents').insert([
      {
        user_id: userId,
        document_type: documentType,
        file_name: fileName,
        file_url: fileUrl,
        file_path: filePath,
        uploaded_at: new Date().toISOString(),
        summary: summary || null,
      },
    ]);

    if (dbError) {
      console.error('DB insert error:', dbError);
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, fileUrl, hasSummary: !!summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('upload-medical-document error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
