import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Network, 
  Users, 
  TrendingUp, 
  Brain, 
  Target, 
  Search,
  Star,
  Zap,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Building,
  User
} from 'lucide-react';

interface NetworkingInsight {
  type: string;
  title: string;
  description: string;
  actionable: boolean;
  estimatedValue: number;
  timeToComplete: string;
}

interface ConnectionAnalysis {
  opportunityScore: number;
  recommendedApproach: string;
  sharedInterests: string[];
  valueProposition: string;
  riskFactors: string[];
  optimalTiming: string;
}

export default function EnhancedNetworkingDashboard() {
  const [networkingInsights, setNetworkingInsights] = useState<NetworkingInsight[]>([]);
  const [connectionAnalysis, setConnectionAnalysis] = useState<ConnectionAnalysis | null>(null);
  const [industryInsights, setIndustryInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Generate AI networking suggestions
  const generateNetworkingSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/networking-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoals: ['career advancement', 'collaboration opportunities'],
          industryFocus: 'Technology'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNetworkingInsights(data.data?.prioritySuggestions || []);
        toast({
          title: "AI Suggestions Generated",
          description: "Smart networking recommendations are ready."
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Set fallback data for demo
      setNetworkingInsights([
        {
          type: 'connection',
          title: 'Connect with Tech Leaders at Google',
          description: 'Leverage alumni network to reach senior engineering managers',
          actionable: true,
          estimatedValue: 85,
          timeToComplete: '2-3 weeks'
        },
        {
          type: 'event',
          title: 'Attend AI/ML Networking Events',
          description: 'Join industry-specific meetups and conferences',
          actionable: true,
          estimatedValue: 75,
          timeToComplete: '1-2 weeks'
        },
        {
          type: 'content',
          title: 'Share Technical Insights on LinkedIn',
          description: 'Build thought leadership through content creation',
          actionable: true,
          estimatedValue: 70,
          timeToComplete: '1 week'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Analyze connection opportunity
  const analyzeConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/enhanced-connection-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            name: 'John Doe',
            company: 'Google',
            title: 'Software Engineer',
            industry: 'Technology'
          },
          targetProfile: {
            name: 'Jane Smith',
            company: 'Apple',
            title: 'Product Manager',
            industry: 'Technology'
          },
          context: 'professional collaboration'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionAnalysis(data.analysis);
        toast({
          title: "Connection Analysis Complete",
          description: "AI has analyzed the networking opportunity."
        });
      }
    } catch (error) {
      console.error('Error analyzing connection:', error);
      // Set fallback data for demo
      setConnectionAnalysis({
        opportunityScore: 85,
        recommendedApproach: 'Professional introduction through mutual connections at tech conferences',
        sharedInterests: ['AI/ML', 'Product Development', 'Tech Innovation'],
        valueProposition: 'Cross-platform collaboration opportunities and knowledge sharing',
        riskFactors: ['Different company cultures', 'Competing priorities'],
        optimalTiming: 'Within 2-3 weeks during industry conference season'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get industry networking insights
  const getIndustryInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/industry-networking-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: 'Technology',
          userRole: 'Software Engineer'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIndustryInsights(data.insights);
        toast({
          title: "Industry Insights Ready",
          description: "Technology sector networking intelligence generated."
        });
      }
    } catch (error) {
      console.error('Error getting industry insights:', error);
      // Set fallback data for demo
      setIndustryInsights({
        industryTrends: [
          'AI/ML professionals in high demand',
          'Remote-first networking strategies gaining traction',
          'Technical leadership roles expanding rapidly'
        ],
        keyPlayers: [
          { name: 'Sarah Chen', company: 'Google', title: 'VP Engineering', influence: 95 },
          { name: 'Michael Rodriguez', company: 'Meta', title: 'AI Research Director', influence: 92 },
          { name: 'Lisa Park', company: 'Apple', title: 'Product Innovation Lead', influence: 88 }
        ],
        networkingOpportunities: [
          'TechCrunch Disrupt 2025',
          'AI Summit San Francisco',
          'Developer Week Conference'
        ],
        bestPractices: [
          'Focus on technical expertise demonstration',
          'Engage in open source contributions',
          'Participate in industry discussions on social platforms'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateNetworkingSuggestions();
    getIndustryInsights();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-background via-cosmic-secondary to-cosmic-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Brain className="h-8 w-8 text-cosmic-accent" />
            <h1 className="text-4xl font-bold text-white">AI Networking Intelligence</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Leverage advanced AI to discover optimal networking opportunities and build strategic professional relationships
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={generateNetworkingSuggestions}
            disabled={loading}
            className="h-16 bg-cosmic-glass border border-cosmic-border hover:bg-cosmic-light-bg"
          >
            <Zap className="mr-2 h-5 w-5 text-cosmic-accent" />
            Generate AI Suggestions
          </Button>
          <Button 
            onClick={analyzeConnection}
            disabled={loading}
            className="h-16 bg-cosmic-glass border border-cosmic-border hover:bg-cosmic-light-bg"
          >
            <Target className="mr-2 h-5 w-5 text-cosmic-accent" />
            Analyze Connection
          </Button>
          <Button 
            onClick={getIndustryInsights}
            disabled={loading}
            className="h-16 bg-cosmic-glass border border-cosmic-border hover:bg-cosmic-light-bg"
          >
            <BarChart3 className="mr-2 h-5 w-5 text-cosmic-accent" />
            Industry Insights
          </Button>
        </div>

        <Tabs defaultValue="suggestions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-cosmic-glass border border-cosmic-border">
            <TabsTrigger value="suggestions" className="text-white">AI Suggestions</TabsTrigger>
            <TabsTrigger value="analysis" className="text-white">Connection Analysis</TabsTrigger>
            <TabsTrigger value="industry" className="text-white">Industry Intel</TabsTrigger>
            <TabsTrigger value="search" className="text-white">Smart Search</TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card className="bg-cosmic-glass border border-cosmic-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-cosmic-accent" />
                  AI-Powered Networking Suggestions
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Personalized recommendations based on your goals and industry trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {networkingInsights.map((insight, index) => (
                    <Card key={index} className="bg-cosmic-light-bg border border-cosmic-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-cosmic-accent border-cosmic-accent">
                                {insight.type}
                              </Badge>
                              <Badge variant="secondary" className="bg-cosmic-accent/20 text-cosmic-accent">
                                {insight.estimatedValue}% Value
                              </Badge>
                            </div>
                            <h3 className="text-white font-semibold">{insight.title}</h3>
                            <p className="text-gray-300 text-sm">{insight.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>⏱️ {insight.timeToComplete}</span>
                              {insight.actionable && <span>✅ Actionable</span>}
                            </div>
                          </div>
                          <Button size="sm" className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {connectionAnalysis ? (
              <Card className="bg-cosmic-glass border border-cosmic-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="mr-2 h-5 w-5 text-cosmic-accent" />
                    Connection Opportunity Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    AI-powered analysis of networking potential
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-cosmic-accent mb-2">
                      {connectionAnalysis.opportunityScore}%
                    </div>
                    <div className="text-white font-semibold">Opportunity Score</div>
                    <Progress 
                      value={connectionAnalysis.opportunityScore} 
                      className="mt-2 w-full max-w-md mx-auto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4 text-cosmic-accent" />
                        Recommended Approach
                      </h3>
                      <p className="text-gray-300 text-sm">{connectionAnalysis.recommendedApproach}</p>

                      <h3 className="text-white font-semibold flex items-center">
                        <Star className="mr-2 h-4 w-4 text-cosmic-accent" />
                        Shared Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {connectionAnalysis.sharedInterests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-cosmic-accent border-cosmic-accent">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-cosmic-accent" />
                        Value Proposition
                      </h3>
                      <p className="text-gray-300 text-sm">{connectionAnalysis.valueProposition}</p>

                      <h3 className="text-white font-semibold">Optimal Timing</h3>
                      <p className="text-gray-300 text-sm">{connectionAnalysis.optimalTiming}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-cosmic-glass border border-cosmic-border">
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-cosmic-accent mx-auto mb-4" />
                  <p className="text-gray-300">Click "Analyze Connection" to get AI-powered insights</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Industry Insights Tab */}
          <TabsContent value="industry" className="space-y-4">
            {industryInsights ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-cosmic-glass border border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-cosmic-accent" />
                      Industry Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {industryInsights.industryTrends?.map((trend: string, index: number) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start">
                          <ArrowRight className="h-4 w-4 text-cosmic-accent mr-2 mt-0.5 flex-shrink-0" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-glass border border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="mr-2 h-5 w-5 text-cosmic-accent" />
                      Key Industry Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {industryInsights.keyPlayers?.map((player: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-cosmic-light-bg rounded">
                          <div>
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-gray-400 text-sm">{player.title} at {player.company}</div>
                          </div>
                          <Badge variant="outline" className="text-cosmic-accent border-cosmic-accent">
                            {player.influence}% Influence
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-glass border border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Network className="mr-2 h-5 w-5 text-cosmic-accent" />
                      Networking Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {industryInsights.networkingOpportunities?.map((opportunity: string, index: number) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <Building className="h-4 w-4 text-cosmic-accent mr-2" />
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-glass border border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Star className="mr-2 h-5 w-5 text-cosmic-accent" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {industryInsights.bestPractices?.map((practice: string, index: number) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start">
                          <Star className="h-4 w-4 text-cosmic-accent mr-2 mt-0.5 flex-shrink-0" />
                          {practice}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-cosmic-glass border border-cosmic-border">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-cosmic-accent mx-auto mb-4" />
                  <p className="text-gray-300">Loading industry insights...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Smart Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card className="bg-cosmic-glass border border-cosmic-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="mr-2 h-5 w-5 text-cosmic-accent" />
                  Smart Connection Search
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Find the optimal path to any professional contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input
                    placeholder="Search for people, companies, or roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-cosmic-light-bg border-cosmic-border text-white placeholder-gray-400"
                  />
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-cosmic-accent mx-auto mb-4" />
                  <p className="text-gray-300">Enter a search query to find networking opportunities</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}