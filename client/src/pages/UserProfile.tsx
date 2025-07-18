import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building2, 
  LinkedinIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Settings
} from 'lucide-react';
import { SiSalesforce, SiHubspot, SiInstagram } from 'react-icons/si';

export default function UserProfile() {
  const [user] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@company.com",
    company: "TechCorp Solutions",
    title: "Senior Product Manager",
    location: "San Francisco, CA",
    joinDate: "March 2024",
    totalConnections: 247,
    introductionsMade: 18,
    platforms: [
      { name: "LinkedIn", connected: true, icon: LinkedinIcon },
      { name: "Salesforce", connected: true, icon: SiSalesforce },
      { name: "HubSpot", connected: false, icon: SiHubspot },
      { name: "Instagram", connected: false, icon: SiInstagram }
    ],
    recentConnections: [
      { name: "Sarah Chen", company: "StartupXYZ", role: "Founder", connectedDate: "2 days ago" },
      { name: "Michael Rodriguez", company: "InnovateCorp", role: "VP Sales", connectedDate: "1 week ago" },
      { name: "Emily Watson", company: "TechFlow", role: "CTO", connectedDate: "2 weeks ago" }
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>{user.title}</CardDescription>
                <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                  <Building2 className="h-4 w-4 mr-1" />
                  {user.company}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {user.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {user.joinDate}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{user.totalConnections}</div>
                    <div className="text-xs text-gray-500">Total Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{user.introductionsMade}</div>
                    <div className="text-xs text-gray-500">Introductions Made</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected Platforms */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Connected Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.platforms.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <platform.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </div>
                    <Badge variant={platform.connected ? "default" : "secondary"}>
                      {platform.connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Network Reach</p>
                      <p className="text-2xl font-bold">2,847</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold">94%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg. Path Length</p>
                      <p className="text-2xl font-bold">2.3</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Connections */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Connections</CardTitle>
                <CardDescription>People you've recently connected with through WarmConnector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.recentConnections.map((connection, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{connection.name}</p>
                          <p className="text-sm text-gray-600">{connection.role} at {connection.company}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{connection.connectedDate}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Your data is secure and never shared</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Data encrypted at rest</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No data sold to third parties</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Platform permissions limited</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Full user control</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}