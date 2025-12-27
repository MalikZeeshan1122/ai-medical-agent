import { useState } from "react";
import { QuickResponseButtons } from "@/components/QuickResponseButtons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface SymptomSelectorProps {
  onSubmit: (symptoms: string[]) => void;
  disabled?: boolean;
}

const COMMON_SYMPTOMS = [
  "Headache",
  "Body aches",
  "Sore throat",
  "Cough",
  "Runny nose",
  "Congestion",
  "Fatigue",
  "Chills",
  "Sweating",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Loss of appetite",
  "Difficulty breathing",
];

export const SymptomSelector = ({ onSubmit, disabled }: SymptomSelectorProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length > 0) {
      onSubmit(selectedSymptoms);
      setSelectedSymptoms([]);
    } else {
      onSubmit(["No additional symptoms"]);
    }
  };

  return (
    <Card className="p-4 bg-accent/50 border-accent animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        Select all symptoms you're experiencing:
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Click multiple options, then press Submit
      </p>
      <QuickResponseButtons
        options={COMMON_SYMPTOMS}
        onSelect={handleSymptomToggle}
        disabled={disabled}
        variant="multiple"
        selectedOptions={selectedSymptoms}
      />
      {selectedSymptoms.length > 0 && (
        <div className="mt-2 p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-primary font-medium">
            Selected: {selectedSymptoms.join(", ")}
          </p>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={disabled || selectedSymptoms.length === 0}
          className="bg-gradient-medical hover:opacity-90 shadow-medical flex-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Submit {selectedSymptoms.length > 0 ? `(${selectedSymptoms.length} selected)` : 'Symptoms'}
        </Button>
        <Button
          onClick={() => onSubmit(["No additional symptoms"])}
          disabled={disabled}
          variant="outline"
        >
          None of these
        </Button>
      </div>
    </Card>
  );
};
