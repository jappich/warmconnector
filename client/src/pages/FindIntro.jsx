import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { 
  Target, 
  Search, 
  Users, 
  ArrowRight, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Briefcase,
  GraduationCap,
  Home,
  Heart,
  UserPlus,
  Building
} from 'lucide-react';

function FindIntro() {
  const [searchData, setSearchData] = useState({
    targetName: '',
    targetCompany: '',
    targetTitle: '',
    searchMode: 'smart'
  });
  const [selectedPath, setSelectedPath] = useState(null);
  const [introMessage, setIntroMessage] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [debouncedCompany] = useDebounce(searchData.targetCompany, 300);
  const { toast } = useToast();

  // Fetch company suggestions
  const fetchCompanySuggestions = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setCompanySuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/companies/suggestions?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const suggestions = await response.json();
        setCompanySuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
    }
  }, []);

  React.useEffect(() => {
    if (debouncedCompany) {
      fetchCompanySuggestions(debouncedCompany);
    }
  }, [debouncedCompany, fetchCompanySuggestions]);

  const handleCompanyChange = (value) => {
    setSearchData({...searchData, targetCompany: value});
    setShowCompanySuggestions(value.length > 0);
  };

  const selectCompanySuggestion = (company) => {
    setSearchData({...searchData, targetCompany: company});
    setShowCompanySuggestions(false);
  };

  const getRelationshipIcon = (type) => {
    switch (type) {
      case 'coworker': 
      case 'professional': 
        return <Briefcase className="h-4 w-4" />;
      case 'school': 
        return <GraduationCap className="h-4 w-4" />;
      case 'family': 
        return <Heart className="h-4 w-4" />;
      case 'hometown': 
        return <Home className="h-4 w-4" />;
      default: 
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const renderConnectionPath = (path, pathIndex) => {
    if (!path?.path || path.path.length === 0) return null;
    
    return (
      <Card key={pathIndex} className="mb-6 hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => setSelectedPath(path)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{path.hops} hop{path.hops !== 1 ? 's' : ''}</Badge>
              <Badge variant="secondary">Strength: {path.totalStrength}%</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Request Introduction
            </Button>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {path.path.map((person, personIndex) => (
              <React.Fragment key={personIndex}>
                <div className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.title}</p>
                  <p className="text-xs text-muted-foreground">{person.company}</p>
                </div>
                {personIndex < path.path.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const searchMutation = useMutation({
    mutationFn: async (searchData) => {
      const response = await fetch(`/api/find-connections?query=${encodeURIComponent(searchData.targetName)}&company=${encodeURIComponent(searchData.targetCompany || '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Search response:', data);
      const totalResults = (data.paths?.length || 0);
      toast({
        title: "Search Complete",
        description: `Found ${totalResults} connection paths`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const requestIntroMutation = useMutation({
    mutationFn: async (requestData) => {
      const response = await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Introduction Request Sent",
        description: `Request sent successfully`,
      });
      setSelectedPath(null);
      setIntroMessage('');
    },
    onError: (error) => {
      toast({
        title: "Request Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchData.targetName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a target name",
        variant: "destructive"
      });
      return;
    }
    searchMutation.mutate(searchData);
  };

  const handleRequestIntro = (path) => {
    if (!introMessage.trim()) {
      toast({
        title: "Missing Message",
        description: "Please enter an introduction message",
        variant: "destructive"
      });
      return;
    }
    
    const requestData = {
      targetName: searchData.targetName,
      targetCompany: searchData.targetCompany,
      message: introMessage,
      path: path
    };

    requestIntroMutation.mutate(requestData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Find Warm Connections</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Discover connection paths to anyone in your network and request warm introductions
          </p>
        </div>

        {/* Examples Section */}
        <Card className="mb-8 bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              When to Use WarmConnector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-300">Business Development</span>
                </div>
                <p className="text-purple-200">Reach decision makers at target companies through mutual connections</p>
                <p className="text-blue-200 text-xs italic">"Connect me to Sarah Johnson, VP of Sales at TechCorp"</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">Job Opportunities</span>
                </div>
                <p className="text-purple-200">Get introductions to hiring managers and team leads</p>
                <p className="text-green-200 text-xs italic">"Introduce me to Alex Chen, Engineering Manager at StartupXYZ"</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium text-yellow-300">Partnership & Investment</span>
                </div>
                <p className="text-purple-200">Connect with investors, partners, and industry experts</p>
                <p className="text-yellow-200 text-xs italic">"Help me meet David Kim, Partner at VentureCapital Partners"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Form */}
        <Card className="mb-8 bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5" />
              Connection Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">
                  Target Person Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter the full name of the person you want to connect with"
                  value={searchData.targetName}
                  onChange={(e) => setSearchData({...searchData, targetName: e.target.value})}
                  className="w-full bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-purple-200">
                  Target Company *
                </label>
                <Input
                  type="text"
                  placeholder="Enter company or organization"
                  value={searchData.targetCompany}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  onFocus={() => setShowCompanySuggestions(searchData.targetCompany.length > 0)}
                  className="w-full bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                />
                
                {showCompanySuggestions && companySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {companySuggestions.map((company, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectCompanySuggestion(company)}
                        className="w-full text-left px-4 py-2 text-sm text-purple-200 hover:bg-purple-900/50 hover:text-white transition-colors"
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">
                  Target Role (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. CEO, VP Engineering, Product Manager"
                  value={searchData.targetTitle}
                  onChange={(e) => setSearchData({...searchData, targetTitle: e.target.value})}
                  className="w-full bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Connections
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchMutation.data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Connection Paths</h2>
              <Badge variant="outline">
                {searchMutation.data.found ? 
                  `${searchMutation.data.paths?.length || 0} paths found` : 
                  'No connections found'
                }
              </Badge>
            </div>

            {searchMutation.data.found && searchMutation.data.paths?.length > 0 ? (
              <div className="space-y-4">
                {searchMutation.data.paths.map((path, index) => renderConnectionPath(path, index))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No connection paths found. Try searching with different criteria or expanding your network connections.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Introduction Request Modal */}
        {selectedPath && (
          <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Request Introduction</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPath(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Connection Path:</h3>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg overflow-x-auto">
                  {selectedPath.path.map((person, index) => (
                    <React.Fragment key={index}>
                      <span className="whitespace-nowrap">{person.name}</span>
                      {index < selectedPath.path.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Introduction Message *
                </label>
                <Textarea
                  placeholder="Write a brief message explaining why you'd like to be introduced..."
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  className="w-full h-32"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleRequestIntro(selectedPath.path)}
                  disabled={requestIntroMutation.isPending}
                  className="flex-1"
                >
                  {requestIntroMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Request
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setSelectedPath(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default FindIntro;