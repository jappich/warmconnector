import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Users, ArrowRight } from 'lucide-react';

interface SearchResult {
  name: string;
  title: string;
  company: string;
  path: string[];
  strength: 'strong' | 'medium' | 'weak';
}

export default function SimpleConnectionFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search - in production this would call the real API
    setTimeout(() => {
      setResults([
        {
          name: "John Smith",
          title: "Software Engineer",
          company: "Tech Corp",
          path: ["You", "Sarah Johnson", "Mike Chen", "John Smith"],
          strength: "medium"
        },
        {
          name: "John Smith",
          title: "Product Manager", 
          company: "Startup Inc",
          path: ["You", "Alex Wilson", "John Smith"],
          strength: "strong"
        }
      ]);
      setIsSearching(false);
    }, 2000);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Connections</h1>
        <p className="text-gray-600">Search for people and discover warm introduction paths</p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Search for Someone
          </CardTitle>
          <CardDescription>
            Enter a person's name or company to find introduction paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Name or Company</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. John Smith at Google"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full"
            >
              {isSearching ? 'Searching...' : 'Find Connections'}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
          {results.map((result, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-gray-600">{result.title} at {result.company}</p>
                    
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Introduction Path:</span>
                        <Badge className={getStrengthColor(result.strength)}>
                          {result.strength} connection
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {result.path.map((person, pathIndex) => (
                          <div key={pathIndex} className="flex items-center">
                            <span className={pathIndex === 0 ? 'font-medium' : ''}>
                              {person}
                            </span>
                            {pathIndex < result.path.length - 1 && (
                              <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Request Introduction
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Data State */}
      {!isSearching && results.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
            <p className="text-gray-600">
              Try searching with a different name or connect more accounts to expand your network
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Connect your accounts for better results</h3>
              <p className="text-sm text-blue-700 mt-1">
                Link your LinkedIn, email, and other professional accounts to see more connection paths
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}