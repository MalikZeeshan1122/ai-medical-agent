import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CriticalSymptoms = () => {
  const { user } = useAuth();
  const [emergencyNumbers, setEmergencyNumbers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNumber, setNewNumber] = useState({ number: "", label: "", country_region: "" });

  const emergencySymptoms = [
    {
      category: "Cardiac",
      symptoms: [
        "Chest pain or pressure",
        "Severe shortness of breath",
        "Irregular heartbeat with dizziness",
        "Pain radiating to arm, jaw, or back",
      ],
    },
    {
      category: "Neurological",
      symptoms: [
        "Sudden severe headache",
        "Confusion or disorientation",
        "Difficulty speaking or slurred speech",
        "Numbness or weakness on one side",
        "Loss of consciousness",
      ],
    },
    {
      category: "Respiratory",
      symptoms: [
        "Severe difficulty breathing",
        "Choking or cannot speak",
        "Blue lips or face",
        "Wheezing that doesn't improve",
      ],
    },
    {
      category: "Other Critical",
      symptoms: [
        "Uncontrolled bleeding",
        "Severe allergic reaction",
        "High fever (>104°F / 40°C)",
        "Severe abdominal pain",
        "Vomiting blood",
        "Seizure",
      ],
    },
  ];

  useEffect(() => {
    if (user) {
      fetchEmergencyNumbers();
    }
  }, [user]);

  const fetchEmergencyNumbers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('emergency_numbers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching emergency numbers:', error);
      return;
    }

    setEmergencyNumbers(data || []);
  };

  const handleAddNumber = async () => {
    if (!user || !newNumber.number.trim() || !newNumber.label.trim()) {
      toast.error("Please fill in number and label");
      return;
    }

    const { error } = await supabase
      .from('emergency_numbers')
      .insert({
        user_id: user.id,
        number: newNumber.number.trim(),
        label: newNumber.label.trim(),
        country_region: newNumber.country_region.trim() || null,
      });

    if (error) {
      toast.error("Failed to add emergency number");
      console.error('Error adding emergency number:', error);
      return;
    }

    toast.success("Emergency number added");
    setNewNumber({ number: "", label: "", country_region: "" });
    setIsDialogOpen(false);
    fetchEmergencyNumbers();
  };

  const handleDeleteNumber = async (id: string) => {
    const { error } = await supabase
      .from('emergency_numbers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete emergency number");
      console.error('Error deleting emergency number:', error);
      return;
    }

    toast.success("Emergency number removed");
    fetchEmergencyNumbers();
  };

  const makeEmergencyCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg">Critical Medical Emergency</AlertTitle>
        <AlertDescription className="text-base">
          If you or someone else is experiencing any of these symptoms, call 911
          immediately. Do not wait or try to drive yourself to the hospital.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Critical Symptoms</h1>
          <p className="text-muted-foreground mt-1">
            Know when to call emergency services
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline">
              <Plus className="w-5 h-5 mr-2" />
              Add Emergency Number
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="number">Emergency Number *</Label>
                <Input
                  id="number"
                  placeholder="e.g., 911, 1122, 999"
                  value={newNumber.number}
                  onChange={(e) => setNewNumber({ ...newNumber, number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., US Emergency, Pakistan Emergency"
                  value={newNumber.label}
                  onChange={(e) => setNewNumber({ ...newNumber, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="region">Country/Region (Optional)</Label>
                <Input
                  id="region"
                  placeholder="e.g., United States, Pakistan"
                  value={newNumber.country_region}
                  onChange={(e) => setNewNumber({ ...newNumber, country_region: e.target.value })}
                />
              </div>
              <Button onClick={handleAddNumber} className="w-full">
                Add Number
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {emergencyNumbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {emergencyNumbers.map((num) => (
                <div
                  key={num.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => makeEmergencyCall(num.number)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {num.number}
                    </Button>
                    <div>
                      <p className="font-semibold">{num.label}</p>
                      {num.country_region && (
                        <p className="text-sm text-muted-foreground">{num.country_region}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNumber(num.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {emergencySymptoms.map((group, idx) => (
        <Card key={idx} className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {group.category} Emergencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {group.symptoms.map((symptom, sIdx) => (
                <li
                  key={sIdx}
                  className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <p className="text-foreground">{symptom}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>What to Do in an Emergency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-foreground">
            <span className="font-semibold">1. Call 911 immediately</span> - Don't delay
            seeking emergency care
          </p>
          <p className="text-foreground">
            <span className="font-semibold">2. Stay calm</span> - Try to remain as calm as
            possible
          </p>
          <p className="text-foreground">
            <span className="font-semibold">3. Provide information</span> - Give the
            dispatcher your location and describe the emergency
          </p>
          <p className="text-foreground">
            <span className="font-semibold">4. Follow instructions</span> - The dispatcher
            may provide life-saving instructions
          </p>
          <p className="text-foreground">
            <span className="font-semibold">5. Don't hang up</span> - Stay on the line
            until help arrives
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriticalSymptoms;
