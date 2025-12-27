import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pill, Clock, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  purpose?: string;
  prescribing_doctor?: string;
  side_effects?: string;
  is_current: boolean;
}

const Medications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  
  const commonMedications = [
    { name: "Panadol", dosage: "500mg", purpose: "Pain relief, Fever", frequency: "Three times daily" },
    { name: "Brufen", dosage: "400mg", purpose: "Pain relief, Inflammation", frequency: "Twice daily" },
    { name: "Flagyl", dosage: "400mg", purpose: "Bacterial infection", frequency: "Three times daily" },
    { name: "Augmentin", dosage: "625mg", purpose: "Bacterial infection", frequency: "Twice daily" },
    { name: "Disprin", dosage: "300mg", purpose: "Pain relief, Fever", frequency: "As needed" },
    { name: "Paracetamol", dosage: "500mg", purpose: "Pain relief, Fever", frequency: "Three times daily" },
    { name: "Amoxil", dosage: "500mg", purpose: "Bacterial infection", frequency: "Three times daily" },
    { name: "Arinac", dosage: "1 tablet", purpose: "Cold, Flu symptoms", frequency: "Twice daily" },
    { name: "Ponstan", dosage: "500mg", purpose: "Pain relief", frequency: "Three times daily" },
    { name: "Rizek", dosage: "20mg", purpose: "Acidity, GERD", frequency: "Once daily" },
    { name: "Telfast", dosage: "120mg", purpose: "Allergies", frequency: "Once daily" },
    { name: "Olfen", dosage: "50mg", purpose: "Pain relief, Inflammation", frequency: "Twice daily" },
    { name: "Calpol", dosage: "5ml", purpose: "Fever, Pain (Children)", frequency: "Three times daily" },
    { name: "Perinorm", dosage: "10mg", purpose: "Nausea, Vomiting", frequency: "Three times daily" },
    { name: "Diamox", dosage: "250mg", purpose: "Altitude sickness", frequency: "Twice daily" },
  ];

  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "Once daily",
    start_date: new Date().toISOString().split('T')[0],
    purpose: "",
    prescribing_doctor: "",
    side_effects: "",
  });

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast({
        title: "Error",
        description: "Failed to load medications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage medications",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingMed) {
        const { error } = await supabase
          .from("medications")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMed.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Medication updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("medications")
          .insert([
            {
              ...formData,
              user_id: user.id,
              is_current: true,
            },
          ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Medication added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMedications();
    } catch (error) {
      console.error("Error saving medication:", error);
      toast({
        title: "Error",
        description: "Failed to save medication",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      medication_name: med.medication_name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date,
      purpose: med.purpose || "",
      prescribing_doctor: med.prescribing_doctor || "",
      side_effects: med.side_effects || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medication deleted successfully",
      });

      fetchMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive",
      });
    }
  };

  const toggleCurrentStatus = async (med: Medication) => {
    try {
      const { error } = await supabase
        .from("medications")
        .update({
          is_current: !med.is_current,
          end_date: !med.is_current ? null : new Date().toISOString().split('T')[0],
        })
        .eq("id", med.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Medication marked as ${!med.is_current ? "active" : "discontinued"}`,
      });

      fetchMedications();
    } catch (error) {
      console.error("Error updating medication:", error);
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: "",
      dosage: "",
      frequency: "Once daily",
      start_date: new Date().toISOString().split('T')[0],
      purpose: "",
      prescribing_doctor: "",
      side_effects: "",
    });
    setEditingMed(null);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
            <p className="text-muted-foreground">
              Please sign in to manage your medications
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMedications = medications.filter(m => m.is_current);
  const pastMedications = medications.filter(m => !m.is_current);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your medications and track your regimen
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical hover:opacity-90 shadow-medical">
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMed ? "Edit" : "Add"} Medication</DialogTitle>
              <DialogDescription>
                {editingMed ? "Update" : "Add"} your medication information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingMed && (
                <div>
                  <Label>Quick Add Common Medications</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {commonMedications.map((med) => (
                      <Button
                        key={med.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => setFormData({
                          ...formData,
                          medication_name: med.name,
                          dosage: med.dosage,
                          purpose: med.purpose,
                          frequency: med.frequency,
                        })}
                      >
                        {med.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="medication_name">Medication Name *</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  placeholder="e.g., Panadol"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="Every other day">Every other day</SelectItem>
                    <SelectItem value="Once weekly">Once weekly</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g., Type 2 Diabetes"
                />
              </div>

              <div>
                <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                <Input
                  id="prescribing_doctor"
                  value={formData.prescribing_doctor}
                  onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              <div>
                <Label htmlFor="side_effects">Known Side Effects</Label>
                <Input
                  id="side_effects"
                  value={formData.side_effects}
                  onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                  placeholder="e.g., Nausea, dizziness"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMed ? "Update" : "Add"} Medication
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading medications...</p>
      ) : (
        <>
          {/* Active Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Active Medications</CardTitle>
              <CardDescription>Your current medication regimen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeMedications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No active medications yet</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first medication
                  </Button>
                </div>
              ) : (
                activeMedications.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 bg-accent/50 rounded-lg space-y-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-lg">{med.medication_name}</p>
                          {med.purpose && (
                            <p className="text-sm text-muted-foreground">{med.purpose}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success">
                          Active
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(med)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="ml-13 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dosage:</span>{" "}
                        <span className="font-medium text-foreground">{med.dosage}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>{" "}
                        <span className="font-medium text-foreground">{med.frequency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>{" "}
                        <span className="font-medium text-foreground">
                          {new Date(med.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {(med.prescribing_doctor || med.side_effects) && (
                      <div className="ml-13 text-sm space-y-1">
                        {med.prescribing_doctor && (
                          <div>
                            <span className="text-muted-foreground">Prescribed by:</span>{" "}
                            <span className="font-medium text-foreground">{med.prescribing_doctor}</span>
                          </div>
                        )}
                        {med.side_effects && (
                          <div>
                            <span className="text-muted-foreground">Side effects:</span>{" "}
                            <span className="font-medium text-foreground">{med.side_effects}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ml-13 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCurrentStatus(med)}
                      >
                        Mark as Discontinued
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Past Medications */}
          {pastMedications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Medications</CardTitle>
                <CardDescription>Previously taken medications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pastMedications.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 bg-muted/30 rounded-lg space-y-2 opacity-70"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Pill className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-lg">{med.medication_name}</p>
                          {med.purpose && (
                            <p className="text-sm text-muted-foreground">{med.purpose}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Discontinued</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="ml-13 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dosage:</span>{" "}
                        <span className="font-medium text-foreground">{med.dosage}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>{" "}
                        <span className="font-medium text-foreground">{med.frequency}</span>
                      </div>
                      {med.end_date && (
                        <div>
                          <span className="text-muted-foreground">Ended:</span>{" "}
                          <span className="font-medium text-foreground">
                            {new Date(med.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-13 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCurrentStatus(med)}
                      >
                        Mark as Active
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Important Information */}
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            Important Medication Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-foreground">
            • Always take medications as prescribed by your healthcare provider
          </p>
          <p className="text-foreground">
            • Don't stop taking medications without consulting your doctor
          </p>
          <p className="text-foreground">
            • Report any side effects or concerns to your healthcare provider
          </p>
          <p className="text-foreground">
            • Keep medications in a safe place away from children
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Medications;
