-- Add scraping analytics table
CREATE TABLE IF NOT EXISTS public.hospital_scraping_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  scrape_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL,
  pages_scraped INTEGER NOT NULL DEFAULT 0,
  pages_failed INTEGER NOT NULL DEFAULT 0,
  duration_seconds NUMERIC,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hospital_scraping_stats_hospital_id ON public.hospital_scraping_stats(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_scraping_stats_scrape_date ON public.hospital_scraping_stats(scrape_date DESC);

-- Enable RLS
ALTER TABLE public.hospital_scraping_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate)
DROP POLICY IF EXISTS "Public read access to scraping stats" ON public.hospital_scraping_stats;
DROP POLICY IF EXISTS "Authenticated users can insert scraping stats" ON public.hospital_scraping_stats;

CREATE POLICY "Public read access to scraping stats" 
ON public.hospital_scraping_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert scraping stats" 
ON public.hospital_scraping_stats 
FOR INSERT 
WITH CHECK (true);

-- Add auto_scrape_enabled and scrape_frequency to hospitals table
ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS auto_scrape_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scrape_frequency TEXT DEFAULT 'weekly';

-- Drop old function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS get_hospital_scraping_stats(UUID);

-- Create corrected function to get scraping statistics
CREATE OR REPLACE FUNCTION get_hospital_scraping_stats(hospital_uuid UUID)
RETURNS TABLE(
  total_scrapes BIGINT,
  successful_scrapes BIGINT,
  failed_scrapes BIGINT,
  total_pages_scraped BIGINT,
  avg_duration_seconds NUMERIC,
  last_scrape_date TIMESTAMP WITH TIME ZONE,
  last_scrape_method TEXT
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_scrapes,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_scrapes,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_scrapes,
    COALESCE(SUM(pages_scraped::INTEGER)::BIGINT, 0) as total_pages_scraped,
    AVG(CAST(duration_seconds AS NUMERIC)) as avg_duration_seconds,
    MAX(scrape_date) as last_scrape_date,
    (SELECT method FROM public.hospital_scraping_stats 
     WHERE hospital_id = hospital_uuid::TEXT 
     ORDER BY scrape_date DESC LIMIT 1) as last_scrape_method
  FROM public.hospital_scraping_stats
  WHERE hospital_id = hospital_uuid::TEXT;
$$;
