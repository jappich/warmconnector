import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface BusinessProfile {
  id: number;
  userId: string;
  hometown?: string;
  almaMater?: string;
  pastCompanies: string[];
  currentDeals: string[];
  hobbies: string[];
  lastLLMVectorId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  vectorId?: string;
  createdAt: string;
}

interface OnboardingQuestion {
  key: keyof BusinessProfile;
  question: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'array';
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    key: 'hometown',
    question: 'What city do you call home?',
    placeholder: 'e.g., San Francisco, New York',
    type: 'text'
  },
  {
    key: 'almaMater',
    question: "Where'd you study?",
    placeholder: 'e.g., Stanford University, Harvard Business School',
    type: 'text'
  },
  {
    key: 'pastCompanies',
    question: 'Which companies have you worked at?',
    placeholder: 'e.g., Google, Apple, Tesla (separate with commas)',
    type: 'array'
  },
  {
    key: 'currentDeals',
    question: 'What deals or projects are top-of-mind right now?',
    placeholder: 'e.g., Series A fundraising, Product launch Q2',
    type: 'array'
  },
  {
    key: 'hobbies',
    question: 'Any hobbies or personal passions we can use as ice-breakers?',
    placeholder: 'e.g., Rock climbing, Photography, Cooking',
    type: 'array'
  }
];

export default function BusinessChatFriend() {
  const [isManuallyVisible, setIsManuallyVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Partial<BusinessProfile>>({
    pastCompanies: [],
    currentDeals: [],
    hobbies: []
  });
  const [currentInput, setCurrentInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check user onboarding status
  const { data: user } = useQuery<{ user: { id: string; onboardingComplete: boolean } | null }>({
    queryKey: ['/api/auth/user']
  });

  // Get business profile
  const { data: businessProfile } = useQuery({
    queryKey: ['/api/business-profile'],
    enabled: Boolean(user?.user)
  });

  // Get chat messages
  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat-messages'],
    enabled: Boolean(user?.user?.onboardingComplete)
  });

  // Save onboarding progress
  const saveProfileMutation = useMutation({
    mutationFn: async (data: Partial<BusinessProfile>) => {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-profile'] });
    }
  });

  // Send chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-messages'] });
      setChatInput('');
    }
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to complete onboarding');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Welcome!",
        description: "Your onboarding is complete. Alex is ready to help you network!"
      });
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleOnboardingNext = async () => {
    const question = ONBOARDING_QUESTIONS[currentQuestion];
    let value: any = currentInput;

    if (question.type === 'array') {
      value = currentInput.split(',').map(item => item.trim()).filter(Boolean);
    }

    const updatedData = { ...onboardingData, [question.key]: value };
    setOnboardingData(updatedData);

    // Save progress
    await saveProfileMutation.mutateAsync(updatedData);

    if (currentQuestion < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentInput('');
    } else {
      // Complete onboarding
      await completeOnboardingMutation.mutateAsync();
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    await sendMessageMutation.mutateAsync(chatInput);
  };

  const isOnboarding = user?.user && !user.user.onboardingComplete;
  const needsBusinessProfile = isOnboarding && !businessProfile;
  
  // Auto-open widget for users who need business profile onboarding
  useEffect(() => {
    if (needsBusinessProfile) {
      setIsManuallyVisible(true);
    }
  }, [needsBusinessProfile]);
  
  // Show chat widget if user needs onboarding OR they manually opened it
  const shouldShowWidget = needsBusinessProfile || isManuallyVisible;

  if (!shouldShowWidget) {
    return (
      <Button
        onClick={() => setIsManuallyVisible(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 z-50 bg-card/95 backdrop-blur-xl border-border transition-all duration-300 shadow-2xl ${
      isMinimized ? 'h-16' : 'h-[500px]'
    }`}>
      <CardHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Alex - Business Assistant
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsManuallyVisible(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 h-full flex flex-col">
          {isOnboarding ? (
            // Onboarding Mode
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Question {currentQuestion + 1} of {ONBOARDING_QUESTIONS.length}
                </Badge>
              </div>
              
              <div className="flex-1">
                <Label className="text-foreground text-base mb-3 block">
                  {ONBOARDING_QUESTIONS[currentQuestion].question}
                </Label>
                
                {ONBOARDING_QUESTIONS[currentQuestion].type === 'textarea' ? (
                  <Textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={ONBOARDING_QUESTIONS[currentQuestion].placeholder}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                    rows={4}
                  />
                ) : (
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={ONBOARDING_QUESTIONS[currentQuestion].placeholder}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    onKeyDown={(e) => e.key === 'Enter' && handleOnboardingNext()}
                  />
                )}
              </div>

              <Button
                onClick={handleOnboardingNext}
                disabled={!currentInput.trim() || saveProfileMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              >
                {currentQuestion < ONBOARDING_QUESTIONS.length - 1 ? 'Next' : 'Complete Setup'}
              </Button>
            </div>
          ) : (
            // Chat Mode
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>👋 Hey there! I'm Alex, your business networking assistant.</p>
                    <p className="text-sm mt-2">Ask me about finding connections, intro strategies, or industry insights!</p>
                  </div>
                )}
                
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground border border-border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Alex anything about networking..."
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sendMessageMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}