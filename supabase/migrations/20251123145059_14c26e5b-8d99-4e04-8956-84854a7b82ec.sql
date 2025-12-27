-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  description TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hospital_pages table for scraped content
CREATE TABLE public.hospital_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  page_type TEXT, -- e.g., 'department', 'service', 'contact', 'about'
  metadata JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_hospital_pages_hospital_id ON public.hospital_pages(hospital_id);
CREATE INDEX idx_hospital_pages_content ON public.hospital_pages USING gin(to_tsvector('english', content));

-- Enable Row Level Security
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is a public-facing medical info system)
CREATE POLICY "Public read access to hospitals" 
ON public.hospitals 
FOR SELECT 
USING (true);

CREATE POLICY "Public read access to hospital pages" 
ON public.hospital_pages 
FOR SELECT 
USING (true);

-- Admin policies (for now, allow all authenticated users to manage - can be restricted later)
CREATE POLICY "Authenticated users can insert hospitals" 
ON public.hospitals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hospitals" 
ON public.hospitals 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete hospitals" 
ON public.hospitals 
FOR DELETE 
USING (true);

CREATE POLICY "Authenticated users can insert hospital pages" 
ON public.hospital_pages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hospital pages" 
ON public.hospital_pages 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete hospital pages" 
ON public.hospital_pages 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();