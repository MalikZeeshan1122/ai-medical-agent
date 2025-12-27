import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, AlertCircle, Pill, Users, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChronicCondition {
  id: string;
  condition_name: string;
  diagnosed_date: string | null;
  severity: string | null;
  notes: string | null;
  is_active: boolean;
}

interface Allergy {
  id: string;
  allergen: string;
  allergy_type: string;
  severity: string;
  reaction: string | null;
  diagnosed_date: string | null;
  notes: string | null;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  prescribing_doctor: string | null;
  purpose: string | null;
  is_current: boolean;
}

interface FamilyHistory {
  id: string;
  relation: string;
  condition_name: string;
  age_of_onset: number | null;
  notes: string | null;
}

const MedicalHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [familyHistory, setFamilyHistory] = useState<FamilyHistory[]>([]);

  // Dialog states
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);

  // Form states for new condition
  const [newCondition, setNewCondition] = useState({
    condition_name: '',
    diagnosed_date: '',
    severity: 'moderate',
    notes: '',
  });

  // Form states for new allergy
  const [newAllergy, setNewAllergy] = useState({
    allergen: '',
    allergy_type: 'medication',
    severity: 'moderate',
    reaction: '',
    diagnosed_date: '',
    notes: '',
  });

  // Form states for new medication
  const [newMedication, setNewMedication] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescribing_doctor: '',
    purpose: '',
  });

  // Form states for new family history
  const [newFamily, setNewFamily] = useState({
    relation: 'mother',
    condition_name: '',
    age_of_onset: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadChronicConditions(),
      loadAllergies(),
      loadMedications(),
      loadFamilyHistory(),
    ]);
    setLoading(false);
  };

  const loadChronicConditions = async () => {
    try {
      const { data, error } = await supabase
        .from('chronic_conditions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChronicConditions(data || []);
    } catch (error: any) {
      console.error('Error loading chronic conditions:', error);
      toast.error('Failed to load chronic conditions');
    }
  };

  const loadAllergies = async () => {
    try {
      const { data, error } = await supabase
        .from('allergies')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error: any) {
      console.error('Error loading allergies:', error);
      toast.error('Failed to load allergies');
    }
  };

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error: any) {
      console.error('Error loading medications:', error);
      toast.error('Failed to load medications');
    }
  };

  const loadFamilyHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('family_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFamilyHistory(data || []);
    } catch (error: any) {
      console.error('Error loading family history:', error);
      toast.error('Failed to load family history');
    }
  };

  const addChronicCondition = async () => {
    if (!newCondition.condition_name.trim()) {
      toast.error('Please enter a condition name');
      return;
    }

    try {
      const { error } = await supabase.from('chronic_conditions').insert({
        user_id: user!.id,
        condition_name: newCondition.condition_name,
        diagnosed_date: newCondition.diagnosed_date || null,
        severity: newCondition.severity,
        notes: newCondition.notes || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Chronic condition added');
      setConditionDialogOpen(false);
      setNewCondition({ condition_name: '', diagnosed_date: '', severity: 'moderate', notes: '' });
      loadChronicConditions();
    } catch (error: any) {
      console.error('Error adding condition:', error);
      toast.error(error.message || 'Failed to add condition');
    }
  };

  const addAllergy = async () => {
    if (!newAllergy.allergen.trim()) {
      toast.error('Please enter an allergen');
      return;
    }

    try {
      const { error } = await supabase.from('allergies').insert({
        user_id: user!.id,
        allergen: newAllergy.allergen,
        allergy_type: newAllergy.allergy_type,
        severity: newAllergy.severity,
        reaction: newAllergy.reaction || null,
        diagnosed_date: newAllergy.diagnosed_date || null,
        notes: newAllergy.notes || null,
      });

      if (error) throw error;

      toast.success('Allergy added');
      setAllergyDialogOpen(false);
      setNewAllergy({ allergen: '', allergy_type: 'medication', severity: 'moderate', reaction: '', diagnosed_date: '', notes: '' });
      loadAllergies();
    } catch (error: any) {
      console.error('Error adding allergy:', error);
      toast.error(error.message || 'Failed to add allergy');
    }
  };

  const addMedication = async () => {
    if (!newMedication.medication_name.trim() || !newMedication.dosage.trim() || !newMedication.frequency.trim()) {
      toast.error('Please fill in all required medication fields');
      return;
    }

    try {
      const { error } = await supabase.from('medications').insert({
        user_id: user!.id,
        medication_name: newMedication.medication_name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        start_date: newMedication.start_date || new Date().toISOString().split('T')[0],
        end_date: newMedication.end_date || null,
        prescribing_doctor: newMedication.prescribing_doctor || null,
        purpose: newMedication.purpose || null,
        is_current: !newMedication.end_date,
      });

      if (error) throw error;

      toast.success('Medication added');
      setMedicationDialogOpen(false);
      setNewMedication({ medication_name: '', dosage: '', frequency: '', start_date: '', end_date: '', prescribing_doctor: '', purpose: '' });
      loadMedications();
    } catch (error: any) {
      console.error('Error adding medication:', error);
      toast.error(error.message || 'Failed to add medication');
    }
  };

  const addFamilyHistory = async () => {
    if (!newFamily.condition_name.trim()) {
      toast.error('Please enter a condition name');
      return;
    }

    try {
      const { error } = await supabase.from('family_history').insert({
        user_id: user!.id,
        relation: newFamily.relation,
        condition_name: newFamily.condition_name,
        age_of_onset: newFamily.age_of_onset ? parseInt(newFamily.age_of_onset) : null,
        notes: newFamily.notes || null,
      });

      if (error) throw error;

      toast.success('Family history added');
      setFamilyDialogOpen(false);
      setNewFamily({ relation: 'mother', condition_name: '', age_of_onset: '', notes: '' });
      loadFamilyHistory();
    } catch (error: any) {
      console.error('Error adding family history:', error);
      toast.error(error.message || 'Failed to add family history');
    }
  };

  const deleteChronicCondition = async (id: string) => {
    try {
      const { error } = await supabase.from('chronic_conditions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Condition deleted');
      loadChronicConditions();
    } catch (error: any) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };

  const deleteAllergy = async (id: string) => {
    try {
      const { error } = await supabase.from('allergies').delete().eq('id', id);
      if (error) throw error;
      toast.success('Allergy deleted');
      loadAllergies();
    } catch (error: any) {
      console.error('Error deleting allergy:', error);
      toast.error('Failed to delete allergy');
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Medication deleted');
      loadMedications();
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      toast.error('Failed to delete medication');
    }
  };

  const deleteFamilyHistory = async (id: string) => {
    try {
      const { error } = await supabase.from('family_history').delete().eq('id', id);
      if (error) throw error;
      toast.success('Family history deleted');
      loadFamilyHistory();
    } catch (error: any) {
      console.error('Error deleting family history:', error);
      toast.error('Failed to delete family history');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'severe':
      case 'life_threatening':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Medical History</h1>
        <p className="text-muted-foreground mt-1">
          Your complete health record in one place
        </p>
      </div>

      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conditions">
            <FileText className="w-4 h-4 mr-2" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="allergies">
            <AlertCircle className="w-4 h-4 mr-2" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="w-4 h-4 mr-2" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="family">
            <Users className="w-4 h-4 mr-2" />
            Family History
          </TabsTrigger>
        </TabsList>

        {/* Chronic Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Chronic Conditions</h2>
            <Dialog open={conditionDialogOpen} onOpenChange={setConditionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Chronic Condition</DialogTitle>
                  <DialogDescription>
                    Add a new chronic medical condition to your health record
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition_name">Condition Name *</Label>
                    <Input
                      id="condition_name"
                      value={newCondition.condition_name}
                      onChange={(e) => setNewCondition({ ...newCondition, condition_name: e.target.value })}
                      placeholder="e.g., Type 2 Diabetes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosed_date">Diagnosed Date</Label>
                    <Input
                      id="diagnosed_date"
                      type="date"
                      value={newCondition.diagnosed_date}
                      onChange={(e) => setNewCondition({ ...newCondition, diagnosed_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={newCondition.severity}
                      onValueChange={(value) => setNewCondition({ ...newCondition, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newCondition.notes}
                      onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                      placeholder="Additional information..."
                    />
                  </div>
                  <Button onClick={addChronicCondition} className="w-full">
                    Add Condition
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {chronicConditions.length > 0 ? (
            <div className="grid gap-4">
              {chronicConditions.map((condition) => (
                <Card key={condition.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{condition.condition_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {condition.diagnosed_date && `Diagnosed: ${new Date(condition.diagnosed_date).toLocaleDateString()}`}
                        </p>
                        {condition.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{condition.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {condition.severity && (
                        <Badge variant="outline" className={getSeverityColor(condition.severity)}>
                          {condition.severity}
                        </Badge>
                      )}
                      {condition.is_active && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteChronicCondition(condition.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No chronic conditions recorded yet</p>
            </Card>
          )}
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Allergies & Sensitivities</h2>
            <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Allergy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Allergy</DialogTitle>
                  <DialogDescription>
                    Record a new allergy or sensitivity
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergen">Allergen *</Label>
                    <Input
                      id="allergen"
                      value={newAllergy.allergen}
                      onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergy_type">Type</Label>
                    <Select
                      value={newAllergy.allergy_type}
                      onValueChange={(value) => setNewAllergy({ ...newAllergy, allergy_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergy_severity">Severity</Label>
                    <Select
                      value={newAllergy.severity}
                      onValueChange={(value) => setNewAllergy({ ...newAllergy, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="life_threatening">Life Threatening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reaction">Reaction</Label>
                    <Input
                      id="reaction"
                      value={newAllergy.reaction}
                      onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
                      placeholder="e.g., Rash, Difficulty breathing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergy_notes">Notes</Label>
                    <Textarea
                      id="allergy_notes"
                      value={newAllergy.notes}
                      onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
                      placeholder="Additional information..."
                    />
                  </div>
                  <Button onClick={addAllergy} className="w-full">
                    Add Allergy
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {allergies.length > 0 ? (
            <div className="grid gap-4">
              {allergies.map((allergy) => (
                <Card key={allergy.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{allergy.allergen}</p>
                        <p className="text-sm text-muted-foreground capitalize">{allergy.allergy_type} allergy</p>
                        {allergy.reaction && (
                          <p className="text-sm text-muted-foreground">Reaction: {allergy.reaction}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getSeverityColor(allergy.severity)}>
                        {allergy.severity.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAllergy(allergy.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No allergies recorded yet</p>
            </Card>
          )}
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current & Past Medications</h2>
            <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                  <DialogDescription>
                    Record a current or past medication
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication_name">Medication Name *</Label>
                    <Input
                      id="medication_name"
                      value={newMedication.medication_name}
                      onChange={(e) => setNewMedication({ ...newMedication, medication_name: e.target.value })}
                      placeholder="e.g., Metformin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Input
                      id="frequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newMedication.start_date}
                      onChange={(e) => setNewMedication({ ...newMedication, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (if discontinued)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newMedication.end_date}
                      onChange={(e) => setNewMedication({ ...newMedication, end_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                    <Input
                      id="prescribing_doctor"
                      value={newMedication.prescribing_doctor}
                      onChange={(e) => setNewMedication({ ...newMedication, prescribing_doctor: e.target.value })}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      value={newMedication.purpose}
                      onChange={(e) => setNewMedication({ ...newMedication, purpose: e.target.value })}
                      placeholder="What is this medication for?"
                    />
                  </div>
                  <Button onClick={addMedication} className="w-full">
                    Add Medication
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {medications.length > 0 ? (
            <div className="grid gap-4">
              {medications.map((medication) => (
                <Card key={medication.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Pill className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{medication.medication_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage} - {medication.frequency}
                        </p>
                        {medication.purpose && (
                          <p className="text-sm text-muted-foreground">Purpose: {medication.purpose}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {new Date(medication.start_date).toLocaleDateString()}
                          {medication.end_date && ` • Ended: ${new Date(medication.end_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {medication.is_current ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Current
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                          Past
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMedication(medication.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No medications recorded yet</p>
            </Card>
          )}
        </TabsContent>

        {/* Family History Tab */}
        <TabsContent value="family" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Family Medical History</h2>
            <Dialog open={familyDialogOpen} onOpenChange={setFamilyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Family Medical History</DialogTitle>
                  <DialogDescription>
                    Record a medical condition in your family history
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="relation">Relation *</Label>
                    <Select
                      value={newFamily.relation}
                      onValueChange={(value) => setNewFamily({ ...newFamily, relation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="maternal_grandmother">Maternal Grandmother</SelectItem>
                        <SelectItem value="maternal_grandfather">Maternal Grandfather</SelectItem>
                        <SelectItem value="paternal_grandmother">Paternal Grandmother</SelectItem>
                        <SelectItem value="paternal_grandfather">Paternal Grandfather</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_condition_name">Condition *</Label>
                    <Input
                      id="family_condition_name"
                      value={newFamily.condition_name}
                      onChange={(e) => setNewFamily({ ...newFamily, condition_name: e.target.value })}
                      placeholder="e.g., Heart Disease, Diabetes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age_of_onset">Age of Onset</Label>
                    <Input
                      id="age_of_onset"
                      type="number"
                      value={newFamily.age_of_onset}
                      onChange={(e) => setNewFamily({ ...newFamily, age_of_onset: e.target.value })}
                      placeholder="Age when condition was diagnosed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_notes">Notes</Label>
                    <Textarea
                      id="family_notes"
                      value={newFamily.notes}
                      onChange={(e) => setNewFamily({ ...newFamily, notes: e.target.value })}
                      placeholder="Additional information..."
                    />
                  </div>
                  <Button onClick={addFamilyHistory} className="w-full">
                    Add Family History
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {familyHistory.length > 0 ? (
            <div className="grid gap-4">
              {familyHistory.map((history) => (
                <Card key={history.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground capitalize">
                          {history.relation.replace('_', ' ')} - {history.condition_name}
                        </p>
                        {history.age_of_onset && (
                          <p className="text-sm text-muted-foreground">
                            Age of onset: {history.age_of_onset} years
                          </p>
                        )}
                        {history.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFamilyHistory(history.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No family medical history recorded yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MedicalHistory;
