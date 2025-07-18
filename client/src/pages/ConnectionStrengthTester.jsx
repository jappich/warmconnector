import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  GraduationCap,
  Building2,
  MapPin,
  Heart,
  MessageSquare,
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ConnectionStrengthTester() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState({ from: '', to: '' });

  // Get available persons from MongoDB
  const { data: availablePersons } = useQuery({
    queryKey: ['/api/data/search-people', '']
  });

  // Test configuration for comprehensive validation
  const testCases = [
    {
      name: 'Company Alumni Test',
      description: 'Tests connections between people who worked at same companies',
      factor: 'company',
      icon: Building2,
      expectedFactors: ['Same company', 'Same department/industry']
    },
    {
      name: 'Educational Background Test',
      description: 'Tests alumni connections from same schools/universities',
      factor: 'education',
      icon: GraduationCap,
      expectedFactors: ['Alumni of']
    },
    {
      name: 'Geographic Proximity Test',
      description: 'Tests connections based on hometown/location data',
      factor: 'location',
      icon: MapPin,
      expectedFactors: ['Same geographic area']
    },
    {
      name: 'Spouse Network Test',
      description: 'Tests connections through spouse relationships',
      factor: 'spouse',
      icon: Heart,
      expectedFactors: ['Spouse connections']
    },
    {
      name: 'Social Media Connections Test',
      description: 'Tests LinkedIn, Twitter, Facebook connections',
      factor: 'socialMedia',
      icon: MessageSquare,
      expectedFactors: ['Connected on']
    },
    {
      name: 'Interaction History Test',
      description: 'Tests meeting, call, email interaction scoring',
      factor: 'interactions',
      icon: Calendar,
      expectedFactors: ['High interaction frequency']
    },
    {
      name: 'Mutual Network Test',
      description: 'Tests shared professional connections',
      factor: 'mutualConnections',
      icon: Users,
      expectedFactors: ['mutual network overlap']
    }
  ];

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const response = await fetch('/api/connections/strength-stats');
      if (!response.ok) throw new Error('Failed to get network data');
      
      const networkData = await response.json();
      
      // Run tests on sample connections from MongoDB
      const testPairs = [
        { from: 'person_001', to: 'person_002', description: 'Tech professionals' },
        { from: 'person_003', to: 'person_004', description: 'Alumni network' },
        { from: 'person_005', to: 'person_006', description: 'Geographic proximity' },
        { from: 'person_007', to: 'person_008', description: 'Industry colleagues' },
        { from: 'person_009', to: 'person_010', description: 'Social connections' }
      ];

      const results = [];
      
      for (const testCase of testCases) {
        const caseResults = [];
        
        for (const pair of testPairs) {
          try {
            const strengthResponse = await fetch(`/api/connections/strength/${pair.from}/${pair.to}`);
            if (strengthResponse.ok) {
              const strengthData = await strengthResponse.json();
              
              const testResult = {
                testName: testCase.name,
                factor: testCase.factor,
                pair: pair,
                score: strengthData.score || 0,
                breakdown: strengthData.breakdown || {},
                details: strengthData.details || '',
                passed: this.validateTestResult(strengthData, testCase),
                factors: strengthData.breakdown?.sharedHistory?.factors || []
              };
              
              caseResults.push(testResult);
            }
          } catch (error) {
            console.error(`Test failed for ${pair.description}:`, error);
          }
        }
        
        results.push({
          testCase: testCase,
          results: caseResults,
          passed: caseResults.some(r => r.passed),
          averageScore: caseResults.reduce((sum, r) => sum + r.score, 0) / caseResults.length || 0
        });
      }
      
      setTestResults(results);
      
      toast({
        title: "Connection Strength Tests Completed",
        description: `Tested ${results.length} connection factors with MongoDB data`
      });

    } catch (error) {
      console.error('Test suite failed:', error);
      toast({
        title: "Test Error",
        description: "Failed to run connection strength tests",
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const validateTestResult = (strengthData, testCase) => {
    if (!strengthData || !strengthData.breakdown) return false;
    
    const breakdown = strengthData.breakdown;
    
    switch (testCase.factor) {
      case 'company':
        return breakdown.sharedHistory?.score > 0 && 
               breakdown.sharedHistory?.factors?.some(f => f.includes('company') || f.includes('department'));
      
      case 'education':
        return breakdown.sharedHistory?.score > 0 && 
               breakdown.sharedHistory?.factors?.some(f => f.includes('Alumni'));
      
      case 'location':
        return breakdown.sharedHistory?.score > 0 && 
               breakdown.sharedHistory?.factors?.some(f => f.includes('geographic'));
      
      case 'spouse':
        return breakdown.sharedHistory?.score > 0 && 
               breakdown.sharedHistory?.factors?.some(f => f.includes('spouse'));
      
      case 'socialMedia':
        return breakdown.sharedHistory?.score > 0 && 
               breakdown.sharedHistory?.factors?.some(f => f.includes('Connected on'));
      
      case 'interactions':
        return breakdown.interactions > 0;
      
      case 'mutualConnections':
        return breakdown.mutualConnections > 0;
      
      default:
        return strengthData.score > 0;
    }
  };

  const testSpecificConnection = async () => {
    if (!selectedPersons.from || !selectedPersons.to) {
      toast({
        title: "Missing Information",
        description: "Please select both persons to test connection strength"
      });
      return;
    }

    try {
      const response = await fetch(`/api/connections/strength/${selectedPersons.from}/${selectedPersons.to}`);
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Connection Test Complete",
          description: `Strength score: ${result.score}% with detailed breakdown`
        });
        
        // Add to test results for display
        setTestResults(prev => [...prev, {
          testCase: { name: 'Manual Test', factor: 'all' },
          results: [{ 
            testName: 'Manual Connection Test',
            pair: selectedPersons,
            score: result.score,
            breakdown: result.breakdown,
            details: result.details,
            passed: result.score > 0,
            factors: result.breakdown?.sharedHistory?.factors || []
          }],
          passed: result.score > 0,
          averageScore: result.score
        }]);
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not calculate connection strength",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Connection Strength Testing Suite</h1>
        <p className="text-gray-400">
          Comprehensive validation of all connection factors using authentic MongoDB data
        </p>
      </div>

      <Tabs defaultValue="automated" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        {/* Automated Testing */}
        <TabsContent value="automated">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <PlayCircle className="mr-2 h-5 w-5" />
                Comprehensive Connection Factor Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testCases.map((testCase, index) => {
                    const Icon = testCase.icon;
                    return (
                      <div key={index} className="p-4 border border-gray-600 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Icon className="h-5 w-5 text-blue-400 mr-2" />
                          <h3 className="text-white font-medium">{testCase.name}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{testCase.description}</p>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Expected Factors:</div>
                          {testCase.expectedFactors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs mr-1">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center">
                  <Button 
                    onClick={runComprehensiveTests}
                    disabled={isRunningTests}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRunningTests ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Run All Connection Tests
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Testing */}
        <TabsContent value="manual">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Manual Connection Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromPerson" className="text-gray-300">From Person ID</Label>
                    <Input
                      id="fromPerson"
                      value={selectedPersons.from}
                      onChange={(e) => setSelectedPersons(prev => ({ ...prev, from: e.target.value }))}
                      placeholder="person_001"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="toPerson" className="text-gray-300">To Person ID</Label>
                    <Input
                      id="toPerson"
                      value={selectedPersons.to}
                      onChange={(e) => setSelectedPersons(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="person_002"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <Button onClick={testSpecificConnection} className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Test Connection Strength
                </Button>

                <div className="p-4 bg-gray-900/50 border border-gray-600 rounded">
                  <h4 className="text-white font-medium mb-2">Test Coverage</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• Company and department affiliations</p>
                    <p>• Educational background and alumni networks</p>
                    <p>• Geographic location and hometown data</p>
                    <p>• Spouse and family connections</p>
                    <p>• Social media platform connections</p>
                    <p>• Interaction history and engagement patterns</p>
                    <p>• Mutual professional connections</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results */}
        <TabsContent value="results">
          <div className="space-y-6">
            {testResults.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Test Results Yet</h3>
                  <p className="text-gray-400">Run the automated tests or manual testing to see results</p>
                </CardContent>
              </Card>
            ) : (
              testResults.map((result, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        {result.passed ? (
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />
                        )}
                        {result.testCase.name}
                      </div>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {Math.round(result.averageScore)}% avg
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.results.map((testResult, i) => (
                        <div key={i} className="p-3 border border-gray-600 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">
                              {testResult.pair.description || `${testResult.pair.from} → ${testResult.pair.to}`}
                            </span>
                            <span className="text-white font-bold">{testResult.score}%</span>
                          </div>
                          
                          <Progress value={testResult.score} className="mb-2" />
                          
                          {testResult.breakdown && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Interactions:</span>
                                <span className="text-white ml-1">{testResult.breakdown.interactions || 0}%</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Mutual:</span>
                                <span className="text-white ml-1">{testResult.breakdown.mutualConnections || 0}%</span>
                              </div>
                              <div>
                                <span className="text-gray-400">History:</span>
                                <span className="text-white ml-1">{testResult.breakdown.sharedHistory?.score || 0}%</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Age:</span>
                                <span className="text-white ml-1">{testResult.breakdown.connectionAge || 0}%</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Engagement:</span>
                                <span className="text-white ml-1">{testResult.breakdown.engagement || 0}%</span>
                              </div>
                            </div>
                          )}
                          
                          {testResult.factors.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-400 mb-1">Detected Factors:</div>
                              <div className="flex flex-wrap gap-1">
                                {testResult.factors.map((factor, fi) => (
                                  <Badge key={fi} variant="outline" className="text-xs">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}