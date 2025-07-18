import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Users, 
  MapPin, 
  Briefcase, 
  Star,
  ChevronRight,
  Target,
  Globe,
  Filter
} from "lucide-react";

interface CompanyEmployee {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  connectionScore: number;
  mutualConnections: number;
  profileImage?: string;
}

const mockEmployees: CompanyEmployee[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "VP of Engineering",
    department: "Engineering",
    location: "San Francisco, CA",
    connectionScore: 85,
    mutualConnections: 3,
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
  },
  {
    id: "2", 
    name: "Marcus Johnson",
    title: "Senior Product Manager",
    department: "Product",
    location: "Seattle, WA",
    connectionScore: 72,
    mutualConnections: 2
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    title: "Director of Sales",
    department: "Sales",
    location: "Austin, TX", 
    connectionScore: 68,
    mutualConnections: 1
  }
];

const companies = [
  { name: "Google", logo: "🔍", employees: 150000, industry: "Technology" },
  { name: "Microsoft", logo: "🪟", employees: 220000, industry: "Technology" },
  { name: "Amazon", logo: "📦", employees: 1500000, industry: "E-commerce" },
  { name: "Apple", logo: "🍎", employees: 164000, industry: "Technology" },
  { name: "Meta", logo: "👥", employees: 85000, industry: "Social Media" },
  { name: "Tesla", logo: "⚡", employees: 140000, industry: "Automotive" }
];

export default function FindConnection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [results, setResults] = useState<CompanyEmployee[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!selectedCompany) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults(mockEmployees);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background with stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 rounded-full px-4 py-2 mb-6">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Company Targeting</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Find Connection
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Target specific companies to find employees, decision-makers, and potential contacts. 
            Perfect for sales prospecting, recruiting, or business development.
          </p>
        </div>

        {/* Use Cases Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <Briefcase className="w-8 h-8 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Sales Prospecting</CardTitle>
              <CardDescription className="text-slate-300">
                "Find VP of Sales at Salesforce to pitch our CRM integration"
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Talent Recruiting</CardTitle>
              <CardDescription className="text-slate-300">
                "Identify senior engineers at Google for our startup hiring"
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <Target className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Partnership Outreach</CardTitle>
              <CardDescription className="text-slate-300">
                "Connect with product managers at Microsoft for partnership opportunities"
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Search Interface */}
        <Card className="glass border border-white/10 bg-white/5 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="w-5 h-5 mr-2 text-cyan-400" />
              Company Employee Search
            </CardTitle>
            <CardDescription className="text-slate-300">
              Select a company and department to find specific employees and decision-makers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <Card 
                  key={company.name}
                  className={`cursor-pointer transition-all duration-200 border ${
                    selectedCompany === company.name 
                      ? 'border-cyan-400 bg-cyan-500/10' 
                      : 'border-white/10 bg-white/5 hover:border-cyan-400/50'
                  }`}
                  onClick={() => setSelectedCompany(company.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{company.logo}</span>
                      <div>
                        <h3 className="text-white font-medium">{company.name}</h3>
                        <p className="text-slate-400 text-sm">{company.employees.toLocaleString()} employees</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Department Filter */}
            {selectedCompany && (
              <div>
                <label className="text-white mb-3 block">Department (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {["Engineering", "Product", "Sales", "Marketing", "Operations", "Executive"].map((dept) => (
                    <Badge 
                      key={dept}
                      variant={selectedDepartment === dept ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedDepartment === dept 
                          ? 'bg-cyan-500 text-white' 
                          : 'border-white/20 text-slate-300 hover:border-cyan-400'
                      }`}
                      onClick={() => setSelectedDepartment(selectedDepartment === dept ? "" : dept)}
                    >
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={!selectedCompany || isSearching}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isSearching ? (
                <>Searching employees...</>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Employees at {selectedCompany || "Company"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="glass border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-cyan-400" />
                Found {results.length} employees at {selectedCompany}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((employee) => (
                  <Card key={employee.id} className="border border-white/10 bg-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{employee.name}</h3>
                            <p className="text-cyan-400">{employee.title}</p>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {employee.department}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {employee.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-medium">{employee.connectionScore}%</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {employee.mutualConnections} mutual connections
                          </p>
                          <Button size="sm" className="mt-2 bg-cyan-500 hover:bg-cyan-600">
                            <ChevronRight className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}