import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Video,
  Share2,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function RealTimeCollaboration() {
  const { toast } = useToast();
  const [activeCollaborations, setActiveCollaborations] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);

  // Fetch active collaborations
  const { data: collaborations, isLoading } = useQuery({
    queryKey: ['/api/collaborations/active']
  });

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ['/api/team/members']
  });

  // Create new collaboration
  const createCollaborationMutation = useMutation({
    mutationFn: async (collaborationData) => {
      const response = await fetch('/api/collaborations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collaborationData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create collaboration');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/active'] });
      toast({
        title: "Collaboration Started",
        description: "Team members have been notified to join"
      });
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ collaborationId, message }) => {
      const response = await fetch(`/api/collaborations/${collaborationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/active'] });
    }
  });

  const handleCreateCollaboration = (type, targetData) => {
    createCollaborationMutation.mutate({
      type,
      target: targetData,
      participants: teamMembers?.slice(0, 3) || []
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedCollaboration) return;
    
    sendMessageMutation.mutate({
      collaborationId: selectedCollaboration.id,
      message: messageInput
    });
  };

  // Mock data for demonstration
  const mockCollaborations = [
    {
      id: 1,
      type: 'introduction_planning',
      target: { name: 'Sarah Johnson', company: 'Microsoft' },
      participants: [
        { id: 1, name: 'Alex Chen', role: 'Lead', status: 'online' },
        { id: 2, name: 'Maria Rodriguez', role: 'Researcher', status: 'away' },
        { id: 3, name: 'David Kim', role: 'Strategist', status: 'online' }
      ],
      status: 'active',
      lastActivity: '5 minutes ago',
      messages: [
        { id: 1, sender: 'Alex Chen', message: 'Found a strong mutual connection through LinkedIn', time: '10m ago' },
        { id: 2, sender: 'Maria Rodriguez', message: 'Perfect timing - she just posted about AI initiatives', time: '5m ago' }
      ]
    },
    {
      id: 2,
      type: 'network_analysis',
      target: { name: 'Tech Industry Analysis', company: 'Multiple' },
      participants: [
        { id: 1, name: 'Alex Chen', role: 'Analyst', status: 'online' },
        { id: 4, name: 'Jennifer Walsh', role: 'Data Scientist', status: 'online' }
      ],
      status: 'active',
      lastActivity: '2 hours ago',
      messages: [
        { id: 3, sender: 'Jennifer Walsh', message: 'Identified 47 high-value connections in biotech', time: '2h ago' }
      ]
    }
  ];

  const collaborationTypes = [
    {
      type: 'introduction_planning',
      title: 'Introduction Planning',
      description: 'Collaborate on finding the best path to a target connection',
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      type: 'network_analysis',
      title: 'Network Analysis',
      description: 'Analyze network patterns and identify opportunities',
      icon: Share2,
      color: 'bg-purple-600'
    },
    {
      type: 'strategy_session',
      title: 'Strategy Session',
      description: 'Plan networking strategies for specific goals',
      icon: MessageSquare,
      color: 'bg-green-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading collaborations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Team Collaboration</h1>
        <p className="text-gray-400">
          Work together with your team to maximize networking effectiveness
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Collaborations */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Active Collaborations
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New Session
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCollaborations.map((collab) => (
                  <div 
                    key={collab.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCollaboration?.id === collab.id 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedCollaboration(collab)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{collab.target.name}</h3>
                        <p className="text-gray-400 text-sm">{collab.target.company}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {collab.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={collab.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {collab.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {collab.participants.map((participant) => (
                          <Avatar key={participant.id} className="w-8 h-8 border-2 border-gray-800">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {collab.lastActivity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          {selectedCollaboration && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Team Chat - {selectedCollaboration.target.name}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-gray-600 text-white">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-white">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {selectedCollaboration.messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-600">
                          {message.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white text-sm font-medium">{message.sender}</span>
                          <span className="text-gray-500 text-xs">{message.time}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="bg-gray-900/50 border-gray-600 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Start Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {collaborationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.type}
                    onClick={() => handleCreateCollaboration(type.type, { name: 'New Target', company: 'TBD' })}
                    disabled={createCollaborationMutation.isPending}
                    className={`w-full justify-start ${type.color} hover:opacity-90`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{type.title}</div>
                      <div className="text-xs opacity-80">{type.description}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Alex Chen', role: 'Team Lead', status: 'online', activity: 'Analyzing connections' },
                  { name: 'Maria Rodriguez', role: 'Researcher', status: 'away', activity: 'In meeting' },
                  { name: 'David Kim', role: 'Strategist', status: 'online', activity: 'Available' },
                  { name: 'Jennifer Walsh', role: 'Data Scientist', status: 'offline', activity: 'Last seen 2h ago' }
                ].map((member) => (
                  <div key={member.name} className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{member.name}</p>
                      <p className="text-gray-400 text-xs">{member.role}</p>
                      <p className="text-gray-500 text-xs truncate">{member.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    type: 'success',
                    message: 'Introduction to Sarah Johnson successful',
                    time: '1h ago',
                    user: 'Alex Chen'
                  },
                  {
                    type: 'update',
                    message: 'Network analysis completed for Tech sector',
                    time: '3h ago',
                    user: 'Jennifer Walsh'
                  },
                  {
                    type: 'alert',
                    message: 'New high-value connection opportunity identified',
                    time: '5h ago',
                    user: 'System'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      activity.type === 'success' ? 'bg-green-900/20' :
                      activity.type === 'update' ? 'bg-blue-900/20' : 'bg-orange-900/20'
                    }`}>
                      {activity.type === 'success' && <CheckCircle className="h-3 w-3 text-green-400" />}
                      {activity.type === 'update' && <Bell className="h-3 w-3 text-blue-400" />}
                      {activity.type === 'alert' && <AlertCircle className="h-3 w-3 text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs">{activity.message}</p>
                      <p className="text-gray-500 text-xs">{activity.user} • {activity.time}</p>
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