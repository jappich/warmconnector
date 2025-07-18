import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  Star, 
  MessageCircle,
  UserPlus,
  Link as LinkIcon,
  Eye,
  ArrowRight,
  Zap,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionActivity {
  id: string;
  type: 'new_connection' | 'introduction_made' | 'profile_view' | 'mutual_connection' | 'path_discovered';
  timestamp: Date;
  person: {
    name: string;
    company: string;
    title: string;
    avatar?: string;
  };
  target?: {
    name: string;
    company: string;
  };
  metadata: {
    strength?: number;
    hops?: number;
    platform?: string;
    mutual_connections?: number;
  };
}

interface NetworkInsight {
  id: string;
  type: 'trending_company' | 'hot_connection' | 'weak_link' | 'opportunity';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  count?: number;
}

export default function LiveConnectionFeed() {
  const [activeTab, setActiveTab] = useState('activity');
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch live activity feed
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/network/activity-feed', filter],
    queryFn: () => apiRequest(`/api/network/activity-feed?filter=${filter}`),
    refetchInterval: isLive ? 5000 : false
  });

  // Fetch network insights
  const { data: insights } = useQuery({
    queryKey: ['/api/network/insights'],
    queryFn: () => apiRequest('/api/network/insights'),
    refetchInterval: 30000
  });

  // Fetch network stats
  const { data: stats } = useQuery({
    queryKey: ['/api/network/stats'],
    queryFn: () => apiRequest('/api/network/stats')
  });

  // Mock data for demo purposes
  const mockActivities: ConnectionActivity[] = [
    {
      id: '1',
      type: 'new_connection',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      person: { name: 'Sarah Chen', company: 'Meta', title: 'Product Manager', avatar: '' },
      metadata: { platform: 'LinkedIn', strength: 85 }
    },
    {
      id: '2',
      type: 'path_discovered',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      person: { name: 'Alex Rodriguez', company: 'Google', title: 'Software Engineer', avatar: '' },
      target: { name: 'Mike Johnson', company: 'Apple' },
      metadata: { hops: 2, strength: 72 }
    },
    {
      id: '3',
      type: 'introduction_made',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      person: { name: 'Emily Davis', company: 'Tesla', title: 'VP Engineering', avatar: '' },
      target: { name: 'David Kim', company: 'SpaceX' },
      metadata: { strength: 91 }
    },
    {
      id: '4',
      type: 'mutual_connection',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      person: { name: 'James Wilson', company: 'Netflix', title: 'Data Scientist', avatar: '' },
      metadata: { mutual_connections: 5, platform: 'GitHub' }
    },
    {
      id: '5',
      type: 'profile_view',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      person: { name: 'Lisa Zhang', company: 'Uber', title: 'Design Lead', avatar: '' },
      metadata: { platform: 'LinkedIn' }
    }
  ];

  const mockInsights: NetworkInsight[] = [
    {
      id: '1',
      type: 'trending_company',
      title: 'Anthropic Connections Rising',
      description: '12 new connections at Anthropic discovered this week',
      action: 'Explore Anthropic network',
      priority: 'high',
      count: 12
    },
    {
      id: '2',
      type: 'hot_connection',
      title: 'High-Value Path Available',
      description: 'Strong 2-hop path to CTO at OpenAI through mutual connection',
      action: 'Request introduction',
      priority: 'high'
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'LinkedIn Engagement Spike',
      description: 'Your network activity increased 34% this week',
      action: 'Leverage momentum',
      priority: 'medium',
      count: 34
    },
    {
      id: '4',
      type: 'weak_link',
      title: 'Strengthen Google Connections',
      description: '3 Google connections need relationship maintenance',
      action: 'Schedule follow-ups',
      priority: 'low',
      count: 3
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_connection': return <UserPlus className="h-4 w-4" />;
      case 'introduction_made': return <MessageCircle className="h-4 w-4" />;
      case 'profile_view': return <Eye className="h-4 w-4" />;
      case 'mutual_connection': return <Users className="h-4 w-4" />;
      case 'path_discovered': return <LinkIcon className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'new_connection': return 'bg-green-100 text-green-700 border-green-200';
      case 'introduction_made': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'profile_view': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'mutual_connection': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'path_discovered': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const displayActivities = activities || mockActivities;
  const displayInsights = insights || mockInsights;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Activity className="mr-4 h-10 w-10 text-blue-400" />
              Live Connection Feed
            </h1>
            <p className="text-gray-400 text-lg">
              Real-time network activity and intelligent connection insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={`border-gray-600 ${isLive ? 'bg-green-600 text-white' : 'text-gray-300'}`}
            >
              <Bell className="mr-2 h-4 w-4" />
              {isLive ? 'Live' : 'Paused'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Connections</p>
                  <p className="text-2xl font-bold text-white">1,247</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">New This Week</p>
                  <p className="text-2xl font-bold text-white">23</p>
                  <p className="text-green-400 text-xs">+12% from last week</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Path Length</p>
                  <p className="text-2xl font-bold text-white">2.3</p>
                  <p className="text-blue-400 text-xs">Excellent coverage</p>
                </div>
                <LinkIcon className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Network Score</p>
                  <p className="text-2xl font-bold text-white">87%</p>
                  <Progress value={87} className="h-2 mt-1" />
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 h-12">
          <TabsTrigger value="activity" className="text-white text-base">
            <Activity className="mr-2 h-4 w-4" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-white text-base">
            <Zap className="mr-2 h-4 w-4" />
            Network Insights
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-white text-base">
            <TrendingUp className="mr-2 h-4 w-4" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Recent Network Activity
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                  <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{activity.person.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {activity.person.title} at {activity.person.company}
                      </Badge>
                      <div className="flex items-center text-gray-400 text-sm ml-auto">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(activity.timestamp)} ago
                      </div>
                    </div>
                    
                    <div className="text-gray-300 text-sm mb-2">
                      {activity.type === 'new_connection' && (
                        <>Connected via {activity.metadata.platform}</>
                      )}
                      {activity.type === 'path_discovered' && (
                        <>Found {activity.metadata.hops}-hop path to {activity.target?.name} at {activity.target?.company}</>
                      )}
                      {activity.type === 'introduction_made' && (
                        <>Made introduction to {activity.target?.name} at {activity.target?.company}</>
                      )}
                      {activity.type === 'mutual_connection' && (
                        <>{activity.metadata.mutual_connections} mutual connections discovered</>
                      )}
                      {activity.type === 'profile_view' && (
                        <>Viewed your profile on {activity.metadata.platform}</>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activity.metadata.strength && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.strength}% strength
                        </Badge>
                      )}
                      {activity.metadata.platform && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.platform}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {displayInsights.map((insight) => (
              <Card key={insight.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{insight.title}</CardTitle>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    {insight.count && (
                      <div className="text-2xl font-bold text-blue-400">
                        {insight.count}
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 ml-auto"
                    >
                      {insight.action}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                High-Value Connection Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Analyzing Network Opportunities
                </h3>
                <p className="text-gray-500 mb-4">
                  We're processing your network data to identify high-value connection opportunities.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Refresh Analysis
                  <RefreshCw className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}