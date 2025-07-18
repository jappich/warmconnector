import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building, MapPin, User, Mail, Briefcase, Globe } from 'lucide-react';

function Onboard() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    companyName: '',
    companyCity: '',
    companyState: '',
    companyCountry: 'USA',
    companyDomain: ''
  });
  
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [pendingCompanyData, setPendingCompanyData] = useState(null);
  const { toast } = useToast();

  const onboardMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.needsCompanyCreation) {
        setPendingCompanyData(data);
        setShowCompanyModal(true);
      } else if (data.success) {
        toast({
          title: "Welcome to WarmConnector!",
          description: "Your account has been created successfully.",
        });
        // Redirect to dashboard or profile
        window.location.href = '/find-intro';
      } else {
        toast({
          title: "Onboarding Failed",
          description: data.message || "Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData) => {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Company Created",
          description: `${data.company.name} has been added to our network.`,
        });
        setShowCompanyModal(false);
        // Retry onboarding now that company exists
        onboardMutation.mutate(formData);
      } else {
        toast({
          title: "Company Creation Failed",
          description: data.message || "Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.companyName || 
        !formData.companyCity || !formData.companyState || !formData.companyCountry) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onboardMutation.mutate(formData);
  };

  const handleCreateCompany = () => {
    if (!pendingCompanyData) return;

    createCompanyMutation.mutate({
      name: pendingCompanyData.companyName,
      city: pendingCompanyData.companyLocation.city,
      state: pendingCompanyData.companyLocation.state,
      country: pendingCompanyData.companyLocation.country,
      domain: pendingCompanyData.companyDomain
    });
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Join WarmConnector
          </CardTitle>
          <p className="text-gray-400">
            Connect with your professional network through intelligent pathfinding
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="title" className="text-gray-300">Job Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </h3>
              
              <div>
                <Label htmlFor="companyName" className="text-gray-300">Company Name *</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange('companyName')}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Acme Corp"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="companyCity" className="text-gray-300">City *</Label>
                  <Input
                    id="companyCity"
                    type="text"
                    value={formData.companyCity}
                    onChange={handleInputChange('companyCity')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="San Francisco"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyState" className="text-gray-300">State *</Label>
                  <Input
                    id="companyState"
                    type="text"
                    value={formData.companyState}
                    onChange={handleInputChange('companyState')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="CA"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyCountry" className="text-gray-300">Country *</Label>
                  <Input
                    id="companyCountry"
                    type="text"
                    value={formData.companyCountry}
                    onChange={handleInputChange('companyCountry')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="USA"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="companyDomain" className="text-gray-300">Company Domain</Label>
                <Input
                  id="companyDomain"
                  type="text"
                  value={formData.companyDomain}
                  onChange={handleInputChange('companyDomain')}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="company.com"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={onboardMutation.isPending}
            >
              {onboardMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company Creation Modal */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Building className="h-5 w-5" />
              Add New Company
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {pendingCompanyData?.companyName} isn't in our system yet. Would you like to add it?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Company Details:</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {pendingCompanyData?.companyName}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {pendingCompanyData?.companyLocation?.city}, {pendingCompanyData?.companyLocation?.state}, {pendingCompanyData?.companyLocation?.country}
                </div>
                {pendingCompanyData?.companyDomain && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {pendingCompanyData.companyDomain}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleCreateCompany}
                disabled={createCompanyMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createCompanyMutation.isPending ? 'Adding...' : 'Add Company'}
              </Button>
              <Button
                onClick={() => setShowCompanyModal(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Onboard;