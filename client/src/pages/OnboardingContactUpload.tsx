import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Mail, 
  Download, 
  CheckCircle, 
  ExternalLink,
  Users,
  ArrowRight,
  Copy,
  Smartphone,
  Laptop,
  Cloud,
  Building2,
  Globe
} from 'lucide-react';
import { SiGoogle, SiSalesforce, SiHubspot } from 'react-icons/si';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  estimatedTime: string;
  stepCount: number;
  isRecommended?: boolean;
}

export default function OnboardingContactUpload() {
  const [selectedMethod, setSelectedMethod] = useState<string>('file-upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedContacts, setUploadedContacts] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMethods: ImportMethod[] = [
    {
      id: 'file-upload',
      name: 'Upload Contact File',
      description: 'Drag & drop CSV, VCard, or Excel files from your computer',
      icon: Upload,
      difficulty: 'Easy',
      estimatedTime: '1-2 min',
      stepCount: 2,
      isRecommended: true
    },
    {
      id: 'google-sync',
      name: 'Google Contacts',
      description: 'Sync directly from Gmail and Google Workspace',
      icon: SiGoogle,
      difficulty: 'Easy',
      estimatedTime: '30 sec',
      stepCount: 1
    },
    {
      id: 'outlook-sync',
      name: 'Microsoft Outlook',
      description: 'Import from Outlook.com or Office 365',
      icon: Mail,
      difficulty: 'Easy',
      estimatedTime: '30 sec',
      stepCount: 1
    },
    {
      id: 'salesforce-sync',
      name: 'Salesforce CRM',
      description: 'Connect your Salesforce contacts and leads',
      icon: SiSalesforce,
      difficulty: 'Medium',
      estimatedTime: '2 min',
      stepCount: 3
    },
    {
      id: 'manual-export',
      name: 'Export from Phone/Email',
      description: 'Step-by-step guide to export contacts manually',
      icon: Smartphone,
      difficulty: 'Medium',
      estimatedTime: '5 min',
      stepCount: 4
    }
  ];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('contacts', file);
      
      // Simulate upload progress
      setIsUploading(true);
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedContacts(data.processedCount || 0);
      toast({
        title: "Contacts Uploaded Successfully!",
        description: `${data.processedCount || 0} contacts have been imported to your network.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/stats'] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your contacts. Please try again.",
        variant: "destructive"
      });
      setUploadProgress(0);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (uploadedContacts > 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center space-y-6">
          <div className="bg-green-100 p-6 rounded-lg border border-green-200">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              Contacts Uploaded Successfully!
            </h1>
            <p className="text-green-700 text-lg mb-4">
              {uploadedContacts} contacts have been imported to your network
            </p>
            
            <div className="flex justify-center gap-4">
              <Link href="/find-intro">
                <Button className="bg-green-600 hover:bg-green-700">
                  Start Finding Connections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="outline" className="border-green-600 text-green-600">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Import Your Contacts
        </h1>
        <p className="text-gray-300 text-lg mb-6">
          Choose the easiest method to import your professional contacts
        </p>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-blue-300 font-medium mb-2">Why import contacts?</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Find warm introduction paths to anyone</li>
                <li>• More contacts = better connection opportunities</li>
                <li>• Get your colleagues to join for maximum effect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={selectedMethod || 'file-upload'} onValueChange={setSelectedMethod}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 h-12 mb-6">
          {importMethods.map((method) => (
            <TabsTrigger key={method.id} value={method.id} className="text-white text-sm">
              <method.icon className="mr-2 h-4 w-4" />
              {method.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Method Cards Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {importMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card 
                key={method.id} 
                className={`cursor-pointer transition-all hover:shadow-lg bg-gray-800/50 border-gray-700 ${
                  selectedMethod === method.id ? 'ring-2 ring-blue-500' : ''
                } ${method.isRecommended ? 'border-blue-500' : ''}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                {method.isRecommended && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-600">
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{method.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getDifficultyColor(method.difficulty)}>
                          {method.difficulty}
                        </Badge>
                        <span className="text-gray-400 text-xs">{method.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">{method.description}</p>
                  <div className="text-gray-400 text-xs">
                    {method.stepCount} step{method.stepCount > 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Method Details */}
        <TabsContent value="file-upload">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="mr-3 h-6 w-6" />
                Upload Contact File
              </CardTitle>
              <p className="text-gray-300">
                The fastest way - just drag and drop your contact file
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isUploading ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Uploading Contacts...</h3>
                  <Progress value={uploadProgress} className="h-3 max-w-md mx-auto" />
                  <p className="text-gray-400 text-sm mt-2">{Math.round(uploadProgress)}% complete</p>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Drag & Drop Your Contact File Here
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Or click to browse your computer
                    </p>
                    <input
                      type="file"
                      accept=".csv,.vcf,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Choose File
                      </Button>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <h4 className="font-medium text-white">CSV Files</h4>
                      <p className="text-gray-400 text-sm">Excel exports, Google Contacts</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <Download className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-medium text-white">VCard Files</h4>
                      <p className="text-gray-400 text-sm">iPhone, Outlook exports</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <Building2 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-medium text-white">Excel Files</h4>
                      <p className="text-gray-400 text-sm">Company directories</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google-sync">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <SiGoogle className="mr-3 h-6 w-6" />
                Google Contacts Sync
              </CardTitle>
              <p className="text-gray-300">
                One-click import from Gmail and Google Workspace
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-blue-300 font-medium mb-4">Quick Setup:</h3>
                <ol className="text-blue-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                    Click "Connect Google Contacts" below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                    Sign in to your Google account
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                    Grant permission to read contacts
                  </li>
                </ol>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <SiGoogle className="mr-2 h-4 w-4" />
                Connect Google Contacts
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlook-sync">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="mr-3 h-6 w-6" />
                Microsoft Outlook Sync
              </CardTitle>
              <p className="text-gray-300">
                Import from Outlook.com or Office 365
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
                <h3 className="text-orange-300 font-medium mb-4">Quick Setup:</h3>
                <ol className="text-orange-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                    Click "Connect Microsoft Outlook" below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                    Sign in with your Microsoft account
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                    Authorize contact access
                  </li>
                </ol>
              </div>
              
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <Mail className="mr-2 h-4 w-4" />
                Connect Microsoft Outlook
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salesforce-sync">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <SiSalesforce className="mr-3 h-6 w-6" />
                Salesforce CRM Sync
              </CardTitle>
              <p className="text-gray-300">
                Import contacts and leads from Salesforce
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-purple-300 font-medium mb-4">Setup Process:</h3>
                <ol className="text-purple-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                    Click "Connect Salesforce" below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                    Enter your Salesforce instance URL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                    Authenticate with your Salesforce credentials
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">4</span>
                    Select which objects to sync (Contacts, Leads, Accounts)
                  </li>
                </ol>
              </div>
              
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <SiSalesforce className="mr-2 h-4 w-4" />
                Connect Salesforce CRM
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-export">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Smartphone className="mr-3 h-6 w-6" />
                Manual Export Guide
              </CardTitle>
              <p className="text-gray-300">
                Step-by-step instructions for exporting from various sources
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="phone" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
                  <TabsTrigger value="phone">From Phone</TabsTrigger>
                  <TabsTrigger value="email">From Email</TabsTrigger>
                  <TabsTrigger value="crm">From CRM</TabsTrigger>
                </TabsList>
                
                <TabsContent value="phone" className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">iPhone/iOS:</h4>
                    <ol className="text-gray-300 text-sm space-y-1">
                      <li>1. Open Settings → [Your Name] → iCloud</li>
                      <li>2. Turn on Contacts sync</li>
                      <li>3. Go to icloud.com on your computer</li>
                      <li>4. Open Contacts → Select All → Export vCard</li>
                    </ol>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Android:</h4>
                    <ol className="text-gray-300 text-sm space-y-1">
                      <li>1. Open Google Contacts app</li>
                      <li>2. Tap Menu → Settings → Export</li>
                      <li>3. Choose export format (VCF or CSV)</li>
                      <li>4. Share or save the file</li>
                    </ol>
                  </div>
                </TabsContent>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Gmail:</h4>
                    <ol className="text-gray-300 text-sm space-y-1">
                      <li>1. Go to contacts.google.com</li>
                      <li>2. Click Export on the left sidebar</li>
                      <li>3. Select contacts and format (CSV recommended)</li>
                      <li>4. Download the file</li>
                    </ol>
                  </div>
                </TabsContent>
                
                <TabsContent value="crm" className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Most CRM Systems:</h4>
                    <ol className="text-gray-300 text-sm space-y-1">
                      <li>1. Look for "Export" or "Reports" section</li>
                      <li>2. Choose Contacts/Leads data</li>
                      <li>3. Select CSV or Excel format</li>
                      <li>4. Include: Name, Email, Company, Title</li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm mb-4">
          Need help? Contact support or check our help documentation
        </p>
        <Link href="/dashboard">
          <Button variant="outline" className="border-gray-600 text-gray-300">
            Skip for Now
          </Button>
        </Link>
      </div>
    </div>
  );
}