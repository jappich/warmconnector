import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Upload, 
  Users, 
  GitBranch, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface GraphStats {
  nodes: number;
  edges: number;
  relationshipTypes: string[];
  lastUpdate: string;
}

interface ImportStats {
  persons: number;
  relationships: number;
  relationshipTypes: string[];
}

export default function AdminDashboard() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch graph statistics
  const { data: graphStats, isLoading: graphLoading } = useQuery<GraphStats>({
    queryKey: ['/api/graph/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // MongoDB data import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/import/mongodb-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Import failed');
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsImporting(true);
      setImportProgress(0);
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `Imported ${data.importStats.persons} persons and ${data.importStats.relationships} relationships`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/graph/status'] });
      setImportProgress(100);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
      }, 2000);
    }
  });

  // Rebuild graph mutation
  const rebuildMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/rebuild-graph', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to rebuild graph');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Graph Rebuilt",
        description: "Enhanced graph has been successfully rebuilt"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/graph/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rebuild Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const handleRebuild = () => {
    rebuildMutation.mutate();
  };

  const getRelationshipBadgeColor = (type: string) => {
    const colors = {
      'COWORKER': 'bg-blue-100 text-blue-800',
      'FAMILY': 'bg-purple-100 text-purple-800',
      'EDUCATION': 'bg-green-100 text-green-800',
      'GREEK_LIFE': 'bg-yellow-100 text-yellow-800',
      'HOMETOWN': 'bg-orange-100 text-orange-800',
      'SOCIAL': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your MongoDB data import and enhanced graph system
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Graph Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Graph Statistics
            </CardTitle>
            <CardDescription>
              Current enhanced graph metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {graphLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ) : graphStats ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Nodes</span>
                  <span className="text-lg font-bold">{graphStats.nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Edges</span>
                  <span className="text-lg font-bold">{graphStats.edges}</span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Relationship Types</p>
                  <div className="flex flex-wrap gap-1">
                    {graphStats.relationshipTypes?.map((type) => (
                      <Badge 
                        key={type} 
                        variant="secondary" 
                        className={getRelationshipBadgeColor(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(graphStats.lastUpdate).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No graph data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* MongoDB Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              MongoDB Import
            </CardTitle>
            <CardDescription>
              Import authentic data from your MongoDB collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}
            
            <Button 
              onClick={handleImport}
              disabled={isImporting || importMutation.isPending}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import MongoDB Data
                </>
              )}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will replace existing data with authentic MongoDB profiles and rebuild all relationships.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Graph Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Graph Management
            </CardTitle>
            <CardDescription>
              Rebuild and manage the enhanced graph system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRebuild}
              disabled={rebuildMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {rebuildMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rebuild Graph
                </>
              )}
            </Button>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Rebuilds the in-memory graph from existing database data without data import.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Enhanced connection finder engine status and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Available Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Multi-hop pathfinding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">6 relationship types</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Enhanced connection finder</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Introduction request workflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Authentic MongoDB data integration</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Relationship Types</h4>
              <div className="grid grid-cols-2 gap-2">
                <Badge className="bg-blue-100 text-blue-800 justify-center">COWORKER</Badge>
                <Badge className="bg-purple-100 text-purple-800 justify-center">FAMILY</Badge>
                <Badge className="bg-green-100 text-green-800 justify-center">EDUCATION</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 justify-center">GREEK_LIFE</Badge>
                <Badge className="bg-orange-100 text-orange-800 justify-center">HOMETOWN</Badge>
                <Badge className="bg-pink-100 text-pink-800 justify-center">SOCIAL</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}