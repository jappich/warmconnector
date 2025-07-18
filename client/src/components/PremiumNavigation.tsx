import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Search,
  Star,
  Menu,
  X,
  Settings,
  LogOut
} from "lucide-react";

interface PremiumNavigationProps {
  userProfile?: {
    name: string;
    title: string;
    company: string;
    avatar?: string;
    memberSince?: string;
    connectionsCount?: number;
  };
}

export default function PremiumNavigation({ userProfile }: PremiumNavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const user = userProfile || {
    name: "Alex Johnson",
    title: "CEO & Founder",
    company: "TechVenture Inc.",
    memberSince: "2024",
    connectionsCount: 847
  };

  const navigation = [
    { 
      name: 'Find Connections', 
      href: '/enhanced-connection-finder', 
      icon: Search,
      description: 'Find paths to people'
    },
    { 
      name: 'AI Insights', 
      href: '/networking-intelligence', 
      icon: Star,
      description: 'Get networking advice'
    }
  ];

  return (
    <>
      {/* Premium Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 shadow-sm">
        <div className="flex flex-col w-full">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between h-20 px-8 border-b border-amber-400/20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Crown className="h-10 w-10 text-amber-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">WarmConnector</h1>
                <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 text-xs">
                  Elite Member
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Member Profile Section */}
          <div className="px-8 py-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-amber-400/30">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold text-lg">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-amber-400">{user.title}</p>
                <p className="text-xs text-slate-400">{user.company}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.connectionsCount}</div>
                <div className="text-xs text-slate-400">Connections</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber-400 fill-current" />
                  <span className="text-xl font-bold text-white ml-1">4.9</span>
                </div>
                <div className="text-xs text-slate-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-400">#{user.memberSince}</div>
                <div className="text-xs text-slate-400">Member</div>
              </div>
            </div>
          </div>
          
          {/* Main Navigation */}
          <div className="flex-1 px-6 py-8 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Core Actions
            </div>
            
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start h-auto p-4 ${
                        isActive 
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:from-amber-500 hover:to-orange-500" 
                          : "text-white hover:text-amber-400 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <Icon className="h-6 w-6" />
                        <div className="text-left">
                          <div className="font-semibold">{item.name}</div>
                          <div className={`text-xs ${isActive ? 'text-black/70' : 'text-slate-400'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Exclusive Status */}
          <div className="px-6 py-4 border-t border-white/10">
            <div className="bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Elite Status</span>
              </div>
              <p className="text-xs text-slate-300">
                You're in the top 1% of our network. Unlock hidden opportunities every day.
              </p>
            </div>
          </div>

          {/* Settings & Logout */}
          <div className="px-6 py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Premium Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-amber-400/20 z-50 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-8 w-8 text-amber-400" />
            <span className="text-xl font-bold text-white">WarmConnector</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 lg:hidden"
            >
              <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed top-16 left-0 right-0 bottom-0 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-amber-400/20">
                <div className="p-6 space-y-6">
                  {/* Mobile Profile */}
                  <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Avatar className="w-12 h-12 border-2 border-amber-400/30">
                      <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <p className="text-sm text-amber-400">{user.title}</p>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link key={item.name} href={item.href}>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start h-auto p-4 ${
                              isActive 
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-black" 
                                : "text-white hover:text-amber-400 hover:bg-white/10"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="mr-4 h-6 w-6" />
                            <div className="text-left">
                              <div className="font-semibold">{item.name}</div>
                              <div className={`text-xs ${isActive ? 'text-black/70' : 'text-slate-400'}`}>
                                {item.description}
                              </div>
                            </div>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}