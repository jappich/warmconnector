import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  Database, 
  Users, 
  Building2,
  Search,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import NetworkAnalyticsDashboard from '@/components/NetworkAnalyticsDashboard';

export default function DataManagement() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [employeeData, setEmployeeData] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // Import company directory
  const importMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/data/import-company', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: data.message
      });
      setEmployeeData('');
      queryClient.invalidateQueries({ queryKey: ['/api/data/search-people'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import company directory",
        variant: "destructive"
      });
    }
  });

  // Search people in database
  const searchMutation = useMutation({
    mutationFn: (query) => apiRequest(`/api/data/search-people?q=${encodeURIComponent(query)}`),
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search people",
        variant: "destructive"
      });
    }
  });

  // Get network statistics
  const { data: networkStats } = useQuery({
    queryKey: ['/api/data/network-stats', selectedPersonId],
    enabled: !!selectedPersonId
  });

  const handleImport = () => {
    if (!companyName.trim()) {
      toast({
        title: "Missing Company Name",
        description: "Please enter a company name",
        variant: "destructive"
      });
      return;
    }

    if (!employeeData.trim()) {
      toast({
        title: "Missing Employee Data",
        description: "Please enter employee data in JSON format",
        variant: "destructive"
      });
      return;
    }

    try {
      const employees = JSON.parse(employeeData);
      if (!Array.isArray(employees)) {
        throw new Error('Employee data must be an array');
      }

      importMutation.mutate({
        companyName: companyName.trim(),
        employees,
        source: 'manual'
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your employee data format",
        variant: "destructive"
      });
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Missing Search Query",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }
    searchMutation.mutate(searchQuery.trim());
  };

  const sampleEmployeeData = `[
  {
    "name": "John Smith",
    "email": "john.smith@company.com",
    "title": "Software Engineer",
    "department": "Engineering",
    "education": ["MIT", "Computer Science"],
    "skills": ["JavaScript", "Python", "React"]
  },
  {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@company.com", 
    "title": "Product Manager",
    "department": "Product",
    "education": ["Stanford University"],
    "previousCompanies": ["Google", "Microsoft"]
  }
]`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
          <Database className="mr-4 h-10 w-10 text-blue-400" />
          Data Management
        </h1>
        <p className="text-gray-400 text-lg">
          Import company directories and manage professional network data
        </p>
        
        {/* Clear Instructions */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-green-300 font-medium mb-2">Upload your contacts to enable connections:</h3>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• Upload CSV files, VCard files, or company directories</li>
                <li>• The more contacts you upload, the better connections we can find</li>
                <li>• Ask colleagues to upload their contacts too for better results</li>
                <li>• Connect LinkedIn and other social accounts for enhanced matching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 h-12">
          <TabsTrigger value="import" className="text-white text-base">
            Import Data
          </TabsTrigger>
          <TabsTrigger value="search" className="text-white text-base">
            Search Network
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white text-base">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Import Company Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Employee Data (JSON Format)
                </label>
                <Textarea
                  value={employeeData}
                  onChange={(e) => setEmployeeData(e.target.value)}
                  placeholder="Paste employee data in JSON format..."
                  className="bg-gray-900/50 border-gray-600 text-white min-h-64 font-mono text-sm"
                  rows={12}
                />
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setEmployeeData(sampleEmployeeData)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Load Sample Data
                </Button>
                
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Directory
                    </>
                  )}
                </Button>
              </div>

              {importMutation.data && (
                <div className="bg-green-900/20 border border-green-500/50 rounded p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400 font-medium">Import Successful</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {importMutation.data.message}
                  </p>
                  {importMutation.data.results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-yellow-400 text-sm">Warnings:</p>
                      <ul className="text-gray-400 text-xs list-disc list-inside">
                        {importMutation.data.results.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Data Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Required Fields:</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• <code>name</code> - Full name of the employee</li>
                    <li>• <code>email</code> - Work email address</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Optional Fields:</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• <code>title</code> - Job title</li>
                    <li>• <code>department</code> - Department or team</li>
                    <li>• <code>location</code> - Office location</li>
                    <li>• <code>education</code> - Array of schools/universities</li>
                    <li>• <code>previousCompanies</code> - Array of previous employers</li>
                    <li>• <code>skills</code> - Array of professional skills</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Search Professional Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, company, or title..."
                  className="bg-gray-900/50 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={searchMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {searchMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchMutation.data && (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">
                    Search Results ({searchMutation.data.length})
                  </h3>
                  {searchMutation.data.length === 0 ? (
                    <p className="text-gray-400">No results found</p>
                  ) : (
                    <div className="grid gap-3">
                      {searchMutation.data.map((person) => (
                        <div
                          key={person.id}
                          className={`p-4 bg-gray-900/50 rounded border cursor-pointer transition-colors ${
                            selectedPersonId === person.id 
                              ? 'border-blue-500 bg-blue-900/20' 
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedPersonId(person.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-medium">{person.name}</h4>
                              <p className="text-gray-400 text-sm">{person.title}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {person.company}
                                </Badge>
                                {person.department && (
                                  <Badge variant="outline" className="text-xs">
                                    {person.department}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{person.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedPersonId && networkStats && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Network Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {networkStats.directConnections}
                    </div>
                    <div className="text-gray-400 text-sm">Direct Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {networkStats.reachableCompanies}
                    </div>
                    <div className="text-gray-400 text-sm">Connected Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {networkStats.networkSize}
                    </div>
                    <div className="text-gray-400 text-sm">Network Reach</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <NetworkAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}