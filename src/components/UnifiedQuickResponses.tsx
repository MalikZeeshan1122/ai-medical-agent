import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ThermometerSun, AlertCircle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedQuickResponsesProps {
  onSubmit: (response: string) => void;
  disabled?: boolean;
  context?: 'temperature' | 'severity' | 'symptoms' | 'yesno' | 'auto';
}

const TEMPERATURE_OPTIONS = [
  { value: "No fever (below 37°C / 98.6°F)", label: "No fever", icon: "🌡️" },
  { value: "Low-grade fever (37-38°C / 98.6-100.4°F)", label: "Low fever (37-38°C / 98.6-100.4°F)", icon: "🌡️" },
  { value: "Moderate fever (38-39°C / 100.4-102.2°F)", label: "Moderate (38-39°C / 100.4-102.2°F)", icon: "🌡️" },
  { value: "High fever (39-40°C / 102.2-104°F)", label: "High (39-40°C / 102.2-104°F)", icon: "🔥" },
  { value: "Very high fever (above 40°C / 104°F+)", label: "Very high (40°C+ / 104°F+)", icon: "🔥" },
];

const SEVERITY_OPTIONS = [
  { value: "Mild - Just slightly uncomfortable", label: "Mild", icon: "1-3" },
  { value: "Moderate - Affecting daily activities", label: "Moderate", icon: "4-6" },
  { value: "Severe - Very difficult to function", label: "Severe", icon: "7-10" },
];

const COMMON_SYMPTOMS = [
  "Headache", "Body aches", "Sore throat", "Cough",
  "Runny nose", "Congestion", "Fatigue", "Chills",
  "Sweating", "Nausea", "Vomiting", "Diarrhea",
  "Loss of appetite", "Difficulty breathing"
];

export const UnifiedQuickResponses = ({ 
  onSubmit, 
  disabled, 
  context = 'auto' 
}: UnifiedQuickResponsesProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmitSymptoms = () => {
    if (selectedSymptoms.length > 0) {
      onSubmit(`I'm experiencing: ${selectedSymptoms.join(", ")}`);
      setSelectedSymptoms([]);
    }
  };

  const handleQuickResponse = (response: string) => {
    onSubmit(response);
  };

  return (
    <Card className="p-4 bg-accent/50 border-accent animate-fade-in space-y-4">
      {/* Temperature Section */}
      <div>
        <button
          onClick={() => setActiveSection(activeSection === 'temp' ? null : 'temp')}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors w-full"
        >
          <ThermometerSun className="w-4 h-4" />
          <span>Temperature / Fever</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeSection === 'temp' ? '▼' : '▶'}
          </span>
        </button>
        {(activeSection === 'temp' || context === 'temperature') && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {TEMPERATURE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleQuickResponse(option.value)}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Severity Section */}
      <div>
        <button
          onClick={() => setActiveSection(activeSection === 'severity' ? null : 'severity')}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors w-full"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Severity Level</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeSection === 'severity' ? '▼' : '▶'}
          </span>
        </button>
        {(activeSection === 'severity' || context === 'severity') && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {SEVERITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleQuickResponse(option.value)}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Symptoms Section */}
      <div>
        <button
          onClick={() => setActiveSection(activeSection === 'symptoms' ? null : 'symptoms')}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors w-full"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Select Symptoms</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeSection === 'symptoms' ? '▼' : '▶'}
          </span>
        </button>
        {(activeSection === 'symptoms' || context === 'symptoms') && (
          <div className="animate-fade-in space-y-3">
            <p className="text-xs text-muted-foreground">
              Click multiple symptoms, then press Submit
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <Button
                    key={symptom}
                    onClick={() => handleSymptomToggle(symptom)}
                    disabled={disabled}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "transition-all hover:scale-105",
                      isSelected && "bg-primary text-primary-foreground shadow-medical ring-2 ring-primary/50"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {symptom}
                  </Button>
                );
              })}
            </div>
            {selectedSymptoms.length > 0 && (
              <div className="p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-primary font-medium">
                  Selected: {selectedSymptoms.join(", ")}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitSymptoms}
                disabled={disabled || selectedSymptoms.length === 0}
                className="bg-gradient-medical hover:opacity-90 shadow-medical flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit {selectedSymptoms.length > 0 ? `(${selectedSymptoms.length})` : 'Symptoms'}
              </Button>
              <Button
                onClick={() => handleQuickResponse("No additional symptoms")}
                disabled={disabled}
                variant="outline"
              >
                None
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Yes/No Quick Responses */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Quick Responses</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleQuickResponse("Yes")}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="hover:bg-green-500 hover:text-white transition-all"
          >
            ✓ Yes
          </Button>
          <Button
            onClick={() => handleQuickResponse("No")}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="hover:bg-red-500 hover:text-white transition-all"
          >
            ✗ No
          </Button>
          <Button
            onClick={() => handleQuickResponse("I'm not sure")}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Not sure
          </Button>
        </div>
      </div>
    </Card>
  );
};
