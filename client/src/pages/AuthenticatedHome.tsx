import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Users, Search, Settings, TrendingUp, Target, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AuthenticatedHome() {
  const { user } = useAuth();

  const stats = [
    { value: "12", label: "Active Connections", color: "text-blue-400" },
    { value: "5", label: "Pending Intros", color: "text-teal-400" },
    { value: "28", label: "Network Size", color: "text-emerald-400" },
    { value: "3", label: "This Week", color: "text-orange-400" }
  ];

  return (
    <div className="bg-background">
      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-lg text-muted-foreground">
              Your professional networking dashboard
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/find-intro">
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Search className="h-8 w-8 text-primary" />
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-foreground">Find Connections</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Discover the shortest path to any professional contact
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/my-connections">
              <Card className="bg-card border-border hover:border-accent/50 transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-accent" />
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <CardTitle className="text-foreground">My Network</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    View and manage your professional relationships
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/my-account">
              <Card className="bg-card border-border hover:border-emerald-500/50 transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Settings className="h-8 w-8 text-emerald-500" />
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <CardTitle className="text-foreground">Profile Settings</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Update your profile and networking preferences
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Getting Started Guide */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Quick Start Guide</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Complete these steps to maximize your networking potential
                  </CardDescription>
                </div>
                <Badge variant="secondary">3 steps left</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">Complete your profile</p>
                    <p className="text-sm text-muted-foreground">Add your professional details and background</p>
                  </div>
                </div>
                <Link href="/my-account">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Complete
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">Import your connections</p>
                    <p className="text-sm text-muted-foreground">Sync with LinkedIn or upload your contact list</p>
                  </div>
                </div>
                <Link href="/data-management">
                  <Button size="sm" variant="outline">
                    Import
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">Find your first warm intro</p>
                    <p className="text-sm text-muted-foreground">Search for someone you'd like to connect with</p>
                  </div>
                </div>
                <Link href="/find-intro">
                  <Button size="sm" variant="outline">
                    Search
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}