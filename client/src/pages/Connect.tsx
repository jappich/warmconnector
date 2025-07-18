import { useState } from "react";
import SocialConnectOnboarding from "@/components/SocialConnectOnboarding";
import ProfileDetailsOnboarding from "@/components/ProfileDetailsOnboarding";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NetworkNodeIcon from "@/components/NetworkNodeIcon";

// Define types for onboarding data
interface ProfileData {
  name: string;
  email: string;
  company?: string;
  school?: string;
  spouse?: string;
  fraternity?: string;
}

interface OnboardingData {
  platforms: string[];
  profile: ProfileData;
}

// Main component
export default function Connect() {
  const { toast } = useToast();
  const [step, setStep] = useState<'social' | 'profile' | 'complete'>('social');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    platforms: [],
    profile: {
      name: "",
      email: "",
      company: "",
      school: "",
      spouse: "",
      fraternity: ""
    }
  });

  const socialPlatformAuthURLs: Record<string, string> = {
    linkedin: "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=r_liteprofile%20r_emailaddress",
    twitter: "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=tweet.read%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain",
    instagram: "https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&response_type=code",
    facebook: "https://www.facebook.com/v12.0/dialog/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=state&scope=email,public_profile",
    github: "https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user"
  };

  // Handle connecting social platforms
  async function handleSocialConnect(selectedPlatforms: string[]) {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would:
      // 1. Redirect to OAuth URLs for each platform
      // 2. Handle OAuth callbacks and token exchange
      // 3. Store tokens securely
      
      // For demo purposes, we'll simulate this process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For each platform, simulate an OAuth redirect in a new window
      const connectedPlatforms = selectedPlatforms.map(platform => {
        console.log(`Would connect to ${platform} via: ${socialPlatformAuthURLs[platform]}`);
        return platform;
      });
      
      // Store connected platforms
      setOnboardingData(prev => ({
        ...prev,
        platforms: connectedPlatforms
      }));
      
      // Move to profile step
      setStep('profile');
      
      toast({
        title: "Networks Selected",
        description: `Ready to connect ${selectedPlatforms.length} network(s): ${selectedPlatforms.join(", ")}`,
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "There was a problem preparing to connect your networks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle back button on profile step
  function handleBack() {
    setStep('social');
  }
  
  // Handle final profile submission
  async function handleFinish(profileData: ProfileData) {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would:
      // 1. Submit user profile data to your API
      // 2. Complete OAuth flows for selected platforms
      // 3. Link the user's social accounts to their profile

      // For demo purposes, we'll simulate this process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store profile data
      setOnboardingData(prev => ({
        ...prev,
        profile: profileData
      }));
      
      // Complete onboarding
      setStep('complete');
      
      toast({
        title: "Profile Complete",
        description: `Thanks ${profileData.name}! Your onboarding is complete.`,
      });
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was a problem saving your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] p-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      {/* Step 1: Social Connect */}
      {step === 'social' && (
        <SocialConnectOnboarding onNext={handleSocialConnect} />
      )}
      
      {/* Step 2: Profile Details */}
      {step === 'profile' && (
        <ProfileDetailsOnboarding 
          onBack={handleBack}
          onFinish={handleFinish}
        />
      )}
      
      {/* Step 3: Completion */}
      {step === 'complete' && (
        <Card className="w-full max-w-[400px] bg-[#1E293B]/80 backdrop-blur-md border-[#1E293B]/50 shadow-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-[#06B6D4]/10 rounded-full">
                <NetworkNodeIcon className="w-8 h-8" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-[#F8FAFC] mb-4">
              Onboarding Complete!
            </h2>
            
            <p className="text-[#94A3B8] mb-6">
              Welcome to WarmConnector, {onboardingData.profile.name}!
            </p>
            
            <div className="mb-6 p-4 bg-[#0F172A]/50 rounded-lg border border-[#1E293B]">
              <h3 className="text-[#F8FAFC] font-medium mb-2">Connected Platforms</h3>
              {onboardingData.platforms.length > 0 ? (
                <ul className="text-left space-y-1">
                  {onboardingData.platforms.map(platform => (
                    <li key={platform} className="text-[#06B6D4]">
                      ✓ {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#94A3B8] text-sm">No platforms connected</p>
              )}
            </div>
            
            <p className="text-[#06B6D4] mb-6">
              Your warm connection network is now ready!
            </p>
            
            <Button 
              onClick={() => window.location.href = '/search'}
              className="w-full py-5 bg-gradient-to-r from-[#06B6D4] to-[#A855F7] text-white shadow-lg"
            >
              Start Finding Connections
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}