import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Plus, 
  X, 
  Save, 
  Users, 
  Award, 
  Globe, 
  Heart, 
  Briefcase,
  GraduationCap,
  Lock,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  phone?: string;
  location?: string;
  bio?: string;
  spouseName?: string;
  spouseEmail?: string;
  managerName?: string;
  managerEmail?: string;
  executiveAssistantName?: string;
  executiveAssistantEmail?: string;
  certifications?: string[];
  languages?: string[];
  hobbies?: string[];
  boardPositions?: string[];
  volunteerRoles?: string[];
  relatives?: Array<{
    name: string;
    relationship: string;
    email?: string;
  }>;
  education?: {
    degree?: string;
    school?: string;
    year?: string;
  };
  networkStats?: {
    totalConnections: number;
    coworkerConnections: number;
    familyConnections: number;
    schoolConnections: number;
    professionalConnections: number;
  };
  lastUpdated?: string;
}

export default function MyProfile() {
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [tempData, setTempData] = useState<Partial<ProfileData>>({});
  const [newItemDialogs, setNewItemDialogs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['/api/profile/me'],
    queryFn: () => apiRequest('/api/profile/me')
  });

  const profile: ProfileData = profileResponse?.profile || {};

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<ProfileData>) => 
      apiRequest('/api/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/me'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      if (data.graphRebuildQueued) {
        toast({
          title: "Network Update",
          description: "Your network graph is being updated with the latest changes.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete section mutation
  const deleteItemMutation = useMutation({
    mutationFn: ({ section, index }: { section: string; index?: string }) =>
      apiRequest(`/api/profile/me/${section}${index ? `/${index}` : ''}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/me'] });
      toast({
        title: "Item Deleted",
        description: "The item has been removed from your profile.",
      });
    }
  });

  const startEditing = (section: string) => {
    setEditingSections(prev => new Set([...prev, section]));
    setTempData(prev => ({ ...prev, [section]: profile[section as keyof ProfileData] }));
  };

  const saveSection = (section: string) => {
    const updates = { [section]: tempData[section as keyof typeof tempData] };
    updateProfileMutation.mutate(updates);
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
  };

  const cancelEditing = (section: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
    setTempData(prev => {
      const newData = { ...prev };
      delete newData[section as keyof typeof newData];
      return newData;
    });
  };

  const addArrayItem = (section: string, item: string) => {
    if (!item.trim()) return;
    
    const currentArray = (profile[section as keyof ProfileData] as string[]) || [];
    const updates = { [section]: [...currentArray, item.trim()] };
    updateProfileMutation.mutate(updates);
    
    setNewItemDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
  };

  const removeArrayItem = (section: string, index: number) => {
    deleteItemMutation.mutate({ section, index: index.toString() });
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" alt={profile.name} />
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {getInitials(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
          <p className="text-lg text-muted-foreground">{profile.title} at {profile.company}</p>
          {profile.lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Network Stats */}
      {profile.networkStats && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.networkStats.totalConnections}</div>
                <div className="text-sm text-muted-foreground">Total Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profile.networkStats.coworkerConnections}</div>
                <div className="text-sm text-muted-foreground">Coworkers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{profile.networkStats.familyConnections}</div>
                <div className="text-sm text-muted-foreground">Family</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{profile.networkStats.schoolConnections}</div>
                <div className="text-sm text-muted-foreground">Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{profile.networkStats.professionalConnections}</div>
                <div className="text-sm text-muted-foreground">Professional</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editingSections.has('basic') ? saveSection('basic') : startEditing('basic')}
            >
              {editingSections.has('basic') ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingSections.has('basic') ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={tempData.name || profile.name || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={tempData.title || profile.title || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempData.email || profile.email || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={tempData.phone || profile.phone || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={tempData.location || profile.location || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={tempData.bio || profile.bio || ''}
                    onChange={(e) => setTempData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveSection('basic')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelEditing('basic')}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.company}</span>
                </div>
                {profile.bio && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family & Personal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Family & Personal
              <Lock className="h-3 w-3 text-muted-foreground" title="Private - used only for pathfinding" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Spouse */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Spouse</Label>
                {profile.spouseName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItemMutation.mutate({ section: 'spouse' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {profile.spouseName ? (
                <div className="text-sm">
                  <div className="font-medium">{profile.spouseName}</div>
                  {profile.spouseEmail && (
                    <div className="text-muted-foreground">{profile.spouseEmail}</div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'spouse']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spouse
                </Button>
              )}
            </div>

            <Separator />

            {/* Relatives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Relatives</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'relative']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Relative
                </Button>
              </div>
              <div className="space-y-2">
                {profile.relatives?.map((relative, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{relative.name}</div>
                      <div className="text-muted-foreground">{relative.relationship}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('relatives', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(!profile.relatives || profile.relatives.length === 0) && (
                  <p className="text-sm text-muted-foreground">No relatives added</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Network
              <Lock className="h-3 w-3 text-muted-foreground" title="Private - used only for pathfinding" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manager */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Manager</Label>
                {profile.managerName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItemMutation.mutate({ section: 'manager' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {profile.managerName ? (
                <div className="text-sm">
                  <div className="font-medium">{profile.managerName}</div>
                  {profile.managerEmail && (
                    <div className="text-muted-foreground">{profile.managerEmail}</div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'manager']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              )}
            </div>

            <Separator />

            {/* Executive Assistant */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Executive Assistant</Label>
                {profile.executiveAssistantName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItemMutation.mutate({ section: 'executiveAssistant' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {profile.executiveAssistantName ? (
                <div className="text-sm">
                  <div className="font-medium">{profile.executiveAssistantName}</div>
                  {profile.executiveAssistantEmail && (
                    <div className="text-muted-foreground">{profile.executiveAssistantEmail}</div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'executiveAssistant']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Executive Assistant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Certifications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Certifications</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'certifications']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.certifications?.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {cert}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeArrayItem('certifications', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {(!profile.certifications || profile.certifications.length === 0) && (
                  <p className="text-sm text-muted-foreground">No certifications added</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Languages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Languages</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'languages']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.languages?.map((lang, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {lang}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeArrayItem('languages', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {(!profile.languages || profile.languages.length === 0) && (
                  <p className="text-sm text-muted-foreground">No languages added</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editingSections.has('education') ? saveSection('education') : startEditing('education')}
            >
              {editingSections.has('education') ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            {editingSections.has('education') ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    value={tempData.education?.degree || profile.education?.degree || ''}
                    onChange={(e) => setTempData(prev => ({ 
                      ...prev, 
                      education: { ...prev.education, degree: e.target.value }
                    }))}
                    placeholder="e.g. Bachelor of Science"
                  />
                </div>
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={tempData.education?.school || profile.education?.school || ''}
                    onChange={(e) => setTempData(prev => ({ 
                      ...prev, 
                      education: { ...prev.education, school: e.target.value }
                    }))}
                    placeholder="e.g. Stanford University"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Graduation Year</Label>
                  <Input
                    id="year"
                    value={tempData.education?.year || profile.education?.year || ''}
                    onChange={(e) => setTempData(prev => ({ 
                      ...prev, 
                      education: { ...prev.education, year: e.target.value }
                    }))}
                    placeholder="e.g. 2020"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveSection('education')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelEditing('education')}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {profile.education?.degree && (
                  <div className="text-sm">
                    <div className="font-medium">{profile.education.degree}</div>
                    {profile.education.school && (
                      <div className="text-muted-foreground">{profile.education.school}</div>
                    )}
                    {profile.education.year && (
                      <div className="text-muted-foreground">Class of {profile.education.year}</div>
                    )}
                  </div>
                )}
                {!profile.education?.degree && (
                  <p className="text-sm text-muted-foreground">No education information added</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests & Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interests & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hobbies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Hobbies & Interests</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'hobbies']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hobby
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.hobbies?.map((hobby, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    {hobby}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeArrayItem('hobbies', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {(!profile.hobbies || profile.hobbies.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hobbies added</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Board Positions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Board Positions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'boardPositions']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Board Position
                </Button>
              </div>
              <div className="space-y-1">
                {profile.boardPositions?.map((position, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                    <span>{position}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('boardPositions', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(!profile.boardPositions || profile.boardPositions.length === 0) && (
                  <p className="text-sm text-muted-foreground">No board positions added</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Volunteer Roles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Volunteer Roles</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewItemDialogs(prev => new Set([...prev, 'volunteerRoles']))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Volunteer Role
                </Button>
              </div>
              <div className="space-y-1">
                {profile.volunteerRoles?.map((role, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                    <span>{role}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('volunteerRoles', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(!profile.volunteerRoles || profile.volunteerRoles.length === 0) && (
                  <p className="text-sm text-muted-foreground">No volunteer roles added</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialogs */}
      {Array.from(newItemDialogs).map(section => (
        <AddItemDialog
          key={section}
          section={section}
          isOpen={true}
          onClose={() => setNewItemDialogs(prev => {
            const newSet = new Set(prev);
            newSet.delete(section);
            return newSet;
          })}
          onAdd={(item) => addArrayItem(section, item)}
        />
      ))}
    </div>
  );
}

// Dialog component for adding new items
function AddItemDialog({ 
  section, 
  isOpen, 
  onClose, 
  onAdd 
}: {
  section: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: string) => void;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      onClose();
    }
  };

  const getPlaceholder = (section: string) => {
    switch (section) {
      case 'certifications': return 'e.g. PMP, CPA, AWS Certified';
      case 'languages': return 'e.g. Spanish, Mandarin, French';
      case 'hobbies': return 'e.g. Photography, Rock Climbing, Cooking';
      case 'boardPositions': return 'e.g. Board Member at XYZ Foundation';
      case 'volunteerRoles': return 'e.g. Volunteer at Local Food Bank';
      default: return 'Enter value';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {section}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getPlaceholder(section)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit">Add</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}