import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  Shield, 
  RefreshCw,
  FileText,
  Users,
  Building,
  Calendar,
  Search,
  Filter,
  Archive,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function DataManagementModern() {
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const dataCategories = [
    {
      id: 'connections',
      name: 'Connections',
      icon: Users,
      count: 1247,
      size: '2.3 MB',
      lastSync: '2 hours ago',
      status: 'synced',
      privacy: 'private'
    },
    {
      id: 'companies',
      name: 'Company Data',
      icon: Building,
      count: 432,
      size: '1.8 MB',
      lastSync: '1 hour ago',
      status: 'synced',
      privacy: 'private'
    },
    {
      id: 'interactions',
      name: 'Interactions',
      icon: FileText,
      count: 3891,
      size: '5.7 MB',
      lastSync: '30 min ago',
      status: 'syncing',
      privacy: 'private'
    },
    {
      id: 'profiles',
      name: 'Profile Data',
      icon: Database,
      count: 856,
      size: '12.4 MB',
      lastSync: '1 day ago',
      status: 'pending',
      privacy: 'encrypted'
    }
  ];

  const exportFormats = [
    { name: 'CSV', description: 'Comma-separated values for spreadsheets' },
    { name: 'JSON', description: 'Structured data format for developers' },
    { name: 'PDF', description: 'Formatted report for sharing' },
    { name: 'Excel', description: 'Microsoft Excel workbook' }
  ];

  const privacySettings = [
    {
      category: 'Profile Visibility',
      description: 'Control who can see your profile information',
      current: 'Connections Only',
      options: ['Public', 'Connections Only', 'Private']
    },
    {
      category: 'Connection Sharing',
      description: 'Allow others to see your connections',
      current: 'Disabled',
      options: ['Enabled', 'Disabled', 'Mutual Only']
    },
    {
      category: 'Data Analytics',
      description: 'Include your data in network analytics',
      current: 'Anonymized',
      options: ['Full', 'Anonymized', 'Disabled']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-success';
      case 'syncing': return 'text-warning';
      case 'pending': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium text-foreground mb-2">Data Management</h1>
          <p className="text-lg text-muted-foreground">
            Manage your networking data, privacy settings, and data exports
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Privacy Center
          </Button>
          <Button className="stat-card-primary border-0">
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Data Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dataCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className="premium-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  {getStatusIcon(category.status)}
                </div>
                
                <h3 className="font-medium text-foreground mb-2">{category.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Records:</span>
                    <span className="font-medium">{category.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{category.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last sync:</span>
                    <span className="font-medium">{category.lastSync}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {category.privacy}
                  </Badge>
                  <span className={`text-xs font-medium ${getStatusColor(category.status)}`}>
                    {category.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import/Export */}
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              Import & Export
            </CardTitle>
            <CardDescription>
              Import data from other platforms or export your WarmConnect data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Import Data</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex flex-col h-auto p-4">
                  <Upload className="h-6 w-6 mb-2 text-primary" />
                  <span className="text-sm">LinkedIn</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto p-4">
                  <FileText className="h-6 w-6 mb-2 text-primary" />
                  <span className="text-sm">CSV File</span>
                </Button>
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Export Formats</h4>
              <div className="space-y-2">
                {exportFormats.map((format) => (
                  <div key={format.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{format.name}</div>
                      <div className="text-xs text-muted-foreground">{format.description}</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-success" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control how your data is used and shared within the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {privacySettings.map((setting, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{setting.category}</div>
                    <div className="text-xs text-muted-foreground">{setting.description}</div>
                  </div>
                  <Badge variant="secondary">{setting.current}</Badge>
                </div>
                <div className="flex gap-2">
                  {setting.options.map((option) => (
                    <Button
                      key={option}
                      variant={option === setting.current ? "default" : "outline"}
                      size="sm"
                      className={option === setting.current ? "stat-card-primary border-0" : ""}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Data Search and Management */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            Data Browser
          </CardTitle>
          <CardDescription>
            Search and manage individual data records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search connections, companies, or interactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>

          {/* Sample Data Records */}
          <div className="space-y-3">
            {[
              { type: 'Connection', name: 'Sarah Chen', company: 'Google', date: '2025-01-05', status: 'Active' },
              { type: 'Interaction', name: 'Email to Michael Rodriguez', company: 'Microsoft', date: '2025-01-04', status: 'Sent' },
              { type: 'Company', name: 'Apple Inc.', company: 'Technology', date: '2025-01-03', status: 'Tracked' },
              { type: 'Profile', name: 'Emily Park', company: 'Startup Inc', date: '2025-01-02', status: 'Updated' }
            ].map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedData([...selectedData, record.name]);
                      } else {
                        setSelectedData(selectedData.filter(item => item !== record.name));
                      }
                    }}
                  />
                  <div>
                    <div className="font-medium text-foreground">{record.name}</div>
                    <div className="text-sm text-muted-foreground">{record.type} • {record.company}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">{record.date}</div>
                  <Badge variant="secondary">{record.status}</Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedData.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {selectedData.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention & Compliance */}
      <Card className="premium-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-warning" />
            Data Retention & Compliance
          </CardTitle>
          <CardDescription>
            Manage data retention policies and compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">GDPR Compliant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All data processing follows EU data protection regulations
              </p>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Data Encrypted</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All sensitive data is encrypted at rest and in transit
              </p>
            </div>
            
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Auto-Cleanup</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Inactive data automatically archived after 2 years
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}