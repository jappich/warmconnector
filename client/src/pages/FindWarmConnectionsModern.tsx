import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  ArrowRight, 
  Building, 
  MapPin, 
  ExternalLink,
  Sparkles,
  Target,
  Network
} from 'lucide-react';

const FindWarmConnectionsModern: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const exampleConnections = [
    {
      id: 1,
      name: 'Sarah Chen',
      title: 'VP of Engineering',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      mutualConnections: 3,
      connectionPath: ['You', 'Alex Johnson', 'Sarah Chen'],
      strength: 'Strong',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      title: 'Product Manager',
      company: 'InnovateLabs',
      location: 'Austin, TX',
      mutualConnections: 2,
      connectionPath: ['You', 'Lisa Wang', 'Michael Rodriguez'],
      strength: 'Medium',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 3,
      name: 'Emily Thompson',
      title: 'Senior Designer',
      company: 'DesignStudio',
      location: 'New York, NY',
      mutualConnections: 5,
      connectionPath: ['You', 'David Kim', 'Emily Thompson'],
      strength: 'Very Strong',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const useCases = [
    {
      icon: Target,
      title: 'Business Development',
      description: 'Find decision-makers at target companies through your network',
      example: 'Connect with VP of Sales at prospect companies'
    },
    {
      icon: Users,
      title: 'Job Opportunities',
      description: 'Discover hiring managers and employees at companies you want to join',
      example: 'Get introduced to engineering leads at your dream company'
    },
    {
      icon: Network,
      title: 'Partnership Opportunities',
      description: 'Connect with potential partners, investors, or collaborators',
      example: 'Meet founders in complementary industries'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-medium text-foreground">Find Introduction</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Discover warm connections to anyone in your extended network. Find the shortest path 
          to your next opportunity through trusted introductions.
        </p>
      </div>

      {/* Search Section */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search for Connections
          </CardTitle>
          <CardDescription>
            Enter a person's name, company, or role to find warm introduction paths
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search for people, companies, or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button className="stat-card-primary border-0 px-8">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">VP of Engineering</Badge>
            <Badge variant="secondary">Product Manager</Badge>
            <Badge variant="secondary">Google</Badge>
            <Badge variant="secondary">San Francisco</Badge>
          </div>
        </CardContent>
      </Card>

      {/* When to Use Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-foreground">When to Use WarmConnect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card key={index} className="premium-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {useCase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Example:</p>
                    <p className="text-sm text-foreground">{useCase.example}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Example Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-foreground">Example Connections</h2>
          <Badge className="bg-success/10 text-success border-success/20">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Matches
          </Badge>
        </div>
        
        <div className="space-y-4">
          {exampleConnections.map((connection) => (
            <Card key={connection.id} className="premium-card border-0 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={connection.avatar} />
                      <AvatarFallback>{connection.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-medium text-foreground">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground">{connection.title}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {connection.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {connection.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {connection.mutualConnections} mutual connections
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Connection path:</span>
                        <div className="flex items-center gap-1">
                          {connection.connectionPath.map((person, index) => (
                            <React.Fragment key={index}>
                              <span className="text-xs bg-secondary px-2 py-1 rounded">{person}</span>
                              {index < connection.connectionPath.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge 
                      variant={connection.strength === 'Very Strong' ? 'default' : 'secondary'}
                      className={connection.strength === 'Very Strong' ? 'bg-success text-success-foreground' : ''}
                    >
                      {connection.strength} Connection
                    </Badge>
                    
                    <Button size="sm" className="stat-card-primary border-0">
                      Request Introduction
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="premium-card border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">2.4M+</div>
              <div className="text-sm text-muted-foreground">Professionals in Network</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">Connection Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">3.2</div>
              <div className="text-sm text-muted-foreground">Avg Degrees of Separation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">24h</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FindWarmConnectionsModern;