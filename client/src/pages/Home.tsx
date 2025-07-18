import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Network, 
  Users, 
  Brain, 
  Search,
  Target,
  Activity,
  BarChart3,
  Globe,
  Building2,
  User,
  ArrowRight,
  Star,
  Zap,
  ChevronRight,
  Database
} from "lucide-react";

const features = [
  {
    id: "find-warm-connections",
    title: "Find Warm Connections",
    description: "Discover connection paths to anyone in your network and request warm introductions",
    icon: Network,
    badge: "Core Feature",
    badgeVariant: "default" as const,
    route: "/find-warm-connections",
    examples: [
      "Find a path to a VP at Google through your college friend",
      "Get introduced to a potential client via mutual connections",
      "Connect with industry leaders through professional networks"
    ],
    useCase: "When you need to reach someone specific but don't know them directly"
  },
  {
    id: "ai-networking-hub",
    title: "AI Networking Hub",
    description: "Get AI-powered networking suggestions, connection analysis, and strategic insights",
    icon: Brain,
    badge: "AI-Powered",
    badgeVariant: "secondary" as const,
    route: "/ai-networking-hub",
    examples: [
      "Receive personalized networking strategies for your industry",
      "Analyze connection opportunities with detailed insights",
      "Get smart suggestions for expanding your network"
    ],
    useCase: "When you want intelligent guidance for strategic networking"
  },
  {
    id: "user-profile",
    title: "My Profile",
    description: "Manage your professional profile, connections, and networking data",
    icon: User,
    badge: "Essential",
    badgeVariant: "outline" as const,
    route: "/user-profile",
    examples: [
      "Update your professional information and skills",
      "View your network statistics and connection strength",
      "Manage privacy settings for relationship data"
    ],
    useCase: "To maintain and optimize your professional presence"
  },
  {
    id: "enhanced-connection-finder",
    title: "Advanced Connection Search",
    description: "Powerful search engine to find people across companies and industries",
    icon: Search,
    badge: "Advanced",
    badgeVariant: "secondary" as const,
    route: "/enhanced-connection-finder",
    examples: [
      "Search for 'Product Manager at Tesla in Austin'",
      "Find alumni from your university working at specific companies",
      "Locate experts in emerging technologies"
    ],
    useCase: "When you need to find specific professionals or expertise"
  },
  {
    id: "network-map",
    title: "Network Visualization",
    description: "Interactive graph visualization of your professional network",
    icon: Activity,
    badge: "Visual",
    badgeVariant: "outline" as const,
    route: "/network-map",
    examples: [
      "See how your connections relate to each other",
      "Identify network gaps and expansion opportunities",
      "Visualize industry clusters in your network"
    ],
    useCase: "To understand and optimize your network structure"
  },
  {
    id: "data-management",
    title: "Data Management",
    description: "Import, manage, and enrich your professional contact data",
    icon: Database,
    badge: "Management",
    badgeVariant: "outline" as const,
    route: "/data-management",
    examples: [
      "Import contacts from LinkedIn, Gmail, or CSV files",
      "Enrich profiles with additional professional data",
      "Manage data sources and privacy settings"
    ],
    useCase: "To build and maintain a comprehensive contact database"
  },
  {
    id: "analytics",
    title: "Network Analytics",
    description: "Detailed analytics and insights about your networking activities",
    icon: BarChart3,
    badge: "Analytics",
    badgeVariant: "outline" as const,
    route: "/cosmic-dashboard",
    examples: [
      "Track networking activity and connection growth",
      "Measure relationship strength across your network",
      "Analyze industry distribution and trends"
    ],
    useCase: "To measure and improve your networking effectiveness"
  },
  {
    id: "onboarding",
    title: "Profile Setup",
    description: "Complete onboarding process to optimize your networking experience",
    icon: Target,
    badge: "Setup",
    badgeVariant: "outline" as const,
    route: "/enhanced-onboarding",
    examples: [
      "Connect your social accounts and professional profiles",
      "Import your existing network and contacts",
      "Set networking goals and preferences"
    ],
    useCase: "To get started and maximize platform benefits"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background with stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">Professional Networking Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              WarmConnect
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your professional networking with AI-powered warm introduction pathfinding. 
            Discover connections, build relationships, and grow your career through intelligent networking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find-warm-connections">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                <Zap className="w-5 h-5 mr-2" />
                Start Finding Connections
              </Button>
            </Link>
            <Link href="/enhanced-onboarding">
              <Button variant="outline" size="lg" className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 px-8 py-3 rounded-xl font-semibold">
                Complete Setup
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="bg-slate-800/40 backdrop-blur-sm border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
                      <IconComponent className="w-6 h-6 text-cyan-400" />
                    </div>
                    <Badge variant={feature.badgeVariant} className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <h4 className="text-cyan-300 font-semibold mb-2 text-sm">Use Case:</h4>
                    <p className="text-slate-400 text-sm italic mb-3">{feature.useCase}</p>
                    
                    <h4 className="text-cyan-300 font-semibold mb-2 text-sm">Examples:</h4>
                    <ul className="space-y-1">
                      {feature.examples.map((example, idx) => (
                        <li key={idx} className="text-slate-400 text-sm flex items-start">
                          <span className="text-cyan-400 mr-2 mt-1">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link href={feature.route}>
                    <Button 
                      variant="ghost" 
                      className="w-full text-cyan-300 hover:text-white hover:bg-cyan-500/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300"
                    >
                      Explore Feature
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Getting Started Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-cyan-400/30 p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-slate-300 mb-6 text-lg">
              Begin your networking journey with our comprehensive platform designed for modern professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enhanced-onboarding">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold">
                  Complete Profile Setup
                </Button>
              </Link>
              <Link href="/find-warm-connections">
                <Button size="lg" variant="outline" className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 px-8 py-3 rounded-xl font-semibold">
                  Find Your First Connection
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>


    </div>
  );
}