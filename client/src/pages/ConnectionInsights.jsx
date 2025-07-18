import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Users, 
  Search,
  Lightbulb,
  Target,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function ConnectionInsights() {
  const { toast } = useToast();
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);

  // AI-powered connection analysis
  const analyzeConnectionMutation = useMutation({
    mutationFn: async ({ targetName, targetCompany }) => {
      const response = await fetch('/api/connections/search-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, targetCompany })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast({
        title: "Analysis Complete",
        description: "AI-powered connection insights generated successfully"
      });
    },
    onError: (error) => {
      if (error.message.includes('OpenAI')) {
        toast({
          title: "AI Service Required",
          description: "OpenAI API key needed for intelligent connection analysis",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  const handleAnalyze = () => {
    if (!targetName.trim()) {
      toast({
        title: "Target Required",
        description: "Please enter the name of the person you want to connect with",
        variant: "destructive"
      });
      return;
    }

    analyzeConnectionMutation.mutate({ targetName, targetCompany });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
          <Brain className="mr-4 h-10 w-10 text-purple-400" />
          Connection Insights
        </h1>
        <p className="text-gray-400 text-lg">
          AI-powered analysis to discover optimal connection strategies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Input */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Target Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  Target Person
                </label>
                <Input
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  Company (Optional)
                </label>
                <Input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g., Microsoft"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeConnectionMutation.isPending}
                className="w-full"
              >
                {analyzeConnectionMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Connections
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 mt-3">
                <p className="mb-2">AI analysis will provide:</p>
                <ul className="space-y-1">
                  <li>• Optimal connection pathways</li>
                  <li>• Strategic networking advice</li>
                  <li>• Relationship strength assessment</li>
                  <li>• Introduction timing recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {!analysisResults && !analyzeConnectionMutation.isPending && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12">
                <div className="text-center">
                  <Lightbulb className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-gray-400 text-xl mb-2">AI Connection Analysis</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Enter a target person to receive intelligent insights about the best 
                    ways to establish a professional connection
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {analyzeConnectionMutation.isPending && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-white text-xl mb-2">Analyzing Connection Pathways</h3>
                  <p className="text-gray-400">
                    AI is processing your network to find optimal connection strategies...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysisResults && (
            <>
              {/* Connection Strategy */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                    AI Connection Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.strategy && (
                      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4">
                        <p className="text-yellow-100">{analysisResults.strategy}</p>
                      </div>
                    )}
                    
                    {analysisResults.recommendations && (
                      <div>
                        <h4 className="text-white font-medium mb-3">Key Recommendations:</h4>
                        <div className="space-y-2">
                          {analysisResults.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Connection Paths */}
              {analysisResults.paths && analysisResults.paths.length > 0 && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="mr-2 h-5 w-5 text-blue-400" />
                      Potential Connection Paths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResults.paths.map((path, index) => (
                        <div key={index} className="border border-gray-600 rounded p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {path.hops} degrees of separation
                            </Badge>
                            <div className="flex items-center text-sm text-gray-400">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {path.strength}% strength
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm">
                            {path.path.map((person, personIndex) => (
                              <React.Fragment key={personIndex}>
                                <div className="flex items-center">
                                  <div className="text-white">{person.name}</div>
                                  {person.company && (
                                    <div className="ml-1 text-gray-500">({person.company})</div>
                                  )}
                                </div>
                                {personIndex < path.path.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-gray-500" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Insights */}
              {analysisResults.insights && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-green-400" />
                      AI Communication Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResults.insights.timing && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Optimal Timing:</h4>
                          <p className="text-gray-300 text-sm">{analysisResults.insights.timing}</p>
                        </div>
                      )}
                      
                      {analysisResults.insights.approach && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Recommended Approach:</h4>
                          <p className="text-gray-300 text-sm">{analysisResults.insights.approach}</p>
                        </div>
                      )}
                      
                      {analysisResults.insights.commonGround && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Common Ground:</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResults.insights.commonGround.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}