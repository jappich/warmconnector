import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Search, 
  Mail,
  Building,
  User,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Users,
  MessageSquare,
  BarChart3,
  Star,
  Lightbulb
} from 'lucide-react';
import { Link } from 'wouter';

export default function FeatureComparisonModern() {
  const comparisonData = [
    {
      feature: 'Input Required',
      findConnection: 'Company name + Location',
      findIntroduction: 'Person name + Company/Title'
    },
    {
      feature: 'Primary Use Case',
      findConnection: 'Market research & prospecting',
      findIntroduction: 'Warm introductions & networking'
    },
    {
      feature: 'Output Type',
      findConnection: 'List of company employees',
      findIntroduction: 'Introduction pathway + contact info'
    },
    {
      feature: 'Best For',
      findConnection: 'Sales teams, business development',
      findIntroduction: 'Personal networking, partnerships'
    },
    {
      feature: 'Response Time',
      findConnection: 'Instant',
      findIntroduction: '5-15 seconds'
    },
    {
      feature: 'Data Sources',
      findConnection: 'Company directories, LinkedIn',
      findIntroduction: 'Personal networks, social graphs'
    },
    {
      feature: 'Success Rate',
      findConnection: '85-95% (finding employees)',
      findIntroduction: '70-85% (getting introductions)'
    }
  ];

  const useCaseExamples = [
    {
      title: 'Business Development',
      description: 'Find decision-makers at target companies',
      findConnectionExample: 'Find all VPs at Google in San Francisco',
      findIntroductionExample: 'Get introduced to Sarah Chen, VP Engineering at Google',
      icon: BarChart3,
      color: 'text-primary'
    },
    {
      title: 'Job Search',
      description: 'Connect with hiring managers and employees',
      findConnectionExample: 'Find engineering managers at Apple',
      findIntroductionExample: 'Get introduced to hiring manager at Apple',
      icon: Users,
      color: 'text-success'
    },
    {
      title: 'Partnership Building',
      description: 'Discover potential partners and collaborators',
      findConnectionExample: 'Find startup founders in fintech',
      findIntroductionExample: 'Get introduced to CEO of fintech startup',
      icon: Target,
      color: 'text-warning'
    }
  ];

  const whenToUse = [
    {
      scenario: 'You know the company but not specific people',
      recommend: 'findConnection',
      reason: 'Perfect for discovering who works where'
    },
    {
      scenario: 'You know exactly who you want to meet',
      recommend: 'findIntroduction',
      reason: 'Best for getting warm introductions'
    },
    {
      scenario: 'Building a prospect list for sales',
      recommend: 'findConnection',
      reason: 'Quickly identify multiple targets'
    },
    {
      scenario: 'Looking for a specific job opportunity',
      recommend: 'findIntroduction',
      reason: 'Personal connections lead to better outcomes'
    },
    {
      scenario: 'Researching a new market or industry',
      recommend: 'findConnection',
      reason: 'Broad discovery of key players'
    },
    {
      scenario: 'Seeking partnership or investment',
      recommend: 'findIntroduction',
      reason: 'Trust and credibility matter most'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center mb-6 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <Target className="h-4 w-4 text-primary mr-2" />
          <span className="text-primary text-sm font-medium">Feature Comparison Guide</span>
        </div>
        
        <h1 className="text-4xl font-medium text-foreground mb-4">
          Feature <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Comparison</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Understanding the difference between Find Connection and Find Introduction 
          to choose the right tool for your networking goals
        </p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-primary">
              <Search className="h-6 w-6" />
              Find Connection
            </CardTitle>
            <CardDescription>
              Discover who works at target companies to build your initial network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-success" />
                <span className="text-sm">Company + Location Input</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-success" />
                <span className="text-sm">Discover Company Employees</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <span className="text-sm">Build Target Lists</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-success" />
                <span className="text-sm">Instant Results</span>
              </div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Example Use Case:</h4>
              <p className="text-sm text-muted-foreground">
                "I want to find all the engineering managers at Google in Seattle to build relationships for potential partnerships."
              </p>
            </div>

            <Link href="/find-connections">
              <Button className="w-full stat-card-primary border-0">
                <Search className="h-4 w-4 mr-2" />
                Try Find Connection
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-warning">
              <Mail className="h-6 w-6" />
              Find Introduction
            </CardTitle>
            <CardDescription>
              Get warm introductions to specific people through your network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-success" />
                <span className="text-sm">Person + Company Input</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <span className="text-sm">Find Connection Paths</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-success" />
                <span className="text-sm">Request Warm Introductions</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm">AI-Powered Path Analysis</span>
              </div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Example Use Case:</h4>
              <p className="text-sm text-muted-foreground">
                "I want to get introduced to Sarah Chen, VP of Engineering at Google, for a potential job opportunity."
              </p>
            </div>

            <Link href="/find-intro">
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Try Find Introduction
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Detailed Feature Comparison
          </CardTitle>
          <CardDescription>
            Side-by-side comparison of capabilities and use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-foreground font-medium">Feature</th>
                  <th className="text-left py-3 px-4 text-primary font-medium">Find Connection</th>
                  <th className="text-left py-3 px-4 text-warning font-medium">Find Introduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonData.map((row, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-foreground font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.findConnection}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.findIntroduction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Use Case Examples */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-medium text-foreground mb-4">Real-World Use Cases</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how both features work together to solve different networking challenges
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCaseExamples.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card key={index} className="premium-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className={`h-6 w-6 ${useCase.color}`} />
                    </div>
                    {useCase.title}
                  </CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Find Connection</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{useCase.findConnectionExample}</p>
                    </div>
                    
                    <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-warning" />
                        <span className="text-xs font-medium text-warning">Find Introduction</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{useCase.findIntroductionExample}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* When to Use Which */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-warning" />
            When to Use Which Feature
          </CardTitle>
          <CardDescription>
            Quick decision guide to choose the right tool for your situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whenToUse.map((item, index) => (
              <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item.recommend === 'findConnection' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                    {item.recommend === 'findConnection' ? 
                      <Search className="h-4 w-4 text-primary" /> : 
                      <Mail className="h-4 w-4 text-warning" />
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{item.scenario}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Recommended:</span>
                      <Badge variant="secondary" className={item.recommend === 'findConnection' ? 'text-primary' : 'text-warning'}>
                        {item.recommend === 'findConnection' ? 'Find Connection' : 'Find Introduction'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Get Started Section */}
      <Card className="premium-card border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-medium text-foreground">Ready to Start Networking?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Try both features to see which works best for your networking goals. 
            Most successful users combine both approaches for maximum impact.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/find-connections">
              <Button className="stat-card-primary border-0 px-8">
                <Search className="h-4 w-4 mr-2" />
                Start with Find Connection
              </Button>
            </Link>
            <Link href="/find-intro">
              <Button variant="outline" className="px-8">
                <Mail className="h-4 w-4 mr-2" />
                Try Find Introduction
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}