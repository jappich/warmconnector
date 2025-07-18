import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface UploadResult {
  totalContacts: number;
  processedContacts: number;
  newConnections: number;
  existingConnections: number;
  errors: string[];
}

export default function ContactUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('contacts', file);

      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ['/api/user/connections'] });
      toast({
        title: "Contacts uploaded successfully",
        description: `Processed ${result.processedContacts} contacts, found ${result.newConnections} new connections`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload contacts",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const parseCSVPreview = (file: File): Promise<Contact[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(0, 6); // Show first 5 contacts
        const contacts: Contact[] = [];
        
        lines.forEach((line, index) => {
          if (index === 0) return; // Skip header
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length >= 2 && values[0]) {
            contacts.push({
              name: values[0],
              email: values[1] || undefined,
              phone: values[2] || undefined,
              company: values[3] || undefined,
            });
          }
        });
        
        resolve(contacts);
      };
      reader.readAsText(file);
    });
  };

  const [previewContacts, setPreviewContacts] = useState<Contact[]>([]);

  const handleFilePreview = async (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const contacts = await parseCSVPreview(file);
      setPreviewContacts(contacts);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event);
    const file = event.target.files?.[0];
    if (file) {
      handleFilePreview(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Upload Your Contacts
        </CardTitle>
        <CardDescription>
          Import contacts from your phone or email to help us find better connection paths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".csv,.vcf,.txt"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: CSV, VCF (vCard), TXT
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="outline">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {previewContacts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Preview (first 5 contacts):</h4>
            <div className="space-y-2">
              {previewContacts.map((contact, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{contact.name}</div>
                  {contact.email && (
                    <div className="text-gray-600">{contact.email}</div>
                  )}
                  {contact.company && (
                    <div className="text-gray-500">{contact.company}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing contacts...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Upload Complete</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{uploadResult.processedContacts}</div>
                <div className="text-sm text-green-700">Contacts Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{uploadResult.newConnections}</div>
                <div className="text-sm text-green-700">New Connections</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Processing Notes</span>
                </div>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            'Processing...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Contacts
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How to export contacts:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>iPhone:</strong> Settings → Contacts → Export vCard</li>
            <li><strong>Android:</strong> Contacts app → Menu → Export to CSV</li>
            <li><strong>Gmail:</strong> Contacts → Export → CSV format</li>
            <li><strong>Outlook:</strong> People → Manage → Export contacts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}