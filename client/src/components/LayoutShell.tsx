import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Brain, 
  Search, 
  Settings,
  Bell,
  HelpCircle,
  FileText,
  Inbox,
  Library,
  Home,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { useAuth } from '../context/AuthContext';
// Mock user data for now to avoid AuthProvider issues
const mockUser = { currentUser: { displayName: 'Alex Johnson' } };

interface LayoutShellProps {
  children: React.ReactNode;
}

const LayoutShell: React.FC<LayoutShellProps> = ({ children }) => {
  const [location] = useLocation();
  // const { user } = useAuth();
  const user = mockUser;

  const navigationItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/dashboard',
      active: location === '/dashboard' || location === '/' || location === '/modern-dashboard'
    },
    { 
      icon: Users, 
      label: 'Find Introduction', 
      href: '/find-connections',
      active: location === '/find-connections' || location === '/find-warm-connections'
    },
    { 
      icon: Search, 
      label: 'Find Connection', 
      href: '/find-connection',
      active: location === '/find-connection'
    },
    { 
      icon: User, 
      label: 'My Profile', 
      href: '/my-profile',
      active: location === '/my-profile' || location === '/profile'
    },
    { 
      icon: Brain, 
      label: 'AI Networking Hub', 
      href: '/ai-networking-hub',
      active: location === '/ai-networking-hub'
    },
    { 
      icon: BarChart3, 
      label: 'Network Analytics', 
      href: '/network-analytics',
      active: location === '/network-analytics'
    },
    { 
      icon: FileText, 
      label: 'Advanced Search', 
      href: '/advanced-search',
      active: location === '/advanced-search'
    },
    { 
      icon: Library, 
      label: 'Network Visualization', 
      href: '/network-visualization',
      active: location === '/network-visualization'
    },
    { 
      icon: Settings, 
      label: 'Data Management', 
      href: '/data-management',
      active: location === '/data-management'
    },
    { 
      icon: Bell, 
      label: 'Feature Comparison', 
      href: '/feature-comparison',
      active: location === '/feature-comparison',
      isRecommended: true
    },
    { 
      icon: MessageSquare, 
      label: 'Business Chat Demo', 
      href: '/business-chat-demo',
      active: location === '/business-chat-demo'
    },
    { 
      icon: HelpCircle, 
      label: 'Help', 
      href: '/help',
      active: location === '/help'
    }
  ];

  const userCards = [
    { name: 'Charlie Dowling', role: 'Engineer', avatar: '/api/placeholder/32/32', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { name: 'Greg Noel', role: 'CEO', avatar: '/api/placeholder/32/32', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { name: 'Katie Plummer', role: 'CTO', avatar: '/api/placeholder/32/32', color: 'bg-gradient-to-br from-green-500 to-emerald-500' },
    { name: 'Joely Klein', role: 'COO', avatar: '/api/placeholder/32/32', color: 'bg-gradient-to-br from-orange-500 to-red-500' },
    { name: 'Jason Lynn', role: 'Designer', avatar: '/api/placeholder/32/32', color: 'bg-gradient-to-br from-indigo-500 to-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Clean Design */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-medium text-foreground">WarmConnect</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                      item.active 
                        ? 'bg-secondary text-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.isRecommended && (
                      <span className="ml-auto px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default LayoutShell;