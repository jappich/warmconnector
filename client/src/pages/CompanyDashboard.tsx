import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building, Users, Ghost, Mail, TrendingUp, Zap, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CompanyEnrichmentStats } from '@/components/GhostProfileBadge';

interface CompanyStats {
  realProfiles: number;
  ghostProfiles: number;
  totalRelationships: number;
  lastEnrichedAt?: string;
  status: string;
  enrichmentSource?: string;
}

export default function CompanyDashboard() {
  // Mock company data - would come from API
  const companyId = 1;

  const { data: companyStats, isLoading } = useQuery({
    queryKey: ['/api/company', companyId, 'enrichment-stats'],
    enabled: true
  });

  const mockStats: CompanyStats = {
    realProfiles: 12,
    ghostProfiles: 427,
    totalRelationships: 1250,
    lastEnrichedAt: new Date().toISOString(),
    status: 'done',
    enrichmentSource: 'PDL + Clearbit'
  };

  const stats = companyStats?.stats || mockStats;
  const total = stats.realProfiles + stats.ghostProfiles;
  const ghostPercentage = total > 0 ? Math.round((stats.ghostProfiles / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Network</h1>
        <p className="text-muted-foreground">
          Your company's professional network powered by AI enrichment
        </p>
      </div>

      {/* Network Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Network</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              professionals in your network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.realProfiles}</div>
            <p className="text-xs text-muted-foreground">
              joined WarmConnector
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ghost Profiles</CardTitle>
            <Ghost className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ghostProfiles}</div>
            <p className="text-xs text-muted-foreground">
              ready to invite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelationships.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              mapped relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Network Stats */}
      <CompanyEnrichmentStats
        realProfiles={stats.realProfiles}
        ghostProfiles={stats.ghostProfiles}
        enrichmentSource={stats.enrichmentSource}
      />

      {/* Network Growth Potential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Network Growth Potential
          </CardTitle>
          <CardDescription>
            Unlock your company's full networking potential by activating ghost profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Network Activation</span>
              <span>{Math.round((stats.realProfiles / total) * 100)}%</span>
            </div>
            <Progress value={(stats.realProfiles / total) * 100} className="h-2" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{stats.realProfiles}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{stats.ghostProfiles}</div>
              <div className="text-sm text-muted-foreground">Pending Invites</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{stats.totalRelationships}</div>
              <div className="text-sm text-muted-foreground">Total Connections</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invite Team Members
            </Button>
            <Button size="sm" variant="outline">
              View Network Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrichment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Enrichment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Enrichment Complete</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.status === 'done' ? 'Complete' : 'In Progress'}
            </Badge>
          </div>

          {stats.lastEnrichedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {new Date(stats.lastEnrichedAt).toLocaleDateString()}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Data Sources:</div>
            <div className="flex gap-2">
              <Badge variant="outline">PDL (People Data Labs)</Badge>
              <Badge variant="outline">Clearbit</Badge>
              <Badge variant="outline">Hunter.io</Badge>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Network Effect Achieved!
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
              Even with just {stats.realProfiles} team members, you've unlocked a network of {total} professionals. 
              Each new member exponentially increases your reach.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to grow and manage your company network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" size="sm" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Invite Colleagues
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Ghost className="h-4 w-4 mr-2" />
              View Ghost Profiles
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Network Analytics
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Bulk Invitations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}