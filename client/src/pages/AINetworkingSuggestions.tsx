import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Users, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  Lightbulb,
  Star,
  Building2,
  Mail,
  Loader2
} from "lucide-react";

interface NetworkingSuggestion {
  person: {
    id: string;
    name: string;
    title?: string;
    company?: string;
    email?: string;
  };
  reason: string;
  confidence: number;
  suggestedApproach: string;
  commonInterests: string[];
  potentialValue: string;
  connectionType: string;
}

interface AINetworkingInsight {
  suggestions: NetworkingSuggestion[];
  strategicInsights: string[];
  networkingGoals: string[];
  industryTrends: string[];
}

export default function AINetworkingSuggestions() {
  const [userGoals, setUserGoals] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, error } = useQuery<{
    success: boolean;
    data: AINetworkingInsight;
    message: string;
  }>({
    queryKey: ['/api/ai/networking-suggestions', userGoals, industryFocus],
    enabled: false // Only run when manually triggered
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (params: { userGoals: string; industryFocus: string }) => {
      const response = await fetch('/api/ai/networking-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/ai/networking-suggestions', userGoals, industryFocus], data);
    }
  });

  const handleGenerateSuggestions = () => {
    generateSuggestionsMutation.mutate({
      userGoals: userGoals.trim(),
      industryFocus: industryFocus.trim()
    });
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'bg-green-100 text-green-800';
      case 'mutual_connection': return 'bg-blue-100 text-blue-800';
      case 'industry_peer': return 'bg-purple-100 text-purple-800';
      case 'skill_complement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-white">AI-Powered Networking Suggestions</h1>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Get personalized networking recommendations based on your goals and industry focus. 
          Our AI analyzes your profile and suggests valuable connections.
        </p>
      </div>

      {/* Input Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Your Networking Goals</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Tell us about your professional goals and industry focus for personalized suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goals" className="text-gray-300">Professional Goals</Label>
            <Textarea
              id="goals"
              placeholder="e.g., Looking to advance to senior management, explore new opportunities in fintech, build partnerships..."
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-gray-300">Industry Focus (Optional)</Label>
            <Input
              id="industry"
              placeholder="e.g., Technology, Finance, Healthcare, Marketing..."
              value={industryFocus}
              onChange={(e) => setIndustryFocus(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          
          <Button 
            onClick={handleGenerateSuggestions}
            disabled={!userGoals.trim() || generateSuggestionsMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generateSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Suggestions...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Networking Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error State */}
      {(error || generateSuggestionsMutation.error) && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6">
            <p className="text-red-400">
              {error?.message || generateSuggestionsMutation.error?.message || 'Failed to generate suggestions'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {suggestions?.data && (
        <div className="space-y-6">
          {/* Strategic Insights */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Strategic Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.data.strategicInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Networking Goals */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <span>Recommended Networking Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {suggestions.data.networkingGoals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                    <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-gray-300">{goal}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Trends */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span>Industry Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.data.industryTrends.map((trend, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <TrendingUp className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-300">{trend}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connection Suggestions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Personalized Connection Suggestions</span>
            </h2>
            
            {suggestions.data.suggestions.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No connection suggestions found. Try adjusting your goals or industry focus.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {suggestions.data.suggestions.map((suggestion, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Person Info */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-white">{suggestion.person.name}</h3>
                            {suggestion.person.title && (
                              <p className="text-gray-400">{suggestion.person.title}</p>
                            )}
                            {suggestion.person.company && (
                              <div className="flex items-center space-x-2 text-gray-400">
                                <Building2 className="h-4 w-4" />
                                <span>{suggestion.person.company}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div className={`text-lg font-bold ${getConfidenceColor(suggestion.confidence)}`}>
                              {suggestion.confidence}% Match
                            </div>
                            <Badge className={getConnectionTypeColor(suggestion.connectionType)}>
                              {suggestion.connectionType.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="bg-gray-600" />

                        {/* Reason & Value */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-white mb-2">Why This Connection Matters</h4>
                            <p className="text-gray-300">{suggestion.reason}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-white mb-2">Potential Value</h4>
                            <p className="text-gray-300">{suggestion.potentialValue}</p>
                          </div>
                        </div>

                        {/* Common Interests */}
                        {suggestion.commonInterests.length > 0 && (
                          <div>
                            <h4 className="font-medium text-white mb-2">Common Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.commonInterests.map((interest, idx) => (
                                <Badge key={idx} variant="outline" className="text-gray-300 border-gray-600">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Approach */}
                        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                          <h4 className="font-medium text-blue-300 mb-2 flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Suggested Approach</span>
                          </h4>
                          <p className="text-blue-100">{suggestion.suggestedApproach}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Connect
                          </Button>
                          {suggestion.person.email && (
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            <Star className="mr-2 h-4 w-4" />
                            Save for Later
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}