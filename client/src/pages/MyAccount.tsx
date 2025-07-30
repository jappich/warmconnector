import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

interface IntroductionRequest {
  id: string;
  requesterId: string;
  connectorId: string;
  targetId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  pathData: string; // JSON string
  timestamp: string;
}

export default function MyAccount() {
  // Fetch introduction requests history
  const {
    data: introductionRequests,
    isLoading,
    error
  } = useQuery({
    queryKey: ['introduction-requests-history'],
    queryFn: async (): Promise<IntroductionRequest[]> => {
      const response = await fetch('/api/introduction/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch introduction requests');
      }
      
      return response.json();
    }
  });

  const getStatusIcon = (status: string) => {
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

  const getStatusBadgeColor = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <User className="mr-3 h-8 w-8 text-blue-400" />
          My Account
        </h1>
        <p className="text-gray-400">
          Manage your profile and track your introduction requests
        </p>
      </div>

      <Tabs defaultValue="intro-requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="intro-requests" className="text-white">
            Introduction Requests
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-white">
            Profile Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intro-requests" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Send className="mr-2 h-5 w-5" />
                Introduction Request History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">Failed to load introduction requests</p>
                </div>
              ) : !introductionRequests || introductionRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No introduction requests yet</p>
                  <p className="text-gray-500 text-sm">
                    Start by searching for connections and requesting introductions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {introductionRequests.map((request) => (
                    <Card key={request.id} className="bg-gray-900/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <Badge className={getStatusBadgeColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-400">
                            {format(new Date(request.timestamp), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-white font-medium">
                            Request to: {request.targetId}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Path length: {JSON.parse(request.pathData || '[]').length} people
                          </p>
                          <p className="text-gray-400 text-sm">
                            Via: {request.connectorId}
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-gray-300 text-sm">
                            {request.message.length > 100
                              ? `${request.message.substring(0, 100)}...`
                              : request.message
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Profile Management</p>
                  <p className="text-gray-500 text-sm">
                    Update your personal information and preferences
                  </p>
                </div>
                
                {/* Basic Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Name</label>
                    <div className="bg-gray-900/50 border border-gray-600 rounded-md p-3">
                      <p className="text-white">Demo User</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Email</label>
                    <div className="bg-gray-900/50 border border-gray-600 rounded-md p-3">
                      <p className="text-white">demo@example.com</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Company</label>
                    <div className="bg-gray-900/50 border border-gray-600 rounded-md p-3">
                      <p className="text-white">Your Company</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Title</label>
                    <div className="bg-gray-900/50 border border-gray-600 rounded-md p-3">
                      <p className="text-white">Your Title</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-gray-500 text-sm mt-6">
                  Profile editing functionality coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}