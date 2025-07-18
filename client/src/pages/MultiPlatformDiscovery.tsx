import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Search, Globe, Users, Link, Phone, Mail, ExternalLink } from 'lucide-react';
import { 
  SiLinkedin, 
  SiX, 
  SiGithub, 
  SiFacebook, 
  SiInstagram 
} from 'react-icons/si';

interface SearchForm {
  personName: string;
  companyName: string;
  additionalContext: string;
}

interface ComprehensiveProfile {
  name: string;
  company: string;
  title: string;
  location?: string;
  email?: string;
  platforms: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    personal_website?: string;
    company_bio?: string;
  };
  webMentions: Array<{
    title: string;
    url: string;
    snippet: string;
    platform: string;
    relevanceScore: number;
  }>;
  socialSignals: {
    professionalActivity: string[];
    expertise: string[];
    recentUpdates: string[];
  };
  confidence: number;
}

const platformIcons = {
  linkedin: SiLinkedin,
  twitter: SiX,
  github: SiGithub,
  facebook: SiFacebook,
  instagram: SiInstagram,
  web: Globe,
  news: Globe,
  directory: Users
};

export default function MultiPlatformDiscovery() {
  const [searchForm, setSearchForm] = useState<SearchForm>({
    personName: '',
    companyName: '',
    additionalContext: ''
  });
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['/api/connections/comprehensive-search', searchForm],
    enabled: searchTriggered && searchForm.personName.length > 0,
    refetchOnWindowFocus: false
  });

  const handleSearch = () => {
    if (searchForm.personName.trim()) {
      setSearchTriggered(true);
    }
  };

  const handleReset = () => {
    setSearchForm({
      personName: '',
      companyName: '',
      additionalContext: ''
    });
    setSearchTriggered(false);
  };

  const profile: ComprehensiveProfile | null = searchResults?.data || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Multi-Platform Connection Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Search across LinkedIn, Twitter/X, GitHub, Facebook, Instagram, public records, 
            news articles, and conference speaker lists to find comprehensive professional information
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Comprehensive Person Search
            </CardTitle>
            <CardDescription>
              Find connections across multiple platforms and public sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Person Name *</label>
              <Input
                placeholder="e.g., Sarah Chen"
                value={searchForm.personName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, personName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company (Optional)</label>
              <Input
                placeholder="e.g., Google"
                value={searchForm.companyName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Context (Optional)</label>
              <Input
                placeholder="e.g., AI researcher, conference speaker"
                value={searchForm.additionalContext}
                onChange={(e) => setSearchForm(prev => ({ ...prev, additionalContext: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={!searchForm.personName.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Searching...' : 'Search All Platforms'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Coverage */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Platform Coverage</CardTitle>
            <CardDescription>
              We search across these platforms and data sources for comprehensive information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'LinkedIn', icon: SiLinkedin, color: 'text-blue-600' },
                { name: 'Twitter/X', icon: SiX, color: 'text-black' },
                { name: 'GitHub', icon: SiGithub, color: 'text-gray-800' },
                { name: 'Facebook', icon: SiFacebook, color: 'text-blue-500' },
                { name: 'Instagram', icon: SiInstagram, color: 'text-pink-500' },
                { name: 'News Articles', icon: Globe, color: 'text-green-600' },
                { name: 'Public Records', icon: Users, color: 'text-purple-600' },
                { name: 'Conference Lists', icon: ExternalLink, color: 'text-orange-600' }
              ].map((platform) => (
                <div key={platform.name} className="flex items-center gap-2 p-3 border rounded-lg">
                  <platform.icon className={`h-5 w-5 ${platform.color}`} />
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchTriggered && (
          <div className="space-y-6">
            {isLoading && (
              <Card className="max-w-4xl mx-auto">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching across multiple platforms...</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="max-w-4xl mx-auto border-red-200">
                <CardContent className="p-8 text-center">
                  <p className="text-red-600">Search failed. Please try again.</p>
                </CardContent>
              </Card>
            )}

            {profile && (
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Profile Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">{profile.name}</CardTitle>
                        <CardDescription className="text-lg">
                          {profile.title} {profile.company && `at ${profile.company}`}
                        </CardDescription>
                        {profile.location && (
                          <p className="text-sm text-gray-500 mt-1">{profile.location}</p>
                        )}
                      </div>
                      <Badge variant={profile.confidence > 0.7 ? 'default' : 'secondary'}>
                        {Math.round(profile.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="platforms" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="platforms">Social Platforms</TabsTrigger>
                    <TabsTrigger value="mentions">Web Mentions</TabsTrigger>
                    <TabsTrigger value="signals">Professional Signals</TabsTrigger>
                    <TabsTrigger value="contact">Contact Methods</TabsTrigger>
                  </TabsList>

                  {/* Social Platforms */}
                  <TabsContent value="platforms" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Presence</CardTitle>
                        <CardDescription>
                          Found profiles and mentions across these platforms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {Object.entries(profile.platforms).map(([platform, url]) => {
                            if (!url) return null;
                            const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Globe;
                            return (
                              <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-5 w-5" />
                                  <span className="font-medium capitalize">{platform.replace('_', ' ')}</span>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </a>
                                </Button>
                              </div>
                            );
                          })}
                          {Object.keys(profile.platforms).length === 0 && (
                            <p className="text-gray-500 text-center py-8">No platform profiles found</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Web Mentions */}
                  <TabsContent value="mentions" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Web Mentions & Public Records</CardTitle>
                        <CardDescription>
                          Found {profile.webMentions.length} mentions across news articles, directories, and public sources
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {profile.webMentions.map((mention, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{mention.title}</h4>
                                <Badge variant="outline">{mention.platform}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{mention.snippet}</p>
                              <div className="flex justify-between items-center">
                                <Badge variant="secondary">
                                  {Math.round(mention.relevanceScore * 100)}% relevant
                                </Badge>
                                {mention.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={mention.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {profile.webMentions.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No web mentions found</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Professional Signals */}
                  <TabsContent value="signals" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Professional Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {profile.socialSignals.professionalActivity.map((activity, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {activity}
                              </Badge>
                            ))}
                            {profile.socialSignals.professionalActivity.length === 0 && (
                              <p className="text-gray-500 text-sm">No activity data found</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Expertise Areas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {profile.socialSignals.expertise.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                {skill}
                              </Badge>
                            ))}
                            {profile.socialSignals.expertise.length === 0 && (
                              <p className="text-gray-500 text-sm">No expertise data found</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Recent Updates</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {profile.socialSignals.recentUpdates.map((update, index) => (
                              <p key={index} className="text-sm text-gray-600 border-l-2 border-blue-200 pl-2">
                                {update}
                              </p>
                            ))}
                            {profile.socialSignals.recentUpdates.length === 0 && (
                              <p className="text-gray-500 text-sm">No recent updates found</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Contact Methods */}
                  <TabsContent value="contact" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>
                          Available contact methods found across platforms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {profile.email && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Mail className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">Email</span>
                              <span className="text-gray-600">{profile.email}</span>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Social Handles</h4>
                            {Object.entries(profile.platforms).map(([platform, url]) => {
                              if (!url) return null;
                              const handle = url.split('/').pop() || platform;
                              const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Globe;
                              return (
                                <div key={platform} className="flex items-center gap-3 p-2 border rounded">
                                  <IconComponent className="h-4 w-4" />
                                  <span className="text-sm">@{handle}</span>
                                </div>
                              );
                            })}
                          </div>

                          {!profile.email && Object.keys(profile.platforms).length === 0 && (
                            <p className="text-gray-500 text-center py-8">No contact information found</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}