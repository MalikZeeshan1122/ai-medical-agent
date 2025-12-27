import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SafetyDisclaimer = () => {
  return (
    <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Medical Disclaimer</AlertTitle>
      <AlertDescription className="text-sm">
        This AI assistant provides preliminary information only and is not a substitute for
        professional medical advice, diagnosis, or treatment. If you have a medical emergency,
        call emergency services immediately.
      </AlertDescription>
    </Alert>
  );
};
