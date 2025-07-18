import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Star, Users, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import ContactUpload from '@/components/ContactUpload';

export default function SimpleDashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Welcome back</h1>
        <p className="text-slate-600">Find warm introductions to anyone in your network</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Find Connections Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Find Connections</CardTitle>
                <CardDescription>Search for people and discover introduction paths</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Enter someone's name or company to find the shortest path for a warm introduction through your network.
            </p>
            <Link href="/enhanced-connection-finder">
              <Button className="w-full">
                Start Searching
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Assistant Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Networking Assistant</CardTitle>
                <CardDescription>Get expert advice on professional networking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ask questions about LinkedIn strategies, introduction emails, and networking best practices.
            </p>
            <Link href="/networking-intelligence">
              <Button variant="outline" className="w-full">
                Get Advice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Contact Upload */}
      <div className="mb-6">
        <ContactUpload />
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Your Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Introductions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Upload your contacts above to improve connection finding
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}