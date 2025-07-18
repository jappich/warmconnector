import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Network,
  Target,
  Clock,
  Building2,
  MapPin,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter
} from 'lucide-react';

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('connections');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/network', timeframe]
  });

  const { data: trendingData } = useQuery({
    queryKey: ['/api/analytics/trending']
  });

  const networkMetrics = [
    {
      title: 'Total Connections',
      value: analyticsData?.totalConnections || 847,
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Introduction Success Rate',
      value: '89.2%',
      change: '+5.1%',
      trend: 'up',
      icon: Target,
      color: 'text-green-400'
    },
    {
      title: 'Network Reach',
      value: '12.4K',
      change: '+8.7%',
      trend: 'up',
      icon: Network,
      color: 'text-purple-400'
    },
    {
      title: 'Response Rate',
      value: '76.3%',
      change: '-2.1%',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-400'
    }
  ];

  const connectionGrowth = [
    { month: 'Jan', connections: 45, introductions: 12 },
    { month: 'Feb', connections: 52, introductions: 18 },
    { month: 'Mar', connections: 68, introductions: 24 },
    { month: 'Apr', connections: 71, introductions: 31 },
    { month: 'May', connections: 89, introductions: 38 },
    { month: 'Jun', connections: 94, introductions: 42 }
  ];

  const topIndustries = [
    { name: 'Technology', connections: 234, percentage: 28 },
    { name: 'Finance', connections: 187, percentage: 22 },
    { name: 'Healthcare', connections: 156, percentage: 18 },
    { name: 'Consulting', connections: 134, percentage: 16 },
    { name: 'Real Estate', connections: 89, percentage: 11 },
    { name: 'Other', connections: 47, percentage: 5 }
  ];

  const recentInsights = [
    {
      type: 'opportunity',
      title: 'High-Value Connection Opportunity',
      description: 'Sarah Chen at Microsoft has 3 mutual connections and works in your target sector',
      time: '2 hours ago',
      priority: 'high'
    },
    {
      type: 'trend',
      title: 'Industry Trend Alert',
      description: 'Technology sector connections increased 15% this month in your network',
      time: '5 hours ago',
      priority: 'medium'
    },
    {
      type: 'success',
      title: 'Introduction Success',
      description: 'Your introduction request to David Rodriguez was accepted',
      time: '1 day ago',
      priority: 'low'
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Network Analytics</h1>
            <p className="text-gray-400">
              Comprehensive insights into your professional networking performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm" className="border-gray-600 text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {networkMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
                <div className={`mt-2 flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change} from last period
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Connection Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">New Connections</span>
                    <span className="text-white font-medium">47 this month</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Introduction Requests</span>
                    <span className="text-white font-medium">23 this month</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Profile Views</span>
                    <span className="text-white font-medium">156 this month</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '89%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { location: 'San Francisco Bay Area', count: 234, percentage: 28 },
                    { location: 'New York City', count: 187, percentage: 22 },
                    { location: 'Los Angeles', count: 156, percentage: 18 },
                    { location: 'Boston', count: 134, percentage: 16 },
                    { location: 'Seattle', count: 89, percentage: 11 },
                    { location: 'Other', count: 47, percentage: 5 }
                  ].map((item) => (
                    <div key={item.location} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-medium">{item.count}</span>
                        <span className="text-gray-500 text-xs">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Network Growth Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {connectionGrowth.map((month) => (
                  <div key={month.month} className="flex flex-col items-center space-y-2">
                    <div className="flex flex-col space-y-1">
                      <div 
                        className="bg-blue-600 rounded-t w-8"
                        style={{height: `${(month.connections / 100) * 120}px`}}
                      ></div>
                      <div 
                        className="bg-green-600 rounded-b w-8"
                        style={{height: `${(month.introductions / 50) * 60}px`}}
                      ></div>
                    </div>
                    <span className="text-gray-400 text-xs">{month.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-300 text-sm">Connections</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-gray-300 text-sm">Introductions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industries Tab */}
        <TabsContent value="industries">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Industry Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topIndustries.map((industry) => (
                  <div key={industry.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{industry.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{industry.connections}</span>
                        <span className="text-gray-500 text-sm">({industry.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{width: `${industry.percentage * 3}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Star className="mr-2 h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-600">
                    <div className={`p-2 rounded-lg ${
                      insight.priority === 'high' ? 'bg-red-900/20' :
                      insight.priority === 'medium' ? 'bg-yellow-900/20' : 'bg-green-900/20'
                    }`}>
                      {insight.type === 'opportunity' && <Target className="h-4 w-4 text-red-400" />}
                      {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-yellow-400" />}
                      {insight.type === 'success' && <Star className="h-4 w-4 text-green-400" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{insight.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{insight.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500 text-xs">{insight.time}</span>
                        <Badge variant={
                          insight.priority === 'high' ? 'destructive' :
                          insight.priority === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {insight.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}