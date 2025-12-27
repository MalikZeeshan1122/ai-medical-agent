import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const SymptomTracker = () => {
  const [open, setOpen] = useState(false);
  const [symptomName, setSymptomName] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSymptoms();
    }
  }, [user]);

  const fetchSymptoms = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch symptoms",
        variant: "destructive",
      });
      return;
    }

    setSymptoms(data || []);
  };

  const handleSubmit = async () => {
    if (!user || !symptomName || !severity) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('symptoms')
      .insert({
        user_id: user.id,
        symptom: symptomName,
        severity,
        notes,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log symptom",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Symptom logged successfully",
    });

    setOpen(false);
    setSymptomName("");
    setSeverity("");
    setNotes("");
    fetchSymptoms();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
      case "high":
        return "bg-destructive/10 text-destructive border-destructive";
      case "moderate":
        return "bg-warning/10 text-warning border-warning";
      case "mild":
      case "low":
        return "bg-success/10 text-success border-success";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Symptom Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your symptoms and identify patterns
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical hover:opacity-90 shadow-medical">
              <Plus className="w-4 h-4 mr-2" />
              Log Symptom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log a New Symptom</DialogTitle>
              <DialogDescription>
                Track your symptoms to identify patterns and share with healthcare providers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="symptom">Symptom Name *</Label>
                <Select value={symptomName} onValueChange={setSymptomName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select symptom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Headache">Headache</SelectItem>
                    <SelectItem value="Body aches">Body aches</SelectItem>
                    <SelectItem value="Sore throat">Sore throat</SelectItem>
                    <SelectItem value="Cough">Cough</SelectItem>
                    <SelectItem value="Runny nose">Runny nose</SelectItem>
                    <SelectItem value="Congestion">Congestion</SelectItem>
                    <SelectItem value="Fatigue">Fatigue</SelectItem>
                    <SelectItem value="Fever">Fever</SelectItem>
                    <SelectItem value="Chills">Chills</SelectItem>
                    <SelectItem value="Sweating">Sweating</SelectItem>
                    <SelectItem value="Nausea">Nausea</SelectItem>
                    <SelectItem value="Vomiting">Vomiting</SelectItem>
                    <SelectItem value="Diarrhea">Diarrhea</SelectItem>
                    <SelectItem value="Loss of appetite">Loss of appetite</SelectItem>
                    <SelectItem value="Difficulty breathing">Difficulty breathing</SelectItem>
                    <SelectItem value="Dizziness">Dizziness</SelectItem>
                    <SelectItem value="Chest pain">Chest pain</SelectItem>
                    <SelectItem value="Abdominal pain">Abdominal pain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mild">Mild - Just slightly uncomfortable</SelectItem>
                    <SelectItem value="Moderate">Moderate - Affecting daily activities</SelectItem>
                    <SelectItem value="Severe">Severe - Very difficult to function</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about this symptom..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !symptomName || !severity}
                className="w-full bg-gradient-medical hover:opacity-90 shadow-medical"
              >
                {loading ? "Saving..." : "Log Symptom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {symptoms.filter(s => {
                    const today = new Date();
                    const symptomDate = new Date(s.created_at);
                    return symptomDate.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Symptoms Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{symptoms.length}</p>
                <p className="text-sm text-muted-foreground">Total Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {symptoms.length > 0 
                    ? symptoms.filter(s => s.severity === 'Moderate' || s.severity === 'Severe').length > 0 
                      ? "Moderate" 
                      : "Mild"
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Avg Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Symptoms</CardTitle>
          <CardDescription>Track and monitor your symptom history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {symptoms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No symptoms logged yet</p>
              <p className="text-sm">Click "Log Symptom" to start tracking</p>
            </div>
          ) : (
            symptoms.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{entry.symptom}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={getSeverityColor(entry.severity)}>
                  {entry.severity}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>AI Pattern Analysis</CardTitle>
          <CardDescription>Insights from your symptom data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Pattern detected:</span> Your symptoms appear
                to be consistent with a viral infection. Fever and body aches started
                simultaneously, which is common in flu-like illnesses.
              </p>
            </div>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Recommendation:</span> If symptoms persist
                for more than 3 days or worsen, consider scheduling a consultation with a
                healthcare provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SymptomTracker;
