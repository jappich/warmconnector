import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import WarmConnectorLogo from '@/components/WarmConnectorLogo';
import { 
  Mail, 
  Linkedin, 
  Github, 
  Twitter, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Heart,
  Upload,
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  Plus,
  AlertCircle
} from 'lucide-react';
import { SiSalesforce, SiHubspot, SiGoogle, SiInstagram } from 'react-icons/si';

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  points: number;
}

export default function WelcomeOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    location: '',
    isNewCompany: false
  });
  const [personalInfo, setPersonalInfo] = useState({
    hometown: '',
    university: '',
    greekLife: '',
    pastCompanies: '',
    hobbies: ''
  });
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, connected: false, points: 35 },
    { id: 'github', name: 'GitHub', icon: Github, connected: false, points: 15 },
    { id: 'twitter', name: 'Twitter', icon: Twitter, connected: false, points: 15 },
    { id: 'salesforce', name: 'Salesforce', icon: SiSalesforce, connected: false, points: 30 },
    { id: 'hubspot', name: 'HubSpot', icon: SiHubspot, connected: false, points: 25 },
    { id: 'google', name: 'Google', icon: SiGoogle, connected: false, points: 20 },
    { id: 'instagram', name: 'Instagram', icon: SiInstagram, connected: false, points: 10 }
  ]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { toast } = useToast();
  const totalPoints = platforms.filter(p => p.connected).reduce((sum, p) => sum + p.points, 0);
  const progressPercentage = (currentStep / 4) * 100;

  const handlePlatformConnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, connected: !p.connected } : p
    ));
    
    const platform = platforms.find(p => p.id === platformId);
    toast({
      title: platform?.connected ? "Disconnected" : "Connected!",
      description: `${platform?.name} ${platform?.connected ? 'disconnected' : 'connected successfully'}`,
    });
  };

  const handleEmailSubmit = () => {
    if (email && email.includes('@')) {
      setCurrentStep(2);
      toast({
        title: "Account Created!",
        description: "Check your email for a confirmation link.",
      });
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
    }
  };

  const checkExistingCompany = async (companyName: string) => {
    try {
      const response = await fetch(`/api/companies/suggestions?q=${encodeURIComponent(companyName)}`);
      const data = await response.json();
      return data.suggestions && data.suggestions.length > 0;
    } catch (error) {
      return false;
    }
  };

  const handleCompanySubmit = async () => {
    if (!companyInfo.name || !companyInfo.location) {
      toast({
        title: "Missing Information",
        description: "Please enter both company name and location.",
        variant: "destructive"
      });
      return;
    }

    const exists = await checkExistingCompany(companyInfo.name);
    setCompanyInfo(prev => ({ ...prev, isNewCompany: !exists }));
    
    if (!exists) {
      toast({
        title: "New Company Detected",
        description: "Great! We'll add your company to our network.",
      });
    } else {
      toast({
        title: "Company Found",
        description: "Perfect! We'll connect you with your coworkers.",
      });
    }
    
    setCurrentStep(3);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File Uploaded",
        description: `${file.name} ready for processing`,
      });
    }
  };

  const handleFinish = async () => {
    try {
      // Submit onboarding data
      const onboardingData = {
        email,
        company: companyInfo.name,
        companyLocation: companyInfo.location,
        isNewCompany: companyInfo.isNewCompany,
        platforms: platforms.filter(p => p.connected).map(p => p.id),
        personalInfo,
        connectionScore: totalPoints,
        hasUploadedContacts: !!uploadedFile
      };

      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });

      if (response.ok) {
        toast({
          title: "Welcome to WarmConnector!",
          description: "Basic setup complete! Ready to boost your network?",
        });
        // Redirect to boost profile page
        setTimeout(() => {
          window.location.href = '/boost';
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "There was an issue setting up your account. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-dark/95 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <WarmConnectorLogo className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to WarmConnector! 🎉
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Let's get you set up in four quick steps so we can start discovering your best introductions.
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cosmic-text">Setup Progress</span>
              <span className="text-sm text-cosmic-accent">{currentStep}/4 steps</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Step 1: Create Account */}
        {currentStep === 1 && (
          <Card className="bg-cosmic-card border-cosmic-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cosmic-text">
                <Mail className="h-5 w-5 text-cosmic-accent" />
                1️⃣ Create your account
              </CardTitle>
              <CardDescription className="text-cosmic-muted">
                What email should we use? We'll send you a confirmation link to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-cosmic-text">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                />
              </div>
              <Button 
                onClick={handleEmailSubmit}
                disabled={!email || !email.includes('@')}
                className="w-full bg-cosmic-primary hover:bg-cosmic-primary/80"
              >
                Create Account & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Company Information */}
        {currentStep === 2 && (
          <Card className="bg-cosmic-card border-cosmic-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cosmic-text">
                <Building2 className="h-5 w-5 text-cosmic-accent" />
                2️⃣ Join (or add) your company pot
              </CardTitle>
              <CardDescription className="text-cosmic-muted">
                Which company do you work for? We group you with everyone else at the same company—more coworkers means more intro paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company" className="text-cosmic-text">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google, Microsoft, Startup Inc"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-cosmic-text">Location (city, state/country)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={companyInfo.location}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>
              </div>

              <div className="bg-cosmic-dark/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Plus className="h-5 w-5 text-cosmic-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium text-cosmic-text mb-1">New here?</h4>
                    <p className="text-sm text-cosmic-muted">
                      If your company isn't listed yet, just confirm and we'll add it right away.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCompanySubmit}
                disabled={!companyInfo.name || !companyInfo.location}
                className="w-full bg-cosmic-primary hover:bg-cosmic-primary/80"
              >
                Continue to Profiles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Connect Platforms */}
        {currentStep === 3 && (
          <Card className="bg-cosmic-card border-cosmic-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cosmic-text">
                <Users className="h-5 w-5 text-cosmic-accent" />
                3️⃣ Connect your professional profiles
              </CardTitle>
              <CardDescription className="text-cosmic-muted">
                Link any social or work accounts (e.g. LinkedIn, GitHub, Twitter). Each profile you link uncovers new networks—let us tap into those connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Score */}
              <div className="bg-cosmic-dark/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cosmic-text">Connection Discovery Score</span>
                  <span className="text-lg font-bold text-cosmic-accent">{totalPoints} points</span>
                </div>
                <Progress value={(totalPoints / 150) * 100} className="h-2" />
                <p className="text-xs text-cosmic-muted mt-2">
                  Higher scores unlock more powerful connection discovery
                </p>
              </div>

              {/* Platform Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <div
                      key={platform.id}
                      onClick={() => handlePlatformConnect(platform.id)}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        platform.connected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-cosmic-border hover:border-cosmic-accent bg-cosmic-dark/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-cosmic-accent" />
                          <span className="font-medium text-cosmic-text">{platform.name}</span>
                        </div>
                        {platform.connected && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                          +{platform.points} pts
                        </Badge>
                        <span className="text-xs text-cosmic-muted">
                          {platform.connected ? 'Connected' : 'Click to connect'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button 
                onClick={() => setCurrentStep(4)}
                className="w-full bg-cosmic-primary hover:bg-cosmic-primary/80"
              >
                Continue to Background Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Personal Details */}
        {currentStep === 4 && (
          <Card className="bg-cosmic-card border-cosmic-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cosmic-text">
                <Heart className="h-5 w-5 text-cosmic-accent" />
                4️⃣ Share key background details
              </CardTitle>
              <CardDescription className="text-cosmic-muted">
                Help us find shared experiences that make introductions warmer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hometown" className="flex items-center gap-1 text-cosmic-text">
                    <MapPin className="h-4 w-4" />
                    Hometown <span className="text-xs text-cosmic-muted ml-1">(local ties spark rapport)</span>
                  </Label>
                  <Input
                    id="hometown"
                    placeholder="e.g., Austin, TX"
                    value={personalInfo.hometown}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, hometown: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="flex items-center gap-1 text-cosmic-text">
                    <GraduationCap className="h-4 w-4" />
                    School / University <span className="text-xs text-cosmic-muted ml-1">(fellow alumni open doors)</span>
                  </Label>
                  <Input
                    id="university"
                    placeholder="e.g., USC"
                    value={personalInfo.university}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, university: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greek" className="flex items-center gap-1 text-cosmic-text">
                    <Users className="h-4 w-4" />
                    Greek or affinity groups <span className="text-xs text-cosmic-muted ml-1">(shared memberships build trust)</span>
                  </Label>
                  <Input
                    id="greek"
                    placeholder="e.g., Sigma Chi"
                    value={personalInfo.greekLife}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, greekLife: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companies" className="flex items-center gap-1 text-cosmic-text">
                    <Building2 className="h-4 w-4" />
                    Past companies <span className="text-xs text-cosmic-muted ml-1">(former coworkers often reconnect you)</span>
                  </Label>
                  <Input
                    id="companies"
                    placeholder="e.g., Google, Microsoft"
                    value={personalInfo.pastCompanies}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, pastCompanies: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hobbies" className="flex items-center gap-1 text-cosmic-text">
                    <Zap className="h-4 w-4" />
                    Hobbies & interests <span className="text-xs text-cosmic-muted ml-1">(personal common ground makes intros warmer)</span>
                  </Label>
                  <Input
                    id="hobbies"
                    placeholder="e.g., hiking, jazz"
                    value={personalInfo.hobbies}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, hobbies: e.target.value }))}
                    className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                  />
                </div>
              </div>

              {/* Bonus Upload Section */}
              <div className="border-t border-cosmic-border pt-6">
                <h4 className="font-medium text-cosmic-text mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cosmic-accent" />
                  Bonus (Optional): Upload your contacts
                </h4>
                <p className="text-sm text-cosmic-muted mb-4">
                  Got a CSV or VCard of colleagues or friends? Upload it here to boost your connection graph even further.
                </p>
                
                <div className="border-2 border-dashed border-cosmic-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-cosmic-muted mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".csv,.vcf,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm text-cosmic-text">
                      {uploadedFile ? `Selected: ${uploadedFile.name}` : "Click to upload CSV, VCard, or Excel file"}
                    </span>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleFinish}
                className="w-full bg-cosmic-primary hover:bg-cosmic-primary/80"
              >
                Complete Setup & Start Finding Connections
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}



        {/* Footer Message */}
        <div className="text-center mt-8">
          <p className="text-cosmic-muted">
            {currentStep < 4 
              ? "Once you're done, we'll build your graph and surface your warmest intro paths right away."
              : "That's it! If you have any questions at any point, just type \"help\"."
            }
          </p>
        </div>
      </div>
    </div>
  );
}