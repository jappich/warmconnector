import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Network,
      title: "AI-Powered Pathfinding",
      description: "Find the shortest introduction path to anyone in your extended network using graph algorithms.",
      color: "text-blue-400"
    },
    {
      icon: Users,
      title: "Company Directory Integration",
      description: "Automatically sync with your organization's directory to build comprehensive network maps.",
      color: "text-green-400"
    },
    {
      icon: Zap,
      title: "Intelligent Relationship Discovery",
      description: "AI analyzes profiles to identify hidden connections through education, interests, and mutual contacts.",
      color: "text-purple-400"
    },
    {
      icon: Shield,
      title: "Privacy-First Approach",
      description: "Your network data is encrypted and only used to facilitate introductions with your explicit consent.",
      color: "text-orange-400"
    }
  ];

  const stats = [
    { label: "Successful Introductions", value: "2,847", change: "+12%" },
    { label: "Active Users", value: "15,293", change: "+8%" },
    { label: "Network Connections", value: "847K", change: "+23%" },
    { label: "Companies Integrated", value: "432", change: "+15%" }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center mb-6 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
          <Zap className="h-4 w-4 text-blue-400 mr-2" />
          <span className="text-blue-400 text-sm font-medium">Professional Networking Reimagined</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Find <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Warm Introductions</span> to Anyone
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Leverage AI and graph analysis to discover the shortest path to your next opportunity. 
          Connect with decision-makers through mutual connections and transform cold outreach into warm introductions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link href="/find-intro">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg">
                  <Network className="mr-2 h-5 w-5" />
                  Find Connections
                </Button>
              </Link>
              <Link href="/my-account">
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg">
                <Network className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700 text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
              <div className="flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 text-xs">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our platform combines AI, graph theory, and social intelligence to revolutionize professional networking
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Process Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple 3-Step Process
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Search for Your Target",
              description: "Enter the name and company of the person you want to meet"
            },
            {
              step: "2",
              title: "Discover Connection Paths",
              description: "Our AI finds all possible introduction routes through your network"
            },
            {
              step: "3",
              title: "Request Introduction",
              description: "Send a personalized introduction request through the optimal path"
            }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Networking?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already using intelligent introductions to accelerate their careers and business growth.
            </p>
            
            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-blue-400 font-medium">Welcome back, {user?.name}!</p>
                <Link href="/find-intro">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4">
                    <Network className="mr-2 h-5 w-5" />
                    Start Finding Connections
                  </Button>
                </Link>
              </div>
            ) : (
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4">
                <CheckCircle className="mr-2 h-5 w-5" />
                Sign Up - It's Free
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}