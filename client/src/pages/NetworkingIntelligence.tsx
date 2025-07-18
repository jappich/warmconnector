import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, FileText, Search, TrendingUp, Users, Lightbulb, Upload, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RagStats {
  totalDocuments: number;
  documentTypes: Record<string, number>;
  haystackVersion: string;
  embeddingModel: string;
  llmModel: string;
}

interface QueryResult {
  question: string;
  answer: string;
  retrievedDocuments: Array<{
    content: string;
    metadata: any;
    score: number;
    reasoning: string;
  }>;
  success: boolean;
  error?: string;
}

const NetworkingIntelligence: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documentSource, setDocumentSource] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [analysisContent, setAnalysisContent] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch RAG system statistics
  const { data: stats, isLoading: statsLoading } = useQuery<{ success: boolean; stats: RagStats }>({
    queryKey: ['/api/haystack/stats'],
    refetchInterval: 30000
  });

  // Query the RAG pipeline
  const queryMutation = useMutation({
    mutationFn: async (data: { question: string }) => {
      const response = await fetch('/api/haystack/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Query failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Query processed",
        description: "Your networking question has been analyzed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Query failed",
        description: error.message || "Failed to process your question",
        variant: "destructive",
      });
    }
  });

  // Ingest new documents
  const ingestMutation = useMutation({
    mutationFn: async (data: { content: string; metadata: any }) => {
      const response = await fetch('/api/haystack/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Document ingestion failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document processed",
        description: "Your document has been added to the knowledge base.",
      });
      setDocumentContent('');
      setDocumentSource('');
      setDocumentType('');
      queryClient.invalidateQueries({ queryKey: ['/api/haystack/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    }
  });

  // Analyze networking content
  const analyzeMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await fetch('/api/haystack/networking/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis complete",
        description: "Your networking content has been analyzed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze content",
        variant: "destructive",
      });
    }
  });

  const handleQuery = () => {
    if (!question.trim()) return;
    queryMutation.mutate({ question });
  };

  const handleIngest = () => {
    if (!documentContent.trim() || !documentSource.trim() || !documentType) return;
    
    ingestMutation.mutate({
      content: documentContent,
      metadata: {
        source: documentSource,
        type: documentType,
        timestamp: new Date()
      }
    });
  };

  const handleAnalyze = () => {
    if (!analysisContent.trim()) return;
    analyzeMutation.mutate({ content: analysisContent });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Networking Intelligence
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered networking insights using advanced document processing and semantic search
          </p>
        </motion.div>

        {/* Statistics Dashboard */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Knowledge Base Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : stats?.stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.stats.totalDocuments}</div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{stats.stats.embeddingModel}</div>
                    <div className="text-sm text-muted-foreground">Embedding Model</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{stats.stats.llmModel}</div>
                    <div className="text-sm text-muted-foreground">LLM Model</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to load statistics</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Query Interface */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Ask Networking Questions</span>
                </CardTitle>
                <CardDescription>
                  Get expert advice on professional networking strategies and best practices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    placeholder="e.g., How do I write an effective LinkedIn connection request?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleQuery}
                  disabled={!question.trim() || queryMutation.isPending}
                  className="w-full"
                >
                  {queryMutation.isPending ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </Button>

                {/* Query Results */}
                {queryMutation.data && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Answer
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{queryMutation.data.answer}</p>
                    </div>

                    {queryMutation.data.retrievedDocuments?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Source Documents</h4>
                        <div className="space-y-2">
                          {queryMutation.data.retrievedDocuments.map((doc: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">{doc.metadata.type}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Score: {(doc.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{doc.reasoning}</p>
                              <p className="text-xs">{doc.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Ingestion */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Add Knowledge</span>
                </CardTitle>
                <CardDescription>
                  Add new documents to expand the networking knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documentContent">Document Content</Label>
                  <Textarea
                    id="documentContent"
                    placeholder="Paste your networking guide, email template, or professional advice..."
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g., LinkedIn Guide 2024"
                      value={documentSource}
                      onChange={(e) => setDocumentSource(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="networking_guide">Networking Guide</SelectItem>
                        <SelectItem value="resume">Resume</SelectItem>
                        <SelectItem value="linkedin">LinkedIn Profile</SelectItem>
                        <SelectItem value="email">Email Template</SelectItem>
                        <SelectItem value="company_report">Company Report</SelectItem>
                        <SelectItem value="social_post">Social Media Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleIngest}
                  disabled={!documentContent.trim() || !documentSource.trim() || !documentType || ingestMutation.isPending}
                  className="w-full"
                >
                  {ingestMutation.isPending ? (
                    <>
                      <FileText className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Add to Knowledge Base
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Networking Analysis */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Networking Situation Analysis</span>
              </CardTitle>
              <CardDescription>
                Describe a networking scenario for strategic advice and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="analysisContent">Describe Your Situation</Label>
                <Textarea
                  id="analysisContent"
                  placeholder="e.g., I want to connect with a VP at a target company but don't have any mutual connections..."
                  value={analysisContent}
                  onChange={(e) => setAnalysisContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!analysisContent.trim() || analyzeMutation.isPending}
                className="w-full"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Situation
                  </>
                )}
              </Button>

              {/* Analysis Results */}
              {analyzeMutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-50 rounded-lg"
                >
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Strategic Analysis
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{analyzeMutation.data.answer}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NetworkingIntelligence;