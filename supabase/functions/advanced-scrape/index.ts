import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ScrapedPage {
  url: string;
  title: string | null;
  content: string | null;
  page_type: string | null;
  metadata: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { hospitalId, websiteUrl } = await req.json();
    console.log('Advanced scraping hospital:', hospitalId, websiteUrl);

    const startTime = Date.now();
    const scrapedPages: ScrapedPage[] = [];
    const visitedUrls = new Set<string>();
    const maxPages = 100;
    const maxDepth = 3;

    // Validate URL
    let baseUrl: URL;
    try {
      baseUrl = new URL(websiteUrl);
    } catch (e) {
      throw new Error(`Invalid URL: ${websiteUrl}`);
    }

    // Advanced recursive scraping function
    async function scrapePageAdvanced(url: string, depth: number): Promise<void> {
      if (depth > maxDepth || visitedUrls.size >= maxPages || visitedUrls.has(url)) {
        return;
      }

      visitedUrls.add(url);
      console.log(`Scraping: ${url} (depth: ${depth}, total: ${visitedUrls.size})`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased from 30s to 45s

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
          return;
        }

        const html = await response.text();
        console.log(`Fetched ${html.length} bytes from ${url}`);
        
        let doc;
        try {
          doc = new DOMParser().parseFromString(html, 'text/html');
        } catch (parseErr) {
          console.error(`Failed to parse HTML from ${url}:`, parseErr);
          // Fallback: try to extract basic info without DOM parsing
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);
          
          // Extract basic text content as fallback
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50000);
          
          if (textContent.length > 100) {
            scrapedPages.push({
              url,
              title,
              content: textContent,
              page_type: 'general',
              metadata: { method: 'advanced_native_fallback' },
            });
            console.log(`Scraped with fallback: ${title}`);
          }
          return;
        }

        if (!doc) {
          console.error(`Failed to parse HTML from ${url}`);
          return;
        }

        // Extract title
        const titleElement = doc.querySelector('title');
        const title = titleElement?.textContent?.trim() || extractTitleFromUrl(url);
        console.log(`Page title: ${title}`);

        // Extract main content with improved selectors
        const contentSelectors = [
          'main', 'article', '[role="main"]',
          '.content', '#content', '.main-content',
          '.post-content', '.entry-content', '.article-content',
          'body'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
          contentElement = doc.querySelector(selector);
          if (contentElement) break;
        }

        // Remove unwanted elements
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer',
          '.advertisement', '.ads', '.sidebar', '.menu',
          '[role="navigation"]', '.navigation', '#navigation'
        ];

        unwantedSelectors.forEach(selector => {
          const elements = contentElement?.querySelectorAll(selector);
          elements?.forEach((el: any) => el.remove?.());
        });

        const content = contentElement?.textContent
          ?.replace(/\s+/g, ' ')
          ?.trim()
          ?.substring(0, 50000) || '';

        console.log(`Extracted ${content.length} characters of content`);

        // Determine page type with better classification
        const pageType = determinePageTypeAdvanced(url, content, doc);

        // Extract metadata
        const metadata = extractMetadata(doc, url);

        scrapedPages.push({
          url,
          title,
          content,
          page_type: pageType,
          metadata,
        });

        console.log(`Successfully scraped page: ${title} (type: ${pageType})`);

        // Extract and follow links (only same domain)
        if (depth < maxDepth && visitedUrls.size < maxPages) {
          const links = doc.querySelectorAll('a[href]');
          const linkPromises: Promise<void>[] = [];

          for (const link of links) {
            const href = (link as any).getAttribute?.('href');
            if (!href) continue;

            try {
              const absoluteUrl = new URL(href, url);
              
              // Only follow same-domain links and avoid certain patterns
              if (
                absoluteUrl.hostname === baseUrl.hostname &&
                !absoluteUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i) &&
                !absoluteUrl.pathname.includes('/wp-admin') &&
                !absoluteUrl.pathname.includes('/login') &&
                !visitedUrls.has(absoluteUrl.href)
              ) {
                linkPromises.push(scrapePageAdvanced(absoluteUrl.href, depth + 1));
                
                // Limit concurrent requests
                if (linkPromises.length >= 5) {
                  await Promise.all(linkPromises);
                  linkPromises.length = 0;
                }
              }
            } catch (e) {
              // Invalid URL, skip
              continue;
            }
          }

          // Wait for remaining promises
          if (linkPromises.length > 0) {
            await Promise.all(linkPromises);
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    // Start scraping from the main URL
    await scrapePageAdvanced(websiteUrl, 0);

    const duration = (Date.now() - startTime) / 1000;

    // Save to database
    if (scrapedPages.length > 0) {
      // Delete old pages
      const { error: deleteError } = await supabase
        .from('hospital_pages')
        .delete()
        .eq('hospital_id', hospitalId);
      
      if (deleteError) {
        console.error('Error deleting old pages:', deleteError);
      }

      // Insert new pages
      const { error: insertError } = await supabase
        .from('hospital_pages')
        .insert(
          scrapedPages.map(page => ({
            hospital_id: hospitalId,
            ...page,
          }))
        );

      if (insertError) {
        console.error('Error inserting pages:', insertError);
        throw insertError;
      }

      // Update hospital
      const { error: updateError } = await supabase
        .from('hospitals')
        .update({ scraped_at: new Date().toISOString() })
        .eq('id', hospitalId);

      if (updateError) {
        console.error('Error updating hospital scraped_at:', updateError);
      }

      // Log stats
      try {
        const { error: statsError } = await supabase.from('hospital_scraping_stats').insert({
          hospital_id: hospitalId,
          pages_scraped: scrapedPages.length,
          pages_failed: 0,
          success: true,
          method: 'advanced_native',
          duration_seconds: duration,
        });
        
        if (statsError) {
          console.warn('Error logging stats (non-critical):', statsError);
        }
      } catch (statsErr) {
        console.warn('Stats logging failed (non-critical):', statsErr);
      }
    } else {
      // No pages scraped - this could be due to site structure or errors
      console.warn(`No pages scraped from ${websiteUrl}. Check if the site is accessible and has content.`);
      
      // Still update the timestamp to show scraping was attempted
      await supabase
        .from('hospitals')
        .update({ scraped_at: new Date().toISOString() })
        .eq('id', hospitalId);
      
      // Log the attempt
      try {
        const { error: statsError } = await supabase.from('hospital_scraping_stats').insert({
          hospital_id: hospitalId,
          pages_scraped: 0,
          pages_failed: 1,
          success: false,
          method: 'advanced_native',
          duration_seconds: duration,
          error_message: 'No pages could be scraped from the website',
        });
        
        if (statsError) {
          console.warn('Error logging failed scrape stats (non-critical):', statsError);
        }
      } catch (statsErr) {
        console.warn('Failed scrape stats logging failed (non-critical):', statsErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: scrapedPages.length > 0,
        pagesScraped: scrapedPages.length,
        method: 'Advanced Native Scraper',
        duration: `${duration.toFixed(2)}s`,
        warning: scrapedPages.length === 0 ? 'No pages could be scraped. The website may be blocking automated requests, have a complex structure, or be temporarily unavailable.' : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in advanced-scrape:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log more diagnostic information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      type: error instanceof Error ? error.constructor.name : typeof error,
      suggestion: 'The advanced scraper encountered an issue. Please verify the URL is accessible and try again.',
    };
    
    console.error('Full error details:', JSON.stringify(errorDetails));
    
    return new Response(
      JSON.stringify(errorDetails),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname
      .split('/')
      .filter(Boolean)
      .pop() || 'Home';
    return pathname
      .replace(/[-_]/g, ' ')
      .replace(/\.\w+$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Page';
  }
}

function determinePageTypeAdvanced(url: string, content: string, doc: any): string {
  const lowerUrl = url.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Check URL patterns first
  if (lowerUrl.includes('/contact') || lowerUrl.includes('/contact-us')) return 'contact';
  if (lowerUrl.includes('/about') || lowerUrl.includes('/about-us')) return 'about';
  if (lowerUrl.includes('/service') || lowerUrl.includes('/department')) return 'services';
  if (lowerUrl.includes('/doctor') || lowerUrl.includes('/staff') || lowerUrl.includes('/physician')) return 'doctors';
  if (lowerUrl.includes('/emergency')) return 'emergency';
  if (lowerUrl.includes('/appointment') || lowerUrl.includes('/booking')) return 'appointments';
  if (lowerUrl.includes('/blog') || lowerUrl.includes('/news') || lowerUrl.includes('/article')) return 'blog';
  if (lowerUrl === new URL(url).origin || lowerUrl === new URL(url).origin + '/') return 'home';

  // Check content patterns
  const patterns: Record<string, string[]> = {
    emergency: ['emergency', '24/7', 'urgent care', 'trauma', 'ambulance'],
    services: ['services', 'specialties', 'departments', 'treatment', 'procedures'],
    doctors: ['doctors', 'physicians', 'specialists', 'medical staff', 'consultants'],
    contact: ['contact', 'phone', 'email', 'address', 'location', 'reach us'],
    about: ['about', 'history', 'mission', 'vision', 'our hospital'],
    appointments: ['appointment', 'booking', 'schedule', 'reserve'],
  };

  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      return type;
    }
  }

  return 'general';
}

function extractMetadata(doc: any, url: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    method: 'advanced_native',
    url: url,
  };

  // Extract meta tags
  const metaTags = doc.querySelectorAll('meta');
  metaTags.forEach((tag: any) => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (name && content) {
      metadata[name] = content;
    }
  });

  // Extract structured data (JSON-LD)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const structuredData: any[] = [];
  jsonLdScripts.forEach((script: any) => {
    try {
      const data = JSON.parse(script.textContent);
      structuredData.push(data);
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  if (structuredData.length > 0) {
    metadata.structuredData = structuredData;
  }

  // Extract contact information
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  
  const bodyText = doc.querySelector('body')?.textContent || '';
  const emails = bodyText.match(emailPattern);
  const phones = bodyText.match(phonePattern);
  
  if (emails) metadata.emails = [...new Set(emails)].slice(0, 5);
  if (phones) metadata.phones = [...new Set(phones)].slice(0, 5);

  return metadata;
}
