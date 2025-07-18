import { Route, Switch, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WarmConnectorLogo from "@/components/WarmConnectorLogo";
import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";
import { 
  Network, 
  Users, 
  Brain, 
  Database, 
  Search,
  Home as HomeIcon,
  Menu,
  X,
  BarChart3,
  Settings,
  TrendingUp,
  User,
  Building2,
  Globe,
  Activity,
  Target
} from "lucide-react";

// Import essential pages only
import Home from "@/pages/Home.tsx";
import CosmicDashboard from "@/pages/CosmicDashboard";
import EnhancedOnboarding from "@/pages/EnhancedOnboarding";
import NetworkMap from "@/pages/NetworkMap.jsx";
import UserProfile from "@/pages/UserProfile";
import AIDemo from "@/pages/AIDemo";
import EnhancedConnectionFinder from "@/pages/EnhancedConnectionFinderCosmic";
import FindIntro from "@/pages/FindIntro.tsx";
import DataManagement from "@/pages/DataManagement";
import LiveConnectionFeed from "@/pages/LiveConnectionFeed";
import OnboardingContactUpload from "@/pages/OnboardingContactUpload";
import ProfileCardDemo from "@/pages/ProfileCardDemo";
import FindConnection from "@/pages/FindConnection";
import FindWarmConnections from "@/pages/FindWarmConnections";
import DataPrivacyInfo from "@/pages/DataPrivacyInfo";
import FeatureComparison from "@/pages/FeatureComparison";
import AdvancedRelationshipAnalysis from "@/pages/AdvancedRelationshipAnalysis";
import WelcomeOnboarding from "@/pages/WelcomeOnboarding";
import BoostProfile from "@/pages/BoostProfile";
import AINetworkingHub from "@/pages/AINetworkingHub";
import WelcomeDashboard from "@/pages/WelcomeDashboard";
import ModernDashboard from "@/pages/ModernDashboard";
import BusinessChatDemo from "@/pages/BusinessChatDemo";
import FindWarmConnectionsModern from "@/pages/FindWarmConnectionsModern";
import MyProfileModern from "@/pages/MyProfileModern";
import AINetworkingHubModern from "@/pages/AINetworkingHubModern";
import BusinessChatDemoModern from "@/pages/BusinessChatDemoModern";
import HomeModern from "@/pages/HomeModern";
import OnboardingModern from "@/pages/OnboardingModern";
import NetworkAnalyticsModern from "@/pages/NetworkAnalyticsModern";
import AdvancedConnectionSearchModern from "@/pages/AdvancedConnectionSearchModern";
import NetworkVisualizationModern from "@/pages/NetworkVisualizationModern";
import DataManagementModern from "@/pages/DataManagementModern";
import FeatureComparisonModern from "@/pages/FeatureComparisonModern";

function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const user = {
    name: "Alex Johnson",
    company: "TechCorp Solutions"
  };

  const navigation = [
    { name: 'DASHBOARD', href: '/dashboard', icon: TrendingUp, description: 'Personalized welcome and progress tracking', isMain: true },
    { name: 'HOME', href: '/', icon: HomeIcon, description: 'Feature overview and getting started' },
    { name: 'FIND WARM CONNECTIONS', href: '/find-warm-connections', icon: Search, description: 'AI pathfinding: Find connection routes to anyone' },
    { name: 'FIND CONNECTION', href: '/find-connection', icon: Users, description: 'Company targeting: Find employees at specific companies' },
    { name: 'FIND INTRO', href: '/find-intro', icon: Target, description: 'Introduction requests: Get introduced to specific people' },
    { name: 'LIVE FEED', href: '/live-feed', icon: Activity, description: 'Real-time connection activity' },
    { name: 'NETWORK MAP', href: '/network-map', icon: Network, description: 'Visualize your network graph' },
    { name: 'UPLOAD CONTACTS', href: '/data-management', icon: Database, description: 'Manage your data and imports' },
    { name: 'AI NETWORKING HUB', href: '/ai-networking-hub', icon: Brain, description: 'Advanced AI networking intelligence' },
    { name: 'AI ASSISTANT', href: '/ai-demo', icon: Target, description: 'Smart networking recommendations' },
    { name: 'ENHANCED FINDER', href: '/enhanced-connection-finder', icon: Users, description: 'Advanced connection search' },
    { name: 'PROFILE CARD', href: '/profile-card', icon: User, description: 'Glassmorphic profile card demo' }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-full w-64 nav-rail z-40">
        <div className="flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-8 border-b border-border">
            <div className="flex items-center">
              <div className="p-2 glass border border-neon-primary/30 rounded-xl neon-glow">
                <img 
                  src={wcLogoPath}
                  alt="WarmConnect"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="ml-4">
                <div className="heading-sm neon-text">
                  WARMCONNECTOR
                </div>
                <div className="label-caps">NETWORKING CONSOLE</div>
              </div>
            </div>
            <Link href="/profile">
              <button className="p-2 glass border border-border rounded-lg smooth-hover hover:border-neon-primary">
                <User className="h-5 w-5 text-foreground" />
              </button>
            </Link>
          </div>
          
          {/* Profile Section */}
          <div className="px-6 py-4 border-b border-border">
            <div className="glass border border-border rounded-lg p-3">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-neon-accent mr-2" />
                <span className="label-caps">CONNECTED WITH {user.company.toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`nav-item ${isActive ? 'active' : ''} cursor-pointer flex items-center`}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="font-medium label-caps">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </div>
                    {item.isMain && (
                      <div className="px-2 py-1 glass border border-neon-primary/30 rounded-full ml-2 flex-shrink-0">
                        <span className="text-xs font-medium neon-text">MAIN</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Footer Links */}
          <div className="px-4 py-4 border-t border-border">
            <div className="space-y-2">
              <Link href="/feature-comparison">
                <div className="nav-item cursor-pointer flex items-center">
                  <Target className="h-4 w-4 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground">
                      Feature Comparison
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/data-privacy">
                <div className="nav-item cursor-pointer flex items-center">
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground">
                      Data & Privacy
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Footer Status */}
          <div className="px-6 py-4 border-t border-border">
            <div className="glass border border-border rounded-lg p-3">
              <div className="label-caps mb-2">SYSTEM STATUS</div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-neon-accent rounded-full mr-2 pulse-glow"></div>
                <span className="text-xs text-foreground">ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 h-16 glass border-b border-border z-50 flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <img 
              src={wcLogoPath}
              alt="WarmConnect"
              className="h-8 w-8 object-contain"
            />
            <span className="heading-sm neon-text">WARMCONNECT</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/profile">
              <button className="p-2 glass border border-border rounded-lg smooth-hover hover:border-neon-primary">
                <User className="h-5 w-5 text-foreground" />
              </button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 glass border border-border rounded-lg smooth-hover hover:border-neon-primary"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden fade-in">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-16 left-0 bottom-0 w-64 glass-dark border-r border-border">
              <div className="px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`nav-item ${isActive ? 'active' : ''} cursor-pointer flex items-center`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="font-medium label-caps">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        </div>
                        {item.isMain && (
                          <div className="px-2 py-1 glass border border-neon-primary/30 rounded-full ml-2 flex-shrink-0">
                            <span className="text-xs font-medium neon-text">MAIN</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import LayoutShell from '@/components/LayoutShell';
import { AuthProvider } from '@/context/AuthContext';

export default function AppRouter() {
  const [location] = useLocation();
  
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Switch>
        {/* Homepage - Keep original layout */}
        <Route path="/">
          <Navigation />
          <Home />
        </Route>
        
        {/* All dashboard and app routes - Use new LayoutShell ONLY */}
        <Route path="/dashboard">
          <LayoutShell>
            <ModernDashboard />
          </LayoutShell>
        </Route>
        
        <Route path="/find-connections">
          <LayoutShell>
            <FindWarmConnectionsModern />
          </LayoutShell>
        </Route>
        
        <Route path="/find-connection">
          <LayoutShell>
            <FindWarmConnectionsModern />
          </LayoutShell>
        </Route>
        
        <Route path="/my-profile">
          <LayoutShell>
            <MyProfileModern />
          </LayoutShell>
        </Route>
        
        <Route path="/ai-networking-hub">
          <LayoutShell>
            <AINetworkingHubModern />
          </LayoutShell>
        </Route>
        
        <Route path="/network-analytics">
          <LayoutShell>
            <NetworkAnalyticsModern />
          </LayoutShell>
        </Route>
        
        <Route path="/advanced-search">
          <LayoutShell>
            <AdvancedConnectionSearchModern />
          </LayoutShell>
        </Route>
        
        <Route path="/network-visualization">
          <LayoutShell>
            <NetworkVisualizationModern />
          </LayoutShell>
        </Route>
        
        <Route path="/data-management">
          <LayoutShell>
            <DataManagementModern />
          </LayoutShell>
        </Route>
        
        <Route path="/feature-comparison">
          <LayoutShell>
            <FeatureComparisonModern />
          </LayoutShell>
        </Route>
        
        <Route path="/business-chat-demo">
          <LayoutShell>
            <BusinessChatDemoModern />
          </LayoutShell>
        </Route>
        
        <Route path="/onboarding">
          <LayoutShell>
            <WelcomeOnboarding />
          </LayoutShell>
        </Route>
        
        <Route path="/settings">
          <LayoutShell>
            <div className="p-8">
              <h1 className="text-2xl font-medium text-foreground mb-4">Settings</h1>
              <p className="text-muted-foreground">Settings page coming soon...</p>
            </div>
          </LayoutShell>
        </Route>
        
        <Route path="/help">
          <LayoutShell>
            <div className="p-8">
              <h1 className="text-2xl font-medium text-foreground mb-4">Help</h1>
              <p className="text-muted-foreground">Help documentation coming soon...</p>
            </div>
          </LayoutShell>
        </Route>
        
        {/* Default route - redirect to dashboard */}
        <Route>
          <LayoutShell>
            <HomeModern />
          </LayoutShell>
        </Route>
        </Switch>
      </div>
    </AuthProvider>
  );
}