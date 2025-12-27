import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star, MapPin, Phone, Mail, Calendar, DollarSign, Clock, Plus, Pencil, Upload, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  office_location: string | null;
  years_experience: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  availability_description: string | null;
  is_accepting_patients: boolean | null;
  consultation_fee: number | null;
  image_url: string | null;
}

const doctorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  specialty: z.string().trim().min(1, "Specialty is required").max(100),
  bio: z.string().trim().min(1, "Bio is required").max(1000),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  email: z.string().trim().email("Invalid email").max(255),
  office_location: z.string().trim().min(1, "Office location is required").max(255),
  years_experience: z.number().int().min(0).max(100),
  consultation_fee: z.number().min(0),
  availability_description: z.string().trim().min(1, "Availability is required").max(255),
  is_accepting_patients: z.boolean(),
});

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    bio: '',
    phone: '',
    email: '',
    office_location: '',
    years_experience: 0,
    consultation_fee: 0,
    availability_description: '',
    is_accepting_patients: true,
  });

  const specialties = [
    'All Specialties',
    'Cardiology',
    'Pediatrics',
    'Dermatology',
    'Orthopedics',
    'Family Medicine',
    'Neurology',
    'Obstetrics & Gynecology',
    'Psychiatry'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, specialtyFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors from Supabase...');
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('average_rating', { ascending: false });

      console.log('Doctors fetch response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Setting doctors:', data?.length || 0, 'doctors');
      setDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors: ' + (error?.message || 'Unknown error'));
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    const query = searchQuery.toLowerCase();
    let filtered = doctors;

    if (specialtyFilter !== 'all') {
      const specialty = specialtyFilter.toLowerCase();
      filtered = filtered.filter(doc => (doc.specialty ?? '').toLowerCase() === specialty);
    }

    if (searchQuery) {
      filtered = filtered.filter(doc => {
        const name = (doc.name ?? '').toLowerCase();
        const specialty = (doc.specialty ?? '').toLowerCase();
        const bio = (doc.bio ?? '').toLowerCase();
        return name.includes(query) || specialty.includes(query) || bio.includes(query);
      });
    }

    setFilteredDoctors(filtered);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('doctor-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('doctor-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewDoctor({
      name: '',
      specialty: '',
      bio: '',
      phone: '',
      email: '',
      office_location: '',
      years_experience: 0,
      consultation_fee: 0,
      availability_description: '',
      is_accepting_patients: true,
    });
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleAddDoctor = async () => {
    try {
      setIsSubmitting(true);
      
      const validatedData = doctorSchema.parse(newDoctor);

      let imageUrl = '';
      if (photoFile) {
        const url = await uploadPhoto(photoFile);
        if (url) imageUrl = url;
      }

      const { error } = await supabase
        .from('doctors')
        .insert({ ...validatedData, image_url: imageUrl });

      if (error) throw error;

      toast.success('Doctor added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        const errorMsg = error?.message || error?.error_description || JSON.stringify(error);
        console.error('Error adding doctor:', error);
        toast.error('Failed to add doctor: ' + errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDoctor = async () => {
    if (!editingDoctor) return;

    try {
      setIsSubmitting(true);
      
      const validatedData = doctorSchema.parse(newDoctor);

      let imageUrl = editingDoctor.image_url;
      if (photoFile) {
        const url = await uploadPhoto(photoFile);
        if (url) imageUrl = url;
      }

      const { error } = await supabase
        .from('doctors')
        .update({ ...validatedData, image_url: imageUrl })
        .eq('id', editingDoctor.id);

      if (error) throw error;

      toast.success('Doctor updated successfully!');
      setIsEditDialogOpen(false);
      setEditingDoctor(null);
      resetForm();
      fetchDoctors();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        const errorMsg = error?.message || error?.error_description || JSON.stringify(error);
        console.error('Error updating doctor:', error);
        toast.error('Failed to update doctor: ' + errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor({
      name: doctor.name,
      specialty: doctor.specialty,
      bio: doctor.bio,
      phone: doctor.phone,
      email: doctor.email,
      office_location: doctor.office_location,
      years_experience: doctor.years_experience,
      consultation_fee: doctor.consultation_fee,
      availability_description: doctor.availability_description,
      is_accepting_patients: doctor.is_accepting_patients,
    });
    setPhotoPreview(doctor.image_url || '');
    setIsEditDialogOpen(true);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const text = await file.text();
      let doctorsData: any[] = [];

      if (file.name.endsWith('.json')) {
        doctorsData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        doctorsData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim());
          const doctor: any = {};
          headers.forEach((header, index) => {
            if (header === 'years_experience' || header === 'consultation_fee') {
              doctor[header] = parseFloat(values[index]) || 0;
            } else if (header === 'is_accepting_patients') {
              doctor[header] = values[index].toLowerCase() === 'true';
            } else {
              doctor[header] = values[index];
            }
          });
          return doctor;
        });
      }

      if (!Array.isArray(doctorsData) || doctorsData.length === 0) {
        toast.error('Invalid file format');
        return;
      }

      const { error } = await supabase.from('doctors').insert(doctorsData);

      if (error) throw error;

      toast.success(`Successfully imported ${doctorsData.length} doctors`);
      setIsImportDialogOpen(false);
      fetchDoctors();
    } catch (error: any) {
      toast.error('Failed to import doctors: ' + error.message);
      console.error('Import error:', error);
    } finally {
      setIsSubmitting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    // Navigate to appointments page with pre-filled doctor info
    navigate('/appointments', {
      state: {
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty
      }
    });
  };

  const renderStars = (rating: number | string | null, totalReviews: number | null) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) || 0 : (rating || 0);
    const numReviews = typeof totalReviews === 'string' ? parseInt(totalReviews) || 0 : (totalReviews || 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < Math.floor(numRating)
                ? 'fill-yellow-400 text-yellow-400'
                : index < numRating
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-muted'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {numRating.toFixed(1)} ({numReviews || 0} reviews)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Find a Doctor</h1>
          <p className="text-muted-foreground">
            Browse our directory of healthcare professionals and book an appointment
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Doctor Photo</Label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  placeholder="Dr. John Smith"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty">Specialty *</Label>
                <Select
                  value={newDoctor.specialty}
                  onValueChange={(value) => setNewDoctor({ ...newDoctor, specialty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.slice(1).map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={newDoctor.bio}
                  onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
                  placeholder="Brief description of the doctor's expertise and background"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="office_location">Office Location *</Label>
                <Input
                  id="office_location"
                  value={newDoctor.office_location}
                  onChange={(e) => setNewDoctor({ ...newDoctor, office_location: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="years_experience">Years of Experience *</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={newDoctor.years_experience}
                    onChange={(e) => setNewDoctor({ ...newDoctor, years_experience: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="consultation_fee">Consultation Fee ($) *</Label>
                  <Input
                    id="consultation_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDoctor.consultation_fee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="availability">Availability Description *</Label>
                <Input
                  id="availability"
                  value={newDoctor.availability_description}
                  onChange={(e) => setNewDoctor({ ...newDoctor, availability_description: e.target.value })}
                  placeholder="Monday-Friday, 9:00 AM - 5:00 PM"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="accepting">Accepting New Patients</Label>
                <Switch
                  id="accepting"
                  checked={newDoctor.is_accepting_patients}
                  onCheckedChange={(checked) => setNewDoctor({ ...newDoctor, is_accepting_patients: checked })}
                />
              </div>

                <Button onClick={handleAddDoctor} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Adding Doctor...' : 'Add Doctor'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileUp className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Doctors</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV or JSON file with doctor information. Required fields: name, specialty, bio, phone, email, office_location, years_experience, consultation_fee, availability_description, is_accepting_patients.
                </p>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <Button
                  onClick={() => importInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Importing...' : 'Select File'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingDoctor(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Doctor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Doctor Photo</Label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  placeholder="Dr. John Smith"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-specialty">Specialty *</Label>
                <Select
                  value={newDoctor.specialty}
                  onValueChange={(value) => setNewDoctor({ ...newDoctor, specialty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.slice(1).map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-bio">Bio *</Label>
                <Textarea
                  id="edit-bio"
                  value={newDoctor.bio}
                  onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
                  placeholder="Brief description of the doctor's expertise and background"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-office_location">Office Location *</Label>
                <Input
                  id="edit-office_location"
                  value={newDoctor.office_location}
                  onChange={(e) => setNewDoctor({ ...newDoctor, office_location: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-years_experience">Years of Experience *</Label>
                  <Input
                    id="edit-years_experience"
                    type="number"
                    min="0"
                    value={newDoctor.years_experience}
                    onChange={(e) => setNewDoctor({ ...newDoctor, years_experience: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-consultation_fee">Consultation Fee ($) *</Label>
                  <Input
                    id="edit-consultation_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDoctor.consultation_fee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-availability">Availability Description *</Label>
                <Input
                  id="edit-availability"
                  value={newDoctor.availability_description}
                  onChange={(e) => setNewDoctor({ ...newDoctor, availability_description: e.target.value })}
                  placeholder="Monday-Friday, 9:00 AM - 5:00 PM"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-accepting">Accepting New Patients</Label>
                <Switch
                  id="edit-accepting"
                  checked={newDoctor.is_accepting_patients}
                  onCheckedChange={(checked) => setNewDoctor({ ...newDoctor, is_accepting_patients: checked })}
                />
              </div>

              <Button onClick={handleEditDoctor} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Updating Doctor...' : 'Update Doctor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name, specialty, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.slice(1).map(specialty => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No doctors found matching your criteria</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  {doctor.image_url && (
                    <img 
                      src={doctor.image_url} 
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1">{doctor.name}</CardTitle>
                        <CardDescription className="text-base font-medium text-primary">
                          {doctor.specialty}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        {doctor.is_accepting_patients && (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            Accepting Patients
                          </Badge>
                        )}
                      </div>
                    </div>
                    {renderStars(doctor.average_rating, doctor.total_reviews)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{doctor.bio}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{doctor.availability_description}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{doctor.office_location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Consultation: ${doctor.consultation_fee}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{doctor.phone}</span>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {doctor.years_experience} years of experience
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(doctor)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleBookAppointment(doctor)}
                  className="flex-1"
                  disabled={!doctor.is_accepting_patients}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Doctors;
