import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Brain, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { APIToolsIndicator } from "@/components/APIToolsIndicator";
import { MedicalDocumentUpload } from '@/components/MedicalDocumentUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIProvider {
  id: string;
  display_name: string;
  provider_name: string;
  model_name: string;
  is_default: boolean;
}

const PrivateAIChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchProviders();
      loadChatHistory();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('id, display_name, provider_name, model_name, is_default')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as AIProvider[];
      setProviders(typedData);
      
      const defaultProvider = typedData.find(p => p.is_default);
      if (defaultProvider) {
        setSelectedProviderId(defaultProvider.id);
      } else if (typedData.length > 0) {
        setSelectedProviderId(typedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('role, content')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        // Welcome message
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your private health assistant. I have access to your medical records, medications, and appointments. How can I help you today?"
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    if (providers.length === 0) {
      toast({
        title: "No AI Provider Configured",
        description: "Please add an AI provider in Settings → AI Providers",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('private-ai-chat', {
        body: {
          messages: [...messages, userMessage],
          providerId: selectedProviderId || undefined,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
            <p className="text-muted-foreground">
              Please sign in to access your private AI health assistant
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            Private AI Assistant
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
              <Lock className="w-3 h-3 mr-1" />
              Private & Secure
            </Badge>
            <p className="text-sm text-muted-foreground">
              Your health data stays private
            </p>
          </div>
        </div>
        {providers.length > 0 && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="provider" className="text-xs text-muted-foreground">
              Select AI Model
            </Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue>
                  {providers.find(p => p.id === selectedProviderId) && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getProviderIcon(providers.find(p => p.id === selectedProviderId)!.provider_name)}</span>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {providers.find(p => p.id === selectedProviderId)!.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {providers.find(p => p.id === selectedProviderId)!.model_name}
                        </span>
                      </div>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-lg">{getProviderIcon(provider.provider_name)}</span>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{provider.display_name}</span>
                          {provider.is_default && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {provider.model_name}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUploadPanel(prev => !prev)}
          >
            {showUploadPanel ? 'Close Documents' : 'Manage Documents'}
          </Button>
        </div>
      </div>

      <APIToolsIndicator />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Health Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          {showUploadPanel && user && (
            <div className="mb-4">
              <MedicalDocumentUpload userId={user.id} />
            </div>
          )}
          <ScrollArea ref={scrollRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your health, medications, or appointments..."
              className="min-h-[80px] resize-none"
              disabled={isLoading || providers.length === 0}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || providers.length === 0}
              size="lg"
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {providers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No AI providers configured. Add one in Settings → AI Providers
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateAIChat;
