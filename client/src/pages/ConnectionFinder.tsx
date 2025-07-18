import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  ArrowRight, 
  UserCheck, 
  Building2, 
  GraduationCap, 
  Home, 
  Heart,
  Loader2,
  Send,
  CheckCircle
} from 'lucide-react';

interface ConnectionPath {
  path: string[];
  hops: number;
  totalStrength: number;
  relationshipTypes?: string[];
  details?: {
    name: string;
    company: string;
    title: string;
    location?: string;
    platforms: any;
    confidence: number;
  };
}

export default function ConnectionFinder() {
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ConnectionPath[]>([]);
  const [introMessage, setIntroMessage] = useState('');
  const [requestingIntro, setRequestingIntro] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!targetName.trim()) {
      toast({
        title: "Target name required",
        description: "Please enter the name of the person you want to connect with.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/connections/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: targetName.trim(),
          targetCompany: targetCompany.trim() || undefined
        })
      });

      const data = await response.json();
      
      if (data.paths && data.paths.length > 0) {
        setSearchResults(data.paths);
        toast({
          title: "Connection paths found",
          description: `Found ${data.paths.length} potential introduction paths.`
        });
      } else {
        setSearchResults([]);
        toast({
          title: "No connections found",
          description: "Try adding more profile data or check the spelling of the name.",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for connections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestIntro = async (pathIndex: number) => {
    const path = searchResults[pathIndex];
    if (!path) return;

    setRequestingIntro(pathIndex);
    try {
      const response = await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: path.path,
          message: introMessage || 'Could you please connect us? I would appreciate an introduction.'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Introduction requested",
          description: "Your introduction request has been sent successfully."
        });
        setIntroMessage('');
      } else {
        toast({
          title: "Request failed",
          description: data.message || "Failed to send introduction request.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Request intro error:', error);
      toast({
        title: "Request failed",
        description: "Unable to send introduction request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRequestingIntro(null);
    }
  };

  const getRelationshipIcon = (relType: string) => {
    switch (relType?.toLowerCase()) {
      case 'coworker':
        return <Building2 className="h-4 w-4" />;
      case 'school':
      case 'education':
        return <GraduationCap className="h-4 w-4" />;
      case 'family':
        return <Heart className="h-4 w-4" />;
      case 'hometown':
        return <Home className="h-4 w-4" />;
      case 'fraternity':
      case 'social':
        return <Users className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-600 bg-green-50';
    if (strength >= 0.6) return 'text-blue-600 bg-blue-50';
    if (strength >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Find Warm Connections
          </h1>
          <p className="text-purple-200">
            Discover introduction paths through your professional network
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
                <Label htmlFor="targetName">Target Person Name *</Label>
                <Input
                  id="targetName"
                  placeholder="Enter person's name (e.g., John Smith)"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Label htmlFor="targetCompany">Company (optional)</Label>
                <Input
                  id="targetCompany"
                  placeholder="Company name"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !targetName.trim()}
              className="w-full md:w-auto"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching network...
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
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Connection Paths Found ({searchResults.length})
              </h2>
            </div>
            
            {searchResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="text-sm">
                        {result.hops} hop{result.hops !== 1 ? 's' : ''}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-sm ${getStrengthColor(result.totalStrength)}`}
                      >
                        {Math.round(result.totalStrength * 100)}% strength
                      </Badge>
                    </div>
                  </div>

                  {/* Path Visualization */}
                  <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
                    {result.path.map((personId, personIndex) => (
                      <React.Fragment key={personIndex}>
                        <div className="flex items-center space-x-2 min-w-fit">
                          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border">
                            {personIndex === 0 && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {personIndex === result.path.length - 1 && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            <span className="text-sm font-medium">
                              {personIndex === 0 ? 'You' : 
                               personIndex === result.path.length - 1 ? targetName : 
                               `Person ${personId}`}
                            </span>
                          </div>
                        </div>
                        {personIndex < result.path.length - 1 && (
                          <div className="flex items-center space-x-1">
                            {getRelationshipIcon(result.relationshipTypes?.[personIndex] || 'connection')}
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Introduction Request Section */}
                  <div className="border-t pt-4">
                    <div className="mb-3">
                      <Label htmlFor={`message-${index}`}>
                        Introduction Message (optional)
                      </Label>
                      <Textarea
                        id={`message-${index}`}
                        placeholder="Add a personal message for your introduction request..."
                        value={introMessage}
                        onChange={(e) => setIntroMessage(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={() => handleRequestIntro(index)}
                      disabled={requestingIntro === index}
                      className="w-full md:w-auto"
                    >
                      {requestingIntro === index ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending request...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Request Introduction
                        </>
                      )}
                    </Button>
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
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> More connected profiles lead to better introduction paths. 
                  Make sure your social platforms are connected in settings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <strong>Privacy Protected:</strong> WarmConnector takes user privacy and information 
              very seriously and will never give this info out. All introduction requests are sent 
              securely and only facilitate connections between willing participants.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}