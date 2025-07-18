import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  MessageSquare, 
  Clock,
  Sparkles,
  Network,
  TrendingUp,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface NetworkingAdviceRequest {
  message: string;
  context?: {
    targetPerson?: string;
    connectionPath?: string[];
    purpose?: string;
  };
}

const NETWORKING_PROMPTS = [
  {
    icon: <MessageSquare className="h-4 w-4" />,
    title: "Introduction Message",
    prompt: "Help me write a professional introduction message for a warm connection."
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: "Networking Event Prep",
    prompt: "How should I prepare for an upcoming networking event in my industry?"
  },
  {
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Follow-up Strategy",
    prompt: "What's the best way to follow up after meeting someone at a networking event?"
  },
  {
    icon: <Network className="h-4 w-4" />,
    title: "LinkedIn Outreach",
    prompt: "Help me craft a LinkedIn connection request that gets accepted."
  }
];

export default function NetworkingChatbot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history
  const { data: conversationHistory } = useQuery({
    queryKey: ['/api/networking/chat/history'],
  });

  useEffect(() => {
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      setMessages(conversationHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, [conversationHistory]);

  const sendMessageMutation = useMutation({
    mutationFn: (request: NetworkingAdviceRequest) =>
      apiRequest('/api/networking/chat/advice', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: (response) => {
      const newMessage: ChatMessage = {
        role: 'assistant',
        content: response.advice,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get networking advice. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const handleSendMessage = (messageText?: string) => {
    const messageToSend = messageText || currentMessage.trim();
    if (!messageToSend) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Send to API
    sendMessageMutation.mutate({
      message: messageToSend
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for better readability
    return content
      .split('\n\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {paragraph.split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < paragraph.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      ));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-2 mb-6">
        <Bot className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Networking AI Assistant</h1>
        <Badge variant="secondary" className="ml-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Prompts Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Get instant advice on common networking scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {NETWORKING_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleSendMessage(prompt.prompt)}
                  disabled={sendMessageMutation.isPending}
                >
                  <div className="flex items-start space-x-2">
                    <div className="mt-0.5">{prompt.icon}</div>
                    <div>
                      <div className="font-medium text-xs">{prompt.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {prompt.prompt}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat with Networking Expert
              </CardTitle>
              <CardDescription>
                Get personalized advice on professional networking, introductions, and relationship building
              </CardDescription>
            </CardHeader>
            
            <Separator />
            
            {/* Messages Area */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to your Networking AI Assistant
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      Ask me anything about professional networking, from crafting introduction messages 
                      to building meaningful business relationships. I'm here to help you connect better.
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 mb-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">
                        {formatMessageContent(message.content)}
                      </div>
                      <div className={`text-xs mt-2 flex items-center ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            <Separator />

            {/* Input Area */}
            <div className="p-4">
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for networking advice..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send • Ask about introductions, networking events, follow-ups, and more
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}