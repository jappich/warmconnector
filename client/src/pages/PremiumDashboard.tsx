import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Crown, Star, Users, Zap, TrendingUp, MessageCircle, Target, ArrowRight, Sparkles, Globe, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';

interface Connection {
  id: string;
  name: string;
  title: string;
  company: string;
  strength: number;
  lastInteraction: string;
  mutualConnections: number;
  avatar?: string;
}

interface Opportunity {
  id: string;
  type: 'introduction' | 'meeting' | 'collaboration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedValue: string;
  timeframe: string;
}

export default function PremiumDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock premium data - in production this would come from authenticated APIs
  const userStats = {
    totalConnections: 847,
    strongConnections: 92,
    weeklyGrowth: 12,
    networkValue: '$2.4M',
    introductionsMade: 156,
    opportunitiesUnlocked: 23
  };

  const recentConnections: Connection[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'VP of Engineering',
      company: 'Meta',
      strength: 89,
      lastInteraction: '2 hours ago',
      mutualConnections: 12,
      avatar: undefined
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      title: 'Chief Innovation Officer',
      company: 'Tesla',
      strength: 94,
      lastInteraction: '1 day ago',
      mutualConnections: 8,
      avatar: undefined
    },
    {
      id: '3',
      name: 'Elena Petrov',
      title: 'Managing Director',
      company: 'Goldman Sachs',
      strength: 76,
      lastInteraction: '3 days ago',
      mutualConnections: 15,
      avatar: undefined
    }
  ];

  const opportunities: Opportunity[] = [
    {
      id: '1',
      type: 'introduction',
      title: 'Introduce Sarah to Marcus',
      description: 'Both interested in AI infrastructure - potential partnership opportunity',
      priority: 'high',
      estimatedValue: '$500K',
      timeframe: 'This week'
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Coffee with Elena',
      description: 'Discussing venture opportunities in your sector',
      priority: 'medium',
      estimatedValue: '$2M',
      timeframe: 'Next week'
    },
    {
      id: '3',
      type: 'collaboration',
      title: 'Joint venture exploration',
      description: 'Three-way collaboration potential identified',
      priority: 'high',
      estimatedValue: '$1.2M',
      timeframe: 'This month'
    }
  ];

  const getStrengthColor = (strength: number) => {
    if (strength >= 90) return 'text-green-400';
    if (strength >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStrengthBg = (strength: number) => {
    if (strength >= 90) return 'bg-green-400';
    if (strength >= 70) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="h-8 w-8 text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Welcome back, Alex</h1>
              <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30">
                Elite Member
              </Badge>
            </div>
            <p className="text-slate-300">Your network is growing stronger every day.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">#2024</div>
              <div className="text-xs text-slate-400">Member Since</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-400 fill-current" />
                <span className="text-2xl font-bold text-white ml-1">4.9</span>
              </div>
              <div className="text-xs text-slate-400">Network Rating</div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: 'Total Connections', value: userStats.totalConnections.toLocaleString(), icon: Users, color: 'text-blue-400' },
            { label: 'Strong Bonds', value: userStats.strongConnections, icon: Zap, color: 'text-green-400' },
            { label: 'Weekly Growth', value: `+${userStats.weeklyGrowth}`, icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Network Value', value: userStats.networkValue, icon: Target, color: 'text-purple-400' },
            { label: 'Introductions Made', value: userStats.introductionsMade, icon: MessageCircle, color: 'text-indigo-400' },
            { label: 'Opportunities', value: userStats.opportunitiesUnlocked, icon: Sparkles, color: 'text-pink-400' }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                    </div>
                    <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent High-Value Connections */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  Elite Network Activity
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your most valuable recent connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentConnections.map((connection, index) => (
                  <motion.div
                    key={connection.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-amber-400/30 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12 border-2 border-amber-400/30">
                        <AvatarImage src={connection.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold">
                          {connection.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-white">{connection.name}</h3>
                        <p className="text-sm text-slate-300">{connection.title}</p>
                        <p className="text-xs text-slate-400">{connection.company}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Strength:</span>
                        <span className={`font-bold ${getStrengthColor(connection.strength)}`}>
                          {connection.strength}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {connection.mutualConnections} mutual
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{connection.lastInteraction}</p>
                    </div>
                  </motion.div>
                ))}
                
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  View All Connections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities & Quick Actions */}
          <div className="space-y-6">
            {/* AI-Powered Opportunities */}
            <Card className="bg-gradient-to-br from-amber-400/10 to-orange-400/10 border-amber-400/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Hidden Opportunities
                </CardTitle>
                <CardDescription className="text-slate-300">
                  AI-discovered potential worth ${opportunities.reduce((sum, opp) => sum + parseFloat(opp.estimatedValue.replace('$', '').replace('K', '000').replace('M', '000000')), 0) / 1000000}M
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunities.slice(0, 3).map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{opportunity.title}</h4>
                      <Badge className={getPriorityColor(opportunity.priority)}>
                        {opportunity.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">{opportunity.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-amber-400 font-semibold">{opportunity.estimatedValue}</span>
                      <span className="text-xs text-slate-400">{opportunity.timeframe}</span>
                    </div>
                  </motion.div>
                ))}
                
                <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold">
                  Unlock All Opportunities
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <Search className="mr-3 h-4 w-4" />
                  Find New Connections
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <MessageCircle className="mr-3 h-4 w-4" />
                  Request Introduction
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <Globe className="mr-3 h-4 w-4" />
                  Explore Network Map
                </Button>
                
                <Separator className="bg-white/10" />
                
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-sm font-semibold text-white mb-1">Network Health</h4>
                  <Progress value={87} className="mb-2" />
                  <p className="text-xs text-slate-300">Your network strength is exceptional</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-slate-400 italic">
            "Never reach out cold again. Every connection is warm, every opportunity is within reach."
          </p>
        </motion.div>
      </div>
    </div>
  );
}