import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Linkedin, 
  Twitter, 
  Github, 
  Mail, 
  CheckCircle, 
  ExternalLink,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { SiSalesforce, SiHubspot, SiGoogle } from 'react-icons/si';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  value: number;
  color: string;
  isConnected: boolean;
  isPremium?: boolean;
  connectionCount?: number;
}

interface SocialIntegrationWizardProps {
  onComplete?: () => void;
}

export default function SocialIntegrationWizard({ onComplete }: SocialIntegrationWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const platforms: SocialPlatform[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      description: 'Professional network & career history',
      value: 35,
      color: 'bg-blue-600',
      isConnected: connectedPlatforms.has('linkedin'),
      connectionCount: 847
    },
    {
      id: 'google',
      name: 'Google Contacts',
      icon: SiGoogle,
      description: 'Email contacts & Gmail network',
      value: 25,
      color: 'bg-red-500',
      isConnected: connectedPlatforms.has('google'),
      connectionCount: 1243
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      icon: SiSalesforce,
      description: 'CRM contacts & business relationships',
      value: 30,
      color: 'bg-blue-500',
      isConnected: connectedPlatforms.has('salesforce'),
      isPremium: true,
      connectionCount: 524
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: SiHubspot,
      description: 'Marketing contacts & company data',
      value: 20,
      color: 'bg-orange-500',
      isConnected: connectedPlatforms.has('hubspot'),
      isPremium: true,
      connectionCount: 362
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Developer network & collaborators',
      value: 15,
      color: 'bg-gray-800',
      isConnected: connectedPlatforms.has('github'),
      connectionCount: 158
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: Twitter,
      description: 'Professional Twitter connections',
      value: 12,
      color: 'bg-black',
      isConnected: connectedPlatforms.has('twitter'),
      connectionCount: 932
    }
  ];

  const connectPlatformMutation = useMutation({
    mutationFn: async (platformId: string) => {
      // Simulate OAuth flow
      const response = await apiRequest('/api/social/connect', {
        method: 'POST',
        body: JSON.stringify({
          platform: platformId,
          accessToken: `demo_token_${platformId}`,
          profileData: { connected: true }
        })
      });
      return response;
    },
    onSuccess: (data, platformId) => {
      setConnectedPlatforms(prev => new Set([...prev, platformId]));
      toast({
        title: "Connected Successfully!",
        description: `${platforms.find(p => p.id === platformId)?.name} has been connected to your account.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/social-accounts'] });
    },
    onError: (error, platformId) => {
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${platforms.find(p => p.id === platformId)?.name}. Please try again.`,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setConnecting(null);
    }
  });

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    // Simulate OAuth redirect flow
    setTimeout(() => {
      connectPlatformMutation.mutate(platformId);
    }, 1500);
  };

  const completedCount = connectedPlatforms.size;
  const totalValue = platforms.filter(p => connectedPlatforms.has(p.id)).reduce((sum, p) => sum + p.value, 0);
  const maxValue = platforms.reduce((sum, p) => sum + p.value, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Zap className="mr-2 h-4 w-4" />
          Connect Social Accounts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            One-Click Social Integration
          </DialogTitle>
          <p className="text-muted-foreground">
            Connect your social accounts to unlock powerful connection discovery
          </p>
        </DialogHeader>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Connection Discovery Score</h3>
                <p className="text-blue-700 text-sm">More connections = better introduction paths</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{totalValue}/{maxValue}</div>
                <div className="text-sm text-blue-600">{completedCount}/{platforms.length} connected</div>
              </div>
            </div>
            <Progress value={(totalValue / maxValue) * 100} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {platforms.filter(p => connectedPlatforms.has(p.id)).reduce((sum, p) => sum + (p.connectionCount || 0), 0).toLocaleString()} contacts
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {Math.round((totalValue / maxValue) * 100)}% coverage
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Secure OAuth</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const IconComponent = platform.icon;
            const isConnecting = connecting === platform.id;
            const isConnected = connectedPlatforms.has(platform.id);

            return (
              <Card 
                key={platform.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isConnected 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {platform.isPremium && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                    Premium
                  </Badge>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            +{platform.value} points
                          </Badge>
                          {platform.connectionCount && (
                            <Badge variant="outline" className="text-xs">
                              ~{platform.connectionCount.toLocaleString()} contacts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isConnected && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {platform.description}
                  </p>
                  
                  {!isConnected ? (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="w-full"
                      variant={isConnecting ? "outline" : "default"}
                    >
                      {isConnecting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Connect {platform.name}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center p-2 bg-green-100 text-green-800 rounded-lg">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Connected Successfully
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {completedCount > 0 ? (
              `Great! You've connected ${completedCount} platform${completedCount === 1 ? '' : 's'}.`
            ) : (
              'Connect at least LinkedIn and Google for best results.'
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            {completedCount >= 2 && (
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onComplete?.();
                  toast({
                    title: "Setup Complete!",
                    description: "You're ready to find warm introductions through your network.",
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}