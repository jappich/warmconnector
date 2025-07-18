import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Edit, 
  ExternalLink, 
  Users,
  BookOpen,
  Briefcase,
  Heart,
  Settings as SettingsIcon,
  Shield,
  Network
} from 'lucide-react';

const MyProfileModern: React.FC = () => {
  const [editMode, setEditMode] = useState(false);

  const profileData = {
    name: 'Alex Johnson',
    title: 'Senior Product Manager',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    email: 'alex.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    avatar: '/api/placeholder/80/80',
    connections: 234,
    introductionsSent: 47,
    networkScore: 89
  };

  const professionalInfo = {
    experience: [
      { company: 'TechCorp', role: 'Senior Product Manager', years: '2022 - Present' },
      { company: 'StartupXYZ', role: 'Product Manager', years: '2020 - 2022' },
      { company: 'ConsultingFirm', role: 'Business Analyst', years: '2018 - 2020' }
    ],
    education: [
      { institution: 'Stanford University', degree: 'MBA', year: '2018' },
      { institution: 'UC Berkeley', degree: 'BS Computer Science', year: '2016' }
    ],
    skills: ['Product Strategy', 'Data Analysis', 'User Experience', 'Team Leadership', 'Agile Development']
  };

  const personalInfo = {
    hometown: 'Portland, OR',
    interests: ['Rock Climbing', 'Photography', 'Coffee Roasting', 'Travel'],
    languages: ['English (Native)', 'Spanish (Conversational)', 'Mandarin (Basic)'],
    causes: ['Environmental Conservation', 'Education Access', 'Mental Health Awareness']
  };

  const networkStats = [
    { label: 'Direct Connections', value: '234', icon: Users },
    { label: 'Introductions Sent', value: '47', icon: Network },
    { label: 'Network Reach', value: '12.4K', icon: ExternalLink },
    { label: 'Connection Score', value: '89', icon: Shield }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-medium text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your professional profile and networking preferences
          </p>
        </div>
        <Button 
          onClick={() => setEditMode(!editMode)} 
          variant={editMode ? "default" : "outline"}
          className={editMode ? "stat-card-primary border-0" : ""}
        >
          <Edit className="h-4 w-4 mr-2" />
          {editMode ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="premium-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="text-lg">AJ</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profileData.name}</h2>
                <p className="text-lg text-muted-foreground">{profileData.title}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {profileData.company}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {profileData.location}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profileData.phone}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Professional Network
                </Badge>
                <Badge className="bg-success/10 text-success border-success/20">
                  Verified Profile
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {networkStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="premium-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Profile Details Tabs */}
      <Tabs defaultValue="professional" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professional" className="space-y-6">
          {/* Experience */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {professionalInfo.experience.map((exp, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">{exp.role}</h4>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{exp.years}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {professionalInfo.education.map((edu, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{edu.year}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {professionalInfo.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle>Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hometown</p>
                  <p className="text-foreground">{personalInfo.hometown}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Languages</p>
                  <div className="space-y-1">
                    {personalInfo.languages.map((lang, index) => (
                      <p key={index} className="text-sm text-foreground">{lang}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle>Interests & Causes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Interests</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personalInfo.interests.map((interest, index) => (
                      <Badge key={index} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Causes I Care About</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personalInfo.causes.map((cause, index) => (
                      <Badge key={index} variant="outline">{cause}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle>Privacy & Visibility Settings</CardTitle>
              <CardDescription>
                Control how your profile information is used in networking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Public Profile</p>
                    <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show in Search Results</p>
                    <p className="text-sm text-muted-foreground">Allow others to find you in connection searches</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-accept Introductions</p>
                    <p className="text-sm text-muted-foreground">Automatically approve introduction requests</p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProfileModern;