import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  Search,
  MapPin,
  Building2,
  Target,
  Zap,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NetworkMap() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('connections');

  // Network analytics data
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['/api/analytics/network']
  });

  const { data: searchResults } = useQuery({
    queryKey: ['/api/data/search-people', searchQuery],
    enabled: searchQuery.length > 2
  });

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
  };

  const handleVisualizationChange = (mode) => {
    setVisualizationMode(mode);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading network visualization...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
          <Network className="mr-4 h-10 w-10 text-blue-400" />
          Network Map
        </h1>
        <p className="text-gray-400 text-lg">
          Visualize professional relationships and discover connection pathways
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Search Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search professionals..."
                className="bg-gray-900/50 border-gray-600 text-white"
              />

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((person) => (
                    <div
                      key={person.id}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedPerson?.id === person.id 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handlePersonSelect(person)}
                    >
                      <div className="text-white font-medium">{person.name}</div>
                      <div className="text-gray-400 text-sm">{person.title}</div>
                      <div className="flex items-center mt-1">
                        <Building2 className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-gray-500 text-xs">{person.company}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Visualization Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={visualizationMode === 'connections' ? 'default' : 'outline'}
                onClick={() => handleVisualizationChange('connections')}
                className="w-full justify-start"
              >
                <Network className="mr-2 h-4 w-4" />
                Connection Graph
              </Button>
              <Button
                variant={visualizationMode === 'companies' ? 'default' : 'outline'}
                onClick={() => handleVisualizationChange('companies')}
                className="w-full justify-start"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Company Network
              </Button>
              <Button
                variant={visualizationMode === 'geography' ? 'default' : 'outline'}
                onClick={() => handleVisualizationChange('geography')}
                className="w-full justify-start"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Geographic Distribution
              </Button>
            </CardContent>
          </Card>

          {selectedPerson && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Selected Professional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-white font-medium">{selectedPerson.name}</div>
                    <div className="text-gray-400">{selectedPerson.title}</div>
                    <div className="text-gray-500 text-sm">{selectedPerson.company}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      25 connections
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      Tech industry
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => toast({
                      title: "Analysis Started",
                      description: `Analyzing connection paths to ${selectedPerson.name}`
                    })}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze Connections
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-gray-700 h-96">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Network Visualization</span>
                <Badge variant="outline" className="capitalize">
                  {visualizationMode}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-gray-400 text-xl mb-2">Interactive Network Graph</h3>
                  <p className="text-gray-500 max-w-md">
                    {visualizationMode === 'connections' && 
                      "Professional connection relationships and shortest paths between individuals"}
                    {visualizationMode === 'companies' && 
                      "Inter-company relationships and cross-organizational connections"}
                    {visualizationMode === 'geography' && 
                      "Geographic distribution of professional networks and regional clusters"}
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => toast({
                      title: "Visualization Loading",
                      description: "Interactive network graph requires additional configuration"
                    })}
                  >
                    Load Interactive Graph
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Statistics */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {networkData?.overview?.totalPersons || 0}
                </div>
                <div className="text-gray-400 text-sm">Total Professionals</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <Network className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {networkData?.overview?.totalRelationships || 0}
                </div>
                <div className="text-gray-400 text-sm">Active Connections</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}