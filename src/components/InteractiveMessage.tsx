import { Activity, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UnifiedQuickResponses } from "./UnifiedQuickResponses";

interface InteractiveMessageProps {
  content: string;
  onQuickResponse: (response: string) => void;
  disabled?: boolean;
  usedTools?: string[];
}

export const InteractiveMessage = ({
  content,
  onQuickResponse,
  disabled,
  usedTools,
}: InteractiveMessageProps) => {
  const lowerContent = content.toLowerCase();
  
  // Detect context for better UX (optional - can show all or specific section)
  let context: 'temperature' | 'severity' | 'symptoms' | 'auto' = 'auto';
  
  if (lowerContent.includes("temperature") || lowerContent.includes("fever")) {
    context = 'temperature';
  } else if (lowerContent.includes("how severe") || (lowerContent.includes("rate") && lowerContent.includes("scale"))) {
    context = 'severity';
  } else if (lowerContent.includes("symptoms are you experiencing") || lowerContent.includes("select all symptoms")) {
    context = 'symptoms';
  }

  // Show unified responses if it's a medical question
  const showUnified = lowerContent.includes("symptom") || 
                      lowerContent.includes("fever") || 
                      lowerContent.includes("temperature") ||
                      lowerContent.includes("severe") ||
                      lowerContent.includes("experiencing") ||
                      lowerContent.includes("how") ||
                      lowerContent.includes("feeling");

  return (
    <div className="flex gap-3 mb-4 animate-fade-in justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-medical flex items-center justify-center shadow-medical">
        <Activity className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="max-w-[80%] w-full flex flex-col gap-2">
        <div className="rounded-2xl px-4 py-3 shadow-soft bg-card border border-border text-card-foreground">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        
        {usedTools && usedTools.length > 0 && (
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
        
        {showUnified && (
          <div className="mt-1">
            <UnifiedQuickResponses 
              onSubmit={onQuickResponse} 
              disabled={disabled}
              context={context}
            />
          </div>
        )}
      </div>
    </div>
  );
};
