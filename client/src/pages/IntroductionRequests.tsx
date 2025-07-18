import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Building, MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IntroductionRequest {
  id: string;
  requesterId: string;
  connectorId: string;
  targetId: string;
  path: string[];
  message: string;
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
  connector: {
    name: string;
    company: string;
    title: string;
  };
  target: {
    name: string;
    company: string;
    title: string;
  };
}

export default function IntroductionRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<IntroductionRequest[]>({
    queryKey: ['/api/introduction/history'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/introduction/status`, {
        method: 'POST',
        body: JSON.stringify({ requestId: id, status }),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/introduction/history'] });
      toast({
        title: "Status updated",
        description: "Introduction request status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update introduction request status.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SENT': return <Send className="h-4 w-4" />;
      case 'ACCEPTED': return <CheckCircle className="h-4 w-4" />;
      case 'DECLINED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Introduction Requests</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Introduction Requests</h1>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No introduction requests yet</h3>
            <p className="text-gray-600 text-center">
              When you request introductions through the connection finder, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Introduction to {request.target.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-1 mt-1">
                      <Building className="h-4 w-4" />
                      <span>{request.target.title} at {request.target.company}</span>
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1`}>
                    {getStatusIcon(request.status)}
                    <span>{request.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Connection Path:</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">You</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {request.connector.name}
                      </span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {request.target.name}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Connector:</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{request.connector.name}</span>
                      <span className="text-gray-400">•</span>
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{request.connector.title} at {request.connector.company}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Message:</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {request.message}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'DECLINED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'SENT' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send Introduction
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}