import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { MapPin, Search, Users, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const searchSchema = z.object({
  targetName: z.string().min(1, 'Please enter a person\'s name'),
  targetCompany: z.string().optional(),
  targetLocation: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface Company {
  id: string;
  name: string;
  domain: string;
}

interface SearchResult {
  id: string;
  name: string;
  company: string;
  title: string;
  connectionPath: Array<{
    person: string;
    relationship: string;
    strength: number;
  }>;
  pathLength: number;
  introduction: {
    strategy: string;
    suggestedMessage: string;
  };
}

export default function FindWarmConnections() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      targetName: '',
      targetCompany: '',
      targetLocation: '',
    },
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const handleSearch = async (data: SearchFormData) => {
    setIsSearching(true);
    setShowResults(false);
    
    try {
      const results = await apiRequest('/api/connections/search', {
        method: 'POST',
        body: JSON.stringify({
          targetName: data.targetName,
          targetCompany: data.targetCompany,
          targetLocation: data.targetLocation,
        }),
      });
      
      setSearchResults(results.connections || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean professional background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary opacity-30"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          {/* Main search card */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 rounded-3xl blur-sm -z-10"></div>
            <div className="absolute inset-[1px] bg-slate-800/60 backdrop-blur-xl rounded-3xl"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  Find Warm Connections
                </h1>
                <p className="text-slate-300 text-lg mb-6">
                  Discover connection paths to anyone in your network and request warm introductions
                </p>
                
                {/* Usage Examples */}
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 mb-6">
                  <h3 className="text-slate-200 font-semibold mb-3 text-center">When to Use WarmConnector</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-blue-400 font-medium mb-1">🤝 Business Development</div>
                      <div className="text-slate-400">"I need an intro to the VP of Sales at Tesla for a potential partnership"</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-medium mb-1">💼 Job Opportunities</div>
                      <div className="text-slate-400">"Can someone connect me to a hiring manager at Google for a product role?"</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-medium mb-1">🎯 Investment & Funding</div>
                      <div className="text-slate-400">"I'm looking for a warm intro to partners at Andreessen Horowitz"</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-6">
                  {/* Target Person Name */}
                  <FormField
                    control={form.control}
                    name="targetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-400 text-lg font-medium">
                          Target Person Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the full name of the person you want to connect with"
                            className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-slate-400 rounded-xl h-12 focus:border-cyan-400 focus:ring-cyan-400/20 focus:ring-2 transition-all duration-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Target Company */}
                  <FormField
                    control={form.control}
                    name="targetCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-400 text-lg font-medium">
                          Target Company
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white rounded-xl h-12 focus:border-cyan-400 focus:ring-cyan-400/20 focus:ring-2 transition-all duration-300">
                              <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-cyan-400/30 text-white">
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.name} className="focus:bg-slate-700 focus:text-cyan-400">
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Target Location */}
                  <FormField
                    control={form.control}
                    name="targetLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-400 text-lg font-medium">
                          Target Location
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              {...field}
                              placeholder="Enter city, state, or region"
                              className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-slate-400 rounded-xl h-12 pl-12 focus:border-cyan-400 focus:ring-cyan-400/20 focus:ring-2 transition-all duration-300"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Search Button */}
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Search className="w-5 h-5" />
                        <span>Find Connections</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Found {searchResults.length} Connection{searchResults.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-slate-400">
                  Here are the best paths to reach your target
                </p>
              </div>

              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-slate-800/40 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 shadow-xl shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {result.name}
                      </h3>
                      <p className="text-slate-300">
                        {result.title} at {result.company}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full px-3 py-1">
                        <span className="text-white text-sm font-medium">
                          {result.pathLength} hop{result.pathLength !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Path */}
                  <div className="mb-4">
                    <h4 className="text-cyan-400 font-medium mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Connection Path
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <span>You</span>
                      {result.connectionPath.map((hop, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="text-cyan-400">→</span>
                          <span className="bg-slate-700/50 px-2 py-1 rounded">
                            {hop.person}
                          </span>
                        </div>
                      ))}
                      <span className="text-cyan-400">→</span>
                      <span className="text-purple-400 font-medium">{result.name}</span>
                    </div>
                  </div>

                  {/* Introduction Strategy */}
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <h4 className="text-cyan-400 font-medium mb-2">
                      Introduction Strategy
                    </h4>
                    <p className="text-slate-300 text-sm mb-3">
                      {result.introduction.strategy}
                    </p>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                    >
                      Request Introduction
                    </Button>
                  </div>
                </div>
              ))}

              {searchResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-slate-400 text-lg">
                    No connections found. Try expanding your search criteria.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}