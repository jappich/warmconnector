import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Brain, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Award,
  Settings,
  Globe,
  Building,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserStats {
  connections: number;
  introRequests: number;
  companies: number;
  networkScore: number;
}

interface ProgressData {
  onboardingComplete: boolean;
  connectionsFound: boolean;
  introRequestSent: boolean;
  profileComplete: boolean;
  aiAssistantUsed: boolean;
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

const WelcomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, progressResponse] = await Promise.all([
          fetch('/api/users/stats'),
          fetch('/api/users/progress')
        ]);

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setUserStats(stats);
        }

        if (progressResponse.ok) {
          const progress = await progressResponse.json();
          setProgressData(progress);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateProgress = (): number => {
    if (!progressData) return 0;
    const steps = Object.values(progressData);
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  const journeySteps: JourneyStep[] = [
    {
      id: 'onboarding',
      title: 'Complete Your Profile',
      description: 'Add your professional information, connections, and background',
      completed: progressData?.onboardingComplete || false,
      icon: UserPlus,
      href: '/onboarding',
      priority: 'high'
    },
    {
      id: 'connections',
      title: 'Find Your First Connection',
      description: 'Search for warm introductions and expand your network',
      completed: progressData?.connectionsFound || false,
      icon: Search,
      href: '/find-connections',
      priority: 'high'
    },
    {
      id: 'intro-request',
      title: 'Send Introduction Request',
      description: 'Request a warm introduction through your network',
      completed: progressData?.introRequestSent || false,
      icon: MessageSquare,
      href: '/find-connections',
      priority: 'medium'
    },
    {
      id: 'ai-assistant',
      title: 'Try AI Networking Assistant',
      description: 'Get personalized networking advice and strategies',
      completed: progressData?.aiAssistantUsed || false,
      icon: Brain,
      href: '/ai-networking-hub',
      priority: 'low'
    }
  ];

  const completedSteps = journeySteps.filter(step => step.completed).length;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            My Stats
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back{user?.user?.name ? `, ${user.user.name.split(' ')[0]}` : ''}!
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Friday, 26</p>
          <p className="text-3xl font-semibold text-foreground">16:23</p>
          <p className="text-xs text-muted-foreground">Work Time 5:45</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Connection Plan */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Connection Plan</h3>
            <span className="text-xs text-muted-foreground">50</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">14</div>
          <div className="text-xs text-muted-foreground">Left</div>
        </div>

        {/* Mail Plan */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Mail Plan</h3>
            <span className="text-xs text-muted-foreground">25</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">6</div>
          <div className="text-xs text-muted-foreground">Left</div>
        </div>

        {/* Direct Messages - Featured */}
        <div className="stat-card-primary p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Direct Messages</h3>
          </div>
          <div className="text-3xl font-bold mb-1">30</div>
          <div className="text-xs opacity-75">Completed</div>
        </div>

        {/* Today's Volume */}
        <div className="premium-card p-6">
          <div className="text-right mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today's volume</h3>
            <div className="text-2xl font-bold text-foreground">$ 96,592</div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Personal</span>
              <span className="text-foreground">$ 3,054</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle>Networking Activity</CardTitle>
              <CardDescription>Your connection growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-muted-foreground">Chart visualization would go here</p>
                  <p className="text-sm text-muted-foreground">Showing connection growth and activity patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Plan Bonus */}
          <div className="premium-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Plan Bonus</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">96%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">18%</div>
                <div className="text-xs text-muted-foreground">Week Growth</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="premium-card p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">2078</div>
                <div className="text-xs text-muted-foreground">Calls</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">1978</div>
                <div className="text-xs text-muted-foreground">Mail</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">2078</div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">638</div>
                <div className="text-xs text-muted-foreground">Leads</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="text-lg font-bold text-foreground">598</span>
              </div>
              <div className="text-xs text-muted-foreground">+18%</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="premium-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/find-connections">
                  <Search className="mr-2 h-4 w-4" />
                  Find Connections
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/ai-networking-hub">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Assistant
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/business-chat-demo">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat Friend
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      {completedSteps >= 3 && (
        <Card className="stat-card-success border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="h-5 w-5" />
              Networking Achievement Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              Great progress! You've completed {completedSteps} key networking steps. 
              You're well on your way to building a powerful professional network.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WelcomeDashboard;