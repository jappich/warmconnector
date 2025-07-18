import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building2, 
  MapPin, 
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Github,
  Globe,
  Save,
  Plus,
  X,
  GraduationCap,
  Users,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function ProfileManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile']
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
    location: '',
    phone: '',
    bio: '',
    linkedin: '',
    twitter: '',
    github: '',
    website: '',
    education: [],
    familyConnections: [],
    socialCircles: []
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Profile Updated",
        description: "Your professional profile has been saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field, item) => {
    setProfileData(prev => ({
      ...prev,
      [field]: [...prev[field], item]
    }));
  };

  const handleArrayRemove = (field, index) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile Management</h1>
        <p className="text-gray-400">
          Manage your professional profile and connection data for better networking insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="basic" className="text-gray-300 data-[state=active]:text-white">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-gray-300 data-[state=active]:text-white">
            Professional
          </TabsTrigger>
          <TabsTrigger value="social" className="text-gray-300 data-[state=active]:text-white">
            Social Links
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-gray-300 data-[state=active]:text-white">
            Connections
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className="text-gray-300">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white"
                  placeholder="Brief description of your professional background and interests..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information */}
        <TabsContent value="professional">
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Current Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Job Title</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="bg-gray-900/50 border-gray-600 text-white"
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-gray-300">Company</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="bg-gray-900/50 border-gray-600 text-white"
                      placeholder="Google"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Education
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleArrayAdd('education', { school: '', degree: '', year: '' })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.education.map((edu, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-600 rounded">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          placeholder="School"
                          value={edu.school}
                          onChange={(e) => {
                            const updated = [...profileData.education];
                            updated[index].school = e.target.value;
                            handleInputChange('education', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...profileData.education];
                            updated[index].degree = e.target.value;
                            handleInputChange('education', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Year"
                          value={edu.year}
                          onChange={(e) => {
                            const updated = [...profileData.education];
                            updated[index].year = e.target.value;
                            handleInputChange('education', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArrayRemove('education', index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {profileData.education.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No education information added yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Social Media & Professional Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin" className="text-gray-300">LinkedIn Profile</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="linkedin"
                      value={profileData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="twitter" className="text-gray-300">Twitter/X Profile</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="twitter"
                      value={profileData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="@johndoe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="github" className="text-gray-300">GitHub Profile</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="github"
                      value={profileData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="github.com/johndoe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className="text-gray-300">Personal Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                      placeholder="www.johndoe.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections">
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Family Connections
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleArrayAdd('familyConnections', { name: '', relationship: '', details: '' })}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Family
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.familyConnections.map((family, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-600 rounded">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Name"
                          value={family.name}
                          onChange={(e) => {
                            const updated = [...profileData.familyConnections];
                            updated[index].name = e.target.value;
                            handleInputChange('familyConnections', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Relationship"
                          value={family.relationship}
                          onChange={(e) => {
                            const updated = [...profileData.familyConnections];
                            updated[index].relationship = e.target.value;
                            handleInputChange('familyConnections', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Professional details"
                          value={family.details}
                          onChange={(e) => {
                            const updated = [...profileData.familyConnections];
                            updated[index].details = e.target.value;
                            handleInputChange('familyConnections', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArrayRemove('familyConnections', index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Social Circles
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleArrayAdd('socialCircles', { type: '', name: '', details: '' })}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Circle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.socialCircles.map((circle, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-600 rounded">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Type (Fraternity, Club, etc.)"
                          value={circle.type}
                          onChange={(e) => {
                            const updated = [...profileData.socialCircles];
                            updated[index].type = e.target.value;
                            handleInputChange('socialCircles', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Name"
                          value={circle.name}
                          onChange={(e) => {
                            const updated = [...profileData.socialCircles];
                            updated[index].name = e.target.value;
                            handleInputChange('socialCircles', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                        <Input
                          placeholder="Additional details"
                          value={circle.details}
                          onChange={(e) => {
                            const updated = [...profileData.socialCircles];
                            updated[index].details = e.target.value;
                            handleInputChange('socialCircles', updated);
                          }}
                          className="bg-gray-900/50 border-gray-600 text-white text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArrayRemove('socialCircles', index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {updateProfileMutation.isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}