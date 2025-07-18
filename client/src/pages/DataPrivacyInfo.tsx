import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Users, Lock, Eye, UserCheck } from 'lucide-react';

export default function DataPrivacyInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-8 py-8 lg:ml-64 lg:pt-0 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4">
            Data Storage & <span className="font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Privacy</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            How WARMCONNECT securely stores and protects your professional network data
          </p>
        </div>

        <div className="grid gap-8">
          {/* User Data Storage */}
          <Card className="glass border border-neon-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-neon-primary">
                <Database className="h-6 w-6" />
                User Data Storage Architecture
              </CardTitle>
              <CardDescription className="text-slate-300">
                Multi-layer data storage with PostgreSQL primary database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-neon-primary">User Profiles (users table)</h4>
                  <ul className="text-sm space-y-1 text-slate-400">
                    <li>• Authentication via Okta ID</li>
                    <li>• Professional info (company, title)</li>
                    <li>• Social profiles (LinkedIn, Twitter, etc.)</li>
                    <li>• Education and background data</li>
                    <li>• Family and hometown information</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-neon-accent">Network Nodes (persons table)</h4>
                  <ul className="text-sm space-y-1 text-slate-400">
                    <li>• Professional contacts and connections</li>
                    <li>• Industry and location data</li>
                    <li>• Social media profiles</li>
                    <li>• Skills and interests</li>
                    <li>• Connection source tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relationship Mapping */}
          <Card className="glass border border-neon-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-neon-accent">
                <Users className="h-6 w-6" />
                Relationship Mapping & Graph Storage
              </CardTitle>
              <CardDescription className="text-slate-300">
                How connections are tracked and verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-emerald-400 mb-2">Relationship Types</h4>
                  <ul className="text-sm space-y-1 text-slate-400">
                    <li>• COWORKER (current/former)</li>
                    <li>• EDUCATION (university, school)</li>
                    <li>• FAMILY (relatives)</li>
                    <li>• SOCIAL (friends, acquaintances)</li>
                    <li>• HOMETOWN (geographic connections)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-400 mb-2">Strength Scoring</h4>
                  <ul className="text-sm space-y-1 text-slate-400">
                    <li>• 1-100 relationship strength score</li>
                    <li>• Based on interaction frequency</li>
                    <li>• Professional overlap</li>
                    <li>• Mutual connections</li>
                    <li>• Recency of contact</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-pink-400 mb-2">Metadata Tracking</h4>
                  <ul className="text-sm space-y-1 text-slate-400">
                    <li>• Source of connection data</li>
                    <li>• Verification status</li>
                    <li>• Last interaction date</li>
                    <li>• Platform where connected</li>
                    <li>• Mutual endorsements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="glass border border-emerald-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-emerald-400">
                <Shield className="h-6 w-6" />
                Privacy & Data Protection
              </CardTitle>
              <CardDescription className="text-slate-300">
                How user information is protected and used ethically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-neon-primary mt-1" />
                    <div>
                      <h4 className="font-medium text-neon-primary">Encrypted Storage</h4>
                      <p className="text-sm text-slate-400">All sensitive data encrypted at rest and in transit using industry-standard encryption</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-neon-accent mt-1" />
                    <div>
                      <h4 className="font-medium text-neon-accent">Visibility Control</h4>
                      <p className="text-sm text-slate-400">Users control what information is shared and with whom through granular privacy settings</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-emerald-400">Consent Management</h4>
                      <p className="text-sm text-slate-400">Explicit consent required for connection sharing and introduction requests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-yellow-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Data Minimization</h4>
                      <p className="text-sm text-slate-400">Only necessary data is collected and stored, with regular purging of outdated information</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Verification */}
          <Card className="glass border border-yellow-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-yellow-400">
                <UserCheck className="h-6 w-6" />
                Connection Verification Process
              </CardTitle>
              <CardDescription className="text-slate-300">
                How the platform ensures connection accuracy and prevents misuse
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-neon-primary mb-3">Multi-Source Verification</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="text-slate-300">Social Platform Cross-Reference:</strong>
                      <p className="text-slate-400">LinkedIn, Twitter, GitHub profiles verified for consistency</p>
                    </div>
                    <div>
                      <strong className="text-slate-300">Professional Database Matching:</strong>
                      <p className="text-slate-400">Company directories and professional databases consulted</p>
                    </div>
                    <div>
                      <strong className="text-slate-300">Mutual Connection Validation:</strong>
                      <p className="text-slate-400">Relationships confirmed through multiple mutual connections</p>
                    </div>
                    <div>
                      <strong className="text-slate-300">User Reporting System:</strong>
                      <p className="text-slate-400">Community-driven accuracy with reporting mechanisms</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-neon-accent mb-2">Ethical Use Safeguards</h4>
                  <ul className="text-sm space-y-2 text-slate-400">
                    <li>• Introduction requests require mutual opt-in</li>
                    <li>• Rate limiting prevents spam or abuse</li>
                    <li>• All introduction paths logged and auditable</li>
                    <li>• Users can opt-out of being included in searches</li>
                    <li>• Automated monitoring for suspicious activity patterns</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}