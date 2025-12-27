import { QuickResponseButtons } from "@/components/QuickResponseButtons";
import { Card } from "@/components/ui/card";

interface YesNoSelectorProps {
  question: string;
  onSelect: (answer: string) => void;
  disabled?: boolean;
}

export const YesNoSelector = ({
  question,
  onSelect,
  disabled,
}: YesNoSelectorProps) => {
  return (
    <Card className="p-4 bg-accent/50 border-accent animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-3">{question}</h3>
      <QuickResponseButtons
        options={["Yes", "No", "Not sure"]}
        onSelect={onSelect}
        disabled={disabled}
      />
    </Card>
  );
};
