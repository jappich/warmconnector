import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Users, 
  Network, 
  TrendingUp, 
  Target,
  Building2,
  Zap,
  Shield,
  CheckCircle,
  Star,
  Quote
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Network,
      title: "Smart Connection Discovery",
      description: "Leverage your entire company's network to find warm introductions to any target contact.",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "AI-Powered Analytics",
      description: "Get real-time insights into connection strength, network growth, and relationship quality.",
      color: "green"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with SSO integration and comprehensive audit trails for compliance.",
      color: "purple"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamline introduction requests and follow-ups with intelligent automation.",
      color: "orange"
    }
  ];

  const stats = [
    { value: "10M+", label: "Professional Connections" },
    { value: "500+", label: "Enterprise Customers" },
    { value: "95%", label: "Success Rate" },
    { value: "24/7", label: "Support Available" }
  ];

  const testimonials = [
    {
      quote: "WarmConnector transformed how our sales team builds relationships. We've seen a 300% increase in qualified leads.",
      author: "Sarah Chen",
      title: "VP of Sales",
      company: "TechCorp"
    },
    {
      quote: "The platform's ability to map our entire company's network has unlocked connections we never knew existed.",
      author: "Michael Rodriguez",
      title: "Head of Business Development",
      company: "Innovation Labs"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                ✨ New: Company-Wide Network Intelligence
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Professional Network</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Leverage your entire organization's collective network to find warm introductions, 
                build stronger relationships, and accelerate business growth with AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                <Link href="/onboarding">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/company-network">
                  <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg">
                    See Demo
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex justify-center items-center space-x-8 text-gray-500 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  SOC 2 Compliant
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  4.9/5 Customer Rating
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  99.9% Uptime
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to build meaningful connections
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines the power of your entire organization's network with 
              advanced AI to help you find and nurture the relationships that matter most.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How WarmConnector Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to unlock your organization's networking potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Team</h3>
              <p className="text-gray-600">
                Seamlessly onboard your entire organization through secure SSO integration 
                and map everyone's professional networks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Find Connections</h3>
              <p className="text-gray-600">
                Use our intelligent search to find who in your company knows your target contacts 
                and discover optimal introduction paths.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Make Introductions</h3>
              <p className="text-gray-600">
                Request warm introductions with AI-powered messaging and track relationship 
                progress with advanced analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by leading organizations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <Quote className="h-8 w-8 text-blue-600 mb-4" />
                  <p className="text-gray-700 text-lg mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <span className="text-gray-600 font-semibold">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-600">{testimonial.title}, {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your professional networking?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of professionals who are already using WarmConnector 
            to build meaningful business relationships.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/onboarding">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}