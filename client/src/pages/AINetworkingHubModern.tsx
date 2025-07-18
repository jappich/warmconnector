import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  Users, 
  Target, 
  Lightbulb, 
  TrendingUp,
  Sparkles,
  Network,
  Search,
  BookOpen,
  Zap
} from 'lucide-react';

const AINetworkingHubModern: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');

  const aiSuggestions = [
    {
      id: 1,
      title: 'Connect with Senior Product Managers',
      description: 'Based on your profile, connecting with SPMs at similar companies could expand your network.',
      strength: 'High Priority',
      action: 'Find Connections'
    },
    {
      id: 2,
      title: 'Leverage Stanford Alumni Network',
      description: 'Your MBA connection could help reach decision makers at target companies.',
      strength: 'Medium Priority',
      action: 'Explore Alumni'
    },
    {
      id: 3,
      title: 'Industry Conference Attendees',
      description: 'Connect with professionals who attended recent product management conferences.',
      strength: 'Low Priority',
      action: 'View Events'
    }
  ];

  const connectionAnalysis = [
    {
      company: 'Google',
      connections: 12,
      pathLength: '2-3 degrees',
      keyContacts: ['Product Manager', 'Engineering Director'],
      opportunity: 'Strong'
    },
    {
      company: 'Meta',
      connections: 8,
      pathLength: '3-4 degrees',
      keyContacts: ['VP Product', 'Senior Designer'],
      opportunity: 'Medium'
    },
    {
      company: 'Microsoft',
      connections: 15,
      pathLength: '2 degrees',
      keyContacts: ['Principal PM', 'Engineering Manager'],
      opportunity: 'Very Strong'
    }
  ];

  const industryInsights = [
    {
      title: 'Product Management Trends',
      insight: 'AI integration is the top skill mentioned in 73% of PM job postings this quarter.',
      relevance: 'High',
      action: 'Update your profile to highlight AI/ML experience'
    },
    {
      title: 'Hiring Patterns',
      insight: 'Companies are prioritizing PMs with cross-functional leadership experience.',
      relevance: 'Medium',
      action: 'Emphasize your collaboration with engineering and design teams'
    },
    {
      title: 'Salary Benchmarks',
      insight: 'Senior PM salaries in SF have increased 12% year-over-year.',
      relevance: 'Medium',
      action: 'Review compensation expectations for upcoming opportunities'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-medium text-foreground">AI Networking Hub</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Leverage artificial intelligence to optimize your networking strategy, discover opportunities, 
          and make smarter connection decisions.
        </p>
      </div>

      {/* AI Query Input */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Ask Your AI Networking Assistant
          </CardTitle>
          <CardDescription>
            Get personalized networking advice based on your profile and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Ask about networking strategies, introduction approaches, or career opportunities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button className="stat-card-primary border-0 px-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">How do I approach VPs?</Badge>
            <Badge variant="secondary">Best intro timing?</Badge>
            <Badge variant="secondary">Industry connections</Badge>
            <Badge variant="secondary">Follow-up strategies</Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Connection Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Industry Insights
          </TabsTrigger>
          <TabsTrigger value="smart-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Smart Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-foreground">Personalized Networking Recommendations</h2>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Brain className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            
            {aiSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="premium-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-foreground">{suggestion.title}</h3>
                        <Badge 
                          variant={suggestion.strength === 'High Priority' ? 'default' : 'secondary'}
                          className={suggestion.strength === 'High Priority' ? 'bg-success text-success-foreground' : ''}
                        >
                          {suggestion.strength}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button size="sm" className="stat-card-primary border-0">
                      {suggestion.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-foreground">Target Company Analysis</h2>
            
            {connectionAnalysis.map((company, index) => (
              <Card key={index} className="premium-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-medium text-foreground">{company.company}</h3>
                        <Badge 
                          className={
                            company.opportunity === 'Very Strong' ? 'bg-success/10 text-success border-success/20' :
                            company.opportunity === 'Strong' ? 'bg-primary/10 text-primary border-primary/20' :
                            'bg-secondary'
                          }
                        >
                          {company.opportunity} Opportunity
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Network Connections</p>
                          <p className="font-medium text-foreground">{company.connections} people</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Path Length</p>
                          <p className="font-medium text-foreground">{company.pathLength}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Key Contacts</p>
                          <p className="font-medium text-foreground">{company.keyContacts.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      <Target className="h-4 w-4 mr-2" />
                      Explore Paths
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-foreground">AI-Generated Industry Insights</h2>
            
            {industryInsights.map((insight, index) => (
              <Card key={index} className="premium-card border-0">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{insight.title}</h3>
                      <Badge variant={insight.relevance === 'High' ? 'default' : 'secondary'}>
                        {insight.relevance} Relevance
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{insight.insight}</p>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">Recommended Action:</p>
                      <p className="text-sm text-muted-foreground">{insight.action}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="smart-search" className="space-y-6">
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                AI-Enhanced Connection Search
              </CardTitle>
              <CardDescription>
                Find connections using natural language queries and AI-powered matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Input 
                  placeholder="Find product managers at unicorn startups in SF who went to top MBA programs"
                  className="text-sm"
                />
                <Button className="stat-card-primary border-0">
                  <Brain className="h-4 w-4 mr-2" />
                  Smart Search
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Example Queries:</h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">VPs at enterprise software companies</Badge>
                    <Badge variant="outline" className="text-xs">Stanford alumni in VC</Badge>
                    <Badge variant="outline" className="text-xs">Former consultants now in tech</Badge>
                    <Badge variant="outline" className="text-xs">Women leaders in AI/ML</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">AI Features:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-primary" />
                      Natural language understanding
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-primary" />
                      Context-aware matching
                    </div>
                    <div className="flex items-center gap-2">
                      <Network className="h-3 w-3 text-primary" />
                      Relationship strength scoring
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-primary" />
                      Strategic introduction paths
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground">AI Introduction Writer</h3>
            <p className="text-sm text-muted-foreground">Generate personalized introduction messages</p>
          </CardContent>
        </Card>

        <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 bg-success/10 rounded-lg w-fit mx-auto">
              <BookOpen className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-medium text-foreground">Networking Strategies</h3>
            <p className="text-sm text-muted-foreground">Learn AI-recommended networking approaches</p>
          </CardContent>
        </Card>

        <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 bg-warning/10 rounded-lg w-fit mx-auto">
              <Users className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-medium text-foreground">Network Analysis</h3>
            <p className="text-sm text-muted-foreground">Get insights on your connection portfolio</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AINetworkingHubModern;