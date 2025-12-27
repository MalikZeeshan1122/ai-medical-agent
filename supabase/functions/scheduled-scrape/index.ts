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
    console.log('Starting scheduled scrape job');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all hospitals with auto-scrape enabled
    const { data: hospitals, error: fetchError } = await supabase
      .from('hospitals')
      .select('id, name, website_url, scrape_frequency, scraped_at')
      .eq('auto_scrape_enabled', true);

    if (fetchError) {
      throw fetchError;
    }

    if (!hospitals || hospitals.length === 0) {
      console.log('No hospitals with auto-scrape enabled');
      return new Response(
        JSON.stringify({ message: 'No hospitals to scrape', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${hospitals.length} hospitals with auto-scrape enabled`);
    
    // Filter hospitals based on their scrape frequency
    const now = new Date();
    const hospitalsToScrape = hospitals.filter(hospital => {
      if (!hospital.scraped_at) return true; // Never scraped before
      
      const lastScraped = new Date(hospital.scraped_at);
      const daysSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (hospital.scrape_frequency) {
        case 'daily':
          return daysSinceLastScrape >= 1;
        case 'weekly':
          return daysSinceLastScrape >= 7;
        case 'monthly':
          return daysSinceLastScrape >= 30;
        default:
          return false;
      }
    });

    console.log(`${hospitalsToScrape.length} hospitals need scraping based on frequency`);

    const results = [];
    
    // Scrape each hospital
    for (const hospital of hospitalsToScrape) {
      try {
        console.log(`Triggering scrape for: ${hospital.name}`);
        
        // Call the main scrape-hospital function
        const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-hospital`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            hospitalId: hospital.id,
            websiteUrl: hospital.website_url,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        
        results.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          success: scrapeResponse.ok,
          ...scrapeData,
        });
        
        console.log(`Scrape completed for ${hospital.name}: ${scrapeResponse.ok ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.error(`Error scraping ${hospital.name}:`, error);
        results.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalHospitals: hospitals.length,
        hospitalsScrape: hospitalsToScrape.length,
        results,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scheduled-scrape:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
