import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Network, 
  Activity, 
  Target, 
  Clock, 
  Globe,
  ArrowUpRight,
  PieChart,
  LineChart,
  Calendar
} from 'lucide-react';

export default function NetworkAnalyticsModern() {
  const analyticsData = {
    totalConnections: 1247,
    connectionGrowth: '+23%',
    activeConnections: 847,
    introductionsMade: 156,
    successRate: 94,
    averageResponseTime: '2.3 days',
    topIndustries: [
      { name: 'Technology', count: 342, percentage: 27 },
      { name: 'Finance', count: 189, percentage: 15 },
      { name: 'Healthcare', count: 156, percentage: 12 },
      { name: 'Education', count: 134, percentage: 11 },
      { name: 'Consulting', count: 98, percentage: 8 }
    ],
    recentActivity: [
      { date: '2025-01-07', connections: 23, introductions: 8 },
      { date: '2025-01-06', connections: 19, introductions: 12 },
      { date: '2025-01-05', connections: 31, introductions: 6 },
      { date: '2025-01-04', connections: 15, introductions: 9 },
      { date: '2025-01-03', connections: 28, introductions: 11 }
    ]
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium text-foreground mb-2">Network Analytics</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive insights into your professional networking performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="stat-card-primary border-0">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Connections</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.totalConnections.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{analyticsData.connectionGrowth}</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.activeConnections}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3 text-warning" />
                  <span className="text-xs text-muted-foreground">68% engagement</span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <Network className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Introductions Made</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.introductionsMade}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{analyticsData.successRate}% success</span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Target className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.averageResponseTime}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary">Industry avg: 4.2 days</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Growth Chart */}
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-primary" />
              Connection Growth Trend
            </CardTitle>
            <CardDescription>
              Daily connections and introductions over the last 5 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-bold text-primary">{day.connections}</div>
                      <div className="text-xs text-muted-foreground">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-success">{day.introductions}</div>
                      <div className="text-xs text-muted-foreground">Introductions</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Distribution */}
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-warning" />
              Industry Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of connections by industry sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topIndustries.map((industry, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{industry.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{industry.count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {industry.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-success" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your networking effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Strong Performance</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your introduction success rate is 32% above industry average
              </p>
            </div>
            
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Opportunity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Consider expanding into Healthcare sector for 15% more connections
              </p>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Growth Potential</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your network reach spans 12 countries with strong engagement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>
            Strategic recommendations to improve your networking outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Follow up with dormant connections</h4>
                <p className="text-sm text-muted-foreground">
                  23 connections haven't been active in 6+ months. A simple check-in could re-engage them.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Start Follow-ups
              </Button>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Leverage high-value connectors</h4>
                <p className="text-sm text-muted-foreground">
                  5 connections have extensive networks. Consider requesting introductions through them.
                </p>
              </div>
              <Button size="sm" variant="outline">
                View Connectors
              </Button>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="p-2 bg-warning/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Optimize introduction timing</h4>
                <p className="text-sm text-muted-foreground">
                  Tuesday-Thursday between 10 AM-2 PM shows 40% higher response rates.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Schedule Smartly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}