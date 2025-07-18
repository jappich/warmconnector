import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  User, 
  Upload, 
  Linkedin, 
  Users, 
  Star,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  route?: string;
  weight: number;
  estimatedTime: string;
}

export default function OnboardingProgressTracker() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Check connected social accounts
  const { data: socialAccounts } = useQuery({
    queryKey: ['/api/user/social-accounts'],
    queryFn: () => apiRequest('/api/user/social-accounts')
  });

  // Check uploaded contacts
  const { data: contactStats } = useQuery({
    queryKey: ['/api/contacts/stats'],
    queryFn: () => apiRequest('/api/contacts/stats')
  });

  // Check profile completion
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: () => apiRequest('/api/user/profile')
  });

  useEffect(() => {
    // Determine completion status for each step
    const hasLinkedIn = socialAccounts?.some((account: any) => account.platform === 'linkedin') || false;
    const hasContacts = (contactStats?.totalContacts || 0) > 0;
    const hasProfile = userProfile?.name && userProfile?.company;
    const hasMultipleSocials = (socialAccounts?.length || 0) >= 2;

    const onboardingSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your basic information, company, and role',
        icon: User,
        completed: hasProfile,
        route: '/profile',
        weight: 20,
        estimatedTime: '2 min'
      },
      {
        id: 'linkedin',
        title: 'Connect LinkedIn',
        description: 'Connect your LinkedIn for professional network access',
        icon: Linkedin,
        completed: hasLinkedIn,
        route: '/',
        weight: 30,
        estimatedTime: '1 min'
      },
      {
        id: 'contacts',
        title: 'Upload Your Contacts',
        description: 'Import contacts from CSV, VCard, or sync from email/CRM',
        icon: Upload,
        completed: hasContacts,
        route: '/onboarding-contacts',
        weight: 35,
        estimatedTime: '3 min'
      },
      {
        id: 'social',
        title: 'Connect More Platforms',
        description: 'Connect additional social platforms for better matching',
        icon: Users,
        completed: hasMultipleSocials,
        route: '/',
        weight: 15,
        estimatedTime: '3 min'
      }
    ];

    setSteps(onboardingSteps);

    // Calculate overall progress
    const completedWeight = onboardingSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.weight, 0);
    
    setOverallProgress(completedWeight);
  }, [socialAccounts, contactStats, userProfile]);

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const nextStep = steps.find(step => !step.completed);

  if (overallProgress === 100) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Setup Complete!</h3>
              <p className="text-green-700 text-sm">
                You're ready to find warm introductions through your network
              </p>
            </div>
            <Link href="/find-intro">
              <Button className="ml-auto bg-green-600 hover:bg-green-700">
                Start Finding Connections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Setup Progress
            </CardTitle>
            <p className="text-blue-700 text-sm mt-1">
              Complete these steps to unlock all features
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-900">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3 bg-blue-100" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isNext = step === nextStep;
          
          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                step.completed 
                  ? 'bg-green-50 border border-green-200' 
                  : isNext
                  ? 'bg-blue-50 border border-blue-200 ring-2 ring-blue-100'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 ${step.completed ? 'text-green-600' : isNext ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>

              <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-100' : isNext ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <StepIcon className={`h-5 w-5 ${step.completed ? 'text-green-600' : isNext ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${step.completed ? 'text-green-900' : isNext ? 'text-blue-900' : 'text-gray-700'}`}>
                    {step.title}
                  </h4>
                  {isNext && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      Next
                    </Badge>
                  )}
                  {step.completed && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      ✓ Done
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${step.completed ? 'text-green-700' : isNext ? 'text-blue-700' : 'text-gray-600'}`}>
                  {step.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                </div>
              </div>

              {!step.completed && step.route && (
                <Link href={step.route}>
                  <Button 
                    size="sm" 
                    variant={isNext ? "default" : "outline"}
                    className={isNext ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {isNext ? 'Start' : 'Setup'}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              )}

              {step.completed && (
                <div className="text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}

        {nextStep && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Next Step: {nextStep.title}</h4>
                <p className="text-blue-700 text-sm">{nextStep.description}</p>
              </div>
              <Link href={nextStep.route || '/'}>
                <Button className="ml-auto bg-blue-600 hover:bg-blue-700">
                  Continue Setup
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}