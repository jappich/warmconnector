import React, { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Brain,
  Target,
  Search,
  MessageSquare,
  Sparkles,
  BarChart3,
  Globe,
  Building,
  Mail,
  Clock,
  User,
  Star,
  Quote,
  Building2,
  ChevronRight,
  Rocket,
  Lightbulb,
  Crown,
  Activity,
  Bell,
  RefreshCw,
  Eye,
  TrendingUp as Trending,
  ChevronUp,
  Dot
} from 'lucide-react';
import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";

// Cosmic animation component
const CosmicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const stars: Array<{
      x: number;
      y: number;
      originalX: number;
      originalY: number;
      radius: number;
      opacity: number;
      speed: number;
      angle: number;
      swayX: number;
      swayY: number;
      interactionRadius: number;
      swayStrength: number;
    }> = [];

    const createStars = () => {
      const numStars = 100;
      for (let i = 0; i < numStars; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({
          x,
          y,
          originalX: x,
          originalY: y,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.3,
          speed: Math.random() * 0.3 + 0.1,
          angle: Math.random() * Math.PI * 2,
          swayX: 0,
          swayY: 0,
          interactionRadius: Math.random() * 80 + 60,
          swayStrength: Math.random() * 10 + 5
        });
      }
    };

    createStars();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines between nearby stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const star1 = stars[i];
          const star2 = stars[j];
          const distance = Math.sqrt(
            Math.pow(star1.x - star2.x, 2) + Math.pow(star1.y - star2.y, 2)
          );

          if (distance < 80) {
            const opacity = (80 - distance) / 80 * 0.2;
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.stroke();
          }
        }
      }

      // Draw and animate stars
      stars.forEach((star) => {
        const dx = mouseRef.current.x - star.originalX;
        const dy = mouseRef.current.y - star.originalY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < star.interactionRadius) {
          const force = (star.interactionRadius - distance) / star.interactionRadius;
          const angle = Math.atan2(dy, dx);
          
          star.swayX += Math.cos(angle) * force * star.swayStrength * 0.1;
          star.swayY += Math.sin(angle) * force * star.swayStrength * 0.1;
        }

        star.swayX *= 0.95;
        star.swayY *= 0.95;

        star.originalX += Math.cos(star.angle) * star.speed;
        star.originalY += Math.sin(star.angle) * star.speed;

        if (star.originalX < 0) star.originalX = canvas.width;
        if (star.originalX > canvas.width) star.originalX = 0;
        if (star.originalY < 0) star.originalY = canvas.height;
        if (star.originalY > canvas.height) star.originalY = 0;

        star.x = star.originalX + star.swayX;
        star.y = star.originalY + star.swayY;

        // Draw star with glow effect
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3);
        gradient.addColorStop(0, `rgba(168, 85, 247, ${star.opacity})`);
        gradient.addColorStop(0.4, `rgba(99, 102, 241, ${star.opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30"
      style={{ 
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)' 
      }}
    />
  );
};

// Live Connection Feed Component
const LiveConnectionFeed = () => {
  const [isLive, setIsLive] = React.useState(true);
  
  const recentActivity = [
    {
      id: '1',
      type: 'new_connection',
      user: 'Sarah Chen',
      company: 'Google',
      action: 'joined your network',
      time: '2 min ago',
      avatar: 'SC',
      priority: 'high'
    },
    {
      id: '2', 
      type: 'introduction_made',
      user: 'Michael Rodriguez',
      company: 'Microsoft',
      action: 'made a warm introduction',
      time: '5 min ago',
      avatar: 'MR',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'connection_strength',
      user: 'Emily Park',
      company: 'Startup Inc',
      action: 'connection strength increased',
      time: '8 min ago',
      avatar: 'EP',
      priority: 'low'
    },
    {
      id: '4',
      type: 'trending',
      user: 'Alex Johnson',
      company: 'TechCorp',
      action: 'trending in your network',
      time: '12 min ago',
      avatar: 'AJ',
      priority: 'medium'
    },
    {
      id: '5',
      type: 'opportunity',
      user: 'Jessica Wu',
      company: 'Apple',
      action: 'mutual connection found',
      time: '15 min ago',
      avatar: 'JW',
      priority: 'high'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_connection': return <Users className="h-4 w-4 text-success" />;
      case 'introduction_made': return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'connection_strength': return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'trending': return <Trending className="h-4 w-4 text-destructive" />;
      case 'opportunity': return <Target className="h-4 w-4 text-primary" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-success';
      case 'medium': return 'border-l-4 border-l-warning';
      case 'low': return 'border-l-4 border-l-muted';
      default: return 'border-l-4 border-l-muted';
    }
  };

  return (
    <Card className="premium-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            Live Connection Feed
            {isLive && <Dot className="h-8 w-8 text-success animate-pulse" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={`h-8 ${isLive ? 'bg-success/10 text-success border-success/20' : ''}`}
            >
              <Bell className="h-3 w-3 mr-1" />
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time networking activity and connection insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors ${getPriorityColor(activity.priority)}`}
          >
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">{activity.avatar}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium text-foreground text-sm">{activity.user}</span>
                    <span className="text-xs text-muted-foreground">@ {activity.company}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Network Pulse Component
const NetworkPulse = () => {
  const networkStats = [
    { label: 'Active Now', value: '47', trend: '+12%', icon: Users },
    { label: 'New Connections', value: '8', trend: '+3', icon: Network },
    { label: 'Introductions Made', value: '5', trend: '+2', icon: MessageSquare },
    { label: 'Hot Opportunities', value: '12', trend: '+5', icon: Target }
  ];

  return (
    <Card className="premium-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Trending className="h-5 w-5 text-primary" />
          Network Pulse
        </CardTitle>
        <CardDescription>
          Live metrics from your professional network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {networkStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-success">{stat.trend}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <ChevronUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Network Growing</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your network activity is 23% above average this week. Keep up the momentum!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Mock user data for now to avoid AuthProvider issues
const mockUser = { isAuthenticated: true, user: { name: 'Alex Johnson' } };

export default function HomeModern() {
  const { isAuthenticated, user } = mockUser;

  const features = [
    {
      icon: Network,
      title: "AI-Powered Pathfinding",
      description: "Find the shortest introduction path to anyone in your extended network using graph algorithms.",
      color: "text-primary",
      badge: "Core Feature"
    },
    {
      icon: Users,
      title: "Company Directory Integration",
      description: "Automatically sync with your organization's directory to build comprehensive network maps.",
      color: "text-success",
      badge: "Enterprise"
    },
    {
      icon: Brain,
      title: "Intelligent Relationship Discovery",
      description: "AI analyzes profiles to identify hidden connections through education, interests, and mutual contacts.",
      color: "text-warning",
      badge: "AI-Powered"
    },
    {
      icon: Shield,
      title: "Privacy-First Approach",
      description: "Your network data is encrypted and only used to facilitate introductions with your explicit consent.",
      color: "text-destructive",
      badge: "Security"
    },
    {
      icon: Target,
      title: "Strategic Connection Planning",
      description: "Plan your networking goals and get AI recommendations for building valuable professional relationships.",
      color: "text-primary",
      badge: "Strategy"
    },
    {
      icon: MessageSquare,
      title: "Smart Introduction Messages",
      description: "Generate personalized introduction requests using AI that understands context and professional etiquette.",
      color: "text-success",
      badge: "Communication"
    }
  ];

  const stats = [
    { label: "Successful Introductions", value: "2,847", change: "+12%", icon: CheckCircle },
    { label: "Active Users", value: "15,293", change: "+8%", icon: Users },
    { label: "Network Connections", value: "847K", change: "+23%", icon: Network },
    { label: "Companies Integrated", value: "432", change: "+15%", icon: Globe }
  ];

  const useCases = [
    {
      title: "Business Development",
      description: "Connect with decision-makers at target companies through warm introductions",
      example: "Get introduced to VP of Sales at your top prospect companies",
      icon: BarChart3
    },
    {
      title: "Job Opportunities", 
      description: "Find hiring managers and employees at companies you want to join",
      example: "Connect with engineering leaders at your dream companies",
      icon: Target
    },
    {
      title: "Partnership Building",
      description: "Discover potential partners, investors, or strategic collaborators",
      example: "Meet founders in complementary industries for partnerships",
      icon: Users
    }
  ];

  const testimonials = [
    {
      quote: "WarmConnect helped me land my dream job at Google through a warm introduction from my university alumni network.",
      author: "Sarah Chen",
      title: "Software Engineer at Google",
      avatar: "SC"
    },
    {
      quote: "I closed a $2M partnership deal using WarmConnect's introduction pathfinding. The AI insights were game-changing.",
      author: "Michael Rodriguez", 
      title: "VP Business Development",
      avatar: "MR"
    },
    {
      quote: "As a startup founder, WarmConnect connected me with the exact investors I needed. 3 degrees of separation to Series A.",
      author: "Emily Park",
      title: "CEO & Founder",
      avatar: "EP"
    }
  ];

  const platformOverview = {
    totalConnections: "10,000+",
    successRate: "95%",
    averagePathLength: "2.8 hops",
    industriesCovered: "25+",
    activeUsers: "15,293",
    companiesIntegrated: "432"
  };

  return (
    <div className="relative min-h-screen">
      {/* Open Access Banner */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-b border-green-500/30 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium">OPEN ACCESS MODE</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">No authentication required • All features publicly accessible</span>
          </div>
        </div>
      </div>

      {/* Cosmic Background */}
      <CosmicBackground />
      
      <div className="relative z-10 p-8 space-y-16 max-w-7xl">
        {/* Welcome Hero Section with Logo */}
        <div className="text-center space-y-6 relative pt-8">
        <div className="flex items-center justify-center mb-6">
          <img 
            src={wcLogoPath}
            alt="WarmConnect" 
            className="h-20 w-20 object-contain"
          />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-light text-foreground tracking-tight mb-4">
          Welcome to <span className="font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">WARMCONNECT</span>
        </h1>
        
        <div className="inline-flex items-center mb-6 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <Star className="h-4 w-4 text-primary mr-2" />
          <span className="text-primary text-sm font-medium">Professional Networking Platform</span>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Professional networking platform for discovering warm introduction paths through your connections.
          Leverage AI and graph analysis to discover the shortest path to your next opportunity.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link href="/find-connections">
                <Button size="lg" className="stat-card-primary border-0 px-8 py-4 text-lg">
                  <Network className="mr-2 h-5 w-5" />
                  Find Connections
                </Button>
              </Link>
              <Link href="/my-profile">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button size="lg" className="stat-card-primary border-0 px-8 py-4 text-lg">
                <Network className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                <Search className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </>
          )}
        </div>

        {/* Welcome back section for authenticated users */}
        {isAuthenticated && user?.name && (
          <Card className="premium-card border-0 max-w-md mx-auto mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">Welcome back, {user.name.split(' ')[0]}!</h3>
              <p className="text-sm text-muted-foreground mb-4">Ready to grow your professional network?</p>
              <div className="flex gap-3 justify-center">
                <Link href="/find-connections">
                  <Button size="sm" className="stat-card-primary border-0">
                    <Search className="h-4 w-4 mr-2" />
                    Find Connections
                  </Button>
                </Link>
                <Link href="/ai-networking-hub">
                  <Button size="sm" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="premium-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">{stat.change}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Use Cases */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-medium text-foreground mb-4">How WarmConnect Works for You</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the power of warm introductions across different professional scenarios
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card key={index} className="premium-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {useCase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Example:</p>
                    <p className="text-sm text-foreground">{useCase.example}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-medium text-foreground mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced technology meets intuitive design to transform your networking experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="premium-card border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="premium-card border-0">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into the most popular features to start networking immediately
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/find-connections">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-3">
                <Search className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-medium">Find Connections</div>
                  <div className="text-xs text-muted-foreground">Search for warm introductions</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/my-profile">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-3">
                <Users className="h-8 w-8 text-success" />
                <div className="text-center">
                  <div className="font-medium">My Profile</div>
                  <div className="text-xs text-muted-foreground">Manage your information</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/ai-networking-hub">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-3">
                <Brain className="h-8 w-8 text-warning" />
                <div className="text-center">
                  <div className="font-medium">AI Assistant</div>
                  <div className="text-xs text-muted-foreground">Get networking advice</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/business-chat-demo">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-3">
                <MessageSquare className="h-8 w-8 text-destructive" />
                <div className="text-center">
                  <div className="font-medium">Chat Demo</div>
                  <div className="text-xs text-muted-foreground">Try our AI chat</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card className="premium-card border-0">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            How WarmConnect Works
          </CardTitle>
          <CardDescription>
            Two powerful tools to transform your professional networking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Find Connection</h3>
              <p className="text-sm text-muted-foreground">
                Discover employees at target companies for prospecting and business development
              </p>
              <Link href="/find-connections">
                <Button className="stat-card-primary border-0">
                  Try Find Connection
                </Button>
              </Link>
            </div>
            
            <div className="text-center space-y-4">
              <div className="p-4 bg-warning/10 rounded-lg w-fit mx-auto">
                <Mail className="h-8 w-8 text-warning" />
              </div>
              <h3 className="font-medium text-foreground">Find Introduction</h3>
              <p className="text-sm text-muted-foreground">
                Get warm introductions to specific people through your professional network
              </p>
              <Link href="/find-intro">
                <Button variant="outline">
                  Try Find Introduction
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Link href="/feature-comparison">
              <Button variant="outline" className="px-6">
                <Target className="h-4 w-4 mr-2" />
                Compare Features in Detail
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="premium-card border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-medium text-foreground">Ready to Start Networking?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals who are already building meaningful connections 
            through WarmConnect's intelligent networking platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/enhanced-onboarding">
              <Button className="stat-card-primary border-0 px-8">
                Complete Setup
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/find-connections">
              <Button variant="outline" className="px-8">
                <Search className="h-4 w-4 mr-2" />
                Explore Features
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Live Connection Feed & Network Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveConnectionFeed />
        <NetworkPulse />
      </div>

      {/* Platform Overview & Network Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="premium-card border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              Platform Overview
            </CardTitle>
            <CardDescription>
              Real-time insights into our growing professional network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{platformOverview.totalConnections}</div>
                <div className="text-sm text-muted-foreground">Total Connections</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-success">{platformOverview.successRate}</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">{platformOverview.averagePathLength}</div>
                <div className="text-sm text-muted-foreground">Avg Path Length</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{platformOverview.industriesCovered}</div>
                <div className="text-sm text-muted-foreground">Industries</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{platformOverview.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-success">{platformOverview.companiesIntegrated}</div>
                <div className="text-sm text-muted-foreground">Companies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-primary" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/enhanced-onboarding">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Complete Profile Setup
              </Button>
            </Link>
            <Link href="/find-connections">
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Find Your First Connection
              </Button>
            </Link>
            <Link href="/ai-networking-hub">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Get AI Networking Advice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Success Stories & Testimonials */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-medium text-foreground mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real professionals sharing how WarmConnect transformed their networking
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="premium-card border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                    <Quote className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{testimonial.avatar}</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{testimonial.author}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enterprise Features */}
      <Card className="premium-card border-0">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3">
            <Crown className="h-6 w-6 text-warning" />
            Enterprise Features
          </CardTitle>
          <CardDescription>
            Advanced capabilities for teams and organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">
                Bank-grade security with SSO integration and audit trails
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="p-4 bg-success/10 rounded-lg w-fit mx-auto">
                <Users className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-medium text-foreground">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Share connections and coordinate outreach across teams
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="p-4 bg-warning/10 rounded-lg w-fit mx-auto">
                <BarChart3 className="h-8 w-8 text-warning" />
              </div>
              <h3 className="font-medium text-foreground">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Deep insights into team networking performance and ROI
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="p-4 bg-destructive/10 rounded-lg w-fit mx-auto">
                <Zap className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-medium text-foreground">API Integration</h3>
              <p className="text-sm text-muted-foreground">
                Connect with CRM systems and workflow automation tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}