import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PrivacyFooter from '@/components/PrivacyFooter';
import { CheckCircle, Circle, Linkedin, Mail, Github, Twitter, ArrowRight, Users, TrendingUp, Star, Heart, GraduationCap, MapPin, Building2 } from 'lucide-react';
import { SiSalesforce, SiHubspot, SiGoogle, SiInstagram } from 'react-icons/si';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  value: number;
  isConnected: boolean;
  isPremium?: boolean;
}

export default function EnhancedOnboarding() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [connectionScore, setConnectionScore] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({
    spouse: '',
    hometown: '',
    university: '',
    greekLife: '',
    previousCompanies: '',
    hobbies: ''
  });
  const { toast } = useToast();

  const platforms: SocialPlatform[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      description: 'Professional network & job history',
      value: 35,
      isConnected: connectedPlatforms.has('linkedin')
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      icon: SiSalesforce,
      description: 'CRM contacts & business relationships',
      value: 25,
      isConnected: connectedPlatforms.has('salesforce'),
      isPremium: true
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: SiHubspot,
      description: 'Marketing contacts & company data',
      value: 20,
      isConnected: connectedPlatforms.has('hubspot'),
      isPremium: true
    },
    {
      id: 'google',
      name: 'Google',
      icon: SiGoogle,
      description: 'Email contacts & professional profile',
      value: 15,
      isConnected: connectedPlatforms.has('google')
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Developer network & repositories',
      value: 10,
      isConnected: connectedPlatforms.has('github')
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: Twitter,
      description: 'Professional Twitter network',
      value: 8,
      isConnected: connectedPlatforms.has('twitter')
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: () => <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">IG</div>,
      description: 'Personal network & lifestyle connections',
      value: 12,
      isConnected: connectedPlatforms.has('instagram')
    }
  ];

  const totalPossibleScore = platforms.reduce((sum, platform) => sum + platform.value, 0);

  useEffect(() => {
    const score = platforms
      .filter(platform => platform.isConnected)
      .reduce((sum, platform) => sum + platform.value, 0);
    setConnectionScore(score);
  }, [Array.from(connectedPlatforms)]);

  const handlePlatformConnect = async (platformId: string) => {
    try {
      const platformName = platforms.find(p => p.id === platformId)?.name;
      
      switch (platformId) {
        case 'linkedin':
          // Check if user is already connected
          const response = await fetch('/api/user/social-accounts');
          const data = await response.json();
          const linkedinAccount = data.accounts?.find((acc: any) => acc.platform === 'linkedin');
          
          if (linkedinAccount) {
            toast({
              title: "Already Connected",
              description: "Your LinkedIn account is already connected.",
            });
            setConnectedPlatforms(prev => new Set([...prev, 'linkedin']));
          } else {
            window.location.href = '/auth/linkedin';
          }
          break;
        case 'salesforce':
          window.location.href = '/auth/salesforce';
          break;
        case 'hubspot':
          window.location.href = '/auth/hubspot';
          break;
        case 'instagram':
          window.location.href = '/auth/instagram';
          break;
        default:
          toast({
            title: "Connect your account",
            description: `Click to connect your ${platformName} account and sync your professional network.`,
          });
          // Simulate connection for demo platforms
          setTimeout(() => {
            setConnectedPlatforms(prev => new Set([...prev, platformId]));
            toast({
              title: "Connected successfully",
              description: `${platformName} account connected and syncing contacts.`,
            });
          }, 1500);
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to platform. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      const response = await fetch('/api/social/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      });
      
      if (response.ok) {
        setConnectedPlatforms(prev => {
          const newSet = new Set(prev);
          newSet.delete(platformId);
          return newSet;
        });
        
        toast({
          title: "Disconnected",
          description: `${platformId} account has been disconnected.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect account.",
        variant: "destructive"
      });
    }
  };
  
  const checkConnectedPlatforms = async () => {
    try {
      const response = await fetch('/api/user/social-accounts');
      const data = await response.json();
      
      if (data.accounts) {
        const connectedSet = new Set(data.accounts.map((acc: any) => acc.platform));
        setConnectedPlatforms(connectedSet);
      }
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error);
    }
  };
  
  useEffect(() => {
    checkConnectedPlatforms();
  }, []);
  
  const handleConnectionCheck = (platformId: string) => {
    setConnectedPlatforms(prev => {
      const newSet = new Set(prev);
      newSet.delete(platformId);
      return newSet;
    });
    toast({
      title: "Platform disconnected",
      description: `Disconnected from ${platforms.find(p => p.id === platformId)?.name}`,
    });
  };

  const getConnectionAdvice = () => {
    if (connectionScore >= 80) {
      return {
        title: "Excellent Network Coverage!",
        description: "You're maximizing your connection discovery potential.",
        icon: <Star className="h-5 w-5 text-yellow-500" />
      };
    } else if (connectionScore >= 50) {
      return {
        title: "Good Network Foundation",
        description: "Consider connecting more platforms to find additional connections.",
        icon: <TrendingUp className="h-5 w-5 text-blue-500" />
      };
    } else {
      return {
        title: "Expand Your Network",
        description: "Connect more platforms to unlock powerful connection discovery.",
        icon: <Users className="h-5 w-5 text-orange-500" />
      };
    }
  };

  const advice = getConnectionAdvice();

  if (onboardingStep === 1) {
    return (
      <div className="min-h-screen bg-cosmic-background text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to WarmConnector
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              The more platforms you connect, the better connections we can find for you
            </p>
            
            {/* Simple Setup Guide */}
            <div className="bg-purple-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <h3 className="text-purple-100 font-medium mb-2">To get the most out of WarmConnector:</h3>
              <ul className="text-purple-200 text-sm space-y-1 text-left">
                <li>• Connect your LinkedIn and other social accounts below</li>
                <li>• Upload your company's contact list (CSV/VCard files)</li>
                <li>• Ask colleagues to join and upload their contacts too</li>
                <li>• The more data uploaded, the better connection paths we can find</li>
              </ul>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center space-x-4 mb-4">
                {advice.icon}
                <div>
                  <h3 className="font-semibold text-lg text-white">{advice.title}</h3>
                  <p className="text-purple-200">{advice.description}</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-200">Connection Discovery Score</span>
                  <span className="text-sm font-bold text-purple-300">
                    {connectionScore}/{totalPossibleScore}
                  </span>
                </div>
                <Progress value={(connectionScore / totalPossibleScore) * 100} className="h-3" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {platforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <Card key={platform.id} className={`relative transition-all duration-200 hover:shadow-lg bg-black/40 backdrop-blur-xl border-purple-500/30 ${
                  platform.isConnected ? 'border-green-400/50 bg-green-900/20' : 'hover:border-purple-400/50'
                }`}>
                  {platform.isPremium && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                      Premium
                    </Badge>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-8 w-8 text-blue-400" />
                        <div>
                          <CardTitle className="text-lg text-white">{platform.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs bg-purple-600/50 text-purple-200">
                            +{platform.value} points
                          </Badge>
                        </div>
                      </div>
                      {platform.isConnected ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-purple-300" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4 min-h-[40px] text-purple-200">
                      {platform.description}
                    </CardDescription>
                    {platform.isConnected ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Connected & syncing
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnect(platform.id)}
                          className="w-full border-purple-500/50 text-purple-200 hover:bg-purple-900/50"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handlePlatformConnect(platform.id)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        variant={platform.isPremium ? "default" : "outline"}
                      >
                        Connect {platform.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <div className="bg-green-900/40 backdrop-blur-sm border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-200 mb-2">Your Privacy is Our Priority</h4>
                  <div className="text-sm text-green-100 space-y-1">
                    <p>• <strong>Secure Connection:</strong> All data transfers use enterprise-grade encryption</p>
                    <p>• <strong>No Data Sale:</strong> We never sell, share, or monetize your personal information</p>
                    <p>• <strong>Platform Permissions:</strong> We only access connection data - never private messages or posts</p>
                    <p>• <strong>Your Control:</strong> Disconnect any platform at any time to remove access</p>
                    <p>• <strong>Data Protection:</strong> Your information is stored securely and used only for connection matching</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6 shadow-sm mb-6">
              <h3 className="font-semibold text-lg mb-2 text-white">Why Connect Multiple Platforms?</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-200">
                <div>
                  <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p><strong className="text-blue-300">More Connections:</strong> Each platform reveals different professional relationships</p>
                </div>
                <div>
                  <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p><strong className="text-green-300">Better Matching:</strong> Comprehensive data leads to stronger introduction paths</p>
                </div>
                <div>
                  <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p><strong className="text-yellow-300">Competitive Edge:</strong> Access connections others can't see</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setOnboardingStep(2)}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Continue to Personal Connections
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-sm text-purple-300 mt-4">
              You can always connect more platforms later from your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Personal Connections
  if (onboardingStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Personal Connections
            </h1>
            <p className="text-lg text-purple-200 mb-6">
              Add personal details to discover even more introduction paths
            </p>
          </div>

          <Card className="mb-8 bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Heart className="mr-2 h-5 w-5 text-red-400" />
                Personal Network Details
              </CardTitle>
              <CardDescription className="text-purple-200">
                These details help find connections through shared experiences and relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="spouse" className="flex items-center text-purple-200">
                    <Heart className="mr-1 h-4 w-4 text-red-400" />
                    Spouse/Partner Name
                  </Label>
                  <Input
                    id="spouse"
                    placeholder="e.g., Sarah Johnson"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.spouse}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, spouse: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hometown" className="flex items-center text-purple-200">
                    <MapPin className="mr-1 h-4 w-4 text-blue-400" />
                    Hometown
                  </Label>
                  <Input
                    id="hometown"
                    placeholder="e.g., Austin, TX"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.hometown}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, hometown: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="flex items-center text-purple-200">
                    <GraduationCap className="mr-1 h-4 w-4 text-green-400" />
                    University/College
                  </Label>
                  <Input
                    id="university"
                    placeholder="e.g., University of Texas"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.university}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, university: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greekLife" className="flex items-center text-purple-200">
                    <Users className="mr-1 h-4 w-4 text-purple-400" />
                    Greek Life
                  </Label>
                  <Input
                    id="greekLife"
                    placeholder="e.g., Sigma Chi, Kappa Alpha Theta"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.greekLife}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, greekLife: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousCompanies" className="flex items-center text-purple-200">
                    <Building2 className="mr-1 h-4 w-4 text-orange-400" />
                    Previous Companies
                  </Label>
                  <Input
                    id="previousCompanies"
                    placeholder="e.g., Microsoft, Google, Apple"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.previousCompanies}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, previousCompanies: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hobbies" className="flex items-center text-purple-200">
                    <Star className="mr-1 h-4 w-4 text-yellow-400" />
                    Hobbies/Interests
                  </Label>
                  <Input
                    id="hobbies"
                    placeholder="e.g., Golf, Tennis, Hiking"
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    value={personalInfo.hobbies}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, hobbies: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-purple-900/40 backdrop-blur-sm rounded-lg p-4 mb-4 border border-purple-500/30">
                <h4 className="font-medium text-purple-100 mb-2">Why this matters</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-200">
                  <div>
                    <strong className="text-blue-300">Shared Experiences:</strong> Find people through common backgrounds like hometown or university
                  </div>
                  <div>
                    <strong className="text-green-300">Family Networks:</strong> Discover connections through spouse's professional network
                  </div>
                  <div>
                    <strong className="text-yellow-300">Interest Groups:</strong> Connect with people who share similar hobbies or affiliations
                  </div>
                </div>
              </div>

              <div className="bg-green-900/40 backdrop-blur-sm border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <h5 className="font-medium text-green-200">Privacy Protection</h5>
                </div>
                <p className="text-sm text-green-100">
                  This personal information is encrypted and used only for connection matching. 
                  It's never shared publicly or sold to third parties. You can edit or remove this data anytime.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={() => setOnboardingStep(3)}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white mr-4"
            >
              Continue to Connection Finder
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              onClick={() => setOnboardingStep(3)}
              variant="outline"
              size="lg"
              className="border-purple-500/50 text-purple-200 hover:bg-purple-900/50"
            >
              Skip for now
            </Button>
            
            <p className="text-sm text-purple-300 mt-4">
              You can always add this information later from your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Connection Finder Demo
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Your Connection Finder is Ready!
          </h1>
          <p className="text-lg text-purple-200">
            Now you can find warm introductions to anyone in your extended network
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Connection Summary</CardTitle>
              <CardDescription className="text-purple-200">Your connected platforms and discovery potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-900/40 backdrop-blur-sm rounded-lg border border-blue-500/30">
                  <span className="font-medium text-blue-200">Connected Platforms</span>
                  <Badge className="bg-blue-600">{connectedPlatforms.size} of {platforms.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-900/40 backdrop-blur-sm rounded-lg border border-green-500/30">
                  <span className="font-medium text-green-200">Discovery Score</span>
                  <Badge className="bg-green-600">{connectionScore}/{totalPossibleScore}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-900/40 backdrop-blur-sm rounded-lg border border-orange-500/30">
                  <span className="font-medium text-orange-200">Estimated Connections</span>
                  <Badge className="bg-orange-600">{Math.floor(connectionScore * 12)} people</Badge>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-medium text-purple-200">Connected Platforms:</h4>
                {platforms.filter(p => p.isConnected).map(platform => {
                  const IconComponent = platform.icon;
                  return (
                    <div key={platform.id} className="flex items-center space-x-3 p-2">
                      <IconComponent className="h-5 w-5 text-blue-400" />
                      <span className="text-sm text-purple-200">{platform.name}</span>
                      <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Next Steps</CardTitle>
              <CardDescription className="text-purple-200">Get started with finding connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start border-purple-500/50 text-purple-200 hover:bg-purple-900/50" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Search for specific people
              </Button>
              <Button className="w-full justify-start border-purple-500/50 text-purple-200 hover:bg-purple-900/50" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Browse company networks
              </Button>
              <Button className="w-full justify-start border-purple-500/50 text-purple-200 hover:bg-purple-900/50" variant="outline">
                <Star className="mr-2 h-4 w-4" />
                Explore connection insights
              </Button>

              <Separator className="my-4" />

              <div className="p-4 bg-blue-900/40 backdrop-blur-sm rounded-lg border border-blue-500/30">
                <h4 className="font-medium text-blue-200 mb-2">Pro Tip</h4>
                <p className="text-sm text-blue-100">
                  The more platforms you connect, the more introduction paths we can discover. 
                  You can always add more platforms from your profile page.
                </p>
              </div>

              <Button 
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => window.location.href = '/connections/search'}
              >
                Start Finding Connections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <PrivacyFooter />
    </div>
  );
}