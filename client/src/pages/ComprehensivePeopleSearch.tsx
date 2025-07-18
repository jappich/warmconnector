import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Users, 
  Shield, 
  Globe, 
  Database, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  User,
  Phone,
  Mail
} from "lucide-react";

interface PersonData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  spouse?: string;
  relatives?: string[];
  employers?: string[];
  education?: string[];
  socialProfiles?: { platform: string; url: string }[];
}

interface UserSuppliedData {
  fraternity?: string;
  hometown?: string;
  mutualFriends?: string[];
  sharedInterests?: string[];
}

interface ConnectionResult {
  source: string;
  evidence: string;
  score: number;
  sourceUrl?: string;
  timestamp: string;
  matchedField: string;
}

interface SearchResult {
  userA_id: string;
  userB_id: string;
  connections: ConnectionResult[];
  top_connection_score: number;
}

export default function ComprehensivePeopleSearch() {
  const [userA, setUserA] = useState<PersonData>({ name: "" });
  const [userB, setUserB] = useState<PersonData>({ name: "" });
  const [userSuppliedData, setUserSuppliedData] = useState<UserSuppliedData>({});
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

  // Check available credentials
  const { data: credentialStatus } = useQuery({
    queryKey: ['/api/connections/check-credentials'],
    refetchOnWindowFocus: false
  });

  // Comprehensive people search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchData: { userA: PersonData; userB: PersonData; userSuppliedData: UserSuppliedData }) => {
      setIsSearching(true);
      setSearchProgress(10);
      
      const response = await fetch('/api/connections/comprehensive-people-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      setSearchProgress(100);
      return response.json();
    },
    onSuccess: () => {
      setIsSearching(false);
      setSearchProgress(0);
    },
    onError: () => {
      setIsSearching(false);
      setSearchProgress(0);
    }
  });

  const handleSearch = () => {
    if (!userA.name || !userB.name) return;
    
    searchMutation.mutate({
      userA,
      userB,
      userSuppliedData
    });
  };

  const updateUserA = (field: keyof PersonData, value: string | string[]) => {
    setUserA(prev => ({ ...prev, [field]: value }));
  };

  const updateUserB = (field: keyof PersonData, value: string | string[]) => {
    setUserB(prev => ({ ...prev, [field]: value }));
  };

  const updateSuppliedData = (field: keyof UserSuppliedData, value: string | string[]) => {
    setUserSuppliedData(prev => ({ ...prev, [field]: value }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSourceIcon = (source: string) => {
    if (source.includes("User-Supplied")) return <User className="h-4 w-4" />;
    if (source.includes("Pipl") || source.includes("Spokeo")) return <Database className="h-4 w-4" />;
    if (source.includes("LinkedIn") || source.includes("GitHub")) return <Briefcase className="h-4 w-4" />;
    if (source.includes("University") || source.includes("Alumni")) return <GraduationCap className="h-4 w-4" />;
    if (source.includes("News") || source.includes("Publication")) return <Globe className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  const searchResult = searchMutation.data as SearchResult;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Comprehensive People Search
        </h1>
        <p className="text-gray-400 text-lg">
          Advanced connection discovery using people finder services, public records, and cross-platform data analysis
        </p>
      </div>

      {/* Credential Status */}
      {credentialStatus && (
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Source Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Available Sources</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OpenAI Analysis
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Public Records
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Social Networks
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Premium Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {credentialStatus.missingCredentials?.includes('PIPL_API_KEY') && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pipl API
                    </Badge>
                  )}
                  {credentialStatus.missingCredentials?.includes('SPOKEO_API_KEY') && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Spokeo API
                    </Badge>
                  )}
                  {credentialStatus.missingCredentials?.includes('WHITEPAGES_API_KEY') && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Whitepages API
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {credentialStatus.missingCredentials?.length > 0 && (
              <Alert className="mt-4 bg-yellow-900/20 border-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-yellow-200">
                  Premium people finder services require API keys for enhanced results. Contact your administrator to enable these data sources.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Person A Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Person A</CardTitle>
            <CardDescription>Enter details for the first person</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userA-name" className="text-gray-300">Full Name *</Label>
              <Input
                id="userA-name"
                value={userA.name}
                onChange={(e) => updateUserA('name', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userA-email" className="text-gray-300">Email</Label>
                <Input
                  id="userA-email"
                  type="email"
                  value={userA.email || ''}
                  onChange={(e) => updateUserA('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="userA-phone" className="text-gray-300">Phone</Label>
                <Input
                  id="userA-phone"
                  value={userA.phone || ''}
                  onChange={(e) => updateUserA('phone', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="userA-spouse" className="text-gray-300">Spouse</Label>
              <Input
                id="userA-spouse"
                value={userA.spouse || ''}
                onChange={(e) => updateUserA('spouse', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="userA-employers" className="text-gray-300">Employers (comma-separated)</Label>
              <Input
                id="userA-employers"
                value={userA.employers?.join(', ') || ''}
                onChange={(e) => updateUserA('employers', e.target.value.split(',').map(s => s.trim()))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Google, Microsoft, Apple"
              />
            </div>
            <div>
              <Label htmlFor="userA-education" className="text-gray-300">Education (comma-separated)</Label>
              <Input
                id="userA-education"
                value={userA.education?.join(', ') || ''}
                onChange={(e) => updateUserA('education', e.target.value.split(',').map(s => s.trim()))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Stanford University, MIT"
              />
            </div>
          </CardContent>
        </Card>

        {/* Person B Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Person B</CardTitle>
            <CardDescription>Enter details for the second person</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userB-name" className="text-gray-300">Full Name *</Label>
              <Input
                id="userB-name"
                value={userB.name}
                onChange={(e) => updateUserB('name', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Sarah Johnson"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userB-email" className="text-gray-300">Email</Label>
                <Input
                  id="userB-email"
                  type="email"
                  value={userB.email || ''}
                  onChange={(e) => updateUserB('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="sarah@example.com"
                />
              </div>
              <div>
                <Label htmlFor="userB-phone" className="text-gray-300">Phone</Label>
                <Input
                  id="userB-phone"
                  value={userB.phone || ''}
                  onChange={(e) => updateUserB('phone', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="userB-spouse" className="text-gray-300">Spouse</Label>
              <Input
                id="userB-spouse"
                value={userB.spouse || ''}
                onChange={(e) => updateUserB('spouse', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Mike Johnson"
              />
            </div>
            <div>
              <Label htmlFor="userB-employers" className="text-gray-300">Employers (comma-separated)</Label>
              <Input
                id="userB-employers"
                value={userB.employers?.join(', ') || ''}
                onChange={(e) => updateUserB('employers', e.target.value.split(',').map(s => s.trim()))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Facebook, Amazon, Netflix"
              />
            </div>
            <div>
              <Label htmlFor="userB-education" className="text-gray-300">Education (comma-separated)</Label>
              <Input
                id="userB-education"
                value={userB.education?.join(', ') || ''}
                onChange={(e) => updateUserB('education', e.target.value.split(',').map(s => s.trim()))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Harvard University, UC Berkeley"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Context */}
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Additional Context</CardTitle>
          <CardDescription>Provide any additional information to enhance connection discovery</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fraternity" className="text-gray-300">Fraternity/Sorority</Label>
            <Input
              id="fraternity"
              value={userSuppliedData.fraternity || ''}
              onChange={(e) => updateSuppliedData('fraternity', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Sigma Alpha Epsilon"
            />
          </div>
          <div>
            <Label htmlFor="hometown" className="text-gray-300">Hometown</Label>
            <Input
              id="hometown"
              value={userSuppliedData.hometown || ''}
              onChange={(e) => updateSuppliedData('hometown', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Springfield, IL"
            />
          </div>
          <div>
            <Label htmlFor="mutualFriends" className="text-gray-300">Mutual Friends (comma-separated)</Label>
            <Input
              id="mutualFriends"
              value={userSuppliedData.mutualFriends?.join(', ') || ''}
              onChange={(e) => updateSuppliedData('mutualFriends', e.target.value.split(',').map(s => s.trim()))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Alex Brown, Lisa Davis"
            />
          </div>
          <div>
            <Label htmlFor="sharedInterests" className="text-gray-300">Shared Interests (comma-separated)</Label>
            <Input
              id="sharedInterests"
              value={userSuppliedData.sharedInterests?.join(', ') || ''}
              onChange={(e) => updateSuppliedData('sharedInterests', e.target.value.split(',').map(s => s.trim()))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="AI, Machine Learning, Tennis"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Button */}
      <div className="mb-6">
        <Button
          onClick={handleSearch}
          disabled={!userA.name || !userB.name || isSearching}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          size="lg"
        >
          {isSearching ? (
            <>
              <Clock className="h-5 w-5 mr-2 animate-spin" />
              Searching All Data Sources...
            </>
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Find Connections
            </>
          )}
        </Button>
        
        {isSearching && (
          <div className="mt-4">
            <Progress value={searchProgress} className="w-full" />
            <p className="text-sm text-gray-400 mt-2 text-center">
              Searching people finder services, public records, and social networks...
            </p>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResult && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Connection Discovery Results
            </CardTitle>
            <CardDescription>
              Found {searchResult.connections.length} connections with top score of {(searchResult.top_connection_score * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResult.connections.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No connections found between these individuals.</p>
                <p className="text-sm mt-2">Try providing additional context or contact information.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResult.connections.map((connection, index) => (
                  <div key={index} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(connection.source)}
                        <span className="font-semibold text-white">{connection.source}</span>
                        <Badge 
                          className={`${getScoreColor(connection.score)} text-white text-xs`}
                        >
                          {(connection.score * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">
                        {connection.matchedField}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-2">{connection.evidence}</p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(connection.timestamp).toLocaleString()}
                      </span>
                      {connection.sourceUrl && (
                        <a 
                          href={connection.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {searchMutation.error && (
        <Alert className="mt-6 bg-red-900/20 border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            Search failed: {searchMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}