import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Search, Network, Linkedin, Users, TrendingUp } from 'lucide-react';

interface SemanticSearchResult {
  personId: string;
  name: string;
  company: string;
  title: string;
  relevanceScore: number;
  matchingFactors: string[];
}

interface ConnectionAnalysis {
  connectionScore: number;
  introductionPath: string[];
  recommendedApproach: string;
  conversationStarters: string[];
  mutualInterests: string[];
  strengthFactors: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
}

interface NetworkingStrategy {
  strategy: string;
  actionItems: string[];
  prioritizedConnections: Array<{
    personId: string;
    name: string;
    company: string;
    priority: number;
    reasoning: string;
  }>;
}

export default function AIDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [connectionAnalysis, setConnectionAnalysis] = useState<ConnectionAnalysis | null>(null);
  const [networkingStrategy, setNetworkingStrategy] = useState<NetworkingStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState<any>(null);

  const performSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo'
        },
        body: JSON.stringify({
          query: searchQuery,
          userContext: {
            industry: 'Technology',
            location: 'San Francisco, CA'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeConnection = async (targetPersonId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo'
        },
        body: JSON.stringify({
          fromPersonId: 'demo_user_1',
          toPersonId: targetPersonId,
          context: 'exploring collaboration opportunities'
        })
      });

      const data = await response.json();
      if (data.success) {
        setConnectionAnalysis(data.data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStrategy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/networking-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo'
        },
        body: JSON.stringify({
          personId: 'demo_user_1',
          goals: ['expand network in AI/ML space', 'find technical co-founder', 'build partnerships'],
          timeframe: '3 months'
        })
      });

      const data = await response.json();
      if (data.success) {
        setNetworkingStrategy(data.data);
      }
    } catch (error) {
      console.error('Strategy error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startLinkedInIntegration = () => {
    window.location.href = '/auth/linkedin';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          WarmConnector AI Demo
        </h1>
        <p className="text-xl text-muted-foreground">
          Experience AI-powered connection intelligence and real-time LinkedIn data ingestion
        </p>
      </div>

      {/* Semantic Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI-Powered Semantic Search
          </CardTitle>
          <CardDescription>
            Find professionals using natural language queries with intelligent matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'software engineer at Google working on AI'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSemanticSearch()}
            />
            <Button onClick={performSemanticSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Search Results:</h3>
              {searchResults.map((result) => (
                <Card key={result.personId} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{result.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.title} at {result.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {result.relevanceScore}% match
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => analyzeConnection(result.personId)}
                      >
                        Analyze Connection
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.matchingFactors.map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Analysis Section */}
      {connectionAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Connection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Connection Score</Label>
                <div className="text-2xl font-bold text-green-600">
                  {connectionAnalysis.connectionScore}/100
                </div>
              </div>
              <div>
                <Label className="font-semibold">Risk Level</Label>
                <Badge 
                  variant={connectionAnalysis.riskAssessment.level === 'LOW' ? 'default' : 'destructive'}
                >
                  {connectionAnalysis.riskAssessment.level}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="font-semibold">Introduction Path</Label>
              <p className="text-sm text-muted-foreground">
                {connectionAnalysis.introductionPath.join(' → ')}
              </p>
            </div>

            <div>
              <Label className="font-semibold">Recommended Approach</Label>
              <p className="text-sm">{connectionAnalysis.recommendedApproach}</p>
            </div>

            <div>
              <Label className="font-semibold">Conversation Starters</Label>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {connectionAnalysis.conversationStarters.map((starter, idx) => (
                  <li key={idx}>{starter}</li>
                ))}
              </ul>
            </div>

            <div>
              <Label className="font-semibold">Mutual Interests</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {connectionAnalysis.mutualInterests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Networking Strategy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Networking Strategy Generator
          </CardTitle>
          <CardDescription>
            Generate personalized networking strategies based on your goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateStrategy} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Strategy'}
          </Button>

          {networkingStrategy && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Strategy Overview</Label>
                <p className="text-sm mt-1">{networkingStrategy.strategy}</p>
              </div>

              <div>
                <Label className="font-semibold">Action Items</Label>
                <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                  {networkingStrategy.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <Label className="font-semibold">Prioritized Connections</Label>
                <div className="space-y-2 mt-1">
                  {networkingStrategy.prioritizedConnections.map((conn, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{conn.name}</h4>
                          <p className="text-sm text-muted-foreground">{conn.company}</p>
                          <p className="text-sm">{conn.reasoning}</p>
                        </div>
                        <Badge>Priority {conn.priority}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Integration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" />
            LinkedIn Data Ingestion
          </CardTitle>
          <CardDescription>
            Connect your LinkedIn account for real-time professional data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={startLinkedInIntegration}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Connect LinkedIn Account
          </Button>

          {linkedinStatus && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">LinkedIn Integration Active</h4>
              <p className="text-sm text-green-700">
                Profiles ingested: {linkedinStatus.profilesIngested} | 
                Connections found: {linkedinStatus.connectionsFound}
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Real-time features available:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Automatic profile synchronization</li>
              <li>Connection relationship detection</li>
              <li>Company employee mapping</li>
              <li>Professional data enrichment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}