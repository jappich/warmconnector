import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConnectionStrengthIndicator from '@/components/ConnectionStrengthIndicator';
import { 
  Users, 
  Search,
  TrendingUp,
  Database,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ConnectionStrengthDemo() {
  const { toast } = useToast();
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Fetch connection strength statistics
  const { data: strengthStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/connections/strength-stats']
  });

  // Search for persons to test strength calculation
  const { data: availablePersons } = useQuery({
    queryKey: ['/api/data/search-people'],
    enabled: false
  });

  const handlePersonSearch = async (searchQuery) => {
    try {
      const response = await fetch(`/api/data/search-people?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const testConnections = [
    {
      fromPersonId: 'person_001',
      toPersonId: 'person_002',
      fromName: 'Sarah Johnson',
      toName: 'Alex Chen',
      relationship: 'Colleagues at Microsoft'
    },
    {
      fromPersonId: 'person_003',
      toPersonId: 'person_004',
      fromName: 'Maria Rodriguez',
      toName: 'David Kim',
      relationship: 'Alumni from Stanford'
    },
    {
      fromPersonId: 'person_005',
      toPersonId: 'person_006',
      fromName: 'Jennifer Walsh',
      toName: 'Robert Chen',
      relationship: 'Industry professionals'
    }
  ];

  const strengthDistribution = [
    { range: 'Strong (80-100%)', count: strengthStats?.networkStats?.strongConnections || 0, color: 'bg-green-500' },
    { range: 'Moderate (60-79%)', count: strengthStats?.networkStats?.moderateConnections || 0, color: 'bg-yellow-500' },
    { range: 'Weak (0-59%)', count: strengthStats?.networkStats?.weakConnections || 0, color: 'bg-red-500' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dynamic Connection Strength</h1>
        <p className="text-gray-400">
          Real-time relationship strength analysis using your professional network data
        </p>
      </div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="analytics">Network Analytics</TabsTrigger>
          <TabsTrigger value="methodology">How It Works</TabsTrigger>
        </TabsList>

        {/* Live Demo */}
        <TabsContent value="demo">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Connection Test */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Test Connection Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fromPerson" className="text-gray-300">From Person ID</Label>
                  <Input
                    id="fromPerson"
                    value={fromPersonId}
                    onChange={(e) => setFromPersonId(e.target.value)}
                    placeholder="Enter person ID"
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="toPerson" className="text-gray-300">To Person ID</Label>
                  <Input
                    id="toPerson"
                    value={toPersonId}
                    onChange={(e) => setToPersonId(e.target.value)}
                    placeholder="Enter person ID"
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>

                {fromPersonId && toPersonId && (
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Connection Strength Result</h4>
                    <ConnectionStrengthIndicator
                      fromPersonId={fromPersonId}
                      toPersonId={toPersonId}
                      showDetails={true}
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p className="mb-2">Strength calculation factors include:</p>
                  <ul className="space-y-1">
                    <li>• Recent interaction frequency and quality</li>
                    <li>• Mutual professional connections</li>
                    <li>• Shared company or educational history</li>
                    <li>• Duration of professional relationship</li>
                    <li>• Engagement patterns and response times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Sample Connections */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Sample Professional Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testConnections.map((connection, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">
                            {connection.fromName} → {connection.toName}
                          </h4>
                          <p className="text-gray-400 text-sm">{connection.relationship}</p>
                        </div>
                      </div>
                      
                      <ConnectionStrengthIndicator
                        fromPersonId={connection.fromPersonId}
                        toPersonId={connection.toPersonId}
                        showDetails={false}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Network Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Network Strength Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading network statistics...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border border-gray-600 rounded">
                        <div className="text-2xl font-bold text-white">
                          {Math.round(strengthStats?.networkStats?.averageStrength || 0)}%
                        </div>
                        <div className="text-gray-400 text-sm">Average Strength</div>
                      </div>
                      <div className="text-center p-4 border border-gray-600 rounded">
                        <div className="text-2xl font-bold text-white">
                          {strengthStats?.networkStats?.totalCalculations || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Analyzed Connections</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Strength Distribution</h4>
                      {strengthDistribution.map((dist, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{dist.range}</span>
                            <span className="text-white">{dist.count} connections</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${dist.color}`}
                              style={{
                                width: `${Math.max(5, (dist.count / Math.max(1, strengthStats?.networkStats?.totalCalculations || 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">MongoDB Database</span>
                      <span className="text-green-400 text-sm">Connected</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Professional profiles, relationships, and interaction history
                    </p>
                  </div>

                  <div className="border border-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Real-time Calculations</span>
                      <span className="text-blue-400 text-sm">Active</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Dynamic strength scoring based on current network data
                    </p>
                  </div>

                  <div className="border border-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Historical Trends</span>
                      <span className="text-purple-400 text-sm">Tracking</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Connection strength evolution over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Methodology */}
        <TabsContent value="methodology">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Connection Strength Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-3">Scoring Algorithm</h3>
                  <p className="text-gray-300 mb-4">
                    Connection strength is calculated using a weighted algorithm that analyzes multiple factors 
                    from your professional network data stored in MongoDB.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-600 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Interactions</span>
                        <span className="text-blue-400">30% weight</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Recent communication frequency, meeting history, and response patterns
                      </p>
                    </div>

                    <div className="border border-gray-600 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Mutual Network</span>
                        <span className="text-green-400">25% weight</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Shared professional connections and network overlap analysis
                      </p>
                    </div>

                    <div className="border border-gray-600 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Shared History</span>
                        <span className="text-purple-400">20% weight</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Common companies, educational background, and professional experiences
                      </p>
                    </div>

                    <div className="border border-gray-600 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Connection Age</span>
                        <span className="text-yellow-400">15% weight</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Duration of professional relationship and stability over time
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Data Processing</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Zap className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Real-time Analysis</h4>
                        <p className="text-gray-400 text-sm">
                          Strength scores are calculated dynamically from current database state
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Database className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Authentic Data</h4>
                        <p className="text-gray-400 text-sm">
                          All calculations use actual relationship data from your MongoDB database
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-purple-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Trend Tracking</h4>
                        <p className="text-gray-400 text-sm">
                          Historical comparisons show relationship strength evolution
                        </p>
                      </div>
                    </div>
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