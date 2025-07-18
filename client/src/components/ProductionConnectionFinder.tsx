import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Users, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Building, 
  GraduationCap, 
  Heart, 
  Briefcase,
  Loader2,
  Send,
  MessageSquare,
  ExternalLink,
  Network,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ConnectionNode {
  id: string;
  name: string;
  title?: string;
  company?: string;
  relationshipType: string;
  linkedin?: string;
  email?: string;
}

interface ConnectionPath {
  path: ConnectionNode[];
  hops: number;
  totalStrength: number;
  strengthFactors: {
    directStrength: number;
    mutualConnections: number;
    companyAlignment: number;
    locationAlignment: number;
    platformDiversity: number;
  };
  aiInsights?: string;
}

interface ConnectionResult {
  found: boolean;
  paths: ConnectionPath[];
  smartMatches: any[];
  totalResults: number;
  processingTime: number;
  strategy: string;
  source: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: string;
  };
}

interface IntroductionRequest {
  requesterId: string;
  connectorId: string;
  targetId: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
}

const RelationIcons = {
  coworker: <Briefcase className="h-4 w-4" />,
  classmate: <GraduationCap className="h-4 w-4" />,
  family: <Heart className="h-4 w-4" />,
  friend: <Users className="h-4 w-4" />,
  colleague: <Building className="h-4 w-4" />,
  default: <Network className="h-4 w-4" />
};

export default function ProductionConnectionFinder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [searchResults, setSearchResults] = useState<ConnectionResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPath, setSelectedPath] = useState<ConnectionPath | null>(null);
  const [introMessage, setIntroMessage] = useState('');
  const [isSendingIntro, setIsSendingIntro] = useState(false);

  // Enhanced search with comprehensive error handling and loading states
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a name or company to search for connections.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSelectedPath(null);

    try {
      const searchParams = new URLSearchParams({
        query: searchQuery.trim(),
        ...(targetCompany && { company: targetCompany.trim() })
      });

      const response = await fetch(`/api/find-connections?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: `You've reached the 10 searches per minute limit. Please wait ${data.retryAfter || 60} seconds.`,
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data);

      if (!data.found || data.paths.length === 0) {
        toast({
          title: "No warm connections found",
          description: "We couldn't find any introduction paths to this person. Try expanding your search or connecting with mutual contacts first.",
        });
      } else {
        toast({
          title: "Connections found!",
          description: `Found ${data.paths.length} introduction path${data.paths.length > 1 ? 's' : ''} in ${data.processingTime}ms`,
        });
      }

    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Enhanced introduction request with email sending
  const handleRequestIntroduction = async (path: ConnectionPath) => {
    if (!introMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please write a message explaining why you'd like to be introduced.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingIntro(true);

    try {
      const connector = path.path[1]; // The person who will make the introduction
      const target = path.path[path.path.length - 1]; // The person we want to meet

      const requestData = {
        requesterId: 'current-user', // Would be from auth context
        connectorId: connector.id,
        targetId: target.id,
        message: introMessage,
        path: path.path.map(node => ({
          id: node.id,
          name: node.name,
          title: node.title,
          company: node.company
        }))
      };

      const response = await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send introduction request');
      }

      toast({
        title: "Introduction request sent!",
        description: `Your request has been sent to ${connector.name}. They'll receive an email with your message.`,
      });

      // Log the request
      queryClient.invalidateQueries({ queryKey: ['introduction-requests'] });
      
      setIntroMessage('');
      setSelectedPath(null);

    } catch (error: any) {
      console.error('Introduction request error:', error);
      toast({
        title: "Failed to send request",
        description: error.message || "Could not send the introduction request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingIntro(false);
    }
  };

  const getRelationIcon = (relationType: string) => {
    return RelationIcons[relationType as keyof typeof RelationIcons] || RelationIcons.default;
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600 bg-green-100';
    if (strength >= 60) return 'text-blue-600 bg-blue-100';
    if (strength >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderConnectionPath = (path: ConnectionPath, index: number) => (
    <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer"
          onClick={() => setSelectedPath(path)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-sm text-slate-500">Path {index + 1}</span>
              <Badge className={`ml-2 ${getStrengthColor(path.totalStrength)}`}>
                {path.totalStrength}% strength
              </Badge>
            </CardTitle>
            <CardDescription>
              {path.hops} hop{path.hops > 1 ? 's' : ''} • {path.strengthFactors.mutualConnections} mutual connections
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hover:bg-blue-50">
            Request Intro
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          {path.path.map((node, nodeIndex) => (
            <div key={nodeIndex} className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      {getRelationIcon(node.relationshipType)}
                      <div className="text-sm">
                        <div className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                          {node.name}
                        </div>
                        {node.title && <div className="text-xs text-slate-500">{node.title}</div>}
                      </div>
                      {node.linkedin && (
                        <ExternalLink className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">{node.name}</div>
                      {node.title && <div>{node.title}</div>}
                      {node.company && <div>{node.company}</div>}
                      <div className="text-xs text-slate-400 mt-1">
                        Relationship: {node.relationshipType}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {nodeIndex < path.path.length - 1 && (
                <ArrowRight className="h-4 w-4 text-slate-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {path.aiInsights && (
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>AI Suggestion:</strong> {path.aiInsights}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Find Warm Connections</h1>
        <p className="text-purple-200">Discover introduction paths to anyone in your extended network</p>
      </div>

      {/* Search Form */}
      <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Search className="h-5 w-5" />
            Search for Connections
          </CardTitle>
          <CardDescription className="text-purple-200">
            Enter a person's name or company to find introduction paths through your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search-query" className="text-purple-200">Person or Company Name *</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., John Smith, Google, Sarah Johnson"
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="target-company" className="text-purple-200">Target Company (optional)</Label>
              <Input
                id="target-company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g., Microsoft, Tesla"
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md transition-all duration-200"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find Connections
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-slate-900">
              Search Results
            </h2>
            <div className="text-sm text-slate-500 flex items-center gap-4">
              <span>Found in {searchResults.processingTime}ms</span>
              <Badge variant="outline">{searchResults.source}</Badge>
              {searchResults.rateLimitInfo && (
                <Badge variant="secondary">
                  {searchResults.rateLimitInfo.remaining} searches remaining
                </Badge>
              )}
            </div>
          </div>

          {searchResults.found && searchResults.paths.length > 0 ? (
            <div className="space-y-4">
              {searchResults.paths.map((path, index) => renderConnectionPath(path, index))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No warm connections found for "{searchQuery}". Consider:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Checking the spelling of the name</li>
                  <li>Trying a company search instead</li>
                  <li>Expanding your network by connecting with mutual contacts</li>
                  <li>Using LinkedIn to find common connections</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Introduction Request Modal */}
      {selectedPath && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Request Introduction
            </CardTitle>
            <CardDescription>
              Send a request to {selectedPath.path[1]?.name} to introduce you to {selectedPath.path[selectedPath.path.length - 1]?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="intro-message">Your Message *</Label>
              <textarea
                id="intro-message"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder="Hi [Connector], I'd love to connect with [Target] because..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px]"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                Be specific about why you want to connect and how you know each other.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => handleRequestIntroduction(selectedPath)}
                disabled={isSendingIntro || !introMessage.trim()}
                className="hover:shadow-md transition-all duration-200"
              >
                {isSendingIntro ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPath(null)}
                className="hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}