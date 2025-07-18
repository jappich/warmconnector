import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo, LogoText } from "@/components/ui/logo";
import { 
  Search,
  Star,
  Menu,
  X,
  Settings,
  LogOut,
  Home,
  Brain
} from "lucide-react";

export default function SimpleNavigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Home
    },
    { 
      name: 'Find Connections', 
      href: '/find-connections', 
      icon: Search
    },
    { 
      name: 'AI Assistant', 
      href: '/networking-intelligence', 
      icon: Star
    },
    { 
      name: 'Dual AI Demo', 
      href: '/dual-ai-demo', 
      icon: Brain
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-lg z-40">
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Logo className="h-8 w-8 text-blue-600" />
              <LogoText />
            </div>
          </div>
          
          {/* Main Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="px-4 py-4 border-t border-slate-200">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Logo className="h-6 w-6 text-blue-600" />
            <LogoText className="text-lg" />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-white/95 backdrop-blur-md">
              <div className="p-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start transition-all duration-200 ${
                          isActive 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
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