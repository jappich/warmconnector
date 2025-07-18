import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Calendar, 
  Bell,
  Clock,
  Target,
  Users,
  Mail,
  MessageSquare,
  Zap,
  Settings,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function AutomationCenter() {
  const { toast } = useToast();
  const [selectedAutomation, setSelectedAutomation] = useState(null);

  // Fetch automation workflows
  const { data: automations, isLoading } = useQuery({
    queryKey: ['/api/automation/workflows']
  });

  // Fetch automation statistics
  const { data: automationStats } = useQuery({
    queryKey: ['/api/automation/stats']
  });

  // Create automation workflow
  const createAutomationMutation = useMutation({
    mutationFn: async (automationConfig) => {
      const response = await fetch('/api/automation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationConfig)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create automation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/workflows'] });
      toast({
        title: "Automation Created",
        description: "Your networking automation workflow is now active"
      });
    }
  });

  // Toggle automation status
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      const response = await fetch(`/api/automation/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle automation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/workflows'] });
    }
  });

  const automationTemplates = [
    {
      id: 'follow_up_reminders',
      title: 'Follow-up Reminders',
      description: 'Automatically remind you to follow up with new connections after specified intervals',
      icon: Bell,
      category: 'engagement',
      triggers: ['New connection added', 'Introduction made'],
      actions: ['Send reminder notification', 'Schedule follow-up task']
    },
    {
      id: 'connection_tracking',
      title: 'Connection Progress Tracking',
      description: 'Monitor and analyze the progression of your networking relationships',
      icon: TrendingUp,
      category: 'analytics',
      triggers: ['Weekly schedule', 'Monthly review'],
      actions: ['Generate progress report', 'Identify stagnant connections']
    },
    {
      id: 'opportunity_alerts',
      title: 'Opportunity Detection',
      description: 'Get notified when high-value networking opportunities arise in your network',
      icon: Target,
      category: 'intelligence',
      triggers: ['Network analysis complete', 'New person added to target company'],
      actions: ['Send opportunity alert', 'Suggest introduction path']
    },
    {
      id: 'content_engagement',
      title: 'Content Engagement Automation',
      description: 'Automatically engage with your connections\' professional content',
      icon: MessageSquare,
      category: 'engagement',
      triggers: ['Connection posts content', 'Industry trending topic'],
      actions: ['Send engagement reminder', 'Suggest comment topics']
    }
  ];

  const activeAutomations = [
    {
      id: 1,
      name: 'Weekly Network Review',
      type: 'analytics',
      status: 'active',
      lastRun: '2 hours ago',
      nextRun: 'In 5 days',
      successRate: 94,
      actions: 127,
      description: 'Generates weekly analytics reports on network growth and engagement'
    },
    {
      id: 2,
      name: 'Introduction Follow-ups',
      type: 'engagement',
      status: 'active',
      lastRun: '1 day ago',
      nextRun: 'Tomorrow',
      successRate: 87,
      actions: 23,
      description: 'Reminds you to follow up with recent introductions after 3 days'
    },
    {
      id: 3,
      name: 'High-Value Opportunity Alerts',
      type: 'intelligence',
      status: 'paused',
      lastRun: '3 days ago',
      nextRun: 'Paused',
      successRate: 91,
      actions: 8,
      description: 'Monitors network for strategic connection opportunities'
    }
  ];

  const handleCreateAutomation = (template) => {
    const automationConfig = {
      name: template.title,
      type: template.id,
      category: template.category,
      triggers: template.triggers,
      actions: template.actions,
      enabled: true
    };

    createAutomationMutation.mutate(automationConfig);
  };

  const handleToggleAutomation = (automation) => {
    const newStatus = automation.status === 'active' ? false : true;
    toggleAutomationMutation.mutate({
      id: automation.id,
      enabled: newStatus
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading automation center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Automation Center</h1>
        <p className="text-gray-400">
          Streamline your networking activities with intelligent automation workflows
        </p>
      </div>

      {/* Automation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Workflows</p>
                <p className="text-2xl font-bold text-white">
                  {automationStats?.activeWorkflows || 2}
                </p>
              </div>
              <Bot className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Running smoothly
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Actions This Week</p>
                <p className="text-2xl font-bold text-white">247</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              +23% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">92%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Excellent performance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Time Saved</p>
                <p className="text-2xl font-bold text-white">12.4h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
            <div className="mt-2 flex items-center text-purple-400 text-sm">
              <Clock className="h-3 w-3 mr-1" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Automation Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Active Workflows */}
        <TabsContent value="active">
          <div className="space-y-4">
            {activeAutomations.map((automation) => (
              <Card key={automation.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        automation.type === 'analytics' ? 'bg-blue-900/20' :
                        automation.type === 'engagement' ? 'bg-green-900/20' : 'bg-purple-900/20'
                      }`}>
                        {automation.type === 'analytics' && <TrendingUp className="h-4 w-4 text-blue-400" />}
                        {automation.type === 'engagement' && <Users className="h-4 w-4 text-green-400" />}
                        {automation.type === 'intelligence' && <Target className="h-4 w-4 text-purple-400" />}
                      </div>
                      {automation.name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                        {automation.status}
                      </Badge>
                      <Switch
                        checked={automation.status === 'active'}
                        onCheckedChange={() => handleToggleAutomation(automation)}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{automation.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-xs">Last Run</p>
                      <p className="text-white text-sm">{automation.lastRun}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Next Run</p>
                      <p className="text-white text-sm">{automation.nextRun}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Success Rate</p>
                      <p className="text-white text-sm">{automation.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Actions Performed</p>
                      <p className="text-white text-sm">{automation.actions}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="w-full bg-gray-700 rounded-full h-2 mr-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                        style={{width: `${automation.successRate}%`}}
                      ></div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-gray-600 text-white">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-white">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {automationTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        template.category === 'analytics' ? 'bg-blue-900/20' :
                        template.category === 'engagement' ? 'bg-green-900/20' : 'bg-purple-900/20'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          template.category === 'analytics' ? 'text-blue-400' :
                          template.category === 'engagement' ? 'text-green-400' : 'text-purple-400'
                        }`} />
                      </div>
                      {template.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{template.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-white text-sm font-medium mb-2">Triggers:</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.triggers.map((trigger, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white text-sm font-medium mb-2">Actions:</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.actions.map((action, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleCreateAutomation(template)}
                      disabled={createAutomationMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Play className="h-3 w-3 mr-2" />
                      Create Automation
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Email Notifications</h3>
                    <p className="text-gray-400 text-sm">Receive automation updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">In-App Notifications</h3>
                    <p className="text-gray-400 text-sm">Show automation alerts in the platform</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Weekly Reports</h3>
                    <p className="text-gray-400 text-sm">Automated weekly performance summaries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Automation Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="daily-actions" className="text-gray-300">
                    Daily Action Limit
                  </Label>
                  <Input
                    id="daily-actions"
                    type="number"
                    defaultValue="50"
                    className="bg-gray-900/50 border-gray-600 text-white mt-1"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Maximum automated actions per day
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="retry-attempts" className="text-gray-300">
                    Retry Attempts
                  </Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    defaultValue="3"
                    className="bg-gray-900/50 border-gray-600 text-white mt-1"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Number of retry attempts for failed actions
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="cooldown-period" className="text-gray-300">
                    Cooldown Period (hours)
                  </Label>
                  <Input
                    id="cooldown-period"
                    type="number"
                    defaultValue="24"
                    className="bg-gray-900/50 border-gray-600 text-white mt-1"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Minimum time between similar automated actions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}