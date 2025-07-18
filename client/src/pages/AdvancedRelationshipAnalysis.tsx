import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Shield, 
  TrendingUp, 
  Zap,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Linkedin
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinkedInIntegration from '@/components/LinkedInIntegration';

interface ExecutiveAssistant {
  assistantId: string;
  assistantName: string;
  assistantTitle: string;
  executiveId: string;
  executiveName: string;
  executiveTitle: string;
  company: string;
  confidence: number;
  accessLevel: 'direct' | 'screened' | 'gatekeeper';
}

interface ProcurementContact {
  contactId: string;
  name: string;
  title: string;
  company: string;
  department: string;
  seniorityLevel: string;
  decisionAuthority: number;
}

interface BoardMember {
  personId: string;
  name: string;
  currentCompany: string;
  title: string;
  boardIndicators: string[];
  confidence: number;
}

export default function AdvancedRelationshipAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: analysisData, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/analyze-relationships'],
    enabled: false
  });

  const analyzeRelationships = async () => {
    setIsAnalyzing(true);
    try {
      await refetchAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createAdvancedRelationshipsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/create-advanced-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph-stats'] });
    }
  });

  const handleCreateRelationships = async () => {
    setIsCreating(true);
    try {
      await createAdvancedRelationshipsMutation.mutateAsync();
    } finally {
      setIsCreating(false);
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'direct': return 'bg-green-100 text-green-800';
      case 'screened': return 'bg-yellow-100 text-yellow-800';
      case 'gatekeeper': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeniorityColor = (level: string) => {
    switch (level) {
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'coordinator': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-dark/95 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Advanced Relationship Analysis
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover high-impact professional connections: Executive Assistants, Procurement Networks, and Board Members
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              onClick={analyzeRelationships}
              disabled={isAnalyzing}
              className="bg-cosmic-primary hover:bg-cosmic-primary/80"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Existing Data
                </>
              )}
            </Button>
            
            {analysisData && (
              <Button 
                onClick={handleCreateRelationships}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Relationships
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analysisData && (
          <Tabs defaultValue="assistants" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-cosmic-card border border-cosmic-border">
              <TabsTrigger value="assistants" className="text-cosmic-text data-[state=active]:bg-cosmic-primary">
                Executive Assistants
              </TabsTrigger>
              <TabsTrigger value="procurement" className="text-cosmic-text data-[state=active]:bg-cosmic-primary">
                Procurement
              </TabsTrigger>
              <TabsTrigger value="board" className="text-cosmic-text data-[state=active]:bg-cosmic-primary">
                Board Members
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="text-cosmic-text data-[state=active]:bg-cosmic-primary">
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-cosmic-text data-[state=active]:bg-cosmic-primary">
                Patterns
              </TabsTrigger>
            </TabsList>

            {/* Executive Assistants Tab */}
            <TabsContent value="assistants" className="space-y-4">
              <Card className="bg-cosmic-card border-cosmic-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cosmic-text">
                    <Users className="h-5 w-5 text-cosmic-accent" />
                    Executive Assistant Relationships
                  </CardTitle>
                  <CardDescription className="text-cosmic-muted">
                    Identified {analysisData.analysis?.executiveAssistants?.length || 0} potential executive assistant relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysisData.analysis?.executiveAssistants?.map((assistant: ExecutiveAssistant) => (
                      <div key={assistant.assistantId} className="border border-cosmic-border rounded-lg p-4 bg-cosmic-dark/30">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-cosmic-text">{assistant.assistantName}</h3>
                              <Badge className={getAccessLevelColor(assistant.accessLevel)}>
                                {assistant.accessLevel}
                              </Badge>
                              <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                                {assistant.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-cosmic-muted">{assistant.assistantTitle}</p>
                            <div className="text-sm text-cosmic-text">
                              <span className="font-medium">Supports:</span> {assistant.executiveName} ({assistant.executiveTitle})
                            </div>
                            <div className="text-sm text-cosmic-muted">
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {assistant.company}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              High Impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Procurement Tab */}
            <TabsContent value="procurement" className="space-y-4">
              <Card className="bg-cosmic-card border-cosmic-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cosmic-text">
                    <Briefcase className="h-5 w-5 text-cosmic-accent" />
                    Procurement Contacts
                  </CardTitle>
                  <CardDescription className="text-cosmic-muted">
                    Found {analysisData.analysis?.procurementContacts?.length || 0} procurement decision makers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysisData.analysis?.procurementContacts?.map((contact: ProcurementContact) => (
                      <div key={contact.contactId} className="border border-cosmic-border rounded-lg p-4 bg-cosmic-dark/30">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-cosmic-text">{contact.name}</h3>
                              <Badge className={getSeniorityColor(contact.seniorityLevel)}>
                                {contact.seniorityLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-cosmic-muted">{contact.title}</p>
                            <div className="text-sm text-cosmic-text">
                              <span className="font-medium">Department:</span> {contact.department}
                            </div>
                            <div className="text-sm text-cosmic-muted">
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {contact.company}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge className="bg-blue-100 text-blue-800">
                              {contact.decisionAuthority}% Authority
                            </Badge>
                            {contact.decisionAuthority > 70 && (
                              <Badge className="bg-green-100 text-green-800 block">
                                Key Decision Maker
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Board Members Tab */}
            <TabsContent value="board" className="space-y-4">
              <Card className="bg-cosmic-card border-cosmic-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cosmic-text">
                    <Shield className="h-5 w-5 text-cosmic-accent" />
                    Board Member Networks
                  </CardTitle>
                  <CardDescription className="text-cosmic-muted">
                    Identified {analysisData.analysis?.boardMembers?.length || 0} potential board members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysisData.analysis?.boardMembers?.map((member: BoardMember) => (
                      <div key={member.personId} className="border border-cosmic-border rounded-lg p-4 bg-cosmic-dark/30">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-cosmic-text">{member.name}</h3>
                              <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                                {member.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-cosmic-muted">{member.title}</p>
                            <div className="text-sm text-cosmic-muted">
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {member.currentCompany}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {member.boardIndicators.map((indicator, index) => (
                                <Badge key={index} className="bg-purple-100 text-purple-800 text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-purple-100 text-purple-800">
                              Board Network
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LinkedIn Integration Tab */}
            <TabsContent value="linkedin" className="space-y-4">
              <LinkedInIntegration />
            </TabsContent>

            {/* Title Patterns Tab */}
            <TabsContent value="patterns" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-cosmic-card border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-cosmic-text">Executive Assistants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.analysis?.titlePatterns?.executiveAssistants?.slice(0, 5).map((pattern: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-cosmic-text">{pattern.title}</span>
                          <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                            {pattern.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-card border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-cosmic-text">Procurement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.analysis?.titlePatterns?.procurement?.slice(0, 5).map((pattern: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-cosmic-text">{pattern.title}</span>
                          <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                            {pattern.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-card border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-cosmic-text">Customer Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.analysis?.titlePatterns?.customerSuccess?.slice(0, 5).map((pattern: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-cosmic-text">{pattern.title}</span>
                          <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                            {pattern.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-card border-cosmic-border">
                  <CardHeader>
                    <CardTitle className="text-cosmic-text">Board Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.analysis?.titlePatterns?.boardMembers?.slice(0, 5).map((pattern: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-cosmic-text">{pattern.title}</span>
                          <Badge variant="outline" className="text-cosmic-text border-cosmic-border">
                            {pattern.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Success Message */}
        {createAdvancedRelationshipsMutation.isSuccess && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Successfully created {createAdvancedRelationshipsMutation.data?.createdCount} advanced relationships!
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {createAdvancedRelationshipsMutation.isError && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Error creating relationships. Please try again.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}