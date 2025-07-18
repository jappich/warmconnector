import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Users, Search, Zap, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Network className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">WarmConnector</span>
          </div>
          <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center mb-6 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Zap className="h-4 w-4 text-blue-400 mr-2" />
            <span className="text-blue-400 text-sm font-medium">Professional Networking Reimagined</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Warm Introductions</span> to Anyone
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Leverage AI and advanced graph analysis to discover the shortest path to your next opportunity. 
            Connect with decision-makers through mutual connections and transform cold outreach into warm introductions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button onClick={handleLogin} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg">
              <Network className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg">
              <Search className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">10,000+</div>
              <div className="text-slate-400">Professional Connections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">95%</div>
              <div className="text-slate-400">Introduction Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">2.5x</div>
              <div className="text-slate-400">Faster Networking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400">Everything you need to build meaningful professional connections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <Network className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">AI-Powered Pathfinding</CardTitle>
                <CardDescription className="text-slate-400">
                  Advanced algorithms find the shortest path to any professional contact through your network
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Smart Introductions</CardTitle>
                <CardDescription className="text-slate-400">
                  AI-generated introduction messages that highlight mutual connections and shared interests
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Privacy First</CardTitle>
                <CardDescription className="text-slate-400">
                  Your data stays secure with enterprise-grade privacy controls and transparent data usage
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-blue-500/20">
            <TrendingUp className="h-16 w-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Networking?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of professionals who are building meaningful connections through warm introductions
            </p>
            <Button onClick={handleLogin} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg">
              Start Connecting Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Network className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-semibold text-white">WarmConnector</span>
          </div>
          <p className="text-slate-400 text-sm">
            Transforming professional networking through intelligent connections
          </p>
        </div>
      </footer>
    </div>
  );
}