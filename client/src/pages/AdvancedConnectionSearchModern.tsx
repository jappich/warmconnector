import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Users, 
  Building, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Star,
  Target,
  Clock,
  ArrowRight,
  Settings,
  Zap,
  Globe
} from 'lucide-react';

export default function AdvancedConnectionSearchModern() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const searchFilters = [
    { id: 'industry', label: 'Industry', icon: Building, options: ['Technology', 'Finance', 'Healthcare', 'Education'] },
    { id: 'location', label: 'Location', icon: MapPin, options: ['San Francisco', 'New York', 'London', 'Remote'] },
    { id: 'company_size', label: 'Company Size', icon: Users, options: ['Startup (1-50)', 'Mid-size (51-500)', 'Enterprise (500+)'] },
    { id: 'role_level', label: 'Role Level', icon: Briefcase, options: ['Entry Level', 'Manager', 'Director', 'VP', 'C-Level'] },
    { id: 'education', label: 'Education', icon: GraduationCap, options: ['Ivy League', 'Top 50 Universities', 'MBA'] }
  ];

  const searchResults = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'VP of Engineering',
      company: 'Google',
      location: 'Mountain View, CA',
      connectionStrength: 'Strong',
      mutualConnections: 12,
      industry: 'Technology',
      profileMatch: 94,
      lastActivity: '2 days ago',
      education: 'Stanford University'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      title: 'Director of Sales',
      company: 'Salesforce',
      location: 'San Francisco, CA',
      connectionStrength: 'Medium',
      mutualConnections: 8,
      industry: 'Technology',
      profileMatch: 87,
      lastActivity: '1 week ago',
      education: 'UC Berkeley'
    },
    {
      id: '3',
      name: 'Emily Park',
      title: 'Product Manager',
      company: 'Apple',
      location: 'Cupertino, CA',
      connectionStrength: 'Strong',
      mutualConnections: 15,
      industry: 'Technology',
      profileMatch: 91,
      lastActivity: '3 days ago',
      education: 'MIT'
    }
  ];

  const savedSearches = [
    { name: 'Tech VPs in Bay Area', count: 247, lastRun: '2 hours ago' },
    { name: 'Healthcare Directors', count: 156, lastRun: '1 day ago' },
    { name: 'Stanford Alumni in Finance', count: 89, lastRun: '3 days ago' }
  ];

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'Weak': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 80) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium text-foreground mb-2">Advanced Connection Search</h1>
          <p className="text-lg text-muted-foreground">
            Find the perfect connections with powerful filters and AI-powered matching
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Search Settings
          </Button>
          <Button className="stat-card-primary border-0">
            <Zap className="h-4 w-4 mr-2" />
            AI Recommendations
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="premium-card border-0">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for people, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="stat-card-primary border-0 px-8">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <div key={filter.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{filter.label}</span>
                    </div>
                    <div className="space-y-1">
                      {filter.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${filter.id}-${option}`}
                            className="rounded border-input"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFilters([...selectedFilters, option]);
                              } else {
                                setSelectedFilters(selectedFilters.filter(f => f !== option));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`${filter.id}-${option}`}
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Saved Searches */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Saved Searches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedSearches.map((search, index) => (
                <div key={index} className="p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{search.name}</span>
                    <Badge variant="secondary" className="text-xs">{search.count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Last run: {search.lastRun}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-medium text-foreground">Search Results</h3>
              <p className="text-sm text-muted-foreground">{searchResults.length} connections found</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Sort by Relevance
              </Button>
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.id} className="premium-card border-0 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {result.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-foreground">{result.name}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-current" />
                            <span className={`text-sm font-medium ${getMatchColor(result.profileMatch)}`}>
                              {result.profileMatch}% match
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{result.title}</span>
                            <span className="text-sm text-muted-foreground">@</span>
                            <span className="text-sm text-primary">{result.company}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{result.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{result.education}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{result.lastActivity}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Connection Strength:</span>
                            <span className={`text-sm font-medium ${getStrengthColor(result.connectionStrength)}`}>
                              {result.connectionStrength}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">
                              {result.mutualConnections} mutual connections
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button className="stat-card-primary border-0">
                        <Target className="h-4 w-4 mr-2" />
                        Find Introduction
                      </Button>
                      <Button variant="outline" size="sm">
                        View Profile
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" className="px-8">
              Load More Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}