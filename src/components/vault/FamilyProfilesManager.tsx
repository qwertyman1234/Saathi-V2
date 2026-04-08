import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import * as vaultAPI from '@/lib/vault/api';
import { FamilyProfile } from '@/lib/vault/types';

interface FamilyProfilesManagerProps {
  onProfileSelect?: (profileId: string) => void;
}

export function FamilyProfilesManager({ onProfileSelect }: FamilyProfilesManagerProps) {
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    relation: 'Self',
    mobileNumber: '',
    email: '',
  });

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getFamilyProfiles();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        toast.error(response.error || 'Failed to load profiles');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load family profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (profile?: FamilyProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        fullName: profile.fullName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        relation: profile.relation,
        mobileNumber: profile.mobileNumber || '',
        email: profile.email || '',
      });
    } else {
      setEditingProfile(null);
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        relation: 'Self',
        mobileNumber: '',
        email: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.fullName || !formData.dateOfBirth || !formData.gender) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingProfile) {
        const response = await vaultAPI.updateFamilyProfile(editingProfile._id, formData);
        if (response.success) {
          toast.success('Profile updated successfully');
          setIsDialogOpen(false);
          loadProfiles();
        } else {
          toast.error(response.error || 'Failed to update profile');
        }
      } else {
        const response = await vaultAPI.createFamilyProfile(formData);
        if (response.success) {
          toast.success('Profile created successfully');
          setIsDialogOpen(false);
          loadProfiles();
        } else {
          toast.error(response.error || 'Failed to create profile');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await vaultAPI.deleteFamilyProfile(profileId);
      if (response.success) {
        toast.success('Profile deleted successfully');
        loadProfiles();
      } else {
        toast.error(response.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Family Profiles</h2>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>No family profiles created yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map(profile => (
            <div key={profile._id} className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-card-foreground">{profile.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{profile.relation}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDialog(profile)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile._id)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>DOB: {profile.dateOfBirth}</p>
                {profile.mobileNumber && <p>Phone: {profile.mobileNumber}</p>}
                {profile.email && <p>Email: {profile.email}</p>}
              </div>
              {onProfileSelect && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => onProfileSelect(profile._id)}
                >
                  View Documents
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Profile Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Add New Profile'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g., Rajesh Kumar Singh"
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={value => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="relation">Relation *</Label>
                <Select value={formData.relation} onValueChange={value => setFormData({ ...formData, relation: value })}>
                  <SelectTrigger id="relation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Self">Self</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Son">Son</SelectItem>
                    <SelectItem value="Daughter">Daughter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber}
                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+91 9800000000"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="flex-1">
                {editingProfile ? 'Update' : 'Create'} Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
