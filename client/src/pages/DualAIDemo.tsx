import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Brain, Zap, Users, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface DualAIResponse {
  openai: {
    response: string;
    confidence: number;
    processingTime: number;
  };
  haystack: {
    response: string;
    insights: string[];
    confidence: number;
    processingTime: number;
  };
  combined: {
    recommendation: string;
    actionableInsights: string[];
    confidence: number;
  };
  systemStatus: {
    openaiAvailable: boolean;
    haystackAvailable: boolean;
    dualModeActive: boolean;
  };
}

export default function DualAIDemo() {
  const [selectedScenario, setSelectedScenario] = useState('connection_discovery');
  const [customQuery, setCustomQuery] = useState('');
  const [companyName, setCompanyName] = useState('Microsoft');
  const [targetName, setTargetName] = useState('Sarah Chen');
  const [targetCompany, setTargetCompany] = useState('Google');

  const queryClient = useQueryClient();

  // Test dual AI system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/networking-intelligence/test'],
    queryFn: () => apiRequest('/api/networking-intelligence/test', { method: 'POST' }),
    refetchInterval: 30000 // Check status every 30 seconds
  });

  // Process networking queries
  const queryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/networking-intelligence/query', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/networking-intelligence'] });
    }
  });

  const handleRunQuery = () => {
    let queryData;
    
    switch (selectedScenario) {
      case 'connection_discovery':
        queryData = {
          type: 'connection_discovery',
          data: {
            companyName,
            userContext: {
              name: 'Demo User',
              company: 'Tech Startup',
              title: 'Software Engineer'
            }
          }
        };
        break;
      case 'introduction_pathfinding':
        queryData = {
          type: 'introduction_pathfinding',
          data: {
            targetName,
            targetCompany,
            userContext: {
              name: 'Demo User',
              company: 'Tech Startup',
              title: 'Software Engineer'
            }
          }
        };
        break;
      case 'networking_strategy':
        queryData = {
          type: 'networking_strategy',
          data: {
            query: customQuery || 'How can I improve my professional networking strategy?'
          }
        };
        break;
      case 'dual_ai_test':
        queryData = {
          type: 'dual_ai_test',
          data: {
            query: 'Test dual AI system capabilities'
          }
        };
        break;
      default:
        return;
    }

    queryMutation.mutate(queryData);
  };

  const result = queryMutation.data?.result as DualAIResponse;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dual AI Networking Intelligence
          </h1>
          <p className="text-lg text-slate-300 mb-6">
            Experience the power of OpenAI GPT-4o and Haystack RAG working together for superior networking insights
          </p>
          
          {/* System Status */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="w-5 h-5" />
                AI System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Checking system status...</span>
                </div>
              ) : systemStatus?.dualAIStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {systemStatus.dualAIStatus.openaiAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span>OpenAI GPT-4o</span>
                    <Badge variant={systemStatus.dualAIStatus.openaiAvailable ? "default" : "destructive"}>
                      {systemStatus.dualAIStatus.openaiAvailable ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus.dualAIStatus.haystackAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span>Haystack RAG</span>
                    <Badge variant={systemStatus.dualAIStatus.haystackAvailable ? "default" : "destructive"}>
                      {systemStatus.dualAIStatus.haystackAvailable ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus.dualAIStatus.dualModeActive ? (
                      <Zap className="w-5 h-5 text-blue-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span>Dual Mode</span>
                    <Badge variant={systemStatus.dualAIStatus.dualModeActive ? "default" : "secondary"}>
                      {systemStatus.dualAIStatus.dualModeActive ? 'Active' : 'Partial'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  Unable to determine system status
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Query Configuration */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configure Networking Query</CardTitle>
              <CardDescription className="text-slate-400">
                Choose a scenario and customize parameters to test dual AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="connection_discovery">
                    <Users className="w-4 h-4 mr-2" />
                    Discovery
                  </TabsTrigger>
                  <TabsTrigger value="introduction_pathfinding">
                    <Target className="w-4 h-4 mr-2" />
                    Introductions
                  </TabsTrigger>
                  <TabsTrigger value="networking_strategy">
                    <Brain className="w-4 h-4 mr-2" />
                    Strategy
                  </TabsTrigger>
                  <TabsTrigger value="dual_ai_test">
                    <Zap className="w-4 h-4 mr-2" />
                    Test
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="connection_discovery" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Company</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="introduction_pathfinding" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Person</label>
                    <Input
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="Enter person's name..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Company</label>
                    <Input
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="Enter company name..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="networking_strategy" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Query</label>
                    <Textarea
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder="Enter your networking question..."
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dual_ai_test" className="space-y-4">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <Brain className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                    <p className="text-slate-300">
                      Test both AI systems to verify dual mode operation
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleRunQuery}
                disabled={queryMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {queryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing with Dual AI...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Dual AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Dual AI Analysis Results</CardTitle>
              <CardDescription className="text-slate-400">
                Comparative insights from OpenAI and Haystack working together
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queryMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                  <p className="text-slate-300">Analyzing with dual AI systems...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-400 mb-2">OpenAI GPT-4o</h4>
                      <p className="text-sm text-slate-300 mb-2">
                        Response Time: {result.openai.processingTime}ms
                      </p>
                      <p className="text-sm text-slate-300">
                        Confidence: {(result.openai.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-400 mb-2">Haystack RAG</h4>
                      <p className="text-sm text-slate-300 mb-2">
                        Response Time: {result.haystack.processingTime}ms
                      </p>
                      <p className="text-sm text-slate-300">
                        Confidence: {(result.haystack.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Combined Recommendation */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-500/20">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Combined AI Recommendation
                    </h4>
                    <p className="text-slate-200 mb-3">{result.combined.recommendation}</p>
                    <div className="text-sm text-slate-300">
                      Overall Confidence: {(result.combined.confidence * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Actionable Insights */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">Actionable Insights</h4>
                    <div className="space-y-2">
                      {result.combined.actionableInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual AI Responses */}
                  <Tabs defaultValue="openai" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="openai">OpenAI Analysis</TabsTrigger>
                      <TabsTrigger value="haystack">Haystack Insights</TabsTrigger>
                    </TabsList>
                    <TabsContent value="openai" className="mt-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <p className="text-slate-200 text-sm">{result.openai.response}</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="haystack" className="mt-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <p className="text-slate-200 text-sm mb-3">{result.haystack.response}</p>
                        {result.haystack.insights.length > 0 && (
                          <div className="border-t border-slate-600 pt-3">
                            <h5 className="text-sm font-medium text-slate-300 mb-2">Additional Insights:</h5>
                            <ul className="space-y-1">
                              {result.haystack.insights.map((insight, index) => (
                                <li key={index} className="text-xs text-slate-400">• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">
                    Run a dual AI analysis to see comparative results from both systems
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}