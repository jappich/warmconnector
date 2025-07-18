import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  Building2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function MyConnections() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch introduction requests
  const {
    data: introRequests,
    isLoading: requestsLoading,
    error: requestsError
  } = useQuery({
    queryKey: ['intro-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/introduction/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch introduction requests');
      }
      
      return response.json();
    }
  });

  // Fetch saved connections
  const {
    data: savedConnections,
    isLoading: connectionsLoading,
    error: connectionsError
  } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/connections/saved', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved connections');
      }
      
      return response.json();
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Send className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const filteredRequests = introRequests?.filter(request => {
    const matchesSearch = !searchTerm || 
      request.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.targetCompany?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredConnections = savedConnections?.filter(connection => {
    return !searchTerm || 
      connection.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.title?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  if (requestsLoading || connectionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-4 text-lg">Loading your connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3 flex items-center">
              <Users className="mr-4 h-8 w-8 text-primary" />
              My Connections
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your network, track introduction requests, and view your saved connections
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connections or introduction requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="intro-requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 h-12">
          <TabsTrigger value="intro-requests" className="text-white text-base">
            Introduction Requests ({introRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="saved-connections" className="text-white text-base">
            Saved Connections ({savedConnections?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intro-requests" className="space-y-6">
          {requestsError ? (
            <Card className="bg-red-900/20 border-red-500/50">
              <CardContent className="p-6 text-center">
                <p className="text-red-400">Failed to load introduction requests</p>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <Send className="mx-auto h-16 w-16 text-gray-500 mb-6" />
                <h3 className="text-gray-400 text-xl mb-3">
                  {searchTerm ? 'No matching requests' : 'No introduction requests yet'}
                </h3>
                <p className="text-gray-500 text-base mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters'
                    : 'Start by searching for connections and requesting introductions'
                  }
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Find Connections
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-400">
                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                          Introduction to: {request.targetName}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-400">
                            <Building2 className="h-4 w-4 mr-2" />
                            {request.targetTitle} at {request.targetCompany}
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Users className="h-4 w-4 mr-2" />
                            Via: {request.intermediaryName}
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Send className="h-4 w-4 mr-2" />
                            Path length: {request.pathLength || 'Unknown'} connections
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">Message Preview:</h4>
                        <p className="text-gray-400 text-sm bg-gray-900/50 p-3 rounded border border-gray-700">
                          {request.messageTemplate?.length > 150
                            ? `${request.messageTemplate.substring(0, 150)}...`
                            : request.messageTemplate || 'No message available'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved-connections" className="space-y-6">
          {connectionsError ? (
            <Card className="bg-red-900/20 border-red-500/50">
              <CardContent className="p-6 text-center">
                <p className="text-red-400">Failed to load saved connections</p>
              </CardContent>
            </Card>
          ) : filteredConnections.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <Users className="mx-auto h-16 w-16 text-gray-500 mb-6" />
                <h3 className="text-gray-400 text-xl mb-3">
                  {searchTerm ? 'No matching connections' : 'No saved connections yet'}
                </h3>
                <p className="text-gray-500 text-base mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Save connections from your searches to build your network'
                  }
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Find New Connections
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConnections.map((connection) => (
                <Card key={connection.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {connection.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{connection.name}</h3>
                        <p className="text-gray-400 text-sm">{connection.title}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-400 text-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        {connection.company}
                      </div>
                      {connection.email && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <Mail className="h-4 w-4 mr-2" />
                          {connection.email}
                        </div>
                      )}
                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Saved {format(new Date(connection.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700">
                        View Profile
                      </Button>
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Send className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}