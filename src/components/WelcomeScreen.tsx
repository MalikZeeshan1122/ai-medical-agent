import { Activity, Clock, Shield, Stethoscope, Settings, Languages, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { playToggle, playClick } from "@/lib/sounds";

export type QuickStartType = "symptom-check" | "medication-reminder" | "health-screening";

interface WelcomeScreenProps {
  onStart: () => void;
  onQuickStart?: (type: QuickStartType) => void;
  language: string;
  onLanguageChange: (value: string) => void;
}

export const WelcomeScreen = ({ onStart, onQuickStart, language, onLanguageChange }: WelcomeScreenProps) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundEnabled') !== 'false';
    }
    return true;
  });
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highContrast') === 'true';
    }
    return false;
  });
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply high contrast mode
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('highContrast', String(highContrast));
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
  }, [highContrast, mounted]);

  // Save sound preference
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('soundEnabled', String(soundEnabled));
    }
  }, [soundEnabled, mounted]);

  const isDarkMode = mounted ? resolvedTheme === "dark" : false;

  const features = [
    {
      icon: Activity,
      title: "Structured Intake",
      description: "Comprehensive symptom assessment following clinical protocols",
      delay: "0ms"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Instant preliminary guidance whenever you need it",
      delay: "100ms"
    },
    {
      icon: Shield,
      title: "Safe & Compliant",
      description: "AI-powered with human oversight and medical safety protocols",
      delay: "200ms"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Animated Header */}
      <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
        <div className="w-16 h-16 rounded-full bg-gradient-medical flex items-center justify-center mb-6 shadow-medical hover-scale transition-all duration-300 animate-pulse">
          <Stethoscope className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-foreground mb-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
        AI Medical Assistant
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md animate-fade-in" style={{ animationDelay: "200ms" }}>
        Your intelligent healthcare companion for preliminary assessment and medical guidance
      </p>

      {/* Feature Cards with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl w-full">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex flex-col items-center p-6 bg-card rounded-xl shadow-soft border border-border hover-scale transition-all duration-300 hover:shadow-medical animate-fade-in group"
              style={{ animationDelay: feature.delay }}
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center animate-fade-in" style={{ animationDelay: "300ms" }}>
        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-medical hover:opacity-90 shadow-medical text-lg px-8 py-6 transition-all hover-scale"
        >
          Start Medical Assessment
        </Button>

        {/* Advanced Options Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 transition-all hover-scale"
            >
              <Settings className="w-5 h-5 mr-2" />
              Advanced Options
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Options
              </DialogTitle>
              <DialogDescription>
                Customize your medical assistant experience
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Language
                </Label>
                <Select value={language} onValueChange={onLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accessibility Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Accessibility</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Dark Mode
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={(checked) => {
                      playToggle(checked);
                      setTheme(checked ? "dark" : "light");
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound" className="flex items-center gap-2 cursor-pointer">
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Sound Effects
                  </Label>
                  <Switch
                    id="sound"
                    checked={soundEnabled}
                    onCheckedChange={(checked) => {
                      setSoundEnabled(checked);
                      // Play the toggle sound after enabling to confirm it works
                      if (checked) {
                        setTimeout(() => playToggle(true), 50);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="contrast" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    High Contrast
                  </Label>
                  <Switch
                    id="contrast"
                    checked={highContrast}
                    onCheckedChange={(checked) => {
                      playToggle(checked);
                      setHighContrast(checked);
                    }}
                  />
                </div>
              </div>

              {/* Quick Start Options */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm">Quick Start</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onQuickStart?.("symptom-check") ?? onStart()}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Symptom Check
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onQuickStart?.("medication-reminder") ?? onStart()}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Medication Reminder
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onQuickStart?.("health-screening") ?? onStart()}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Health Screening
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
