import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  TrendingUp, 
  Target,
  Search,
  Plus,
  MessageSquare,
  Clock,
  ArrowRight,
  Building2,
  MapPin,
  Star
} from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState('week');

  // Fetch user's network data
  const { data: networkStats } = useQuery({
    queryKey: ['/api/analytics/network']
  });

  // Fetch recent connections
  const { data: recentConnections } = useQuery({
    queryKey: ['/api/user/connections']
  });

  // Fetch connection suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['/api/connections/suggestions']
  });

  const quickActions = [
    {
      title: 'Find Introduction',
      description: 'Search for warm connection paths',
      icon: Search,
      href: '/find-intro',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Add Connection',
      description: 'Manually add a professional contact',
      icon: Plus,
      href: '/add-connection',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Network Map',
      description: 'Visualize your professional network',
      icon: Network,
      href: '/network-map',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const recentActivity = [
    {
      type: 'connection',
      message: 'Connected with Sarah Johnson at Microsoft',
      time: '2 hours ago',
      icon: Users
    },
    {
      type: 'introduction',
      message: 'Introduction request sent to John Smith',
      time: '5 hours ago',
      icon: MessageSquare
    },
    {
      type: 'insight',
      message: 'New connection insights available for Tech industry',
      time: '1 day ago',
      icon: TrendingUp
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Your professional networking hub - discover connections and grow your network
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Connections</p>
                <p className="text-2xl font-bold text-white">
                  {networkStats?.totalConnections || 156}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Introduction Requests</p>
                <p className="text-2xl font-bold text-white">23</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-400" />
            </div>
            <div className="mt-2 flex items-center text-yellow-400 text-sm">
              <Clock className="h-3 w-3 mr-1" />
              5 pending responses
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">87%</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <Star className="h-3 w-3 mr-1" />
              Above average
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Network Reach</p>
                <p className="text-2xl font-bold text-white">2.1K</p>
              </div>
              <Network className="h-8 w-8 text-orange-400" />
            </div>
            <div className="mt-2 flex items-center text-blue-400 text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              2nd degree connections
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Button
                      className={`w-full justify-start ${action.color} text-white`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs opacity-80">{action.description}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-gray-700/50">
                        <Icon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{activity.message}</p>
                        <p className="text-gray-500 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Suggestions */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Suggested Connections
                <Link href="/insights">
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Alex Thompson',
                    title: 'Senior Product Manager',
                    company: 'Google',
                    mutualConnections: 3,
                    reason: 'Same university and industry'
                  },
                  {
                    name: 'Maria Rodriguez',
                    title: 'VP of Engineering',
                    company: 'Meta',
                    mutualConnections: 5,
                    reason: 'Connected through John Smith'
                  },
                  {
                    name: 'David Chen',
                    title: 'Investment Director',
                    company: 'Sequoia Capital',
                    mutualConnections: 2,
                    reason: 'Tech startup ecosystem'
                  }
                ].map((person, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{person.name}</h3>
                        <p className="text-gray-400 text-sm">{person.title}</p>
                        <div className="flex items-center mt-1">
                          <Building2 className="h-3 w-3 text-gray-500 mr-1" />
                          <span className="text-gray-500 text-xs">{person.company}</span>
                          <span className="mx-2 text-gray-600">•</span>
                          <span className="text-blue-400 text-xs">{person.mutualConnections} mutual</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-2">
                        {person.reason}
                      </Badge>
                      <div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}