import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Send, Lightbulb } from 'lucide-react';

interface QueryResult {
  question: string;
  answer: string;
  success: boolean;
  error?: string;
}

export default function SimpleAIAssistant() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{question: string, answer: string}>>([]);

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
    onSuccess: (data: QueryResult) => {
      setConversation(prev => [...prev, { question: data.question, answer: data.answer }]);
      setQuestion('');
    },
    onError: (error: any) => {
      console.error('Query failed:', error);
    }
  });

  const handleSubmit = () => {
    if (!question.trim()) return;
    queryMutation.mutate({ question });
  };

  const suggestedQuestions = [
    "How do I write effective LinkedIn connection requests?",
    "What are the best networking strategies for introverts?",
    "How should I follow up after meeting someone at a conference?",
    "What's the best way to ask for an introduction?"
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Networking Assistant</h1>
        <p className="text-gray-600">Get expert advice on professional networking and relationship building</p>
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="space-y-4 mb-8">
          {conversation.map((item, index) => (
            <div key={index} className="space-y-3">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-1" />
                    <p className="text-blue-900">{item.question}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2">
                    <Star className="h-4 w-4 text-purple-600 mt-1" />
                    <div className="text-gray-700 whitespace-pre-wrap">{item.answer}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Question Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Ask a Question
          </CardTitle>
          <CardDescription>
            Get personalized networking advice based on proven strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I network effectively at industry events?"
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmit}
              disabled={queryMutation.isPending || !question.trim()}
              className="w-full"
            >
              {queryMutation.isPending ? 'Getting advice...' : 'Get Advice'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      {conversation.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Popular Questions
            </CardTitle>
            <CardDescription>
              Click any question to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {suggestedQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start h-auto p-3"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}