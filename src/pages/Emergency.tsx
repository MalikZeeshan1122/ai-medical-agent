import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, AlertCircle, MapPin, Plus, Trash2, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { z } from "zod";

// Validation schema for emergency contacts
const emergencyContactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  phone_number: z.string()
    .trim()
    .min(1, "Phone number is required")
    .max(30, "Phone number must be less than 30 characters")
    .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain numbers, +, -, spaces, and parentheses"),
  contact_type: z.union([z.literal("emergency"), z.literal("personal"), z.literal("medical")]),
  notes: z.string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .transform(val => val || ""),
});

type EmergencyContactForm = z.infer<typeof emergencyContactSchema>;

interface EmergencyContact extends EmergencyContactForm {
  id: string;
  user_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const Emergency = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customContacts, setCustomContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState<EmergencyContactForm>({
    name: "",
    phone_number: "",
    contact_type: "personal",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmergencyContactForm, string>>>({});

  // Default Pakistani emergency services
  const defaultEmergencyContacts = [
    { name: "Emergency Services (Rescue)", number: "1122", type: "Emergency", country: "Pakistan" },
    { name: "Police Emergency", number: "15", type: "Emergency", country: "Pakistan" },
    { name: "Ambulance Service", number: "115", type: "Emergency", country: "Pakistan" },
    { name: "Edhi Ambulance", number: "115", type: "Emergency", country: "Pakistan" },
    { name: "Fire Brigade", number: "16", type: "Emergency", country: "Pakistan" },
  ];

  useEffect(() => {
    if (user) {
      fetchCustomContacts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCustomContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomContacts((data || []) as EmergencyContact[]);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      emergencyContactSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof EmergencyContactForm, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof EmergencyContactForm] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add emergency contacts",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingContact) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingContact.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Emergency contact updated successfully",
        });
      } else {
        // Ensure all required fields are present
        const insertData = {
          name: formData.name,
          phone_number: formData.phone_number,
          contact_type: formData.contact_type as "emergency" | "personal" | "medical",
          notes: formData.notes || "",
          user_id: user.id,
        };

        const { error } = await supabase
          .from("emergency_contacts")
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Emergency contact added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCustomContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      contact_type: contact.contact_type,
      notes: contact.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this emergency contact?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });

      fetchCustomContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      contact_type: "personal",
      notes: "",
    });
    setFormErrors({});
    setEditingContact(null);
  };

  const handleCall = (phoneNumber: string) => {
    // Remove spaces and formatting for the actual call
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <Alert variant="destructive" className="border-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg">Emergency Information</AlertTitle>
        <AlertDescription className="text-base">
          For life-threatening emergencies, call 1122 (Pakistan) immediately or go to the nearest
          emergency room. This app is not a substitute for emergency care.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Quick access to critical phone numbers
          </p>
        </div>
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit" : "Add"} Emergency Contact</DialogTitle>
                <DialogDescription>
                  Add important contacts for quick access in emergencies
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Dr. Ahmed Khan"
                    maxLength={100}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="e.g., +92-300-1234567"
                    maxLength={30}
                  />
                  {formErrors.phone_number && (
                    <p className="text-sm text-destructive mt-1">{formErrors.phone_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Contact Type *</Label>
                  <Select
                    value={formData.contact_type}
                    onValueChange={(value: any) => setFormData({ ...formData, contact_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency Service</SelectItem>
                      <SelectItem value="medical">Medical Professional</SelectItem>
                      <SelectItem value="personal">Personal Contact</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.contact_type && (
                    <p className="text-sm text-destructive mt-1">{formErrors.contact_type}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional information..."
                    maxLength={500}
                    rows={3}
                  />
                  {formErrors.notes && (
                    <p className="text-sm text-destructive mt-1">{formErrors.notes}</p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  {editingContact ? "Update" : "Add"} Contact
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pakistani Emergency Services */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Phone className="w-5 h-5" />
            Emergency Hotlines - Pakistan
          </CardTitle>
          <CardDescription>Available 24/7 for urgent situations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {defaultEmergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg text-foreground">{contact.name}</p>
                  <p className="text-2xl font-bold text-destructive mt-1">
                    {contact.number}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCall(contact.number)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Emergency Contacts */}
      {user && customContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Emergency Contacts</CardTitle>
            <CardDescription>Your saved emergency numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customContacts
              .filter((c) => c.contact_type === "emergency")
              .map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-foreground">{contact.name}</p>
                      <p className="text-xl font-bold text-destructive mt-1">{contact.phone_number}</p>
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleCall(contact.phone_number)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Personal Contacts */}
      {user && customContacts.some(c => c.contact_type !== "emergency") && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Emergency Contacts</CardTitle>
            <CardDescription>Your healthcare providers and family contacts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customContacts
              .filter((c) => c.contact_type !== "emergency")
              .map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{contact.name}</p>
                      <p className="text-lg text-muted-foreground mt-1">{contact.phone_number}</p>
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCall(contact.phone_number)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Sign in to add and manage your custom emergency contacts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Emergency;
