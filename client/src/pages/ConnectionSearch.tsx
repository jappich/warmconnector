import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, MapPin, Building, ArrowRight, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ConnectionPath {
  target: {
    name: string;
    title: string;
    company: string;
    profileUrl?: string;
  };
  path: Array<{
    name: string;
    title: string;
    company: string;
    relationshipType: string;
  }>;
  pathLength: number;
  connectionStrength: number;
  platforms: string[];
}

export default function ConnectionSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [searchResults, setSearchResults] = useState<ConnectionPath[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's connected platforms
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['/api/user/social-accounts'],
    enabled: true
  });

  const searchMutation = useMutation({
    mutationFn: async (searchData: { query: string; company?: string }) => {
      const response = await fetch('/api/connections/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.results || []);
      setIsSearching(false);
      if (data.results?.length === 0) {
        toast({
          title: "No connections found",
          description: "Try connecting more platforms or searching for different people",
        });
      }
    },
    onError: () => {
      setIsSearching(false);
      toast({
        title: "Search failed",
        description: "Unable to search connections. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a person's name to search for connections",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    searchMutation.mutate({
      query: searchQuery,
      company: targetCompany || undefined
    });
  };

  const requestIntroduction = useMutation({
    mutationFn: async (pathData: ConnectionPath) => {
      const response = await fetch('/api/introduction/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: pathData.target.name,
          targetCompany: pathData.target.company,
          pathLength: pathData.pathLength,
          introductionPath: pathData.path
        })
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Introduction requested!",
        description: "We'll help facilitate this connection for you.",
      });
    }
  });

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-blue-500';
    if (strength >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Very Strong';
    if (strength >= 60) return 'Strong';
    if (strength >= 40) return 'Moderate';
    return 'Weak';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Find Warm Connections
          </h1>
          <p className="text-purple-200">
            Search for anyone and discover introduction paths through your network
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Connection Search
            </CardTitle>
            <CardDescription>
              Enter a person's name and optionally their company to find introduction paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Enter person's name (e.g., John Smith)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Input
                  placeholder="Company (optional)"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Searching across {socialAccounts.length} connected platforms</span>
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? 'Searching...' : 'Find Connections'}
                <Search className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Platforms Status */}
        {socialAccounts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialAccounts.map((account: any) => (
                  <Badge key={account.platform} variant="secondary" className="flex items-center space-x-1">
                    <span>{account.platform}</span>
                    <span className="text-xs">({account.connectionCount || 0} connections)</span>
                  </Badge>
                ))}
              </div>
              {socialAccounts.length < 3 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Connect more platforms to discover additional introduction paths.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Connection Paths Found ({searchResults.length})
              </h2>
            </div>

            {searchResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{result.target.name}</span>
                        {result.target.profileUrl && (
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {result.target.title} at {result.target.company}
                        </span>
                        <Badge className={`text-white ${getStrengthColor(result.connectionStrength)}`}>
                          {getStrengthLabel(result.connectionStrength)} Connection
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-2">
                        {result.pathLength} degree{result.pathLength !== 1 ? 's' : ''} of separation
                      </div>
                      <Button 
                        onClick={() => requestIntroduction.mutate(result)}
                        disabled={requestIntroduction.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Request Introduction
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Introduction Path:</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50">You</Badge>
                        {result.path.map((person, pathIndex) => (
                          <React.Fragment key={pathIndex}>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge variant="outline" className="bg-gray-50">
                              <div className="text-center">
                                <div className="font-medium">{person.name}</div>
                                <div className="text-xs text-gray-500">
                                  {person.title} • {person.relationshipType}
                                </div>
                              </div>
                            </Badge>
                          </React.Fragment>
                        ))}
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {result.target.name}
                        </Badge>
                      </div>
                    </div>

                    {result.platforms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Found via platforms:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.platforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to find connections
              </h3>
              <p className="text-gray-500 mb-6">
                Enter someone's name above to discover warm introduction paths through your network
              </p>
              {socialAccounts.length === 0 && (
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-700">
                    <strong>Get started:</strong> Connect your social platforms to unlock powerful connection discovery
                  </p>
                  <Button 
                    className="mt-3" 
                    variant="outline"
                    onClick={() => window.location.href = '/onboarding'}
                  >
                    Connect Platforms
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}