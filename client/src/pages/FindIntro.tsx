import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Mail, 
  Send, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Calendar,
  Handshake,
  Star,
  ChevronRight,
  UserPlus,
  ArrowRight
} from "lucide-react";

interface IntroRequest {
  id: string;
  targetName: string;
  targetTitle: string;
  targetCompany: string;
  requesterName: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  requestDate: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

const mockRequests: IntroRequest[] = [
  {
    id: "1",
    targetName: "Sarah Chen",
    targetTitle: "VP of Engineering",
    targetCompany: "Google",
    requesterName: "Alex Johnson",
    status: "pending",
    requestDate: "2025-01-02",
    message: "Would love to discuss AI infrastructure solutions...",
    priority: "high"
  },
  {
    id: "2",
    targetName: "Marcus Rodriguez",
    targetTitle: "Product Director",
    targetCompany: "Microsoft",
    requesterName: "Alex Johnson", 
    status: "accepted",
    requestDate: "2025-01-01",
    message: "Interested in collaborating on enterprise tools...",
    priority: "medium"
  },
  {
    id: "3",
    targetName: "Lisa Park",
    targetTitle: "Head of Sales",
    targetCompany: "Salesforce",
    requesterName: "Alex Johnson",
    status: "completed",
    requestDate: "2024-12-28",
    message: "Looking to explore partnership opportunities...",
    priority: "low"
  }
];

export default function FindIntro() {
  const [targetName, setTargetName] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [requests, setRequests] = useState<IntroRequest[]>(mockRequests);

  const handleSubmitRequest = () => {
    if (!targetName || !message) return;
    
    const newRequest: IntroRequest = {
      id: Date.now().toString(),
      targetName,
      targetTitle,
      targetCompany,
      requesterName: "Alex Johnson",
      status: "pending",
      requestDate: new Date().toISOString().split('T')[0],
      message,
      priority: "medium"
    };
    
    setRequests([newRequest, ...requests]);
    setTargetName("");
    setTargetCompany("");
    setTargetTitle("");
    setMessage("");
    setActiveTab('manage');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <Handshake className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean professional background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background opacity-50"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-400/30 rounded-full px-4 py-2 mb-6">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Introduction Requests</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Find Intro
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Request warm introductions to specific people and manage your introduction pipeline. 
            Perfect for targeted outreach, partnership building, and relationship development.
          </p>
        </div>

        {/* Use Cases Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <UserPlus className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Executive Outreach</CardTitle>
              <CardDescription className="text-slate-300">
                "Get introduced to the CEO of TechCorp for strategic partnership discussions"
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <Handshake className="w-8 h-8 text-pink-400 mb-2" />
              <CardTitle className="text-white">Investment Connections</CardTitle>
              <CardDescription className="text-slate-300">
                "Request introduction to VC partner at Sequoia for Series A funding"
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Expert Networking</CardTitle>
              <CardDescription className="text-slate-300">
                "Connect with industry expert for technical advisory role"
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 ${
              activeTab === 'create' 
                ? 'bg-purple-500 text-white' 
                : 'border-white/20 text-slate-300 hover:border-purple-400'
            }`}
          >
            <Send className="w-4 h-4 mr-2" />
            Create Request
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-2 ${
              activeTab === 'manage' 
                ? 'bg-purple-500 text-white' 
                : 'border-white/20 text-slate-300 hover:border-purple-400'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Manage Requests ({requests.length})
          </Button>
        </div>

        {/* Create Request Tab */}
        {activeTab === 'create' && (
          <Card className="glass border border-white/10 bg-white/5 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Send className="w-5 h-5 mr-2 text-purple-400" />
                Request Introduction
              </CardTitle>
              <CardDescription className="text-slate-300">
                Specify who you'd like to meet and craft your introduction request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white mb-2 block">Target Person Name *</label>
                  <Input
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="bg-white/5 border-white/20 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="text-white mb-2 block">Company</label>
                  <Input
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g., Google"
                    className="bg-white/5 border-white/20 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-white mb-2 block">Title/Role</label>
                <Input
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="e.g., VP of Engineering"
                  className="bg-white/5 border-white/20 text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-white mb-2 block">Introduction Message *</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi [Mutual Connection], 

I hope you're doing well! I'm reaching out because I'd love to connect with [Target Name] about [specific reason]. 

[Brief context about why this introduction would be valuable]

Would you be open to making an introduction? I'd be happy to provide more context.

Best regards,
[Your name]"
                  rows={8}
                  className="bg-white/5 border-white/20 text-white placeholder-slate-400"
                />
              </div>

              <Button 
                onClick={handleSubmitRequest}
                disabled={!targetName || !message}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Introduction Request
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manage Requests Tab */}
        {activeTab === 'manage' && (
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-400" />
                Your Introduction Requests
              </CardTitle>
              <CardDescription className="text-slate-300">
                Track and manage your ongoing introduction requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border border-white/10 bg-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{request.targetName}</h3>
                          <p className="text-purple-400">{request.targetTitle}</p>
                          <p className="text-slate-400 text-sm">{request.targetCompany}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-2 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                          <p className="text-slate-400 text-sm flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {request.requestDate}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <p className="text-slate-300 text-sm italic">
                          "{request.message.substring(0, 120)}..."
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            Requested by {request.requesterName}
                          </span>
                          <Badge variant="outline" className="border-white/20 text-slate-300">
                            {request.priority} priority
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}