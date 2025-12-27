import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, User as UserIcon, Upload, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
}

const emptyProfile = (userId: string): Profile => ({
  id: userId,
  username: '',
  full_name: '',
  avatar_url: null,
  date_of_birth: '',
  gender: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  blood_type: '',
  height_cm: null,
  weight_kg: null,
});

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // No profile row yet; seed an empty profile for editing
        setProfile(emptyProfile(user!.id));
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('patient-avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          phone: profile.phone,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          blood_type: profile.blood_type,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
        });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and emergency contacts
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Profile'} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profile?.full_name?.charAt(0) || <UserIcon className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WEBP. Max size 5MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={profile?.date_of_birth || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile?.gender || ''}
                onValueChange={(value) => setProfile(prev => prev ? { ...prev, gender: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile?.phone || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_type">Blood Type</Label>
              <Select
                value={profile?.blood_type || ''}
                onValueChange={(value) => setProfile(prev => prev ? { ...prev, blood_type: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={profile?.height_cm || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, height_cm: parseFloat(e.target.value) || null } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={profile?.weight_kg || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, weight_kg: parseFloat(e.target.value) || null } : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Person to contact in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Emergency Contact Name</Label>
              <Input
                id="emergency_name"
                value={profile?.emergency_contact_name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, emergency_contact_name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_phone"
                type="tel"
                value={profile?.emergency_contact_phone || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, emergency_contact_phone: e.target.value } : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
