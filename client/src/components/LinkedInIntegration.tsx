import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Linkedin, 
  Users, 
  Building2, 
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface LinkedInAssistant {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  connectionDegree: number;
  mutualConnections?: number;
}

export default function LinkedInIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [executiveName, setExecutiveName] = useState('');
  const [discoveredAssistants, setDiscoveredAssistants] = useState<LinkedInAssistant[]>([]);

  const connectLinkedInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/linkedin/auth-url');
      const data = await response.json();
      
      if (data.success) {
        // Open LinkedIn auth in new window
        window.open(data.authUrl, 'linkedin-auth', 'width=600,height=600');
        return data;
      }
      throw new Error(data.error);
    },
    onSuccess: () => {
      // Listen for auth completion
      const checkAuth = setInterval(() => {
        // In production, you'd check with your backend for auth completion
        // For demo, we'll simulate success after 3 seconds
        setTimeout(() => {
          setIsConnected(true);
          clearInterval(checkAuth);
        }, 3000);
      }, 1000);
    }
  });

  const discoverAssistantsMutation = useMutation({
    mutationFn: async ({ companyName, executiveName }: { companyName: string; executiveName?: string }) => {
      const response = await fetch('/api/linkedin/discover-assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, executiveName })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setDiscoveredAssistants(data.assistants);
      }
    }
  });

  const handleDiscoverAssistants = () => {
    if (companyName) {
      discoverAssistantsMutation.mutate({ 
        companyName, 
        executiveName: executiveName || undefined 
      });
    }
  };

  const getConnectionBadgeColor = (degree: number) => {
    switch (degree) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* LinkedIn Connection Status */}
      <Card className="bg-cosmic-card border-cosmic-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-text">
            <Linkedin className="h-5 w-5 text-blue-600" />
            LinkedIn Integration
          </CardTitle>
          <CardDescription className="text-cosmic-muted">
            Connect your LinkedIn account to discover executive assistants and professional relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cosmic-muted">
                <AlertCircle className="h-4 w-4" />
                <span>LinkedIn account not connected</span>
              </div>
              <Button 
                onClick={() => connectLinkedInMutation.mutate()}
                disabled={connectLinkedInMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                {connectLinkedInMutation.isPending ? 'Connecting...' : 'Connect LinkedIn'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>LinkedIn account connected successfully</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Executive Assistant Discovery */}
      {isConnected && (
        <Card className="bg-cosmic-card border-cosmic-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cosmic-text">
              <Users className="h-5 w-5 text-cosmic-accent" />
              Executive Assistant Discovery
            </CardTitle>
            <CardDescription className="text-cosmic-muted">
              Find executive assistants for target companies and executives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-cosmic-text">Company Name</label>
                <Input
                  placeholder="e.g., Microsoft, Google, Apple"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-cosmic-text">Executive Name (Optional)</label>
                <Input
                  placeholder="e.g., Satya Nadella"
                  value={executiveName}
                  onChange={(e) => setExecutiveName(e.target.value)}
                  className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleDiscoverAssistants}
              disabled={!companyName || discoverAssistantsMutation.isPending}
              className="bg-cosmic-primary hover:bg-cosmic-primary/80"
            >
              {discoverAssistantsMutation.isPending ? 'Discovering...' : 'Discover Assistants'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Discovered Assistants */}
      {discoveredAssistants.length > 0 && (
        <Card className="bg-cosmic-card border-cosmic-border">
          <CardHeader>
            <CardTitle className="text-cosmic-text">Discovered Executive Assistants</CardTitle>
            <CardDescription className="text-cosmic-muted">
              Found {discoveredAssistants.length} potential executive assistants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {discoveredAssistants.map((assistant) => (
                <div key={assistant.id} className="border border-cosmic-border rounded-lg p-4 bg-cosmic-dark/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-cosmic-text">
                          {assistant.firstName} {assistant.lastName}
                        </h3>
                        <Badge className={getConnectionBadgeColor(assistant.connectionDegree)}>
                          {assistant.connectionDegree === 1 ? '1st' : assistant.connectionDegree === 2 ? '2nd' : '3rd'} degree
                        </Badge>
                      </div>
                      <p className="text-sm text-cosmic-muted">{assistant.headline}</p>
                      {assistant.mutualConnections && assistant.mutualConnections > 0 && (
                        <div className="text-sm text-cosmic-text">
                          <Users className="inline h-3 w-3 mr-1" />
                          {assistant.mutualConnections} mutual connections
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        High Impact
                      </Badge>
                      <Button size="sm" variant="outline" className="border-cosmic-border text-cosmic-text">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Benefits */}
      <Card className="bg-cosmic-card border-cosmic-border">
        <CardHeader>
          <CardTitle className="text-cosmic-text">LinkedIn Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cosmic-accent" />
                <span className="font-medium text-cosmic-text">Executive Access</span>
              </div>
              <p className="text-sm text-cosmic-muted">
                Identify executive assistants for direct C-suite access
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cosmic-accent" />
                <span className="font-medium text-cosmic-text">Company Insights</span>
              </div>
              <p className="text-sm text-cosmic-muted">
                Discover org charts and reporting relationships
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cosmic-accent" />
                <span className="font-medium text-cosmic-text">Professional Networks</span>
              </div>
              <p className="text-sm text-cosmic-muted">
                Map industry connections and alumni networks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}