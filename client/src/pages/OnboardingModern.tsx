import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Building, 
  Users, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart,
  Globe
} from 'lucide-react';

const OnboardingModern: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    email: '',
    title: '',
    company: '',
    location: '',
    
    // Education & Background
    education: '',
    hometown: '',
    languages: [],
    
    // Professional
    experience: '',
    skills: [],
    interests: [],
    
    // Network
    socialProfiles: {
      linkedin: '',
      github: '',
      twitter: ''
    }
  });

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialProfileChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [platform]: value
      }
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Let's start with the basics about you</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="alex@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                <Input
                  placeholder="Senior Product Manager"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                <Input
                  placeholder="TechCorp"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <Input
                  placeholder="San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-success/10 rounded-lg w-fit mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Education & Background</h2>
              <p className="text-muted-foreground">Tell us about your educational and personal background</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Education</label>
                <Input
                  placeholder="Stanford University - MBA, UC Berkeley - BS Computer Science"
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hometown</label>
                <Input
                  placeholder="Portland, OR"
                  value={formData.hometown}
                  onChange={(e) => handleInputChange('hometown', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Interests & Hobbies</label>
                <Input
                  placeholder="Rock climbing, photography, coffee roasting, travel"
                  value={formData.interests.join(', ')}
                  onChange={(e) => handleInputChange('interests', e.target.value.split(', '))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Languages</label>
                <Input
                  placeholder="English (Native), Spanish (Conversational), Mandarin (Basic)"
                  value={formData.languages.join(', ')}
                  onChange={(e) => handleInputChange('languages', e.target.value.split(', '))}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-warning/10 rounded-lg w-fit mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-warning" />
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Professional Experience</h2>
              <p className="text-muted-foreground">Share your professional background and skills</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Professional Experience</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Brief overview of your career journey and key roles..."
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Skills & Expertise</label>
                <Input
                  placeholder="Product Strategy, Data Analysis, User Experience, Team Leadership"
                  value={formData.skills.join(', ')}
                  onChange={(e) => handleInputChange('skills', e.target.value.split(', '))}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-destructive/10 rounded-lg w-fit mx-auto mb-4">
                <Globe className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Social Profiles</h2>
              <p className="text-muted-foreground">Connect your professional social profiles for better networking</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">LinkedIn Profile</label>
                <Input
                  placeholder="https://linkedin.com/in/your-profile"
                  value={formData.socialProfiles.linkedin}
                  onChange={(e) => handleSocialProfileChange('linkedin', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">GitHub Profile (Optional)</label>
                <Input
                  placeholder="https://github.com/your-username"
                  value={formData.socialProfiles.github}
                  onChange={(e) => handleSocialProfileChange('github', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Twitter Profile (Optional)</label>
                <Input
                  placeholder="https://twitter.com/your-handle"
                  value={formData.socialProfiles.twitter}
                  onChange={(e) => handleSocialProfileChange('twitter', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-medium text-foreground">Welcome to WarmConnect</h1>
        <p className="text-lg text-muted-foreground">
          Let's set up your profile to help you find the best networking opportunities
        </p>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Sparkles className="h-3 w-3 mr-1" />
          Step {currentStep} of {totalSteps}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="premium-card border-0">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="premium-card border-0">
        <CardContent className="p-8">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={handleNext}
            className="stat-card-primary border-0 px-6"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button className="stat-card-primary border-0 px-6">
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center space-x-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div 
              key={stepNumber}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : isCurrent 
                    ? 'border-primary text-primary' 
                    : 'border-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{stepNumber}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingModern;