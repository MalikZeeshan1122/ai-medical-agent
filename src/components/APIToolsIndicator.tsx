import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface APITool {
  id: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

interface APIToolsIndicatorProps {
  isToolCalling?: boolean;
  activeToolName?: string;
}

export const APIToolsIndicator = ({ isToolCalling, activeToolName }: APIToolsIndicatorProps) => {
  const { user } = useAuth();
  const [apiTools, setApiTools] = useState<APITool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAPITools();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAPITools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_api_integrations')
        .select('id, display_name, description, is_active')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setApiTools((data || []) as APITool[]);
    } catch (error) {
      console.error('Error fetching API tools:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (apiTools.length === 0) {
    return null;
  }

  return (
    <Card className="p-3 bg-accent/50 border-accent">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Active Tools:
          </span>
        </div>
        
        {apiTools.map((tool) => {
          const isCurrentlyActive = isToolCalling && activeToolName === tool.display_name;
          
          return (
            <TooltipProvider key={tool.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={isCurrentlyActive ? "default" : "secondary"}
                    className={`gap-1.5 transition-all ${
                      isCurrentlyActive 
                        ? 'animate-pulse bg-primary/90 shadow-md' 
                        : 'bg-secondary/80'
                    }`}
                  >
                    {isCurrentlyActive ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span className="text-xs">{tool.display_name}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{tool.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {isToolCalling && activeToolName && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Calling {activeToolName} to get real-time information...
          </p>
        </div>
      )}
    </Card>
  );
};