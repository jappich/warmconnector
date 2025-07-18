import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Brain, Users, Zap, Target, CheckCircle } from 'lucide-react';
import BusinessChatFriend from '@/components/BusinessChatFriend';

export default function BusinessChatDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Business Chat Friend Demo
          </h1>
          <p className="text-purple-200 text-lg max-w-3xl mx-auto">
            Meet Alex, your AI-powered business networking assistant. Experience personalized onboarding 
            and intelligent conversation designed to enhance your professional connections.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
                Smart Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">
                Five strategic questions to understand your background, goals, and networking needs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">
                GPT-4o integration provides contextual networking advice based on your profile.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                Graph Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">
                Automatically creates Neo4j relationships from your career history and connections.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Instructions */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              How to Experience the Demo
            </CardTitle>
            <CardDescription className="text-purple-200">
              Follow these steps to see the BusinessChatFriend in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-purple-600 text-white min-w-[24px] h-6 flex items-center justify-center">1</Badge>
                  <div>
                    <h3 className="text-white font-medium">Click the Chat Icon</h3>
                    <p className="text-purple-300 text-sm">Look for the purple message icon in the bottom-right corner</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge className="bg-purple-600 text-white min-w-[24px] h-6 flex items-center justify-center">2</Badge>
                  <div>
                    <h3 className="text-white font-medium">Complete Onboarding</h3>
                    <p className="text-purple-300 text-sm">Answer 5 strategic questions about your background</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-purple-600 text-white min-w-[24px] h-6 flex items-center justify-center">3</Badge>
                  <div>
                    <h3 className="text-white font-medium">Start Networking</h3>
                    <p className="text-purple-300 text-sm">Chat with Alex about connections, strategies, and opportunities</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  Sample Questions to Try
                </h3>
                <div className="space-y-2">
                  <div className="bg-purple-900/30 p-3 rounded-lg">
                    <p className="text-purple-200 text-sm">"How can I get introduced to someone at Google?"</p>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-lg">
                    <p className="text-purple-200 text-sm">"What's the best way to approach potential investors?"</p>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-lg">
                    <p className="text-purple-200 text-sm">"Help me craft an introduction message"</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Architecture */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Implementation Features
            </CardTitle>
            <CardDescription className="text-purple-200">
              Built with modern tech stack and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-white font-medium">Frontend</h4>
                <ul className="text-purple-300 text-sm space-y-1">
                  <li>• React with TypeScript</li>
                  <li>• TanStack Query for data</li>
                  <li>• Shadcn/UI components</li>
                  <li>• Responsive glassmorphic design</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Backend</h4>
                <ul className="text-purple-300 text-sm space-y-1">
                  <li>• Express.js API endpoints</li>
                  <li>• PostgreSQL data storage</li>
                  <li>• Real-time message handling</li>
                  <li>• Drizzle ORM integration</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">AI & Graph</h4>
                <ul className="text-purple-300 text-sm space-y-1">
                  <li>• OpenAI GPT-4o ready</li>
                  <li>• Neo4j relationship mapping</li>
                  <li>• Context-aware responses</li>
                  <li>• Vector storage support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <p className="text-purple-200 mb-4">Ready to experience intelligent networking?</p>
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Click the chat icon to get started!</span>
          </div>
        </div>
      </div>

      {/* BusinessChatFriend component */}
      <BusinessChatFriend />
    </div>
  );
}