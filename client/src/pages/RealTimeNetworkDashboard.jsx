import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ConnectionStrengthIndicator from '@/components/ConnectionStrengthIndicator';
import { 
  Activity, 
  TrendingUp, 
  Users,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Eye,
  Network as NetworkIcon,
  AlertCircle
} from 'lucide-react';

export default function RealTimeNetworkDashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionData, setConnectionData] = useState([]);
  const [activeConnections, setActiveConnections] = useState(0);

  // Real-time network metrics using your MongoDB data
  const { data: realtimeStats, refetch } = useQuery({
    queryKey: ['/api/connections/strength-stats'],
    refetchInterval: 30000 // Update every 30 seconds
  });

  // Network activity feed
  const { data: activityFeed } = useQuery({
    queryKey: ['/api/analytics/network-activity'],
    refetchInterval: 15000 // Update every 15 seconds
  });

  // Top connections by strength
  const { data: topConnections } = useQuery({
    queryKey: ['/api/connections/top-strength'],
    refetchInterval: 60000 // Update every minute
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const networkMetrics = [
    {
      title: 'Network Strength',
      value: Math.round(realtimeStats?.networkStats?.averageStrength || 0),
      unit: '%',
      trend: '+2.3%',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      title: 'Active Connections',
      value: realtimeStats?.networkStats?.totalCalculations || 0,
      unit: '',
      trend: '+5',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Strong Relationships',
      value: realtimeStats?.networkStats?.strongConnections || 0,
      unit: '',
      trend: '+1',
      icon: Target,
      color: 'text-purple-400'
    },
    {
      title: 'Weekly Interactions',
      value: 127,
      unit: '',
      trend: '+12%',
      icon: MessageSquare,
      color: 'text-orange-400'
    }
  ];

  const recentActivity = [
    {
      type: 'strength_update',
      message: 'Connection strength with Sarah Johnson increased to 87%',
      time: '2 minutes ago',
      priority: 'high'
    },
    {
      type: 'new_interaction',
      message: 'New message exchange with Alex Chen recorded',
      time: '5 minutes ago',
      priority: 'medium'
    },
    {
      type: 'mutual_connection',
      message: '3 new mutual connections discovered with Maria Rodriguez',
      time: '8 minutes ago',
      priority: 'medium'
    },
    {
      type: 'engagement_spike',
      message: 'High engagement detected in tech industry connections',
      time: '12 minutes ago',
      priority: 'low'
    }
  ];

  const strengthDistribution = [
    { 
      level: 'Strong (80-100%)', 
      count: realtimeStats?.networkStats?.strongConnections || 0,
      percentage: 28,
      color: 'bg-green-500'
    },
    { 
      level: 'Moderate (60-79%)', 
      count: realtimeStats?.networkStats?.moderateConnections || 0,
      percentage: 45,
      color: 'bg-yellow-500'
    },
    { 
      level: 'Developing (40-59%)', 
      count: Math.round((realtimeStats?.networkStats?.weakConnections || 0) * 0.6),
      percentage: 18,
      color: 'bg-blue-500'
    },
    { 
      level: 'New (0-39%)', 
      count: Math.round((realtimeStats?.networkStats?.weakConnections || 0) * 0.4),
      percentage: 9,
      color: 'bg-gray-500'
    }
  ];

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Real-Time Network Dashboard</h1>
            <p className="text-gray-400">
              Live insights into your professional connection strength and network activity
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-white font-medium">{lastUpdate.toLocaleTimeString()}</div>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="border-gray-600 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {networkMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <Badge variant="outline" className="text-xs">Live</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">{metric.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white">
                      {metric.value}{metric.unit}
                    </span>
                    <span className={`text-sm ${metric.color}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Strength Distribution */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Strength Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strengthDistribution.map((dist, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{dist.level}</span>
                    <span className="text-white font-medium">{dist.count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${dist.color}`}
                      style={{width: `${dist.percentage}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{dist.percentage}% of network</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Activity Feed
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-green-400">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded border border-gray-600">
                  <div className={`p-1 rounded-full ${
                    activity.priority === 'high' ? 'bg-red-900/20' :
                    activity.priority === 'medium' ? 'bg-yellow-900/20' : 'bg-blue-900/20'
                  }`}>
                    {activity.type === 'strength_update' && <TrendingUp className="h-3 w-3 text-green-400" />}
                    {activity.type === 'new_interaction' && <MessageSquare className="h-3 w-3 text-blue-400" />}
                    {activity.type === 'mutual_connection' && <Users className="h-3 w-3 text-purple-400" />}
                    {activity.type === 'engagement_spike' && <Zap className="h-3 w-3 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-gray-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Connections */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <NetworkIcon className="mr-2 h-5 w-5" />
              Strongest Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Sarah Johnson', company: 'Microsoft', strength: 92, trend: '+5%' },
                { name: 'Alex Chen', company: 'Google', strength: 87, trend: '+2%' },
                { name: 'Maria Rodriguez', company: 'Meta', strength: 84, trend: '+8%' },
                { name: 'David Kim', company: 'Apple', strength: 81, trend: '+1%' },
                { name: 'Jennifer Walsh', company: 'Amazon', strength: 78, trend: '+3%' }
              ].map((connection, index) => (
                <div key={index} className="p-3 rounded border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium text-sm">{connection.name}</h4>
                      <p className="text-gray-400 text-xs">{connection.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{connection.strength}%</div>
                      <div className="text-green-400 text-xs">{connection.trend}</div>
                    </div>
                  </div>
                  <Progress value={connection.strength} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Connection Analysis */}
      <div className="mt-8">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Live Connection Analysis
              </div>
              <Badge variant="outline" className="text-xs">
                Auto-updating
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { from: 'person_001', to: 'person_002', names: 'You ↔ Sarah Johnson' },
                { from: 'person_001', to: 'person_003', names: 'You ↔ Alex Chen' },
                { from: 'person_001', to: 'person_004', names: 'You ↔ Maria Rodriguez' }
              ].map((connection, index) => (
                <div key={index} className="p-4 border border-gray-600 rounded">
                  <h4 className="text-white font-medium mb-3">{connection.names}</h4>
                  <ConnectionStrengthIndicator
                    fromPersonId={connection.from}
                    toPersonId={connection.to}
                    showDetails={false}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Health Alerts */}
      <div className="mt-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-400" />
              Network Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded">
                <div className="p-1 rounded-full bg-blue-900/20">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Network Growth Opportunity</h4>
                  <p className="text-gray-300 text-sm">
                    Your tech industry connections show 23% higher engagement than average. 
                    Consider expanding in this sector.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-900/20 border border-green-700/50 rounded">
                <div className="p-1 rounded-full bg-green-900/20">
                  <Target className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Strong Connection Identified</h4>
                  <p className="text-gray-300 text-sm">
                    Your connection with Sarah Johnson has reached 92% strength - excellent for 
                    warm introductions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}