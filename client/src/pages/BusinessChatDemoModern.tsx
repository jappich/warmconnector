import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Brain, 
  Users, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  MessageSquare,
  Target,
  Network,
  Settings,
  Play
} from 'lucide-react';

const BusinessChatDemoModern: React.FC = () => {
  const [demoStep, setDemoStep] = useState(0);

  const features = [
    {
      icon: MessageCircle,
      title: 'Smart Onboarding',
      description: 'Five strategic questions to understand your background, goals, and networking needs.',
      color: 'text-primary'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'GPT-4o integration provides contextual networking advice based on your profile.',
      color: 'text-success'
    },
    {
      icon: Users,
      title: 'Graph Integration',
      description: 'Automatically creates Neo4j relationships from your career history and connections.',
      color: 'text-warning'
    }
  ];

  const demoSteps = [
    {
      step: 1,
      title: 'Access the Chat Interface',
      description: 'Click the message icon in the bottom-right corner to activate Alex, your AI networking assistant.',
      status: 'complete'
    },
    {
      step: 2,
      title: 'Complete 5-Question Onboarding',
      description: 'Answer questions about your hometown, education, work history, current projects, and interests.',
      status: 'active'
    },
    {
      step: 3,
      title: 'Start AI-Powered Conversations',
      description: 'Ask questions about networking strategies, introductions, or career opportunities.',
      status: 'pending'
    },
    {
      step: 4,
      title: 'Get Personalized Recommendations',
      description: 'Receive tailored advice based on your profile and networking goals.',
      status: 'pending'
    }
  ];

  const sampleQuestions = [
    "How can I get introduced to someone at Google?",
    "What's the best way to approach potential investors?",
    "Help me craft an introduction message",
    "Who should I connect with for my Series A fundraising?",
    "How do I leverage my Stanford network for business development?"
  ];

  const capabilities = [
    {
      title: 'Context-Aware Responses',
      description: 'Uses your onboarding data to provide personalized networking advice',
      icon: Brain
    },
    {
      title: 'Professional Memory',
      description: 'Remembers your conversation history across sessions for continuity',
      icon: MessageSquare
    },
    {
      title: 'Strategic Planning',
      description: 'Helps develop long-term networking strategies based on your goals',
      icon: Target
    },
    {
      title: 'Network Analysis',
      description: 'Analyzes your existing connections to suggest optimization opportunities',
      icon: Network
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-medium text-foreground">Business Chat Friend Demo</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Meet Alex, your AI-powered business networking assistant. Experience personalized onboarding 
          and intelligent conversation designed to enhance your professional connections.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="premium-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demo Experience */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            How to Experience the Demo
          </CardTitle>
          <CardDescription>
            Follow these steps to see the BusinessChatFriend in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Demo Steps */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Demo Steps</h3>
              {demoSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.status === 'complete' ? 'bg-success text-success-foreground border-success' :
                    step.status === 'active' ? 'bg-primary text-primary-foreground border-primary' :
                    'border-muted-foreground text-muted-foreground'
                  }`}>
                    {step.status === 'complete' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.step}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample Questions */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Try These Questions</h3>
              <div className="space-y-3">
                {sampleQuestions.map((question, index) => (
                  <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-foreground">"{question}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Demo Button */}
          <div className="text-center pt-4">
            <Button className="stat-card-primary border-0 px-8 py-3">
              <MessageCircle className="h-5 w-5 mr-2" />
              Start Demo Experience
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-foreground">AI Features & Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="premium-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">{capability.title}</h3>
                      <p className="text-sm text-muted-foreground">{capability.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Technical Implementation */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Technical Implementation
          </CardTitle>
          <CardDescription>
            Built with modern AI and database technologies for scalable networking intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Frontend</h4>
              <div className="space-y-2">
                <Badge variant="outline">React + TypeScript</Badge>
                <Badge variant="outline">Tailwind CSS</Badge>
                <Badge variant="outline">Shadcn/UI Components</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Backend</h4>
              <div className="space-y-2">
                <Badge variant="outline">Express.js API</Badge>
                <Badge variant="outline">PostgreSQL Database</Badge>
                <Badge variant="outline">OpenAI GPT-4o</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Features</h4>
              <div className="space-y-2">
                <Badge variant="outline">Smart Onboarding</Badge>
                <Badge variant="outline">Vector Storage</Badge>
                <Badge variant="outline">Graph Integration</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready to Deploy */}
      <Card className="premium-card border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="p-4 bg-success/10 rounded-lg w-fit mx-auto">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-medium text-foreground">Ready for OpenAI Integration</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The Business Chat Friend is fully implemented and ready for GPT-4o integration. 
            All database schemas, API endpoints, and frontend components are production-ready.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="stat-card-primary border-0">
              View API Documentation
            </Button>
            <Button variant="outline">
              Test Integration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessChatDemoModern;