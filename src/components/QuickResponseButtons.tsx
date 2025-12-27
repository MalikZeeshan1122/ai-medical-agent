import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface QuickResponseButtonsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
  variant?: "single" | "multiple";
  selectedOptions?: string[];
}

export const QuickResponseButtons = ({
  options,
  onSelect,
  disabled,
  variant = "single",
  selectedOptions = [],
}: QuickResponseButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2 my-3 animate-fade-in">
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option);
        return (
          <Button
            key={option}
            onClick={() => onSelect(option)}
            disabled={disabled}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "transition-all hover:scale-105",
              isSelected && "bg-primary text-primary-foreground shadow-medical ring-2 ring-primary/50"
            )}
          >
            {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {option}
          </Button>
        );
      })}
    </div>
  );
};
