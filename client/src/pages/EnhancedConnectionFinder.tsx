import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Users, Search, Database, Globe, Shield, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ConnectionEvidence {
  source: string;
  evidence: string;
  score: number;
  metadata?: any;
}

interface EnhancedConnectionResult {
  userA_id: string;
  userB_id: string;
  connections: ConnectionEvidence[];
  top_connection_score: number;
  analysis: {
    phases_executed: string[];
    total_connections: number;
    unique_sources: number;
    composite_score: number;
    connections_by_source: Record<string, number>;
    connection_strength_distribution: {
      strong: number;
      medium: number;
      weak: number;
    };
    recommendations: string[];
  };
}

export default function EnhancedConnectionFinder() {
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedConnectionResult | null>(null);

  const queryClient = useQueryClient();

  // Query to validate data sources
  const { data: sourcesStatus } = useQuery({
    queryKey: ['/api/connections/validate-sources'],
    queryFn: () => apiRequest('/api/connections/validate-sources')
  });

  // Mutation for enhanced connection search using PostgreSQL
  const searchMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/connections/find-enhanced', {
      method: 'POST',
      body: data
    }),
    onSuccess: (data) => {
      setSearchResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    }
  });

  const handleSearch = () => {
    if (!userAId || !userBId) return;

    searchMutation.mutate({
      fromPersonId: userAId,
      toPersonId: userBId,
      maxDepth: 3
    });
  };

  const handlePhaseToggle = (phase: string, checked: boolean) => {
    if (checked) {
      setIncludePhases([...includePhases, phase]);
    } else {
      setIncludePhases(includePhases.filter(p => p !== phase));
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('API')) return <Globe className="h-4 w-4" />;
    if (source.includes('Database')) return <Database className="h-4 w-4" />;
    if (source.includes('Pro') || source.includes('Enterprise')) return <Shield className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Strong';
    if (score >= 0.5) return 'Medium';
    return 'Weak';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Enhanced Connection Finder</h1>
        <p className="text-muted-foreground">
          Multi-phase connection discovery using social APIs, public records, and premium data sources
        </p>
        
        {/* Simple Setup Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 max-w-2xl mx-auto mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-blue-300 font-medium mb-2">To find connections:</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Upload company contacts first (Upload Contacts page)</li>
                <li>• Connect LinkedIn and social accounts</li>
                <li>• More uploaded contacts = better connection paths</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Connection Search</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Search Configuration
              </CardTitle>
              <CardDescription>
                Configure the multi-phase connection search between two individuals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userA">User A ID</Label>
                  <Input
                    id="userA"
                    value={userAId}
                    onChange={(e) => setUserAId(e.target.value)}
                    placeholder="Enter first user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userB">User B ID</Label>
                  <Input
                    id="userB"
                    value={userBId}
                    onChange={(e) => setUserBId(e.target.value)}
                    placeholder="Enter second user ID"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Phases</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phase1"
                        checked={includePhases.includes('phase1')}
                        onCheckedChange={(checked) => handlePhaseToggle('phase1', checked as boolean)}
                      />
                      <Label htmlFor="phase1" className="text-sm font-medium">
                        Phase 1: Social APIs
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      LinkedIn, GitHub, Twitter, Facebook, Instagram
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phase2"
                        checked={includePhases.includes('phase2')}
                        onCheckedChange={(checked) => handlePhaseToggle('phase2', checked as boolean)}
                      />
                      <Label htmlFor="phase2" className="text-sm font-medium">
                        Phase 2: Public Records
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      TruePeopleSearch, ZabaSearch, FastPeopleSearch
                    </p>
                  </Card>

                  <Card className="p-4 opacity-60">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whitepages"
                        checked={includeWhitepages}
                        onCheckedChange={(checked) => setIncludeWhitepages(checked as boolean)}
                      />
                      <Label htmlFor="whitepages" className="text-sm font-medium">
                        Phase 3: Whitepages Pro
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Premium address & contact verification
                    </p>
                  </Card>

                  <Card className="p-4 opacity-60">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pipl"
                        checked={includePipl}
                        onCheckedChange={(checked) => setIncludePipl(checked as boolean)}
                      />
                      <Label htmlFor="pipl" className="text-sm font-medium">
                        Phase 4: Pipl Enterprise
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enterprise identity resolution
                    </p>
                  </Card>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                className="w-full"
                disabled={searchMutation.isPending || !userAId || !userBId}
              >
                {searchMutation.isPending ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Searching Connections...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Enhanced Connections
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Validation</CardTitle>
              <CardDescription>
                Status of available connection data sources and APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourcesStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Available Sources: {sourcesStatus.available_count} of {sourcesStatus.total_count}
                    </span>
                    <Progress value={(sourcesStatus.available_count / sourcesStatus.total_count) * 100} className="w-32" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(sourcesStatus.sources).map(([source, available]) => (
                      <div key={source} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(source)}
                          <span className="text-sm capitalize">
                            {source.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading source validation...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {searchResults ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Connection Analysis Summary</CardTitle>
                  <CardDescription>
                    Results for {searchResults.userA_id} ↔ {searchResults.userB_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{searchResults.analysis.total_connections}</div>
                      <div className="text-sm text-muted-foreground">Total Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{searchResults.analysis.unique_sources}</div>
                      <div className="text-sm text-muted-foreground">Data Sources</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(searchResults.analysis.composite_score * 100).toFixed(0)}%</div>
                      <div className="text-sm text-muted-foreground">Composite Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{searchResults.analysis.phases_executed.length}</div>
                      <div className="text-sm text-muted-foreground">Phases Used</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Connection Strength Distribution</h4>
                      <div className="flex gap-4">
                        <Badge variant="default" className="bg-green-500">
                          Strong: {searchResults.analysis.connection_strength_distribution.strong}
                        </Badge>
                        <Badge variant="default" className="bg-yellow-500">
                          Medium: {searchResults.analysis.connection_strength_distribution.medium}
                        </Badge>
                        <Badge variant="default" className="bg-red-500">
                          Weak: {searchResults.analysis.connection_strength_distribution.weak}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Phases Executed</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.analysis.phases_executed.map((phase) => (
                          <Badge key={phase} variant="outline">
                            {phase.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Evidence</CardTitle>
                  <CardDescription>
                    Detailed connection findings from all enabled phases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {searchResults.connections.map((connection, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getSourceIcon(connection.source)}
                                <span className="font-medium text-sm">{connection.source}</span>
                                <Badge 
                                  className={`${getScoreColor(connection.score)} text-white`}
                                >
                                  {getScoreLabel(connection.score)} ({Math.round(connection.score * 100)}%)
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{connection.evidence}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {searchResults.analysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Suggestions to improve connection discovery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {searchResults.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Run a connection search to see detailed results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}