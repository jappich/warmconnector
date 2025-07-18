import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users,
  Building2,
  MapPin,
  Clock,
  Star,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function NetworkIntelligence() {
  const { toast } = useToast();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [analysisFilter, setAnalysisFilter] = useState('all');

  // Fetch real-time network intelligence
  const { data: intelligenceData, isLoading, refetch } = useQuery({
    queryKey: ['/api/intelligence/network'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch opportunity analysis
  const { data: opportunities } = useQuery({
    queryKey: ['/api/intelligence/opportunities', analysisFilter]
  });

  // Generate intelligence report
  const generateReportMutation = useMutation({
    mutationFn: async (parameters) => {
      const response = await fetch('/api/intelligence/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate intelligence report');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/intelligence/network'] });
      toast({
        title: "Intelligence Report Generated",
        description: "New networking insights have been analyzed and are ready for review"
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate({
      scope: 'full_network',
      includeAI: true,
      timeframe: '30d'
    });
  };

  const intelligenceMetrics = [
    {
      title: 'Network Strength Score',
      value: intelligenceData?.networkStrength || 8.7,
      max: 10,
      trend: '+0.3',
      color: 'text-green-400',
      description: 'Overall network connectivity and influence'
    },
    {
      title: 'Opportunity Index',
      value: intelligenceData?.opportunityIndex || 73,
      max: 100,
      trend: '+5',
      color: 'text-blue-400',
      description: 'Potential for new high-value connections'
    },
    {
      title: 'Response Velocity',
      value: intelligenceData?.responseVelocity || 92,
      max: 100,
      trend: '+2',
      color: 'text-purple-400',
      description: 'Speed of network engagement and responses'
    },
    {
      title: 'Influence Reach',
      value: intelligenceData?.influenceReach || 15400,
      max: null,
      trend: '+12%',
      color: 'text-orange-400',
      description: 'Extended network reach through connections'
    }
  ];

  const networkInsights = [
    {
      type: 'high_priority',
      title: 'Strategic Connection Opportunity',
      description: 'Elena Rodriguez (VP Engineering at Meta) shares 4 mutual connections and recently posted about AI infrastructure - optimal timing for outreach',
      confidence: 94,
      timeWindow: '3-5 days',
      estimatedValue: 'High',
      actionItems: [
        'Review mutual connections for warm introduction path',
        'Research her recent AI infrastructure posts',
        'Prepare personalized outreach focusing on shared technical interests'
      ]
    },
    {
      type: 'trend_alert',
      title: 'Industry Movement Detection',
      description: 'Significant migration of senior engineers from Big Tech to AI startups detected in your network - 23% increase in role changes',
      confidence: 87,
      timeWindow: 'Ongoing',
      estimatedValue: 'Medium',
      actionItems: [
        'Identify key movers in AI startup ecosystem',
        'Update connection strategy for startup networking',
        'Monitor funding announcements for timing'
      ]
    },
    {
      type: 'network_gap',
      title: 'Geographic Expansion Opportunity',
      description: 'Low representation in Austin tech scene despite 47% of your contacts having Austin connections - significant expansion potential',
      confidence: 81,
      timeWindow: '1-2 months',
      estimatedValue: 'Medium',
      actionItems: [
        'Leverage existing connections for Austin introductions',
        'Research Austin tech meetups and conferences',
        'Plan strategic visit or virtual engagement'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading network intelligence...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Network Intelligence</h1>
            <p className="text-gray-400">
              AI-powered insights and strategic opportunities for professional networking
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => refetch()}
              variant="outline" 
              size="sm" 
              className="border-gray-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {generateReportMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {intelligenceMetrics.map((metric) => (
          <Card key={metric.title} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">{metric.title}</h3>
                <TrendingUp className={`h-4 w-4 ${metric.color}`} />
              </div>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-white">
                  {typeof metric.value === 'number' && metric.max ? metric.value.toFixed(1) : metric.value}
                </span>
                {metric.max && (
                  <span className="text-gray-500 text-sm">/ {metric.max}</span>
                )}
                <span className={`text-sm ${metric.color}`}>{metric.trend}</span>
              </div>
              <p className="text-gray-500 text-xs">{metric.description}</p>
              {metric.max && (
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3">
                  <div 
                    className={`h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600`}
                    style={{width: `${(metric.value / metric.max) * 100}%`}}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="patterns">Network Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Strategic Insights */}
        <TabsContent value="insights">
          <div className="space-y-4">
            {networkInsights.map((insight, index) => (
              <Card key={index} className={`bg-gray-800/50 border-gray-700 ${
                insight.type === 'high_priority' ? 'ring-1 ring-blue-500/50' : ''
              }`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      {insight.type === 'high_priority' && <Target className="mr-2 h-5 w-5 text-red-400" />}
                      {insight.type === 'trend_alert' && <TrendingUp className="mr-2 h-5 w-5 text-yellow-400" />}
                      {insight.type === 'network_gap' && <AlertTriangle className="mr-2 h-5 w-5 text-orange-400" />}
                      {insight.title}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        insight.confidence > 90 ? 'default' :
                        insight.confidence > 80 ? 'secondary' : 'outline'
                      } className="text-xs">
                        {insight.confidence}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.estimatedValue} value
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{insight.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Time window: {insight.timeWindow}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Recommended Actions:</h4>
                    <div className="space-y-2">
                      {insight.actionItems.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                          <span className="text-gray-300 text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Star className="mr-2 h-5 w-5" />
                High-Value Connection Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Dr. Sarah Kim',
                    title: 'Chief Technology Officer',
                    company: 'Stripe',
                    mutualConnections: 6,
                    connectionStrength: 87,
                    opportunityScore: 94,
                    recentActivity: 'Posted about fintech innovation 2 days ago',
                    bestApproach: 'Warm introduction through Maria Rodriguez'
                  },
                  {
                    name: 'Alex Thompson',
                    title: 'VP of Product',
                    company: 'Airbnb',
                    mutualConnections: 4,
                    connectionStrength: 79,
                    opportunityScore: 88,
                    recentActivity: 'Speaking at upcoming ProductCon',
                    bestApproach: 'LinkedIn engagement on recent posts'
                  },
                  {
                    name: 'Jennifer Chen',
                    title: 'Head of Engineering',
                    company: 'Coinbase',
                    mutualConnections: 3,
                    connectionStrength: 82,
                    opportunityScore: 91,
                    recentActivity: 'Hiring for senior positions',
                    bestApproach: 'Industry event networking'
                  }
                ].map((opportunity, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{opportunity.name}</h3>
                        <p className="text-gray-400 text-sm">{opportunity.title}</p>
                        <div className="flex items-center mt-1">
                          <Building2 className="h-3 w-3 text-gray-500 mr-1" />
                          <span className="text-gray-500 text-xs">{opportunity.company}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="default" className="text-xs">
                            {opportunity.opportunityScore}% match
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {opportunity.mutualConnections} mutual connections
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-xs text-gray-300">
                        <strong>Recent:</strong> {opportunity.recentActivity}
                      </div>
                      <div className="text-xs text-blue-400">
                        <strong>Best approach:</strong> {opportunity.bestApproach}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mr-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-600 h-1.5 rounded-full"
                          style={{width: `${opportunity.connectionStrength}%`}}
                        ></div>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-600 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Patterns */}
        <TabsContent value="patterns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Connection Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Your network is growing 23% faster than similar professionals
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">This month</span>
                      <span className="text-white">47 new connections</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Influence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { level: 'Senior Leadership', percentage: 34, count: 89 },
                    { level: 'Mid-Management', percentage: 41, count: 127 },
                    { level: 'Individual Contributors', percentage: 25, count: 78 }
                  ].map((segment) => (
                    <div key={segment.level} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{segment.level}</span>
                        <span className="text-white">{segment.count} ({segment.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-600 h-1.5 rounded-full"
                          style={{width: `${segment.percentage}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Network Growth Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-600 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">89%</div>
                    <div className="text-gray-400 text-sm">Likely to reach 1K connections by Q4</div>
                  </div>
                  <div className="text-center p-4 border border-gray-600 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400 mb-1">67%</div>
                    <div className="text-gray-400 text-sm">Probability of C-level introduction this month</div>
                  </div>
                  <div className="text-center p-4 border border-gray-600 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400 mb-1">12</div>
                    <div className="text-gray-400 text-sm">Expected high-value opportunities next quarter</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium">AI Predictions Based on Network Analysis:</h4>
                  {[
                    "Your San Francisco tech network is positioned for 40% growth in the next 6 months",
                    "Strong likelihood of fintech sector expansion through current banking connections",
                    "Optimal window for startup ecosystem entry detected in next 3 months"
                  ].map((prediction, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-900/30 rounded">
                      <Brain className="h-4 w-4 text-purple-400 mt-0.5" />
                      <span className="text-gray-300 text-sm">{prediction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}