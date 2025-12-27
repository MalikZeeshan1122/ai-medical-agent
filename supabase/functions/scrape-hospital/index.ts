import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hospitalId, websiteUrl, firecrawlApiKey, scraperApiKey } = await req.json();
    console.log('Scraping hospital:', hospitalId, websiteUrl);
    console.log('Using Firecrawl:', !!firecrawlApiKey);
    console.log('Using ScraperAPI:', !!scraperApiKey);

    if (!hospitalId || !websiteUrl) {
      throw new Error('Hospital ID and website URL are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();
    let scrapedPages = [];
    let method = 'native';
    let success = true;
    let errorMessage = '';

    // Choose scraping method based on available API keys
    try {
      if (firecrawlApiKey) {
        console.log('Using Firecrawl API for scraping');
        method = 'firecrawl';
        scrapedPages = await scrapeWithFirecrawl(websiteUrl, hospitalId, firecrawlApiKey);
      } else if (scraperApiKey) {
        console.log('Using ScraperAPI for scraping');
        method = 'scraperapi';
        scrapedPages = await scrapeWithScraperAPI(websiteUrl, hospitalId, scraperApiKey);
      } else {
        console.log('Using native scraping method');
        method = 'native';
        scrapedPages = await scrapeNatively(websiteUrl, hospitalId);
      }
    } catch (scrapeError) {
      success = false;
      errorMessage = scrapeError instanceof Error ? scrapeError.message : 'Scraping failed';
      throw scrapeError;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      
      // Log analytics
      await supabase.from('hospital_scraping_stats').insert({
        hospital_id: hospitalId,
        method,
        pages_scraped: scrapedPages.length,
        pages_failed: 0,
        duration_seconds: duration,
        success,
        error_message: errorMessage || null,
      });
    }


    // Delete old scraped pages for this hospital
    await supabase
      .from('hospital_pages')
      .delete()
      .eq('hospital_id', hospitalId);

    // Insert new scraped pages
    const { error: insertError } = await supabase
      .from('hospital_pages')
      .insert(scrapedPages);

    if (insertError) {
      throw insertError;
    }

    // Update hospital scraped_at timestamp
    await supabase
      .from('hospitals')
      .update({ scraped_at: new Date().toISOString() })
      .eq('id', hospitalId);

    console.log(`Successfully scraped ${scrapedPages.length} pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pagesScraped: scrapedPages.length,
        message: `Successfully scraped ${scrapedPages.length} pages from ${websiteUrl}`,
        method: firecrawlApiKey ? 'Firecrawl API' : 'Native'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-hospital:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        suggestion: 'The website may be blocking automated requests, experiencing downtime, or have connectivity issues. Try again later or check if the URL is correct.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeWithFirecrawl(websiteUrl: string, hospitalId: string, apiKey: string) {
  console.log('Initiating Firecrawl scrape for:', websiteUrl);
  
  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: websiteUrl,
      limit: 50,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorData}`);
  }

  const crawlData = await response.json();
  const crawlId = crawlData.id;
  
  if (!crawlId) {
    throw new Error('Failed to start Firecrawl crawl');
  }

  console.log('Firecrawl crawl started, ID:', crawlId);
  
  // Poll for completion
  let completed = false;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  let crawlResult: any;

  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;

    const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check crawl status: ${statusResponse.status}`);
    }

    crawlResult = await statusResponse.json();
    console.log(`Crawl status check ${attempts}:`, crawlResult.status);

    if (crawlResult.status === 'completed') {
      completed = true;
    } else if (crawlResult.status === 'failed') {
      throw new Error('Firecrawl crawl failed');
    }
  }

  if (!completed) {
    throw new Error('Crawl timeout - taking longer than expected');
  }

  const scrapedPages = [];
  const pages = crawlResult.data || [];

  console.log(`Processing ${pages.length} pages from Firecrawl`);

  for (const page of pages) {
    const content = page.markdown || page.html || '';
    const title = page.metadata?.title || extractTitleFromUrl(page.url);
    const pageType = determinePageType(page.url, content);

    scrapedPages.push({
      hospital_id: hospitalId,
      url: page.url,
      title,
      content,
      page_type: pageType,
      metadata: { 
        scraped_from: websiteUrl,
        method: 'firecrawl',
        ...page.metadata 
      },
      scraped_at: new Date().toISOString(),
    });
  }

  return scrapedPages;
}

async function scrapeNatively(websiteUrl: string, hospitalId: string) {
  // Validate URL accessibility first
  console.log('Testing connection to:', websiteUrl);
  const testController = new AbortController();
  const testTimeout = setTimeout(() => testController.abort(), 5000);
  
  let links: string[];
  try {
    const testResponse = await fetch(websiteUrl, {
      method: 'HEAD',
      signal: testController.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(testTimeout);
    console.log('Connection test successful, status:', testResponse.status);
  } catch (testError) {
    clearTimeout(testTimeout);
    console.error('Connection test failed:', testError);
    
    if (testError instanceof Error) {
      if (testError.name === 'AbortError') {
        throw new Error('Website is not responding. The server may be down, overloaded, or blocking automated requests. Please verify the URL is correct and the website is accessible from your browser.');
      }
      if (testError.message.includes('ETIMEDOUT') || testError.message.includes('Connection timed out')) {
        throw new Error('Cannot connect to this website. Possible reasons:\n• The website server is down or unreachable\n• The website is blocking cloud service IP addresses\n• Network firewall restrictions\n• The URL may be incorrect\n\nPlease verify the website is accessible and try a different hospital website.');
      }
      if (testError.message.includes('ECONNREFUSED')) {
        throw new Error('Connection refused by the website server. The server may be down or not accepting connections.');
      }
    }
    throw new Error('Unable to access the website. Please verify the URL is correct and the website is publicly accessible.');
  }

  // Fetch main page
  console.log('Fetching main page:', websiteUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  
  try {
    const mainPageResponse = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    clearTimeout(timeoutId);

    if (!mainPageResponse.ok) {
      throw new Error(`Website returned error: HTTP ${mainPageResponse.status} ${mainPageResponse.statusText}`);
    }

    const mainPageHtml = await mainPageResponse.text();
    links = extractLinks(mainPageHtml, websiteUrl);
    console.log(`Found ${links.length} links to scrape`);
    
    if (links.length === 0) {
      console.warn('No links found, will scrape main page only');
      links = [websiteUrl];
    }
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch main page:', fetchError);
    
    if (fetchError instanceof Error && fetchError.message.includes('HTTP')) {
      throw fetchError;
    }
    
    throw new Error('Failed to retrieve website content. The website may have changed or is experiencing issues.');
  }

  const pagesToScrape = links.slice(0, 50);
  const scrapedPages = [];

  for (const link of pagesToScrape) {
    try {
      console.log('Scraping page:', link);
      const pageController = new AbortController();
      const pageTimeoutId = setTimeout(() => pageController.abort(), 10000);
      
      const pageResponse = await fetch(link, {
        signal: pageController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(pageTimeoutId);
      
      if (!pageResponse.ok) {
        console.warn(`Skipping ${link}: HTTP ${pageResponse.status}`);
        continue;
      }
      
      const pageHtml = await pageResponse.text();
      const { title, content, pageType } = extractContent(pageHtml, link);
      
      scrapedPages.push({
        hospital_id: hospitalId,
        url: link,
        title,
        content,
        page_type: pageType,
        metadata: { scraped_from: websiteUrl, method: 'native' },
        scraped_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error scraping ${link}:`, error);
    }
  }

  return scrapedPages;
}

function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() || 'Home';
  } catch {
    return 'Unknown';
  }
}

function determinePageType(url: string, content: string): string {
  const urlLower = url.toLowerCase();
  const contentLower = content.toLowerCase();

  if (urlLower.includes('department') || contentLower.includes('department')) {
    return 'department';
  } else if (urlLower.includes('service') || contentLower.includes('service')) {
    return 'service';
  } else if (urlLower.includes('contact') || contentLower.includes('contact')) {
    return 'contact';
  } else if (urlLower.includes('about') || contentLower.includes('about')) {
    return 'about';
  } else if (urlLower.includes('doctor') || contentLower.includes('doctor')) {
    return 'doctor';
  } else if (urlLower.includes('laborator') || contentLower.includes('laborator')) {
    return 'laboratory';
  }
  
  return 'general';
}

async function scrapeWithScraperAPI(websiteUrl: string, hospitalId: string, apiKey: string) {
  console.log('Initiating ScraperAPI scrape for:', websiteUrl);
  
  // First, scrape the main page
  const mainPageUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(websiteUrl)}`;
  const mainResponse = await fetch(mainPageUrl);
  
  if (!mainResponse.ok) {
    throw new Error(`ScraperAPI error: ${mainResponse.status} ${mainResponse.statusText}`);
  }
  
  const mainHtml = await mainResponse.text();
  const links = extractLinks(mainHtml, websiteUrl);
  console.log(`Found ${links.length} links via ScraperAPI`);
  
  const pagesToScrape = [websiteUrl, ...links.slice(0, 49)]; // Main page + up to 49 others
  const scrapedPages = [];
  
  for (const pageUrl of pagesToScrape) {
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(pageUrl)}`;
      const response = await fetch(scraperUrl);
      
      if (!response.ok) {
        console.warn(`Failed to scrape ${pageUrl}: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const { title, content, pageType } = extractContent(html, pageUrl);
      
      scrapedPages.push({
        hospital_id: hospitalId,
        url: pageUrl,
        title,
        content,
        page_type: pageType,
        metadata: { 
          scraped_from: websiteUrl,
          method: 'scraperapi'
        },
        scraped_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error scraping ${pageUrl} with ScraperAPI:`, error);
    }
  }
  
  return scrapedPages;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    if (url && !url.startsWith('#') && !url.startsWith('javascript:')) {
      try {
        const absoluteUrl = new URL(url, baseUrl).href;
        const baseDomain = new URL(baseUrl).hostname;
        const linkDomain = new URL(absoluteUrl).hostname;
        
        // Only include links from the same domain
        if (linkDomain === baseDomain) {
          links.add(absoluteUrl);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }

  return Array.from(links);
}

function extractContent(html: string, url: string): { title: string; content: string; pageType: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Remove script and style tags
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extract text content
  const textContent = cleanHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Determine page type based on URL and content
  let pageType = 'general';
  const urlLower = url.toLowerCase();
  const contentLower = textContent.toLowerCase();

  if (urlLower.includes('department') || contentLower.includes('department')) {
    pageType = 'department';
  } else if (urlLower.includes('service') || contentLower.includes('service')) {
    pageType = 'service';
  } else if (urlLower.includes('contact') || contentLower.includes('contact')) {
    pageType = 'contact';
  } else if (urlLower.includes('about') || contentLower.includes('about')) {
    pageType = 'about';
  } else if (urlLower.includes('doctor') || contentLower.includes('doctor')) {
    pageType = 'doctor';
  } else if (urlLower.includes('laborator') || contentLower.includes('laborator')) {
    pageType = 'laboratory';
  }

  return { title, content: textContent, pageType };
}