import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Users,
  Save,
  Loader2,
  Settings,
  Key,
  Bell,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';

export default function MyAccount() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    education: [],
    organizations: [],
    family: [],
    hometowns: []
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    onSuccess: (data) => {
      setProfileData({
        name: data.name || '',
        company: data.company || '',
        title: data.title || '',
        email: data.email || '',
        education: data.education || [],
        organizations: data.organizations || [],
        family: data.family || [],
        hometowns: data.hometowns || []
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const addListItem = (field, item) => {
    if (item.trim()) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...prev[field], item.trim()]
      }));
    }
  };

  const removeListItem = (field, index) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const ListEditor = ({ field, label, placeholder }) => {
    const [newItem, setNewItem] = useState('');
    
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <div className="space-y-2">
          {profileData[field].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 bg-gray-900/50 px-3 py-2 rounded border border-gray-600">
              <span className="text-white flex-1">{item}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeListItem(field, index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex space-x-2">
            <Input
              placeholder={placeholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addListItem(field, newItem);
                  setNewItem('');
                }
              }}
              className="bg-gray-900/50 border-gray-600 text-white"
            />
            <Button
              onClick={() => {
                addListItem(field, newItem);
                setNewItem('');
              }}
              disabled={!newItem.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-400" />
          <p className="text-gray-400 mt-4 text-lg">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
          <User className="mr-4 h-10 w-10 text-blue-400" />
          My Account
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your profile and account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 h-12">
          <TabsTrigger value="profile" className="text-white text-base">
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="network" className="text-white text-base">
            Network Details
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-white text-base">
            Account Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company
                  </label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title
                  </label>
                  <Input
                    value={profileData.title}
                    onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="Your job title"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="grid gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Network Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ListEditor
                  field="education"
                  label="Education"
                  placeholder="Add school or university..."
                />
                
                <ListEditor
                  field="organizations"
                  label="Organizations & Associations"
                  placeholder="Add organization..."
                />
                
                <ListEditor
                  field="family"
                  label="Family & Personal Connections"
                  placeholder="Add family connection..."
                />
                
                <ListEditor
                  field="hometowns"
                  label="Hometowns & Locations"
                  placeholder="Add location..."
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Network Details
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Account Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded border border-gray-600">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-gray-400 text-sm">Receive updates about introduction requests</p>
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <Bell className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded border border-gray-600">
                <div>
                  <h3 className="text-white font-medium">Privacy Settings</h3>
                  <p className="text-gray-400 text-sm">Control who can find you and request introductions</p>
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <Key className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-900/20 rounded border border-red-500/50">
                <div>
                  <h3 className="text-red-400 font-medium">Delete Account</h3>
                  <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">0</div>
                  <div className="text-gray-400 text-sm">Introductions Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <div className="text-gray-400 text-sm">Successful Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-gray-400 text-sm">Network Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">0</div>
                  <div className="text-gray-400 text-sm">Profile Views</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}