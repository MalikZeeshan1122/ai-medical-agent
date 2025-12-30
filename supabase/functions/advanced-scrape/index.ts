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
    return new Response(null, { status: 200, headers: corsHeaders });
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
    const maxPages = 5; // Strict limit
    const maxDepth = 1;  // Strict limit
    const globalTimeoutMs = 20000;
    const globalTimeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Global timeout exceeded')), globalTimeoutMs));


    // Validate URL
    let baseUrl: URL;
    try {
      baseUrl = new URL(websiteUrl);
    } catch (e) {
      throw new Error(`Invalid URL: ${websiteUrl}`);
    }

    async function scrapePageAdvanced(url: string, depth: number): Promise<void> {
      console.log(`[DEBUG] scrapePageAdvanced ENTRY: url=${url}, depth=${depth}, visitedUrls.size=${visitedUrls.size}`);
      if (depth > maxDepth) {
        console.log(`[DEBUG] Max depth exceeded: depth=${depth} > maxDepth=${maxDepth}. Returning.`);
        return;
      }
      if (visitedUrls.size >= maxPages) {
        console.log(`[DEBUG] Max pages limit reached: visitedUrls.size=${visitedUrls.size} >= maxPages=${maxPages}. Returning.`);
        return;
      }
      if (visitedUrls.has(url)) {
        console.log(`[DEBUG] URL already visited: ${url}. Returning.`);
        return;
      }
      const skipExt = /\.(pdf|jpg|jpeg|png|gif|zip|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov|wmv|svg|webp|avif|ico)$/i;
      if (skipExt.test(url.split('?')[0])) {
        console.log(`[DEBUG] Skipping non-HTML file: ${url}`);
        return;
      }
      visitedUrls.add(url);
      console.log(`[DEBUG] Scraping: ${url} (depth: ${depth}, total: ${visitedUrls.size})`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
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
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('text/html')) {
          console.error(`[DEBUG] Skipped non-HTML or failed fetch: ${url} (${response.status} ${response.statusText}, content-type: ${contentType})`);
          return;
        }
        const html = await response.text();
        console.log(`[DEBUG] Fetched ${html.length} bytes from ${url}`);
        let doc;
        try {
          doc = new DOMParser().parseFromString(html, 'text/html');
        } catch (parseErr) {
          console.error(`[DEBUG] Failed to parse HTML from ${url}:`, parseErr);
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);
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
            console.log(`[DEBUG] Scraped with fallback: ${title}`);
          }
          return;
        }
        if (!doc) {
          console.error(`[DEBUG] Failed to parse HTML from ${url}`);
          return;
        }
        const titleElement = doc.querySelector('title');
        const title = titleElement?.textContent?.trim() || extractTitleFromUrl(url);
        console.log(`[DEBUG] Page title: ${title}`);
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
        console.log(`[DEBUG] Extracted ${content.length} characters of content`);
        const pageType = determinePageTypeAdvanced(url, content, doc);
        const metadata = extractMetadata(doc, url);
        scrapedPages.push({
          url,
          title,
          content,
          page_type: pageType,
          metadata,
        });
        console.log(`[DEBUG] Successfully scraped page: ${title} (type: ${pageType})`);
        if (depth < maxDepth && visitedUrls.size < maxPages) {
          const links = doc.querySelectorAll('a[href]');
          const linkPromises: Promise<void>[] = [];
          for (const link of links) {
            const href = (link as any).getAttribute?.('href');
            if (!href) continue;
            try {
              const absoluteUrl = new URL(href, url);
              if (
                absoluteUrl.hostname === baseUrl.hostname &&
                !absoluteUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i) &&
                !absoluteUrl.pathname.includes('/wp-admin') &&
                !absoluteUrl.pathname.includes('/login') &&
                !visitedUrls.has(absoluteUrl.href)
              ) {
                // Check limits before recursing
                if (visitedUrls.size < maxPages && depth + 1 <= maxDepth) {
                  linkPromises.push(scrapePageAdvanced(absoluteUrl.href, depth + 1));
                  if (linkPromises.length >= 5) {
                    await Promise.all(linkPromises);
                    linkPromises.length = 0;
                  }
                } else {
                  console.log(`[DEBUG] Not recursing further: visitedUrls.size=${visitedUrls.size}, depth+1=${depth+1}`);
                }
              }
            } catch (e) {
              continue;
            }
          }
          if (linkPromises.length > 0) {
            await Promise.all(linkPromises);
          }
        }
      } catch (error) {
        console.error(`[DEBUG] Error scraping ${url}:`, error);
      }
    }
    try {
      await Promise.race([
        scrapePageAdvanced(websiteUrl, 0),
        globalTimeoutPromise
      ]);
    } catch (scrapeError) {
      console.error('[DEBUG] Scraping failed:', scrapeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: scrapeError instanceof Error ? scrapeError.message : String(scrapeError),
          type: scrapeError instanceof Error ? scrapeError.constructor.name : typeof scrapeError,
          suggestion: scrapeError instanceof Error && scrapeError.message.includes('timeout')
            ? 'Try reducing the number of pages or depth, or check if the target site is slow.'
            : 'Check the logs for more details.'
        }),
        { status: 546, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
