import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  Building2, 
  MapPin, 
  Star, 
  Target,
  Globe,
  Briefcase,
  GraduationCap,
  Heart,
  ArrowRight,
  Zap,
  Network
} from 'lucide-react';

const exampleSearches = [
  {
    title: "Find Product Manager at Tesla",
    description: "Search for product managers working at Tesla in Austin",
    example: {
      name: "Sarah Chen",
      company: "Tesla",
      location: "Austin, TX"
    },
    useCase: "When you want to connect with someone in a specific role at a target company"
  },
  {
    title: "Alumni Network Search",
    description: "Find Stanford graduates working at tech companies",
    example: {
      name: "",
      company: "Google",
      location: "Stanford University"
    },
    useCase: "Leveraging educational connections for networking"
  },
  {
    title: "Industry Expert Discovery",
    description: "Locate AI/ML experts in the San Francisco Bay Area",
    example: {
      name: "AI Engineer",
      company: "OpenAI",
      location: "San Francisco, CA"
    },
    useCase: "Finding subject matter experts in emerging technologies"
  }
];

const searchCategories = [
  {
    id: "professional",
    title: "Professional Network",
    icon: Briefcase,
    description: "Current and former colleagues, business partners",
    color: "cyan"
  },
  {
    id: "educational",
    title: "Educational Connections",
    icon: GraduationCap,
    description: "School alumni, university networks",
    color: "blue"
  },
  {
    id: "social",
    title: "Social Networks",
    icon: Heart,
    description: "Social media connections and mutual friends",
    color: "purple"
  },
  {
    id: "industry",
    title: "Industry Networks",
    icon: Globe,
    description: "Professional associations and industry groups",
    color: "green"
  }
];

export default function EnhancedConnectionFinderCosmic() {
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [activeExample, setActiveExample] = useState(0);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleExampleSearch = (example: any) => {
    setTargetName(example.name);
    setTargetCompany(example.company);
    setTargetLocation(example.location);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate search with demo results
    setTimeout(() => {
      setSearchResults({
        query: { name: targetName, company: targetCompany, location: targetLocation },
        results: [
          {
            name: "Sarah Chen",
            title: "Senior Product Manager",
            company: "Tesla",
            location: "Austin, TX",
            connections: [
              { type: "Professional", strength: 85, path: "John Smith → Tesla Alumni → Sarah Chen" },
              { type: "Educational", strength: 72, path: "Stanford MBA Program → Sarah Chen" }
            ],
            confidence: 92
          },
          {
            name: "Michael Rodriguez", 
            title: "Product Manager",
            company: "Tesla",
            location: "Austin, TX",
            connections: [
              { type: "Professional", strength: 78, path: "LinkedIn Connections → Michael Rodriguez" }
            ],
            confidence: 87
          }
        ]
      });
      setIsSearching(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background with stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-4 py-2 mb-6">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">Advanced Connection Search</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Enhanced Connection Finder
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Powerful search engine to find people across companies and industries. 
            Discover professionals through multiple data sources and connection paths.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/40 backdrop-blur-sm border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Target className="w-6 h-6 text-cyan-400 mr-3" />
                  Search for People
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enter details about the person you want to find and connect with
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetName" className="text-cyan-300 font-medium">
                      Target Person Name
                    </Label>
                    <Input
                      id="targetName"
                      placeholder="Enter full name or job title"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="bg-slate-900/50 border-cyan-400/30 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetCompany" className="text-cyan-300 font-medium">
                      Target Company
                    </Label>
                    <Input
                      id="targetCompany"
                      placeholder="Company name"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="bg-slate-900/50 border-cyan-400/30 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetLocation" className="text-cyan-300 font-medium">
                      Location (Optional)
                    </Label>
                    <Input
                      id="targetLocation"
                      placeholder="City, state, or region"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      className="bg-slate-900/50 border-cyan-400/30 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || (!targetName && !targetCompany)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Find Connections
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && (
              <Card className="mt-8 bg-slate-800/40 backdrop-blur-sm border border-cyan-400/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Users className="w-5 h-5 text-cyan-400 mr-3" />
                    Search Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.results.map((person, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold text-lg">{person.name}</h3>
                            <p className="text-slate-300">{person.title}</p>
                            <div className="flex items-center text-slate-400 text-sm mt-1">
                              <Building2 className="w-4 h-4 mr-1" />
                              {person.company}
                              <MapPin className="w-4 h-4 ml-3 mr-1" />
                              {person.location}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                            {person.confidence}% match
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-cyan-300 font-medium text-sm">Connection Paths:</h4>
                          {person.connections.map((conn, connIdx) => (
                            <div key={connIdx} className="flex items-center text-sm">
                              <Badge variant="outline" className="text-xs mr-3">
                                {conn.type}
                              </Badge>
                              <span className="text-slate-400 flex-1">{conn.path}</span>
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span className="text-yellow-400 text-xs">{conn.strength}%</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button size="sm" className="mt-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                          <Network className="w-4 h-4 mr-2" />
                          Find Introduction Path
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Examples and Help */}
          <div className="space-y-6">
            {/* Example Searches */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border border-cyan-400/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <Zap className="w-5 h-5 text-cyan-400 mr-3" />
                  Example Searches
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Try these common search patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exampleSearches.map((example, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-cyan-400/30 transition-colors cursor-pointer" onClick={() => handleExampleSearch(example.example)}>
                      <h4 className="text-white font-medium text-sm mb-2">{example.title}</h4>
                      <p className="text-slate-400 text-xs mb-2">{example.description}</p>
                      <Badge variant="outline" className="text-xs">{example.useCase}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Categories */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border border-cyan-400/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Search Categories</CardTitle>
                <CardDescription className="text-slate-400">
                  We search across multiple network types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg bg-slate-900/30">
                        <div className={`p-2 rounded-lg bg-${category.color}-500/20 border border-${category.color}-400/30`}>
                          <IconComponent className={`w-4 h-4 text-${category.color}-400`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{category.title}</h4>
                          <p className="text-slate-400 text-xs">{category.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}