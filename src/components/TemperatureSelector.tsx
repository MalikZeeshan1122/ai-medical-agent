import { QuickResponseButtons } from "@/components/QuickResponseButtons";
import { Card } from "@/components/ui/card";

interface TemperatureSelectorProps {
  onSelect: (temperature: string) => void;
  disabled?: boolean;
}

const TEMPERATURE_OPTIONS = [
  "99-100°F (37.2-37.8°C) - Low grade",
  "100-102°F (37.8-38.9°C) - Moderate",
  "102-104°F (38.9-40°C) - High",
  "Above 104°F (40°C) - Very high",
  "Haven't measured",
];

export const TemperatureSelector = ({
  onSelect,
  disabled,
}: TemperatureSelectorProps) => {
  return (
    <Card className="p-4 bg-accent/50 border-accent animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        What's your temperature?
      </h3>
      <QuickResponseButtons
        options={TEMPERATURE_OPTIONS}
        onSelect={onSelect}
        disabled={disabled}
      />
    </Card>
  );
};
