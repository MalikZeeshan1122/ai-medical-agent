import { QuickResponseButtons } from "@/components/QuickResponseButtons";
import { Card } from "@/components/ui/card";

interface SeveritySelectorProps {
  onSelect: (severity: string) => void;
  disabled?: boolean;
}

const SEVERITY_OPTIONS = [
  "Mild - Just slightly uncomfortable",
  "Moderate - Affecting daily activities",
  "Severe - Very difficult to function",
];

export const SeveritySelector = ({
  onSelect,
  disabled,
}: SeveritySelectorProps) => {
  return (
    <Card className="p-4 bg-accent/50 border-accent animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        How severe does the fever feel?
      </h3>
      <QuickResponseButtons
        options={SEVERITY_OPTIONS}
        onSelect={onSelect}
        disabled={disabled}
      />
    </Card>
  );
};
