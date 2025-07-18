import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConnectionStrengthIndicator from '@/components/ConnectionStrengthIndicator';
import { 
  Search,
  Users,
  Building2,
  Route,
  Star,
  ArrowRight,
  MapPin,
  Briefcase,
  GraduationCap,
  Target,
  Network,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanyNetworkFinder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [connectionPaths, setConnectionPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get company employee data from Okta onboarding
  const { data: companyEmployees } = useQuery({
    queryKey: ['/api/company/employees']
  });

  // Company network analytics
  const { data: networkStats } = useQuery({
    queryKey: ['/api/analytics/company-network']
  });

  const findConnectionPaths = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the name of the person you want to connect with"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Search through company network for connection paths
      const response = await fetch('/api/connections/find-company-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: searchQuery,
          targetCompany: targetCompany || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionPaths(data.paths || []);
        setSearchResults(data.potentialMatches || []);
        
        toast({
          title: "Connection Paths Found",
          description: `Discovered ${data.paths?.length || 0} potential connection routes`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Search Failed",
          description: error.message || "Could not find connection paths",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search company network",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const requestIntroduction = async (pathIndex) => {
    try {
      const path = connectionPaths[pathIndex];
      const response = await fetch('/api/introduction/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPersonId: path.target.id,
          introducerPersonId: path.introducer.id,
          message: `I'd like to connect with ${path.target.name} regarding professional opportunities.`
        })
      });

      if (response.ok) {
        toast({
          title: "Introduction Requested",
          description: `Request sent through ${path.introducer.name}`
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Could not send introduction request",
        variant: "destructive"
      });
    }
  };

  const getPathStrengthColor = (strength) => {
    if (strength >= 80) return 'text-green-400';
    if (strength >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPathTypeIcon = (pathType) => {
    switch (pathType) {
      case 'direct': return <Users className="h-4 w-4" />;
      case 'colleague': return <Building2 className="h-4 w-4" />;
      case 'alumni': return <GraduationCap className="h-4 w-4" />;
      case 'industry': return <Briefcase className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Company Network Finder</h1>
        <p className="text-gray-400">
          Find connections to anyone through your company's professional network
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="search">Find Connection</TabsTrigger>
          <TabsTrigger value="network">Company Network</TabsTrigger>
          <TabsTrigger value="analytics">Network Analytics</TabsTrigger>
        </TabsList>

        {/* Connection Search */}
        <TabsContent value="search">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Find Your Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target-name" className="text-gray-300">Person's Name</Label>
                    <Input
                      id="target-name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="John Smith"
                      className="bg-gray-900/50 border-gray-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && findConnectionPaths()}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="target-company" className="text-gray-300">Target Company (Optional)</Label>
                    <Input
                      id="target-company"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="Microsoft"
                      className="bg-gray-900/50 border-gray-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && findConnectionPaths()}
                    />
                  </div>
                </div>

                <Button 
                  onClick={findConnectionPaths}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Searching Company Network...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Find Connection Paths
                    </>
                  )}
                </Button>

                {/* Connection Paths Results */}
                {connectionPaths.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">Connection Paths Found</h3>
                    {connectionPaths.map((path, index) => (
                      <Card key={index} className="bg-gray-900/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getPathTypeIcon(path.type)}
                              <Badge variant="outline" className="text-xs">
                                {path.hops} hop{path.hops !== 1 ? 's' : ''}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPathStrengthColor(path.strength)}`}
                              >
                                {path.strength}% strength
                              </Badge>
                            </div>
                            <Button 
                              onClick={() => requestIntroduction(index)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Request Introduction
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">You</span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {path.introducer?.name?.charAt(0) || 'I'}
                                </span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {path.target?.name?.charAt(0) || 'T'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <div className="text-gray-400">Your Contact</div>
                                <div className="text-white font-medium">{path.introducer?.name}</div>
                                <div className="text-gray-500">{path.introducer?.title}</div>
                                <div className="text-gray-500">{path.introducer?.company}</div>
                              </div>
                              
                              <div>
                                <div className="text-gray-400">Connection Type</div>
                                <div className="text-white">{path.connectionReason}</div>
                                <div className="text-gray-500">{path.relationshipType}</div>
                              </div>
                              
                              <div>
                                <div className="text-gray-400">Target</div>
                                <div className="text-white font-medium">{path.target?.name}</div>
                                <div className="text-gray-500">{path.target?.title}</div>
                                <div className="text-gray-500">{path.target?.company}</div>
                              </div>
                            </div>

                            {/* Connection Strength Breakdown */}
                            <div className="pt-3 border-t border-gray-600">
                              <ConnectionStrengthIndicator
                                fromPersonId={path.introducer?.id}
                                toPersonId={path.target?.id}
                                showDetails={false}
                                size="small"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchResults.length === 0 && connectionPaths.length === 0 && searchQuery && !isSearching && (
                  <Card className="bg-gray-900/50 border-gray-600">
                    <CardContent className="p-8 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white font-medium mb-2">No Connections Found</h3>
                      <p className="text-gray-400 mb-4">
                        No one in your company network has a direct connection to "{searchQuery}"
                        {targetCompany && ` at ${targetCompany}`}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Try searching for someone else or expand your search criteria
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Network Overview */}
        <TabsContent value="network">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Company Network Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border border-gray-600 rounded">
                  <div className="text-2xl font-bold text-white">
                    {companyEmployees?.total || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Employees Onboarded</div>
                </div>
                
                <div className="text-center p-4 border border-gray-600 rounded">
                  <div className="text-2xl font-bold text-white">
                    {networkStats?.totalConnections || 0}
                  </div>
                  <div className="text-gray-400 text-sm">External Connections</div>
                </div>
                
                <div className="text-center p-4 border border-gray-600 rounded">
                  <div className="text-2xl font-bold text-white">
                    {networkStats?.averageConnectionsPerEmployee || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Avg Connections/Employee</div>
                </div>
                
                <div className="text-center p-4 border border-gray-600 rounded">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(networkStats?.networkDensity * 100) || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">Network Density</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Top Connected Employees</h4>
                {(networkStats?.topConnectors || []).slice(0, 5).map((employee, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-600 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{employee.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{employee.name}</div>
                        <div className="text-gray-400 text-sm">{employee.department}</div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {employee.connectionCount} connections
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Analytics */}
        <TabsContent value="analytics">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Network Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Connection Success Rate</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Successful Introductions</span>
                        <span className="text-white">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3">Average Response Time</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Introduction Requests</span>
                        <span className="text-white">24 hours</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-3">Most Connected Industries</h4>
                  <div className="space-y-3">
                    {[
                      { industry: 'Technology', connections: 247, percentage: 45 },
                      { industry: 'Finance', connections: 156, percentage: 28 },
                      { industry: 'Healthcare', connections: 89, percentage: 16 },
                      { industry: 'Education', connections: 62, percentage: 11 }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.industry}</span>
                          <span className="text-white">{item.connections} connections</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}