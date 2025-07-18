import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebookF, FaGithub } from "react-icons/fa";
import NetworkNodeIcon from "./NetworkNodeIcon";
import { ONBOARD_URL, API_KEY } from "@/lib/config";

interface SocialConnectOnboardingProps {
  onNext: (selectedPlatforms: string[]) => Promise<void>;
}

const SocialConnectOnboarding = ({ onNext }: SocialConnectOnboardingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const socialNetworks = [
    { id: "linkedin", name: "LinkedIn", icon: FaLinkedin, color: "text-[#0077B5]" },
    { id: "twitter", name: "Twitter", icon: FaTwitter, color: "text-[#1DA1F2]" },
    { id: "instagram", name: "Instagram", icon: FaInstagram, color: "text-[#E1306C]" },
    { id: "facebook", name: "Facebook", icon: FaFacebookF, color: "text-[#1877F2]" },
    { id: "github", name: "GitHub", icon: FaGithub, color: "text-[#FFFFFF]" },
  ];

  const handleTogglePlatform = (platformId: string) => {
    // Reset error when user makes changes
    if (error) setError("");
    
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (selectedPlatforms.length === 0) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // Send selected platforms to the API
      const response = await fetch(ONBOARD_URL || '/api/social-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'x-api-key': API_KEY } : {})
        },
        body: JSON.stringify({ socialPlatforms: selectedPlatforms })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      // Call onNext to advance to the next step
      await onNext(selectedPlatforms);
      
    } catch (err) {
      console.error("Error connecting social networks:", err);
      setError(err instanceof Error ? err.message : "Failed to connect social platforms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto relative">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-3xl"></div>

      <Card className="bg-[#1E293B]/80 backdrop-blur-md border border-transparent shadow-xl overflow-hidden neon-border">
        <CardContent className="p-6 md:p-8">
          {/* Progress indicator */}
          <div className="mb-6 relative h-1 w-full bg-gray-700/50 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-2/4 bg-gradient-to-r from-[#06B6D4] to-[#A855F7]"></div>
          </div>
          <div className="text-xs text-[#94A3B8] mb-6 text-right">Step 2 of 4</div>
          
          {/* Header with network icon */}
          <div className="flex items-center justify-center mb-2">
            <div className="mr-3 p-2 bg-[#06B6D4]/10 rounded-full relative">
              <NetworkNodeIcon />
              <div className="absolute inset-0 rounded-full bg-[#06B6D4]/10 animate-ping opacity-30"></div>
            </div>
            <h1 className="text-2xl font-bold text-[#F8FAFC] neon-text">Connect Your Networks</h1>
          </div>
          
          {/* Subheading */}
          <p className="text-center text-[#94A3B8] mb-8">
            Link more accounts to unlock deeper, smarter introductions.
          </p>

          {/* Social Network Options */}
          <div className="space-y-4 mb-6">
            {socialNetworks.map((network) => (
              <div 
                key={network.id}
                className={`flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:border-[#06B6D4]/30 ${
                  selectedPlatforms.includes(network.id)
                    ? "border-transparent neon-border bg-[#06B6D4]/10"
                    : "border-[#1E293B] bg-[#0F172A]/50"
                }`}
                onClick={() => handleTogglePlatform(network.id)}
              >
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full ${selectedPlatforms.includes(network.id) ? 'shadow-[0_0_10px_rgba(6,182,212,0.7)]' : 'border border-[#94A3B8]'}`}>
                    {selectedPlatforms.includes(network.id) && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[#06B6D4]"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center ml-3 flex-1">
                  <div className={`mr-3 p-2 rounded-full ${
                    selectedPlatforms.includes(network.id) 
                      ? 'bg-[#06B6D4]/20 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                      : 'bg-gray-800/50'
                  }`}>
                    <network.icon className={`text-xl ${selectedPlatforms.includes(network.id) ? network.color : 'text-gray-400'}`} />
                  </div>
                  <Label
                    htmlFor={network.id}
                    className="text-[#F8FAFC] font-medium cursor-pointer"
                  >
                    {network.name}
                  </Label>
                </div>
              </div>
            ))}
          </div>

          {/* Encouragement text */}
          <p className="text-center text-sm text-[#94A3B8] italic mb-6">
            The more networks you link, the richer your connections become.
          </p>

          {/* Error message */}
          {error && (
            <Alert 
              className="mb-6 border border-red-500/30 bg-red-500/10 text-red-400"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={selectedPlatforms.length === 0 || isLoading}
            className="w-full mt-6 py-6 bg-gradient-to-r from-[#06B6D4] to-[#A855F7] text-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600 disabled:hover:scale-100 disabled:hover:shadow-none"
            aria-label="Continue to next step"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
            ) : (
              "Continue"
            )}
          </Button>
          
          {/* Privacy note */}
          <p className="text-center text-xs text-[#94A3B8] mt-4">
            We'll only access your connections, not your personal data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialConnectOnboarding;