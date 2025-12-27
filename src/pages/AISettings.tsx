import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, Check, X, Brain, Sparkles, TestTube, Activity, Zap, Wrench, BarChart3, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { APITemplateSelector } from "@/components/APITemplateSelector";
import { APITemplate } from "@/data/apiTemplates";
import { APIAnalytics } from "@/components/APIAnalytics";

// Validation schema (simplified)
const aiProviderSchema = z.object({
  display_name: z.string()
    .trim()
    .min(1, "Display Name is required")
    .max(100, "Display Name must be less than 100 characters"),
  provider_name: z.string()
    .min(1, "Provider is required"),
  model_name: z.string()
    .trim()
    .min(1, "Model name is required")
    .max(100, "Model name must be less than 100 characters"),
  api_key_encrypted: z.string()
    .min(1, "API key is required")
    .max(500, "API key is too long"),
  base_url: z.string()
    .trim()
    .max(500, "Base URL is too long")
    .optional(),
});

const apiIntegrationSchema = z.object({
  display_name: z.string()
    .trim()
    .min(1, "API Name is required")
    .max(100, "API Name must be less than 100 characters"),
  api_name: z.string()
    .trim()
    .min(1, "API identifier is required")
    .max(100, "API identifier must be less than 100 characters"),
  api_key_encrypted: z.string()
    .min(1, "API key is required")
    .max(500, "API key is too long"),
  base_url: z.string()
    .trim()
    .max(500, "Base URL is too long")
    .optional(),
  description: z.string()
    .trim()
    .max(500, "Description is too long")
    .optional(),
});

type AIProviderForm = z.infer<typeof aiProviderSchema>;
type APIIntegrationForm = z.infer<typeof apiIntegrationSchema>;

interface AIProvider extends Partial<AIProviderForm> {
  id: string;
  user_id: string;
  display_name: string;
  provider_name: string;
  model_name: string;
  api_key_encrypted: string;
  is_active: boolean;
  is_default: boolean;
  provider_config: any;
  created_at: string;
  updated_at: string;
}

interface APIIntegration {
  id: string;
  user_id: string;
  display_name: string;
  api_name: string;
  api_key_encrypted: string;
  base_url?: string;
  description?: string;
  is_active: boolean;
  config: any;
  cache_enabled?: boolean;
  cache_ttl_seconds?: number;
  rate_limit_enabled?: boolean;
  rate_limit_calls?: number;
  rate_limit_window_seconds?: number;
  created_at: string;
  updated_at: string;
}

const AISettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    provider_name: "",
    model_name: "",
    api_key_encrypted: "",
    base_url: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [testing, setTesting] = useState(false);
  const [usageStats, setUsageStats] = useState<Record<string, { messages: number; tokens: number }>>({});

  // API Integrations state
  const [apiIntegrations, setApiIntegrations] = useState<APIIntegration[]>([]);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<APIIntegration | null>(null);
  const [apiFormData, setApiFormData] = useState({
    display_name: "",
    api_name: "",
    api_key_encrypted: "",
    base_url: "",
    description: "",
    cache_enabled: false,
    cache_ttl_seconds: 3600,
    rate_limit_enabled: false,
    rate_limit_calls: 100,
    rate_limit_window_seconds: 3600,
  });
  const [apiFormErrors, setApiFormErrors] = useState<Partial<Record<keyof typeof apiFormData, string>>>({});
  const [testingApi, setTestingApi] = useState(false);
  const [showApiAnalytics, setShowApiAnalytics] = useState(false);


  useEffect(() => {
    if (user) {
      fetchProviders();
      fetchUsageStats();
      fetchApiIntegrations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProviders((data || []) as AIProvider[]);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to load AI providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_chat_messages")
        .select("provider_id, tokens_used");

      if (error) throw error;

      const stats: Record<string, { messages: number; tokens: number }> = {};
      (data || []).forEach((msg: any) => {
        if (msg.provider_id) {
          if (!stats[msg.provider_id]) {
            stats[msg.provider_id] = { messages: 0, tokens: 0 };
          }
          stats[msg.provider_id].messages++;
          stats[msg.provider_id].tokens += msg.tokens_used || 0;
        }
      });
      setUsageStats(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    }
  };

  const validateForm = (): boolean => {
    try {
      aiProviderSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof AIProviderForm, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof AIProviderForm] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage AI providers",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProvider) {
        const { base_url, ...restFormData } = formData;
        const updateData: any = {
          ...restFormData,
          updated_at: new Date().toISOString(),
        };

        // Store base_url inside provider_config JSON
        updateData.provider_config = base_url ? { base_url } : {};
        
        // Only update API key if it's not the masked value
        if (formData.api_key_encrypted === "••••••••") {
          delete updateData.api_key_encrypted;
        }

        const { error } = await supabase
          .from("ai_providers")
          .update(updateData)
          .eq("id", editingProvider.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "API provider updated successfully",
        });
      } else {
        const { base_url, ...restFormData } = formData;
        const insertData = {
          ...restFormData,
          user_id: user.id,
          // Store base_url inside provider_config JSON
          provider_config: base_url ? { base_url } : {},
        };

        const { error } = await supabase
          .from("ai_providers")
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "API provider added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProviders();
    } catch (error: any) {
      console.error("Error saving provider:", error);
      const errorMessage = error?.message || error?.error_description || error?.hint || JSON.stringify(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (provider: AIProvider, active: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_providers")
        .update({ is_active: active })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${provider.display_name} ${active ? "enabled" : "disabled"}`,
      });

      fetchProviders();
    } catch (error) {
      console.error("Error toggling provider:", error);
      toast({
        title: "Error",
        description: "Failed to update provider status",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (provider: AIProvider) => {
    try {
      // First, unset all defaults
      await supabase
        .from("ai_providers")
        .update({ is_default: false })
        .eq("user_id", user!.id);

      // Then set the new default
      const { error } = await supabase
        .from("ai_providers")
        .update({ is_default: true, is_active: true })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${provider.display_name} set as default`,
      });

      fetchProviders();
    } catch (error) {
      console.error("Error setting default:", error);
      toast({
        title: "Error",
        description: "Failed to set default provider",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setFormData({
      display_name: provider.display_name,
      provider_name: provider.provider_name,
      model_name: provider.model_name,
      api_key_encrypted: "••••••••", // Masked for security
      base_url: provider.provider_config?.base_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleTestConnection = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test the connection",
        variant: "destructive",
      });
      return;
    }

    if (!formData.api_key_encrypted || formData.api_key_encrypted === "••••••••") {
      toast({
        title: "API Key Required",
        description: "Please enter an API key to test the connection",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("private-ai-chat", {
        body: {
          messages: [{ role: "user", content: "Test connection" }],
          userId: user.id,
          providerId: editingProvider?.id,
          testConfig: {
            provider_name: formData.provider_name || "custom",
            model_name: formData.model_name,
            api_key: formData.api_key_encrypted,
            config: formData.base_url ? { base_url: formData.base_url } : null,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Connection test successful! API is working correctly.",
      });
    } catch (error: any) {
      console.error("Connection test error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to API provider",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this AI provider?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("ai_providers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI provider deleted successfully",
      });

      fetchProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete AI provider",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      display_name: "",
      provider_name: "",
      model_name: "",
      api_key_encrypted: "",
      base_url: "",
    });
    setFormErrors({});
    setEditingProvider(null);
  };

  // API Integrations functions
  const fetchApiIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_api_integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiIntegrations((data || []) as APIIntegration[]);
    } catch (error) {
      console.error("Error fetching API integrations:", error);
      toast({
        title: "Error",
        description: "Failed to load API integrations",
        variant: "destructive",
      });
    }
  };

  const validateApiForm = (): boolean => {
    try {
      apiIntegrationSchema.parse(apiFormData);
      setApiFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof typeof apiFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof typeof apiFormData] = err.message;
          }
        });
        setApiFormErrors(errors);
      }
      return false;
    }
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage API integrations",
        variant: "destructive",
      });
      return;
    }

    if (!validateApiForm()) {
      toast({
        title: "Validation error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingApi) {
        const updateData: any = {
          ...apiFormData,
          updated_at: new Date().toISOString(),
        };
        
        if (apiFormData.api_key_encrypted === "••••••••") {
          delete updateData.api_key_encrypted;
        }

        const { error } = await supabase
          .from("ai_api_integrations")
          .update(updateData)
          .eq("id", editingApi.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "API integration updated successfully",
        });
      } else {
        const insertData = {
          ...apiFormData,
          user_id: user.id,
          is_active: true,
          config: {},
        };

        const { error } = await supabase
          .from("ai_api_integrations")
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "API integration added successfully",
        });
      }

      setIsApiDialogOpen(false);
      resetApiForm();
      fetchApiIntegrations();
    } catch (error) {
      console.error("Error saving API integration:", error);
      toast({
        title: "Error",
        description: "Failed to save API integration",
        variant: "destructive",
      });
    }
  };

  const handleSelectTemplate = (template: APITemplate) => {
    setApiFormData({
      display_name: template.name,
      api_name: template.apiName,
      api_key_encrypted: "",
      base_url: template.baseUrl,
      description: template.description,
      cache_enabled: true,
      cache_ttl_seconds: 3600,
      rate_limit_enabled: true,
      rate_limit_calls: 100,
      rate_limit_window_seconds: 3600,
    });
    setIsApiDialogOpen(true);
  };

  const handleToggleApiActive = async (api: APIIntegration, active: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_api_integrations")
        .update({ is_active: active })
        .eq("id", api.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${api.display_name} ${active ? "enabled" : "disabled"}`,
      });

      fetchApiIntegrations();
    } catch (error) {
      console.error("Error toggling API:", error);
      toast({
        title: "Error",
        description: "Failed to update API status",
        variant: "destructive",
      });
    }
  };

  const handleEditApi = (api: APIIntegration) => {
    setEditingApi(api);
    setApiFormData({
      display_name: api.display_name,
      api_name: api.api_name,
      api_key_encrypted: "••••••••",
      base_url: api.base_url || "",
      description: api.description || "",
      cache_enabled: api.cache_enabled || false,
      cache_ttl_seconds: api.cache_ttl_seconds || 3600,
      rate_limit_enabled: api.rate_limit_enabled || false,
      rate_limit_calls: api.rate_limit_calls || 100,
      rate_limit_window_seconds: api.rate_limit_window_seconds || 3600,
    });
    setIsApiDialogOpen(true);
  };

  const handleDeleteApi = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API integration?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("ai_api_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API integration deleted successfully",
      });

      fetchApiIntegrations();
    } catch (error) {
      console.error("Error deleting API:", error);
      toast({
        title: "Error",
        description: "Failed to delete API integration",
        variant: "destructive",
      });
    }
  };

  const resetApiForm = () => {
    setApiFormData({
      display_name: "",
      api_name: "",
      api_key_encrypted: "",
      base_url: "",
      description: "",
      cache_enabled: false,
      cache_ttl_seconds: 3600,
      rate_limit_enabled: false,
      rate_limit_calls: 100,
      rate_limit_window_seconds: 3600,
    });
    setApiFormErrors({});
    setEditingApi(null);
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case "openai":
        return "🤖";
      case "google":
      case "gemini":
        return "✨";
      case "anthropic":
        return "🧠";
      case "cohere":
        return "🔷";
      case "mistral":
        return "🌊";
      case "groq":
        return "⚡";
      case "perplexity":
        return "🔍";
      case "lovable":
        return "💜";
      default:
        return "🔧";
    }
  };

  const getProviderModels = (provider: string): string[] => {
    switch (provider) {
      case "openai":
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
      case "anthropic":
        return ["claude-sonnet-4-5", "claude-opus-4-1", "claude-sonnet-4", "claude-haiku-4"];
      case "google":
        return ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      case "cohere":
        return ["command-r-plus", "command-r", "command-light"];
      case "mistral":
        return ["mistral-large", "mistral-medium", "mistral-small", "mixtral-8x7b"];
      case "groq":
        return ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"];
      case "perplexity":
        return ["llama-3.1-sonar-large", "llama-3.1-sonar-small"];
      default:
        return [];
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
            <p className="text-muted-foreground">
              Please sign in to configure AI providers
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8" />
            AI Provider Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure AI models for your private health assistant
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add AI Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingProvider ? "Edit" : "Add"} API Provider</DialogTitle>
              <DialogDescription>
                Configure an API to power your private health assistant
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., My OpenAI GPT-4"
                  maxLength={100}
                />
                {formErrors.display_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.display_name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  A friendly name to identify this LLM configuration
                </p>
              </div>

              <div>
                <Label htmlFor="provider_name">LLM Provider *</Label>
                <Select
                  value={formData.provider_name}
                  onValueChange={(value) => {
                    setFormData({ ...formData, provider_name: value, model_name: "" });
                  }}
                >
                  <SelectTrigger id="provider_name">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <span className="flex items-center gap-2">
                        🤖 OpenAI
                      </span>
                    </SelectItem>
                    <SelectItem value="anthropic">
                      <span className="flex items-center gap-2">
                        🧠 Anthropic (Claude)
                      </span>
                    </SelectItem>
                    <SelectItem value="google">
                      <span className="flex items-center gap-2">
                        ✨ Google (Gemini)
                      </span>
                    </SelectItem>
                    <SelectItem value="cohere">
                      <span className="flex items-center gap-2">
                        🔷 Cohere
                      </span>
                    </SelectItem>
                    <SelectItem value="mistral">
                      <span className="flex items-center gap-2">
                        🌊 Mistral AI
                      </span>
                    </SelectItem>
                    <SelectItem value="groq">
                      <span className="flex items-center gap-2">
                        ⚡ Groq
                      </span>
                    </SelectItem>
                    <SelectItem value="perplexity">
                      <span className="flex items-center gap-2">
                        🔍 Perplexity
                      </span>
                    </SelectItem>
                    <SelectItem value="custom">
                      <span className="flex items-center gap-2">
                        🔧 Custom / Other
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.provider_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.provider_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model_name">Model Name *</Label>
                {formData.provider_name && formData.provider_name !== "custom" ? (
                  <Select
                    value={formData.model_name}
                    onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                  >
                    <SelectTrigger id="model_name">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviderModels(formData.provider_name).map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom model...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    placeholder="e.g., llama-3.3-70b-versatile"
                    maxLength={100}
                  />
                )}
                {formErrors.model_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.model_name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.provider_name && formData.provider_name !== "custom" 
                    ? "Select from popular models or choose 'Custom model' to enter manually"
                    : "Enter the exact model identifier from your provider's documentation"}
                </p>
              </div>

              <div>
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key_encrypted}
                  onChange={(e) => setFormData({ ...formData, api_key_encrypted: e.target.value })}
                  placeholder={editingProvider ? "Leave blank to keep existing" : "Enter your API key"}
                  maxLength={500}
                />
                {formErrors.api_key_encrypted && (
                  <p className="text-sm text-destructive mt-1">{formErrors.api_key_encrypted}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is encrypted and stored securely
                </p>
              </div>

              {(formData.provider_name === "custom" || formData.provider_name === "groq" || formData.provider_name === "openai") && (
                <div>
                  <Label htmlFor="base_url">Base URL (optional)</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder={formData.provider_name === "openai" ? "https://api.openai.com/v1" : formData.provider_name === "groq" ? "https://api.groq.com/openai/v1" : "http://localhost:11434/v1"}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set for OpenAI-compatible endpoints (e.g., Groq, Together, Ollama). Leave blank to use the provider default.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
                <Button type="submit" className="flex-1">
                  {editingProvider ? "Update" : "Add"} Provider
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured AI Providers</CardTitle>
          <CardDescription>
            Manage your AI models for the private health assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No AI providers configured yet</p>
              <p className="text-sm text-muted-foreground">
                Add an AI provider to enable private health assistance
              </p>
            </div>
          ) : (
            providers.map((provider) => (
              <div
                key={provider.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getProviderIcon(provider.provider_name)}</span>
                      <h3 className="font-semibold text-lg">{provider.display_name}</h3>
                      {provider.is_default && (
                        <Badge variant="default" className="bg-primary">
                          <Check className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {provider.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Model: <span className="font-mono">{provider.model_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Provider: {provider.provider_name}
                    </p>
                    {usageStats[provider.id] && (
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {usageStats[provider.id].messages} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {usageStats[provider.id].tokens.toLocaleString()} tokens
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.is_active}
                          onCheckedChange={(checked) => handleToggleActive(provider, checked)}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      {!provider.is_default && provider.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(provider)}
                        >
                          Set Default
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(provider)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* API Integrations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              API Tool Integrations
            </CardTitle>
            <CardDescription>
              Configure external APIs that the AI can use as tools during conversations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiAnalytics(!showApiAnalytics)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showApiAnalytics ? "Hide" : "Show"} Analytics
            </Button>
            <APITemplateSelector onSelectTemplate={handleSelectTemplate} />
            <Dialog open={isApiDialogOpen} onOpenChange={(open) => {
              setIsApiDialogOpen(open);
              if (!open) resetApiForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingApi ? "Edit" : "Add"} API Tool</DialogTitle>
                  <DialogDescription>
                    Configure an external API that the AI can call during conversations
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleApiSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="api_display_name">Display Name *</Label>
                    <Input
                      id="api_display_name"
                      value={apiFormData.display_name}
                      onChange={(e) => setApiFormData({ ...apiFormData, display_name: e.target.value })}
                      placeholder="e.g., Weather API"
                      maxLength={100}
                    />
                    {apiFormErrors.display_name && (
                      <p className="text-sm text-destructive mt-1">{apiFormErrors.display_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="api_name">API Identifier *</Label>
                    <Input
                      id="api_name"
                      value={apiFormData.api_name}
                      onChange={(e) => setApiFormData({ ...apiFormData, api_name: e.target.value })}
                      placeholder="e.g., openweather"
                      maxLength={100}
                    />
                    {apiFormErrors.api_name && (
                      <p className="text-sm text-destructive mt-1">{apiFormErrors.api_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      A unique identifier for this API (lowercase, no spaces)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="api_base_url">Base URL (Optional)</Label>
                    <Input
                      id="api_base_url"
                      value={apiFormData.base_url}
                      onChange={(e) => setApiFormData({ ...apiFormData, base_url: e.target.value })}
                      placeholder="e.g., https://api.openweathermap.org/data/2.5"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The base URL for API calls (if applicable)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="api_key_field">API Key *</Label>
                    <Input
                      id="api_key_field"
                      type="password"
                      value={apiFormData.api_key_encrypted}
                      onChange={(e) => setApiFormData({ ...apiFormData, api_key_encrypted: e.target.value })}
                      placeholder={editingApi ? "Leave blank to keep existing" : "Enter your API key"}
                      maxLength={500}
                    />
                    {apiFormErrors.api_key_encrypted && (
                      <p className="text-sm text-destructive mt-1">{apiFormErrors.api_key_encrypted}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Your API key is encrypted and stored securely
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="api_description">Description (Optional)</Label>
                    <Input
                      id="api_description"
                      value={apiFormData.description}
                      onChange={(e) => setApiFormData({ ...apiFormData, description: e.target.value })}
                      placeholder="e.g., Get current weather data for any location"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A brief description of what this API does
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-base flex items-center gap-2 mb-4">
                      <Settings className="w-4 h-4" />
                      Performance & Limits
                    </Label>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="cache_enabled">Response Caching</Label>
                          <p className="text-xs text-muted-foreground">Cache GET responses to reduce API calls</p>
                        </div>
                        <Switch
                          id="cache_enabled"
                          checked={apiFormData.cache_enabled}
                          onCheckedChange={(checked) => setApiFormData({ ...apiFormData, cache_enabled: checked })}
                        />
                      </div>

                      {apiFormData.cache_enabled && (
                        <div>
                          <Label htmlFor="cache_ttl">Cache Duration (seconds)</Label>
                          <Input
                            id="cache_ttl"
                            type="number"
                            value={apiFormData.cache_ttl_seconds}
                            onChange={(e) => setApiFormData({ ...apiFormData, cache_ttl_seconds: parseInt(e.target.value) })}
                            min={60}
                            max={86400}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            How long to cache responses (60 - 86400 seconds)
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="rate_limit_enabled">Rate Limiting</Label>
                          <p className="text-xs text-muted-foreground">Limit API calls per time window</p>
                        </div>
                        <Switch
                          id="rate_limit_enabled"
                          checked={apiFormData.rate_limit_enabled}
                          onCheckedChange={(checked) => setApiFormData({ ...apiFormData, rate_limit_enabled: checked })}
                        />
                      </div>

                      {apiFormData.rate_limit_enabled && (
                        <>
                          <div>
                            <Label htmlFor="rate_limit_calls">Maximum Calls</Label>
                            <Input
                              id="rate_limit_calls"
                              type="number"
                              value={apiFormData.rate_limit_calls}
                              onChange={(e) => setApiFormData({ ...apiFormData, rate_limit_calls: parseInt(e.target.value) })}
                              min={1}
                              max={10000}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Maximum calls allowed in the time window
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="rate_limit_window">Time Window (seconds)</Label>
                            <Input
                              id="rate_limit_window"
                              type="number"
                              value={apiFormData.rate_limit_window_seconds}
                              onChange={(e) => setApiFormData({ ...apiFormData, rate_limit_window_seconds: parseInt(e.target.value) })}
                              min={60}
                              max={86400}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Reset window duration (60 - 86400 seconds)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingApi ? "Update" : "Add"} API Tool
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showApiAnalytics && <APIAnalytics />}
          
          <div className="space-y-3">
            {apiIntegrations.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No API tools configured yet</p>
                <p className="text-sm text-muted-foreground">
                  Add external APIs that the AI can call during conversations
                </p>
              </div>
            ) : (
              apiIntegrations.map((api) => (
                <div
                  key={api.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{api.display_name}</h3>
                        {api.is_active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10">
                            Inactive
                          </Badge>
                        )}
                        {api.cache_enabled && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                        {api.rate_limit_enabled && (
                          <Badge variant="outline" className="text-xs">
                            Rate Limited
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Identifier: <span className="font-mono">{api.api_name}</span>
                      </p>
                      {api.base_url && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Base URL: <span className="font-mono text-xs">{api.base_url}</span>
                        </p>
                      )}
                      {api.description && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {api.description}
                        </p>
                      )}
                      {(api.cache_enabled || api.rate_limit_enabled) && (
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          {api.cache_enabled && (
                            <span>Cache: {api.cache_ttl_seconds}s</span>
                          )}
                          {api.rate_limit_enabled && (
                            <span>Limit: {api.rate_limit_calls} calls/{api.rate_limit_window_seconds}s</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={api.is_active}
                            onCheckedChange={(checked) => handleToggleApiActive(api, checked)}
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditApi(api)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteApi(api.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            About Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • All API keys are encrypted and stored securely in your database
          </p>
          <p>
            • Your health data never leaves your private assistant
          </p>
          <p>
            • AI conversations are processed through secure edge functions
          </p>
          <p>
            • You have full control over which AI providers access your data
          </p>
          <p>
            • Lovable AI provides built-in access without exposing API keys
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
