import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  Zap, 
  Filter, 
  Maximize, 
  RotateCcw,
  Share,
  Download,
  Eye,
  Settings,
  Play,
  Pause,
  Target,
  Building,
  MapPin,
  Activity
} from 'lucide-react';

export default function NetworkVisualizationModern() {
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedView, setSelectedView] = useState('force');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const networkStats = {
    totalNodes: 1247,
    totalConnections: 3892,
    clusters: 8,
    avgPathLength: 2.8,
    density: 0.15,
    centralityScore: 0.84
  };

  const networkNodes = [
    { id: 'you', name: 'You', type: 'self', connections: 156, strength: 1.0, x: 50, y: 50 },
    { id: 'sarah', name: 'Sarah Chen', type: 'direct', connections: 89, strength: 0.9, x: 30, y: 40 },
    { id: 'michael', name: 'Michael Rodriguez', type: 'direct', connections: 67, strength: 0.8, x: 70, y: 40 },
    { id: 'emily', name: 'Emily Park', type: 'direct', connections: 112, strength: 0.85, x: 60, y: 70 },
    { id: 'david', name: 'David Kim', type: 'indirect', connections: 45, strength: 0.6, x: 20, y: 60 },
    { id: 'jessica', name: 'Jessica Wu', type: 'indirect', connections: 78, strength: 0.7, x: 80, y: 60 }
  ];

  const clusterData = [
    { name: 'Technology', size: 342, color: 'bg-blue-500', connections: 1456 },
    { name: 'Finance', size: 189, color: 'bg-green-500', connections: 876 },
    { name: 'Healthcare', size: 156, color: 'bg-red-500', connections: 654 },
    { name: 'Education', size: 134, color: 'bg-purple-500', connections: 432 },
    { name: 'Consulting', size: 98, color: 'bg-yellow-500', connections: 321 },
    { name: 'Startup', size: 87, color: 'bg-pink-500', connections: 298 },
    { name: 'Media', size: 76, color: 'bg-indigo-500', connections: 267 },
    { name: 'Government', size: 65, color: 'bg-gray-500', connections: 198 }
  ];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'self': return 'bg-primary';
      case 'direct': return 'bg-success';
      case 'indirect': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getNodeSize = (connections: number) => {
    if (connections > 100) return 'w-6 h-6';
    if (connections > 50) return 'w-5 h-5';
    return 'w-4 h-4';
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium text-foreground mb-2">Network Visualization</h1>
          <p className="text-lg text-muted-foreground">
            Interactive visualization of your professional network relationships
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share View
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="stat-card-primary border-0">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="premium-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">View:</span>
                <div className="flex gap-1">
                  {['force', 'circular', 'hierarchical'].map((view) => (
                    <Button
                      key={view}
                      variant={selectedView === view ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedView(view)}
                      className={selectedView === view ? "stat-card-primary border-0" : ""}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAnimating(!isAnimating)}
                >
                  {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isAnimating ? 'Pause' : 'Play'}
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button variant="outline" size="sm">
                  <Maximize className="h-4 w-4" />
                  Fullscreen
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
              <Badge variant="secondary">All Industries</Badge>
              <Badge variant="secondary">Direct + Indirect</Badge>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Graph */}
        <div className="lg:col-span-3">
          <Card className="premium-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-primary" />
                  Network Graph
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {networkStats.totalNodes} nodes, {networkStats.totalConnections} edges
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Network Visualization Canvas */}
              <div className="relative w-full h-96 bg-secondary/20 rounded-lg overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                
                {/* Network Nodes and Connections */}
                <div className="absolute inset-0 p-4">
                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    {networkNodes.map((node, i) => 
                      networkNodes.slice(i + 1).map((otherNode, j) => (
                        <line
                          key={`${node.id}-${otherNode.id}`}
                          x1={`${node.x}%`}
                          y1={`${node.y}%`}
                          x2={`${otherNode.x}%`}
                          y2={`${otherNode.y}%`}
                          stroke="hsl(var(--primary))"
                          strokeWidth="1"
                          opacity="0.3"
                          className={isAnimating ? 'animate-pulse' : ''}
                        />
                      ))
                    )}
                  </svg>
                  
                  {/* Network Nodes */}
                  {networkNodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${getNodeSize(node.connections)} ${getNodeColor(node.type)} rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg hover:scale-110 transition-all duration-200`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      onClick={() => setSelectedNode(node)}
                      title={`${node.name} - ${node.connections} connections`}
                    >
                      {node.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-background/90 p-3 rounded-lg border">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>You</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span>Direct Connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span>2nd Degree</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Network Stats */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Network Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-xl font-bold text-primary">{networkStats.totalNodes}</div>
                  <div className="text-xs text-muted-foreground">Total Nodes</div>
                </div>
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-xl font-bold text-success">{networkStats.avgPathLength}</div>
                  <div className="text-xs text-muted-foreground">Avg Path Length</div>
                </div>
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-xl font-bold text-warning">{(networkStats.density * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Network Density</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Node Info */}
          {selectedNode && (
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Node Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${getNodeColor(selectedNode.type)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                    {selectedNode.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{selectedNode.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedNode.type} connection</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connections:</span>
                    <span className="text-sm font-medium text-foreground">{selectedNode.connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Strength:</span>
                    <span className="text-sm font-medium text-foreground">{(selectedNode.strength * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <Button className="w-full stat-card-primary border-0 mt-4">
                  <Target className="h-4 w-4 mr-2" />
                  Find Introduction Path
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cluster Analysis */}
          <Card className="premium-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Industry Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clusterData.slice(0, 5).map((cluster, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 ${cluster.color} rounded-full`}></div>
                    <span className="text-sm font-medium text-foreground">{cluster.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{cluster.size}</div>
                    <div className="text-xs text-muted-foreground">{cluster.connections} links</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Insights */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            Network Analysis Insights
          </CardTitle>
          <CardDescription>
            AI-powered insights about your network structure and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Strong Central Position</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You're well-positioned as a network hub with high betweenness centrality
              </p>
            </div>
            
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Industry Concentration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                72% of connections are in Technology - consider diversifying
              </p>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Geographic Reach</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Strong presence in 3 major tech hubs with expansion potential
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}