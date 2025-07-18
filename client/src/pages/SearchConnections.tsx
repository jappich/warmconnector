import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, ArrowRight, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PathNode {
  id: string;
  name: string;
  company?: string;
  title?: string;
  relationshipType?: string;
}

interface IntroductionPath {
  path: PathNode[];
  hops: number;
  totalStrength: number;
}

interface PathSearchResponse {
  paths: IntroductionPath[];
}

export default function SearchConnections() {
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [selectedPath, setSelectedPath] = useState<IntroductionPath | null>(null);
  const [messageTemplate, setMessageTemplate] = useState('');
  const { toast } = useToast();

  // Search for introduction paths
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch: searchPaths
  } = useQuery({
    queryKey: ['intro-paths', targetName, targetCompany],
    queryFn: async (): Promise<PathSearchResponse> => {
      if (!targetName.trim()) {
        return { paths: [] };
      }

      const response = await fetch('/api/find-intro-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetName: targetName.trim(),
          targetCompany: targetCompany.trim() || undefined
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { paths: [] };
        }
        throw new Error('Failed to find introduction paths');
      }

      return response.json();
    },
    enabled: false // Manual trigger
  });

  // Request introduction mutation
  const requestIntroMutation = useMutation({
    mutationFn: async ({ path, messageTemplate }: { path: string[], messageTemplate: string }) => {
      const response = await fetch('/api/request-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, messageTemplate }),
      });

      if (!response.ok) {
        throw new Error('Failed to send introduction request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Introduction Request Sent!",
        description: `Your request has been sent successfully. Request ID: ${data.requestId}`,
      });
      setSelectedPath(null);
      setMessageTemplate('');
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send introduction request",
        variant: "destructive",
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetName.trim()) {
      searchPaths();
    }
  };

  const handleRequestIntro = () => {
    if (!selectedPath || !messageTemplate.trim()) return;

    const pathIds = selectedPath.path.map(node => node.id);
    requestIntroMutation.mutate({
      path: pathIds,
      messageTemplate: messageTemplate.trim()
    });
  };

  const getRelationshipBadgeColor = (type?: string) => {
    switch (type) {
      case 'coworker': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'college': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'family': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'friend': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Users className="mr-3 h-8 w-8 text-blue-400" />
          Find Introduction Paths
        </h1>
        <p className="text-gray-400">
          Search for warm introductions to anyone in your extended network
        </p>
      </div>

      {/* Search Form */}
      <Card className="bg-gray-800/50 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Search for Target Person</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetName" className="text-gray-300">
                  Target Name *
                </Label>
                <Input
                  id="targetName"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g. Tim Cook"
                  className="bg-gray-900/50 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="targetCompany" className="text-gray-300">
                  Target Company (Optional)
                </Label>
                <Input
                  id="targetCompany"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Apple Inc"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!targetName.trim() || isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? 'Searching...' : 'Find Introduction Paths'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {searchResults.paths.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg mb-2">No introduction paths found</p>
                  <p className="text-sm">
                    Try searching for a different person or check if they're in your network
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Found {searchResults.paths.length} Introduction Path{searchResults.paths.length !== 1 ? 's' : ''}
              </h2>
              
              {searchResults.paths.map((introPath, index) => (
                <Card 
                  key={index} 
                  className={`bg-gray-800/50 border-gray-700 transition-all cursor-pointer hover:border-blue-500/50 ${
                    selectedPath === introPath ? 'border-blue-500 bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedPath(introPath)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-gray-300">
                        {introPath.hops} hop{introPath.hops !== 1 ? 's' : ''} • Strength: {introPath.totalStrength}
                      </Badge>
                      {selectedPath === introPath && (
                        <CheckCircle className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    
                    {/* Path Visualization */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      {introPath.path.map((node, nodeIndex) => (
                        <React.Fragment key={node.id}>
                          <div className="flex-shrink-0 text-center">
                            <div className="bg-gray-700 rounded-lg p-3 min-w-[120px]">
                              <p className="font-medium text-white text-sm">{node.name}</p>
                              {node.title && (
                                <p className="text-xs text-gray-400">{node.title}</p>
                              )}
                              {node.company && (
                                <p className="text-xs text-gray-500">{node.company}</p>
                              )}
                              {node.relationshipType && (
                                <Badge 
                                  className={`mt-1 text-xs ${getRelationshipBadgeColor(node.relationshipType)}`}
                                >
                                  {node.relationshipType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {nodeIndex < introPath.path.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Request Introduction Form */}
      {selectedPath && (
        <Card className="bg-gray-800/50 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Send className="mr-2 h-5 w-5" />
              Request Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="messageTemplate" className="text-gray-300">
                Custom Message Template *
              </Label>
              <Textarea
                id="messageTemplate"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Hi [Contact Name], I hope you're doing well! I'm reaching out because I'm hoping to connect with [Target Name] at [Target Company]. Would you be comfortable making an introduction? I'm interested in [reason for connection]. Thanks so much!"
                className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                required
              />
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div className="text-sm text-gray-400">
              <p className="mb-2">Your introduction request will be sent to:</p>
              <p className="font-medium text-white">
                {selectedPath.path[1]?.name} ({selectedPath.path[1]?.title})
              </p>
            </div>
            
            <Button
              onClick={handleRequestIntro}
              disabled={!messageTemplate.trim() || requestIntroMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {requestIntroMutation.isPending ? 'Sending...' : 'Send Introduction Request'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {searchError && (
        <Card className="bg-red-900/20 border-red-500/50 mt-8">
          <CardContent className="p-4">
            <p className="text-red-400">
              Error: {searchError.message || 'Failed to search for introduction paths'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}