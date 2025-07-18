import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ghost, Search, Mail, Filter, Users, Building, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GhostProfileBadge } from '@/components/GhostProfileBadge';
import { InvitationFlow } from '@/components/InvitationFlow';

interface GhostProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  ghostSource: string;
  trustScore: number;
  location?: string;
  connections?: number;
}

export default function GhostProfiles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [invitationDialog, setInvitationDialog] = useState<{
    isOpen: boolean;
    ghostUser?: GhostProfile;
  }>({ isOpen: false });

  // Mock ghost profiles data
  const mockGhostProfiles: GhostProfile[] = [
    {
      id: 'ghost_1',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      title: 'Engineering Manager',
      company: 'TechCorp',
      ghostSource: 'PDL',
      trustScore: 85,
      location: 'San Francisco, CA',
      connections: 12
    },
    {
      id: 'ghost_2',
      name: 'Marcus Rodriguez',
      email: 'marcus.r@innovate.co',
      title: 'Senior Developer',
      company: 'InnovateCo',
      ghostSource: 'Clearbit',
      trustScore: 72,
      location: 'Austin, TX',
      connections: 8
    },
    {
      id: 'ghost_3',
      name: 'Emily Watson',
      email: 'emily.watson@startupxyz.com',
      title: 'Product Manager',
      company: 'StartupXYZ',
      ghostSource: 'Hunter',
      trustScore: 68,
      location: 'New York, NY',
      connections: 15
    },
    {
      id: 'ghost_4',
      name: 'David Kim',
      email: 'david.kim@enterprise.com',
      title: 'Executive Assistant to CEO',
      company: 'Enterprise Corp',
      ghostSource: 'PDL',
      trustScore: 90,
      location: 'Seattle, WA',
      connections: 25
    }
  ];

  const { data: ghostProfiles = mockGhostProfiles, isLoading } = useQuery({
    queryKey: ['/api/ghost-profiles', searchQuery, sourceFilter],
    enabled: false // Using mock data for now
  });

  const filteredProfiles = ghostProfiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || profile.ghostSource === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'PDL': return 'bg-blue-100 text-blue-800';
      case 'Clearbit': return 'bg-green-100 text-green-800';
      case 'Hunter': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Ghost className="h-8 w-8 text-purple-600" />
          Ghost Profiles
        </h1>
        <p className="text-muted-foreground">
          Discover and invite professionals from your enriched company network
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ghost Profiles</CardTitle>
            <Ghost className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ghostProfiles.length}</div>
            <p className="text-xs text-muted-foreground">ready to invite</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ghostProfiles.filter(p => p.trustScore > 80).length}
            </div>
            <p className="text-xs text-muted-foreground">trust score 80+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executive Access</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ghostProfiles.filter(p => p.title.toLowerCase().includes('executive') || p.title.toLowerCase().includes('assistant')).length}
            </div>
            <p className="text-xs text-muted-foreground">executive assistants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Connections</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(ghostProfiles.reduce((acc, p) => acc + (p.connections || 0), 0) / ghostProfiles.length)}
            </div>
            <p className="text-xs text-muted-foreground">per profile</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Ghost Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSourceFilter('all')}
              >
                All Sources
              </Button>
              <Button
                variant={sourceFilter === 'PDL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSourceFilter('PDL')}
              >
                PDL
              </Button>
              <Button
                variant={sourceFilter === 'Clearbit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSourceFilter('Clearbit')}
              >
                Clearbit
              </Button>
              <Button
                variant={sourceFilter === 'Hunter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSourceFilter('Hunter')}
              >
                Hunter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ghost Profiles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{profile.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {profile.title}
                    </CardDescription>
                  </div>
                </div>
                <GhostProfileBadge
                  isGhost={true}
                  ghostSource={profile.ghostSource}
                  trustScore={profile.trustScore}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.company}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.connections && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.connections} mutual connections</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getSourceColor(profile.ghostSource)}>
                  {profile.ghostSource}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Trust: {profile.trustScore}%
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => setInvitationDialog({
                  isOpen: true,
                  ghostUser: profile
                })}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Ghost className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ghost profiles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters to find more profiles.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invitation Dialog */}
      {invitationDialog.isOpen && invitationDialog.ghostUser && (
        <InvitationFlow
          isOpen={invitationDialog.isOpen}
          onClose={() => setInvitationDialog({ isOpen: false })}
          ghostUser={invitationDialog.ghostUser}
          targetUser={{ id: 'target-1', name: 'Connection Target', company: 'Target Company' }}
          requesterId="demo-user-001"
          pathData={[]}
        />
      )}
    </div>
  );
}