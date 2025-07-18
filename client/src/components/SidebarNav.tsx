import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Network, 
  Users, 
  Database, 
  User, 
  Settings,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Find Connections', href: '/find-intro', icon: Network },
  { name: 'My Connections', href: '/my-connections', icon: Users },
  { name: 'Data Management', href: '/data-management', icon: Database },
  { name: 'My Account', href: '/my-account', icon: User },
  { name: 'AI Demo', href: '/business-chat-demo', icon: MessageCircle },
];

interface SidebarNavProps {
  isCollapsed?: boolean;
}

export default function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-white/10">
        <Network className="h-8 w-8 text-accent mr-3" />
        {!isCollapsed && (
          <span className="text-xl font-semibold text-text-primary">
            WarmConnector
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));

          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  'flex items-center h-10 gap-3 px-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-bg-elevated text-accent shadow-[0_0_0_1px_#1d2030] backdrop-blur'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon 
                  className={cn(
                    'h-5 w-5 transition-colors flex-shrink-0',
                    isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                  )} 
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-accent" />
                    )}
                  </>
                )}
              </a>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-6 py-4 border-t border-white/10">
          <div className="text-xs text-text-muted text-center">
            Professional Networking Platform
          </div>
        </div>
      )}
    </nav>
  );
}