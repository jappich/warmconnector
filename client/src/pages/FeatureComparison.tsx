import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Target, Building, Mail, Search, CheckCircle, Clock, User } from 'lucide-react';
import { Link } from 'wouter';

export default function FeatureComparison() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-8 py-8 lg:ml-64 lg:pt-0 pt-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4">
            Feature <span className="font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Comparison</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Understanding the difference between Find Connection and Find Introduction
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="glass border border-neon-primary/30 hover:border-neon-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-neon-primary">
                <Building className="h-6 w-6" />
                Find Connection
              </CardTitle>
              <CardDescription className="text-slate-300">
                Discover who you might know at any company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-300 text-sm mb-3">
                  <strong>What it does:</strong> Search for potential connections at a specific company and location
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-primary" />
                    Company-based search
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-primary" />
                    Location filtering
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-primary" />
                    Multiple potential matches
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-primary" />
                    Broad discovery tool
                  </div>
                </div>
              </div>
              <Link href="/find-connection">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  Try Find Connection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass border border-neon-accent/30 hover:border-neon-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-neon-accent">
                <User className="h-6 w-6" />
                Find Introduction
              </CardTitle>
              <CardDescription className="text-slate-300">
                Get introduced to a specific person you want to meet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-300 text-sm mb-3">
                  <strong>What it does:</strong> Find the best path to get introduced to a specific person
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-accent" />
                    Target-specific search
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-accent" />
                    Path optimization
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-accent" />
                    Introduction messaging
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-neon-accent" />
                    Actionable workflow
                  </div>
                </div>
              </div>
              <Link href="/find-intro">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Try Find Introduction
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Comparison */}
        <Card className="glass border border-emerald-400/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-emerald-400">
              <Target className="h-6 w-6" />
              Detailed Feature Comparison
            </CardTitle>
            <CardDescription className="text-slate-300">
              Side-by-side comparison of capabilities and use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Feature</th>
                    <th className="text-left py-3 px-4 text-neon-primary font-medium">Find Connection</th>
                    <th className="text-left py-3 px-4 text-neon-accent font-medium">Find Introduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Input Required</td>
                    <td className="py-3 px-4 text-slate-400">Company name + Location</td>
                    <td className="py-3 px-4 text-slate-400">Person name + Company/Title</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Search Scope</td>
                    <td className="py-3 px-4 text-slate-400">Broad company-wide search</td>
                    <td className="py-3 px-4 text-slate-400">Targeted individual search</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Results</td>
                    <td className="py-3 px-4 text-slate-400">Multiple potential connections</td>
                    <td className="py-3 px-4 text-slate-400">Optimal introduction path</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Best For</td>
                    <td className="py-3 px-4 text-slate-400">Exploring opportunities</td>
                    <td className="py-3 px-4 text-slate-400">Reaching specific people</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Output</td>
                    <td className="py-3 px-4 text-slate-400">Connection list with paths</td>
                    <td className="py-3 px-4 text-slate-400">Introduction request template</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">Use Case</td>
                    <td className="py-3 px-4 text-slate-400">Market research, hiring</td>
                    <td className="py-3 px-4 text-slate-400">Business development, partnerships</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Use Case Examples */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="glass border border-neon-primary/30">
            <CardHeader>
              <CardTitle className="text-neon-primary">When to Use Find Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Exploring New Markets</h4>
                  <p className="text-sm text-slate-400">"I want to see who I know at companies in the fintech space in NYC"</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Hiring & Recruiting</h4>
                  <p className="text-sm text-slate-400">"I need to hire engineers - who do I know at top tech companies?"</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Industry Research</h4>
                  <p className="text-sm text-slate-400">"I want to understand the competitive landscape by connecting with people at rival companies"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border border-neon-accent/30">
            <CardHeader>
              <CardTitle className="text-neon-accent">When to Use Find Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Sales & Business Development</h4>
                  <p className="text-sm text-slate-400">"I need to reach the VP of Engineering at Stripe to discuss our API partnership"</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Investment & Fundraising</h4>
                  <p className="text-sm text-slate-400">"I want to get introduced to a specific partner at Andreessen Horowitz"</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h4 className="font-medium text-slate-300 mb-1">Strategic Partnerships</h4>
                  <p className="text-sm text-slate-400">"I need to connect with the Head of Partnerships at a specific company for a collaboration"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}