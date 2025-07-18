import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Users, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Star,
  Eye,
  MessageSquare,
  X,
  ArrowRight,
  Building2,
  User,
  Lightbulb
} from 'lucide-react';

interface NetworkingSuggestion {
  id: string;
  type: 'introduction' | 'reconnect' | 'follow_up' | 'strategic_connect' | 'event_opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  actionItems: string[];
  targetPerson?: {
    id: string;
    name: string;
    company?: string;
    title?: string;
  };
  connectorPerson?: {
    id: string;
    name: string;
    company?: string;
    title?: string;
  };
  context: {
    relationshipType?: string;
    mutualConnections?: number;
    recentActivity?: string;
    industry?: string;
    location?: string;
  };
  estimatedValue: number;
  confidence: number;
  createdAt: Date;
}

interface UserContext {
  currentGoals: string[];
  industry: string;
  role: string;
  company: string;
  interests: string[];
  recentActivity: string;
  maxSuggestions: number;
}

export default function ContextualNetworkingSuggestions() {
  const [userContext, setUserContext] = useState<UserContext>({
    currentGoals: [],
    industry: '',
    role: '',
    company: '',
    interests: [],
    recentActivity: '',
    maxSuggestions: 5
  });
  
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate suggestions query
  const { data: suggestionsData, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ['/api/networking/contextual-suggestions', userContext],
    enabled: false // Manual trigger
  });

  // Track action mutation
  const trackActionMutation = useMutation({
    mutationFn: async ({ suggestionId, action, metadata }: any) => {
      const response = await fetch('/api/networking/track-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, action, metadata })
      });
      
      if (!response.ok) {
        throw new Error('Failed to track action');
      }
      
      return response.json();
    }
  });

  const handleGenerateSuggestions = async () => {
    try {
      const response = await fetch('/api/networking/contextual-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userContext)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }
      
      const data = await response.json();
      queryClient.setQueryData(['/api/networking/contextual-suggestions', userContext], data);
      
      toast({
        title: "Suggestions Generated",
        description: `Generated ${data.suggestions.length} personalized networking suggestions`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate networking suggestions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTrackAction = (suggestionId: string, action: string, metadata?: any) => {
    trackActionMutation.mutate({ suggestionId, action, metadata });
  };

  const addGoal = () => {
    if (goalInput.trim() && !userContext.currentGoals.includes(goalInput.trim())) {
      setUserContext(prev => ({
        ...prev,
        currentGoals: [...prev.currentGoals, goalInput.trim()]
      }));
      setGoalInput('');
    }
  };

  const removeGoal = (goal: string) => {
    setUserContext(prev => ({
      ...prev,
      currentGoals: prev.currentGoals.filter(g => g !== goal)
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !userContext.interests.includes(interestInput.trim())) {
      setUserContext(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setUserContext(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'introduction': return <Users className="h-4 w-4" />;
      case 'reconnect': return <RefreshCw className="h-4 w-4" />;
      case 'follow_up': return <MessageSquare className="h-4 w-4" />;
      case 'strategic_connect': return <Target className="h-4 w-4" />;
      case 'event_opportunity': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const suggestions: NetworkingSuggestion[] = suggestionsData?.suggestions || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Networking Suggestions</h1>
          <p className="text-muted-foreground">
            Get personalized networking recommendations based on your goals and context
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI-Enhanced
        </Badge>
      </div>

      {/* User Context Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Networking Context
          </CardTitle>
          <CardDescription>
            Provide context about your current situation and goals to get better suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={userContext.company}
                onChange={(e) => setUserContext(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your current company"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role/Title</Label>
              <Input
                id="role"
                value={userContext.role}
                onChange={(e) => setUserContext(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Your current role"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={userContext.industry} onValueChange={(value) => setUserContext(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxSuggestions">Max Suggestions</Label>
              <Select 
                value={userContext.maxSuggestions.toString()} 
                onValueChange={(value) => setUserContext(prev => ({ ...prev, maxSuggestions: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 suggestions</SelectItem>
                  <SelectItem value="5">5 suggestions</SelectItem>
                  <SelectItem value="8">8 suggestions</SelectItem>
                  <SelectItem value="10">10 suggestions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Goals */}
          <div className="space-y-2">
            <Label>Current Goals</Label>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a networking goal..."
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              />
              <Button onClick={addGoal} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userContext.currentGoals.map((goal) => (
                <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                  {goal}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeGoal(goal)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Professional Interests</Label>
            <div className="flex gap-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add an interest..."
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userContext.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="flex items-center gap-1">
                  {interest}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeInterest(interest)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <Label htmlFor="recentActivity">Recent Activity/Context</Label>
            <Textarea
              id="recentActivity"
              value={userContext.recentActivity}
              onChange={(e) => setUserContext(prev => ({ ...prev, recentActivity: e.target.value }))}
              placeholder="Describe recent work, projects, or networking activities..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerateSuggestions}
            disabled={suggestionsLoading}
            className="w-full"
          >
            {suggestionsLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions Results */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Networking Suggestions</h2>
            <Badge variant="secondary">
              {suggestions.length} suggestions generated
            </Badge>
          </div>

          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSuggestionTypeIcon(suggestion.type)}
                    <div>
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{suggestion.estimatedValue}/10</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-sm">{Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExpandedSuggestion(
                        expandedSuggestion === suggestion.id ? null : suggestion.id
                      );
                      handleTrackAction(suggestion.id, 'viewed');
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                
                {suggestion.targetPerson && (
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{suggestion.targetPerson.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.targetPerson.title} at {suggestion.targetPerson.company}
                        </div>
                      </div>
                    </div>
                    {suggestion.connectorPerson && (
                      <>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{suggestion.connectorPerson.name}</div>
                            <div className="text-sm text-muted-foreground">Connector</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {expandedSuggestion === suggestion.id && (
                  <div className="space-y-4">
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Why This Suggestion?</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {suggestion.actionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleTrackAction(suggestion.id, 'initiated', { source: 'suggestions_page' })}
                      >
                        Take Action
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackAction(suggestion.id, 'dismissed')}
                      >
                        Not Interested
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !suggestionsLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Suggestions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Fill out your context and click "Generate AI Suggestions" to get personalized networking recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}