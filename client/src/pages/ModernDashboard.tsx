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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Network,
  Search,
  ArrowUpRight
} from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
const mockUser = { currentUser: { displayName: 'Alex Johnson' } };

interface UserStats {
  connections: number;
  sharedContacts: number;
  sentIntroductions: number;
  connectionStrength: number;
  recentConnections: number;
}

const ModernDashboard: React.FC = () => {
  // const { currentUser } = useAuth();
  const currentUser = mockUser.currentUser;
  const [userStats, setUserStats] = useState<UserStats>({
    connections: 5,
    sharedContacts: 3,
    sentIntroductions: 12,
    connectionStrength: 67,
    recentConnections: 2
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-medium text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Streamline your professional networking with intelligent connection insights.
          </p>
        </div>
        
        {/* Connection Strength Widget */}
        <div className="premium-card p-6 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Connection Strength</span>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">{userStats.connectionStrength}</div>
          <div className="text-sm text-muted-foreground">+ {userStats.recentConnections} recent connections.</div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex justify-end">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src="/api/placeholder/64/64" />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {currentUser?.displayName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Connection Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-foreground">Connection Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connections */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-foreground">{userStats.connections}</div>
            <div className="text-sm text-muted-foreground">Connections</div>
          </div>

          {/* Shared Contacts */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-foreground">{userStats.sharedContacts}</div>
            <div className="text-sm text-muted-foreground">Shared Contacts</div>
          </div>

          {/* Sent Introductions */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-foreground">{userStats.sentIntroductions}</div>
            <div className="text-sm text-muted-foreground">Sent Introductions</div>
          </div>
        </div>
      </div>

      {/* Network Activity Chart */}
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-foreground">Network Activity</h2>
        
        <div className="premium-card p-6">
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg relative overflow-hidden">
            {/* Chart placeholder with network activity visualization */}
            <div className="absolute inset-0 flex items-end justify-center space-x-8 p-8">
              {/* Week days simulation */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const heights = [40, 60, 80, 65, 90, 70, 45];
                return (
                  <div key={day} className="flex flex-col items-center space-y-2">
                    <div 
                      className="w-8 bg-gradient-to-t from-primary to-accent rounded-t-lg"
                      style={{ height: `${heights[index]}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Chart overlay indicators */}
            <div className="absolute top-4 left-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-muted-foreground">Code Insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-xs text-muted-foreground">Auto Commam</span>
              </div>
            </div>

            {/* Profile tooltip simulation */}
            <div className="absolute top-8 right-16 premium-card p-3 rounded-lg">
              <span className="text-xs text-foreground">Lauren Jackeum</span>
            </div>
          </div>
          
          {/* Chart footer */}
          <div className="mt-4 text-sm text-muted-foreground">
            3.5k donnermeded to
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/find-connections">
          <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Find Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Discover warm introductions through your network
              </p>
              <ArrowUpRight className="h-4 w-4 text-primary mt-2" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/ai-networking-hub">
          <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Network className="h-5 w-5 text-accent" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get intelligent networking recommendations
              </p>
              <ArrowUpRight className="h-4 w-4 text-accent mt-2" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-profile">
          <Card className="premium-card border-0 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-success" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your professional profile and settings
              </p>
              <ArrowUpRight className="h-4 w-4 text-success mt-2" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default ModernDashboard;