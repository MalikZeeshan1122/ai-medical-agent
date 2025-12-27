import { cn } from "@/lib/utils";
import { Activity, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  usedTools?: string[];
}

export const ChatMessage = ({ role, content, usedTools }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-medical flex items-center justify-center shadow-medical">
          <Activity className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={cn("max-w-[80%] flex flex-col gap-2")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-soft",
            isAssistant
              ? "bg-card border border-border text-card-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        
        {isAssistant && usedTools && usedTools.length > 0 && (
          <div className="flex items-center gap-1.5 px-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">Used:</span>
            {usedTools.map((tool, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-accent/50"
              >
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
