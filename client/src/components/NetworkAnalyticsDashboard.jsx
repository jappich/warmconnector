import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Network,
  Zap,
  RefreshCw,
  Search,
  ArrowRight,
  Activity,
  Target,
  Globe,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function NetworkAnalyticsDashboard() {
  const { toast } = useToast();
  const [enrichmentPersonId, setEnrichmentPersonId] = useState('');
  const [companyPathFrom, setCompanyPathFrom] = useState('');
  const [companyPathTo, setCompanyPathTo] = useState('');

  // Network analytics data
  const { data: networkAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/network']
  });

  // Enrichment statistics
  const { data: enrichmentStats, isLoading: enrichmentLoading } = useQuery({
    queryKey: ['/api/enrichment/stats']
  });

  // Trending insights
  const { data: trendingInsights, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/analytics/trending']
  });

  // Profile enrichment mutation
  const enrichProfileMutation = useMutation({
    mutationFn: (personId) => apiRequest(`/api/enrichment/profile/${personId}`, {
      method: 'POST',
      body: JSON.stringify({ additionalContext: {} })
    }),
    onSuccess: (data) => {
      toast({
        title: "Profile Enriched",
        description: `Enhanced profile for ${data.name} with AI insights`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Enrichment Failed",
        description: error.message || "Failed to enrich profile",
        variant: "destructive"
      });
    }
  });

  // Company path analysis mutation
  const companyPathMutation = useMutation({
    mutationFn: ({ fromCompany, toCompany }) => 
      apiRequest(`/api/analytics/company-path/${encodeURIComponent(fromCompany)}/${encodeURIComponent(toCompany)}`),
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze company paths",
        variant: "destructive"
      });
    }
  });

  const handleEnrichProfile = () => {
    if (!enrichmentPersonId.trim()) {
      toast({
        title: "Missing Person ID",
        description: "Please enter a person ID to enrich",
        variant: "destructive"
      });
      return;
    }
    enrichProfileMutation.mutate(enrichmentPersonId.trim());
  };

  const handleCompanyPathAnalysis = () => {
    if (!companyPathFrom.trim() || !companyPathTo.trim()) {
      toast({
        title: "Missing Company Names",
        description: "Please enter both company names",
        variant: "destructive"
      });
      return;
    }
    companyPathMutation.mutate({
      fromCompany: companyPathFrom.trim(),
      toCompany: companyPathTo.trim()
    });
  };

  if (analyticsLoading || enrichmentLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-3" />
            <span className="text-gray-300">Loading analytics dashboard...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Network Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
              <TabsTrigger value="pathways">Pathways</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {networkAnalytics ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {networkAnalytics.overview.totalPersons}
                        </div>
                        <div className="text-gray-400 text-sm">Total Profiles</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Network className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {networkAnalytics.overview.totalRelationships}
                        </div>
                        <div className="text-gray-400 text-sm">Connections</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Activity className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {networkAnalytics.overview.averageConnectionsPerPerson}
                        </div>
                        <div className="text-gray-400 text-sm">Avg Connections</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Globe className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {networkAnalytics.overview.networkDensity}%
                        </div>
                        <div className="text-gray-400 text-sm">Network Density</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Top Companies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {networkAnalytics.companies.topCompanies.slice(0, 5).map((company, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-blue-400 mr-2" />
                                <span className="text-gray-300">{company.company}</span>
                              </div>
                              <Badge variant="outline">{company.employeeCount} employees</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Top Connectors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {networkAnalytics.topConnectors.slice(0, 5).map((connector, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div>
                                <div className="text-gray-300 font-medium">{connector.name}</div>
                                <div className="text-gray-500 text-sm">{connector.title}</div>
                              </div>
                              <Badge variant="outline">{connector.totalConnections} connections</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">No network data available. Import company data to see analytics.</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="enrichment" className="space-y-4">
              {enrichmentStats ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Profile Enrichment</span>
                          <Zap className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {enrichmentStats.profiles.enrichmentRate}%
                        </div>
                        <Progress 
                          value={parseFloat(enrichmentStats.profiles.enrichmentRate)} 
                          className="h-2"
                        />
                        <div className="text-gray-500 text-sm mt-1">
                          {enrichmentStats.profiles.enriched} of {enrichmentStats.profiles.total} profiles
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Relationship Analysis</span>
                          <Network className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {enrichmentStats.relationships.enrichmentRate}%
                        </div>
                        <Progress 
                          value={parseFloat(enrichmentStats.relationships.enrichmentRate)} 
                          className="h-2"
                        />
                        <div className="text-gray-500 text-sm mt-1">
                          {enrichmentStats.relationships.enriched} of {enrichmentStats.relationships.total} relationships
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Company Insights</span>
                          <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {enrichmentStats.companies.withInsights}
                        </div>
                        <div className="text-gray-500 text-sm">
                          Companies with AI insights
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-900/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Profile Enrichment Tool</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          value={enrichmentPersonId}
                          onChange={(e) => setEnrichmentPersonId(e.target.value)}
                          placeholder="Enter person ID to enrich..."
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <Button
                          onClick={handleEnrichProfile}
                          disabled={enrichProfileMutation.isPending}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          {enrichProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {enrichProfileMutation.data && (
                        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded p-4">
                          <h4 className="text-yellow-400 font-medium mb-2">Enrichment Results</h4>
                          <div className="text-gray-300 text-sm space-y-1">
                            <p><strong>Name:</strong> {enrichProfileMutation.data.name}</p>
                            <p><strong>Industry Insights:</strong> {enrichProfileMutation.data.enrichment?.industryInsights}</p>
                            <p><strong>Connection Strength:</strong> {enrichProfileMutation.data.enrichment?.connectionStrength}/10</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">No enrichment data available.</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pathways" className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Company Path Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={companyPathFrom}
                      onChange={(e) => setCompanyPathFrom(e.target.value)}
                      placeholder="From company..."
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <ArrowRight className="h-10 w-10 text-gray-400 flex-shrink-0" />
                    <Input
                      value={companyPathTo}
                      onChange={(e) => setCompanyPathTo(e.target.value)}
                      placeholder="To company..."
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Button
                      onClick={handleCompanyPathAnalysis}
                      disabled={companyPathMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {companyPathMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {companyPathMutation.data && (
                    <div className="bg-purple-900/20 border border-purple-500/50 rounded p-4">
                      <h4 className="text-purple-400 font-medium mb-3">Path Analysis Results</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">From: {companyPathMutation.data.fromCompany}</div>
                          <div className="text-gray-400">Employees: {companyPathMutation.data.fromEmployeeCount}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">To: {companyPathMutation.data.toCompany}</div>
                          <div className="text-gray-400">Employees: {companyPathMutation.data.toEmployeeCount}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="text-gray-300">
                          <strong>Direct Connections:</strong> {companyPathMutation.data.directConnections}
                        </div>
                        <div className="text-gray-300">
                          <strong>Average Strength:</strong> {companyPathMutation.data.averageStrength}/10
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {trendingInsights ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Recent Growth
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">New Profiles (30 days)</span>
                            <span className="text-green-400 font-bold">
                              {trendingInsights.recentGrowth?.newPersonsLast30Days || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">New Connections (30 days)</span>
                            <span className="text-green-400 font-bold">
                              {trendingInsights.recentGrowth?.newRelationshipsLast30Days || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center">
                          <Target className="mr-2 h-5 w-5" />
                          Strong Connections
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {trendingInsights.strongestCompanyConnections?.slice(0, 3).map((connection, index) => (
                            <div key={index} className="text-sm">
                              <div className="text-gray-300">
                                {connection._id.company1} ↔ {connection._id.company2}
                              </div>
                              <div className="text-gray-500">
                                {connection.strongConnections} strong connections
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">Loading trending insights...</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}