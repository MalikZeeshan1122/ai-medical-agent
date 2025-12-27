import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface QuickActionBarProps {
  onSelectAction: (action: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  "Tell me more about my symptoms",
  "What should I do next?",
  "When should I see a doctor?",
  "Could this be serious?",
];

export const QuickActionBar = ({ onSelectAction, disabled }: QuickActionBarProps) => {
  return (
    <div className="border-t border-border/50 pt-3 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Quick questions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action}
            onClick={() => onSelectAction(action)}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 hover:bg-primary/5 hover:text-primary text-muted-foreground"
          >
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
};
