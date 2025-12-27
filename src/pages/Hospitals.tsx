import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Globe, Loader2, Trash2, RefreshCw, Settings, Eye, Zap, Server, Search, Filter, BarChart3, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface Hospital {
  id: string;
  name: string;
  website_url: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  description?: string;
  scraped_at?: string;
  created_at: string;
  auto_scrape_enabled?: boolean;
  scrape_frequency?: string;
}

interface HospitalPage {
  id: string;
  hospital_id: string;
  url: string;
  title: string | null;
  content: string | null;
  page_type: string | null;
  metadata: any;
  scraped_at: string;
}

interface ScrapingStats {
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  total_pages_scraped: number;
  avg_duration_seconds: number;
  last_scrape_date: string;
  last_scrape_method: string;
}

const Hospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>("");
  const [scraperApiKey, setScraperApiKey] = useState<string>("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [previewHospital, setPreviewHospital] = useState<Hospital | null>(null);
  const [previewPages, setPreviewPages] = useState<HospitalPage[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hospitalStats, setHospitalStats] = useState<ScrapingStats | null>(null);
  const [selectedHospitalForStats, setSelectedHospitalForStats] = useState<Hospital | null>(null);
  const [testingFirecrawl, setTestingFirecrawl] = useState(false);
  const [testingScraper, setTestingScraper] = useState(false);
  const [firecrawlValid, setFirecrawlValid] = useState<boolean | null>(null);
  const [scraperValid, setScraperValid] = useState<boolean | null>(null);
  const [selectedHospitals, setSelectedHospitals] = useState<Set<string>>(new Set());
  const [bulkScraping, setBulkScraping] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedFirecrawlKey = localStorage.getItem('firecrawl_api_key');
    const savedScraperKey = localStorage.getItem('scraper_api_key');
    if (savedFirecrawlKey) setFirecrawlApiKey(savedFirecrawlKey);
    if (savedScraperKey) setScraperApiKey(savedScraperKey);
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [searchQuery, filterStatus, hospitals]);

  const [formData, setFormData] = useState({
    name: "",
    website_url: "",
    address: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
    description: "",
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filterHospitals = () => {
    let filtered = [...hospitals];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(h => {
        switch (filterStatus) {
          case "scraped":
            return !!h.scraped_at;
          case "not-scraped":
            return !h.scraped_at;
          case "auto-enabled":
            return h.auto_scrape_enabled === true;
          default:
            return true;
        }
      });
    }

    setFilteredHospitals(filtered);
  };

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      toast({
        title: "Error",
        description: "Failed to load hospitals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHospital = async () => {
    try {
      // Ensure user is authenticated before attempting insert
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to add a hospital.",
          variant: "destructive",
        });
        return;
      }

      // Validate required fields
      if (!formData.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Hospital name is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.website_url?.trim()) {
        toast({
          title: "Validation Error",
          description: "Website URL is required",
          variant: "destructive",
        });
        return;
      }

      // Clean up form data - remove empty strings for optional fields
      const cleanedData: any = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        website_url: formData.website_url.trim(),
      };
      
      // Only add optional fields if they have values
      if (formData.address?.trim()) cleanedData.address = formData.address.trim();
      if (formData.city?.trim()) cleanedData.city = formData.city.trim();
      if (formData.country?.trim()) cleanedData.country = formData.country.trim();
      if (formData.phone?.trim()) cleanedData.phone = formData.phone.trim();
      if (formData.email?.trim()) cleanedData.email = formData.email.trim();
      if (formData.description?.trim()) cleanedData.description = formData.description.trim();
      if (formData.latitude?.trim()) {
        const lat = parseFloat(formData.latitude);
        if (!isNaN(lat)) cleanedData.latitude = lat;
      }
      if (formData.longitude?.trim()) {
        const lng = parseFloat(formData.longitude);
        if (!isNaN(lng)) cleanedData.longitude = lng;
      }

      console.log("Inserting hospital data:", cleanedData);

      // Fallback to raw fetch to capture full error body and avoid column filtering
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/hospitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabase.supabaseKey,
          Authorization: session ? `Bearer ${session.access_token}` : "",
          Prefer: "return=representation",
        },
        body: JSON.stringify([cleanedData]),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(async () => ({ raw: await response.text() }));
        console.error("Hospital insert error details:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        toast({
          title: `Insert failed (${response.status})`,
          description: errorBody?.message || JSON.stringify(errorBody) || response.statusText,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log("Hospital inserted successfully:", data);

      toast({
        title: "Success",
        description: "Hospital added successfully",
      });

      setIsAddOpen(false);
      setFormData({
        name: "",
        website_url: "",
        address: "",
        city: "",
        country: "",
        latitude: "",
        longitude: "",
        phone: "",
        email: "",
        description: "",
      });
      
      fetchHospitals();
    } catch (error: any) {
      console.error("Error adding hospital:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add hospital",
        variant: "destructive",
      });
    }
  };

  const testFirecrawlKey = async () => {
    if (!firecrawlApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    setTestingFirecrawl(true);
    setFirecrawlValid(null);

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey.trim()}`,
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown'],
        }),
      });

      if (response.ok) {
        setFirecrawlValid(true);
        toast({
          title: "Valid API Key",
          description: "Firecrawl API key is valid and working",
        });
      } else {
        setFirecrawlValid(false);
        toast({
          title: "Invalid API Key",
          description: "Firecrawl API key is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setFirecrawlValid(false);
      toast({
        title: "Connection Error",
        description: "Failed to test Firecrawl API key",
        variant: "destructive",
      });
    } finally {
      setTestingFirecrawl(false);
    }
  };

  const testScraperKey = async () => {
    if (!scraperApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ScraperAPI key",
        variant: "destructive",
      });
      return;
    }

    setTestingScraper(true);
    setScraperValid(null);

    try {
      const response = await fetch(`http://api.scraperapi.com/?api_key=${scraperApiKey.trim()}&url=https://example.com`);

      if (response.ok) {
        setScraperValid(true);
        toast({
          title: "Valid API Key",
          description: "ScraperAPI key is valid and working",
        });
      } else {
        setScraperValid(false);
        toast({
          title: "Invalid API Key",
          description: "ScraperAPI key is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setScraperValid(false);
      toast({
        title: "Connection Error",
        description: "Failed to test ScraperAPI key",
        variant: "destructive",
      });
    } finally {
      setTestingScraper(false);
    }
  };

  const saveApiKey = () => {
    if (firecrawlApiKey.trim()) {
      localStorage.setItem('firecrawl_api_key', firecrawlApiKey.trim());
    }
    if (scraperApiKey.trim()) {
      localStorage.setItem('scraper_api_key', scraperApiKey.trim());
    }
    toast({
      title: "Success",
      description: "API keys saved successfully",
    });
    setShowSettingsDialog(false);
  };

  const clearFirecrawlKey = () => {
    localStorage.removeItem('firecrawl_api_key');
    setFirecrawlApiKey("");
    toast({ title: "Success", description: "Firecrawl key cleared" });
  };

  const clearScraperKey = () => {
    localStorage.removeItem('scraper_api_key');
    setScraperApiKey("");
    toast({ title: "Success", description: "ScraperAPI key cleared" });
  };

  const handleToggleAutoScrape = async (hospital: Hospital, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ auto_scrape_enabled: enabled })
        .eq('id', hospital.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Auto-scraping ${enabled ? 'enabled' : 'disabled'} for ${hospital.name}`,
      });

      fetchHospitals();
    } catch (error) {
      console.error('Error toggling auto-scrape:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-scrape setting",
        variant: "destructive",
      });
    }
  };

  const handleUpdateScrapeFrequency = async (hospital: Hospital, frequency: string) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ scrape_frequency: frequency })
        .eq('id', hospital.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Scrape frequency updated to ${frequency}`,
      });

      fetchHospitals();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast({
        title: "Error",
        description: "Failed to update scrape frequency",
        variant: "destructive",
      });
    }
  };

  const handleViewAnalytics = async (hospital: Hospital) => {
    setSelectedHospitalForStats(hospital);
    setShowAnalytics(true);
    
    try {
      const { data, error } = await supabase
        .rpc('get_hospital_scraping_stats', { hospital_uuid: hospital.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setHospitalStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    }
  };

  const handlePreviewContent = async (hospital: Hospital) => {
    setPreviewHospital(hospital);
    setLoadingPreview(true);
    
    try {
      const { data, error } = await supabase
        .from('hospital_pages')
        .select('*')
        .eq('hospital_id', hospital.id)
        .order('scraped_at', { ascending: false });

      if (error) throw error;
      
      setPreviewPages(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No content available",
          description: "This hospital hasn't been scraped yet. Click 'Scrape Website' first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      toast({
        title: "Error",
        description: "Failed to load scraped content",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const getScrapingMethod = (pages: HospitalPage[]): string => {
    if (pages.length === 0) return 'Not scraped';
    const latestPage = pages[0];
    const method = latestPage.metadata?.method;
    return method === 'firecrawl' ? 'Firecrawl API' : 'Native';
  };

  const handleScrapeHospital = async (hospitalId: string, websiteUrl: string, hospital: Hospital) => {
    setScrapingId(hospitalId);
    
    // Validate URL format first
    try {
      new URL(websiteUrl);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please check the website URL format and try again.",
        variant: "destructive",
      });
      setScrapingId(null);
      return;
    }
    
    // Check if API keys are configured
    if (!firecrawlApiKey && !scraperApiKey) {
      // Use advanced native scraper as fallback
      try {
        const { data, error } = await supabase.functions.invoke("advanced-scrape", {
          body: { 
            hospitalId, 
            websiteUrl,
          },
        });

        if (error || data?.error) {
          throw new Error(data?.error || 'Advanced scraping failed');
        }

        toast({
          title: "Success",
          description: `Scraped ${data.pagesScraped || 0} pages from ${hospital.name} using ${data.method || 'Advanced Native Scraper'}`,
        });

        fetchHospitals();
        setScrapingId(null);
        return;
      } catch (advError) {
        // If advanced scraper fails, show error and suggest API keys
        const errorMsg = advError instanceof Error ? advError.message : 'Advanced scraping failed';
        console.error('Advanced scraper error:', errorMsg);
        
        toast({
          title: "Scraping Failed",
          description: `Advanced scraping encountered an issue: ${errorMsg}. Try configuring Firecrawl or ScraperAPI in Settings for better results.`,
          variant: "destructive",
          duration: 10000,
        });
        setScrapingId(null);
        setShowSettingsDialog(true);
        return;
      }
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("scrape-hospital", {
        body: { 
          hospitalId, 
          websiteUrl,
          firecrawlApiKey: firecrawlApiKey || undefined,
          scraperApiKey: scraperApiKey || undefined
        },
      });

      if (error) {
        console.error('Scraping error:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'Unknown error';
        throw new Error(errorMessage);
      }

      if (data?.error) {
        // Check for authentication errors
        if (data.error.includes('Unauthorized') || data.error.includes('Invalid token') || data.error.includes('401')) {
          throw new Error('Invalid API key. Please check your Firecrawl or ScraperAPI key in Settings and ensure it\'s valid. You may need to regenerate your API key from the provider\'s dashboard.');
        }
        throw new Error(data.error + (data.suggestion ? `\n\n${data.suggestion}` : ''));
      }

      toast({
        title: "Success",
        description: `Scraped ${data.pagesScraped || 0} pages from ${hospital.name} using ${data.method || 'default method'}`,
      });

      fetchHospitals();
    } catch (error) {
      console.error("Error scraping hospital:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scrape hospital website';
      
      // Check if it's an API key issue
      const isAuthError = errorMessage.includes('Unauthorized') || 
                         errorMessage.includes('Invalid token') || 
                         errorMessage.includes('401') ||
                         errorMessage.includes('Invalid API key');
      
      // Show detailed error with multiline support
      toast({
        title: isAuthError ? "Invalid API Key" : "Scraping Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
      
      // Open settings dialog if auth error
      if (isAuthError) {
        setShowSettingsDialog(true);
      }
    } finally {
      setScrapingId(null);
    }
  };

  const toggleHospitalSelection = (hospitalId: string) => {
    setSelectedHospitals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hospitalId)) {
        newSet.delete(hospitalId);
      } else {
        newSet.add(hospitalId);
      }
      return newSet;
    });
  };

  const selectAllHospitals = () => {
    setSelectedHospitals(new Set(filteredHospitals.map(h => h.id)));
  };

  const deselectAllHospitals = () => {
    setSelectedHospitals(new Set());
  };

  const handleBulkScrape = async () => {
    if (selectedHospitals.size === 0) {
      toast({
        title: "No hospitals selected",
        description: "Please select hospitals to scrape",
        variant: "destructive",
      });
      return;
    }

    setBulkScraping(true);
    setShowBulkDialog(true);
    const hospitalsToScrape = filteredHospitals.filter(h => selectedHospitals.has(h.id));
    let successCount = 0;
    let failCount = 0;

    const useAdvanced = !firecrawlApiKey && !scraperApiKey;

    for (const hospital of hospitalsToScrape) {
      try {
        const functionName = useAdvanced ? "advanced-scrape" : "scrape-hospital";
        const body = useAdvanced 
          ? { hospitalId: hospital.id, websiteUrl: hospital.website_url }
          : { 
              hospitalId: hospital.id, 
              websiteUrl: hospital.website_url,
              firecrawlApiKey: firecrawlApiKey || undefined,
              scraperApiKey: scraperApiKey || undefined
            };

        const { data, error } = await supabase.functions.invoke(functionName, { body });

        if (error || data?.error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setBulkScraping(false);
    toast({
      title: "Bulk Scraping Complete",
      description: `Successfully scraped ${successCount} hospitals. ${failCount} failed.${useAdvanced ? ' (Used Advanced Native Scraper)' : ''}`,
    });
    deselectAllHospitals();
    fetchHospitals();
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    try {
      const { error } = await supabase
        .from("hospitals")
        .delete()
        .eq("id", hospitalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hospital deleted successfully",
      });

      fetchHospitals();
    } catch (error) {
      console.error("Error deleting hospital:", error);
      toast({
        title: "Error",
        description: "Failed to delete hospital",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hospital Management</h1>
          <p className="text-muted-foreground mt-2">
            Add hospitals and scrape their websites to provide AI-powered assistance
          </p>
        </div>
        <div className="flex gap-2">
          {selectedHospitals.size > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={handleBulkScrape}
                disabled={bulkScraping}
              >
                {bulkScraping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping {selectedHospitals.size} hospitals...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scrape Selected ({selectedHospitals.size})
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllHospitals}>
                Deselect All
              </Button>
            </>
          )}
          {filteredHospitals.length > 0 && selectedHospitals.size === 0 && (
            <Button variant="outline" size="sm" onClick={selectAllHospitals}>
              Select All
            </Button>
          )}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Scraping Settings</DialogTitle>
                <DialogDescription>
                  Configure API keys and scraping preferences for hospital data collection
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="api" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="api">API Configuration</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="api" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Firecrawl API
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Advanced web scraping with better success rates and structured data extraction.
                        Get your API key from{" "}
                        <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          firecrawl.dev
                        </a>
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="firecrawlKey">API Key</Label>
                          <Input
                            id="firecrawlKey"
                            type="password"
                            value={firecrawlApiKey}
                            onChange={(e) => setFirecrawlApiKey(e.target.value)}
                            placeholder="fc-..."
                            className="font-mono"
                          />
                        </div>
                        {firecrawlApiKey && (
                          <div className="flex items-center gap-2">
                            {firecrawlValid === true && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                <Zap className="w-3 h-3 mr-1" />
                                Valid Key
                              </Badge>
                            )}
                            {firecrawlValid === false && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                                Invalid Key
                              </Badge>
                            )}
                            {firecrawlValid === null && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                                <Zap className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={testFirecrawlKey}
                              disabled={testingFirecrawl}
                              className="h-8 text-xs"
                            >
                              {testingFirecrawl ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                "Test Key"
                              )}
                            </Button>
                            <Button onClick={clearFirecrawlKey} variant="ghost" size="sm">
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-600" />
                        ScraperAPI
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Reliable scraping with proxy rotation and CAPTCHA handling.
                        Get your API key from{" "}
                        <a href="https://scraperapi.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          scraperapi.com
                        </a>
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="scraperKey">API Key</Label>
                          <Input
                            id="scraperKey"
                            type="password"
                            value={scraperApiKey}
                            onChange={(e) => setScraperApiKey(e.target.value)}
                            placeholder="..."
                            className="font-mono"
                          />
                        </div>
                        {scraperApiKey && (
                          <div className="flex items-center gap-2">
                            {scraperValid === true && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                <Server className="w-3 h-3 mr-1" />
                                Valid Key
                              </Badge>
                            )}
                            {scraperValid === false && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                                Invalid Key
                              </Badge>
                            )}
                            {scraperValid === null && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                                <Server className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={testScraperKey}
                              disabled={testingScraper}
                              className="h-8 text-xs"
                            >
                              {testingScraper ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                "Test Key"
                              )}
                            </Button>
                            <Button onClick={clearScraperKey} variant="ghost" size="sm">
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        Advanced Native Scraper
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Free advanced scraping using our enhanced native scraper. Features intelligent content extraction, 
                        recursive crawling, metadata extraction, and contact information detection. No API key required!
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                            Free
                          </Badge>
                          <span className="text-muted-foreground">Includes deep crawling up to 100 pages</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                            Smart
                          </Badge>
                          <span className="text-muted-foreground">Extracts emails, phones, and structured data</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Scraping Method Priority</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        The system will automatically choose the best available method:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            1
                          </div>
                          <div>
                            <p className="font-medium">Firecrawl API</p>
                            <p className="text-xs text-muted-foreground">If API key is configured</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold">
                            2
                          </div>
                          <div>
                            <p className="font-medium">Native Scraping</p>
                            <p className="text-xs text-muted-foreground">Automatic fallback</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end mt-4">
                <Button onClick={saveApiKey}>
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Hospital</DialogTitle>
              <DialogDescription>
                Enter hospital details. The website will be scraped to provide AI assistance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Hospital Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Victoria Hospital"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website URL *</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="29.3813"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="71.6749"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 62 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@hospital.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the hospital"
                  rows={3}
                />
              </div>
              <Button onClick={handleAddHospital} className="w-full">
                Add Hospital
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hospitals by name, city, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hospitals</SelectItem>
            <SelectItem value="scraped">Scraped</SelectItem>
            <SelectItem value="not-scraped">Not Scraped</SelectItem>
            <SelectItem value="auto-enabled">Auto-Scrape On</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHospitals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hospitals added yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first hospital to start providing AI-powered assistance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className="relative">
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedHospitals.has(hospital.id)}
                  onCheckedChange={() => toggleHospitalSelection(hospital.id)}
                  aria-label={`Select ${hospital.name}`}
                />
              </div>
              <CardHeader className="pl-12">
                <CardTitle className="flex items-start justify-between">
                  <span>{hospital.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteHospital(hospital.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardTitle>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    {hospital.city && hospital.country && `${hospital.city}, ${hospital.country}`}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {hospital.scraped_at ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Scraped
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Not Scraped
                      </Badge>
                    )}
                    {hospital.auto_scrape_enabled && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                        <Zap className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hospital.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{hospital.address}</span>
                  </div>
                )}
                {hospital.website_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <a
                      href={hospital.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {hospital.website_url}
                    </a>
                  </div>
                )}
                {hospital.scraped_at && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Last scraped: {new Date(hospital.scraped_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={hospital.auto_scrape_enabled || false}
                        onCheckedChange={(checked) => handleToggleAutoScrape(hospital, checked)}
                      />
                      <span className="text-muted-foreground">Auto-scrape {hospital.scrape_frequency || 'weekly'}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleScrapeHospital(hospital.id, hospital.website_url, hospital)}
                    disabled={scrapingId === hospital.id}
                    className="flex-1"
                    variant="outline"
                  >
                    {scrapingId === hospital.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {hospital.scraped_at ? "Re-scrape" : "Scrape"}
                      </>
                    )}
                  </Button>
                  {hospital.scraped_at && (
                    <>
                      <Button
                        onClick={() => handlePreviewContent(hospital)}
                        variant="outline"
                        size="icon"
                        title="Preview content"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleViewAnalytics(hospital)}
                        variant="outline"
                        size="icon"
                        title="View analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Preview Dialog */}
      <Dialog open={!!previewHospital} onOpenChange={(open) => !open && setPreviewHospital(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Scraped Content Preview - {previewHospital?.name}</DialogTitle>
            <DialogDescription>
              View the content scraped from this hospital's website
            </DialogDescription>
          </DialogHeader>
          
          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : previewPages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {previewPages.length} pages scraped
                  </Badge>
                  <Badge 
                    variant={getScrapingMethod(previewPages) === 'Firecrawl API' ? 'default' : 'outline'}
                    className={getScrapingMethod(previewPages) === 'Firecrawl API' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-muted'}
                  >
                    {getScrapingMethod(previewPages) === 'Firecrawl API' ? (
                      <Zap className="w-3 h-3 mr-1" />
                    ) : (
                      <Server className="w-3 h-3 mr-1" />
                    )}
                    {getScrapingMethod(previewPages)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scraped: {new Date(previewPages[0].scraped_at).toLocaleString()}
                </p>
              </div>
              
              <ScrollArea className="h-[50vh] rounded-md border">
                <div className="p-4 space-y-4">
                  {previewPages.map((page, index) => (
                    <div key={page.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{page.title || 'Untitled'}</h4>
                          <p className="text-xs text-muted-foreground truncate">{page.url}</p>
                        </div>
                        {page.page_type && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {page.page_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {page.content?.substring(0, 200)}...
                      </p>
                      {index < previewPages.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Globe className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No content available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hospitals;