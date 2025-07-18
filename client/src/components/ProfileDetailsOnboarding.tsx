import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import NetworkNodeIcon from "./NetworkNodeIcon";
import { ONBOARD_URL, API_KEY } from "@/lib/config";

interface ProfileData {
  name: string;
  email: string;
  company?: string;
  school?: string;
  spouse?: string;
  fraternity?: string;
}

interface ProfileDetailsOnboardingProps {
  onBack: () => void;
  onFinish: (data: ProfileData) => Promise<void>;
}

const ProfileDetailsOnboarding = ({ onBack, onFinish }: ProfileDetailsOnboardingProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    company: "",
    school: "",
    spouse: "",
    fraternity: ""
  });
  
  const [errors, setErrors] = useState({
    name: "",
    email: ""
  });
  
  const [submitError, setSubmitError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when typing
    if (name === "name" || name === "email") {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Clear submit error when any field changes
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {
      name: formData.name.trim() ? "" : "Name is required",
      email: !formData.email.trim() 
        ? "Email is required" 
        : !validateEmail(formData.email) 
          ? "Please enter a valid email" 
          : ""
    };
    
    setErrors(newErrors);
    
    // Only proceed if no errors
    if (newErrors.name || newErrors.email) {
      return;
    }
    
    setIsLoading(true);
    setSubmitError("");
    
    try {
      // Send profile data to the API
      const response = await fetch(ONBOARD_URL || '/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'x-api-key': API_KEY } : {})
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Profile submission failed with status ${response.status}`);
      }
      
      // Show success toast
      toast({
        title: "Profile saved successfully!",
        description: `Thanks ${formData.name}! Your profile is now complete.`,
      });
      
      // Call onFinish to advance to the next step
      await onFinish(formData);
      
    } catch (error) {
      console.error("Error submitting profile details:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save your profile. Please try again.";
      setSubmitError(errorMessage);
      
      toast({
        title: "Error saving profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!formData.name.trim() && !!formData.email.trim() && validateEmail(formData.email);

  return (
    <div className="w-full max-w-[400px] mx-auto relative">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-3xl"></div>

      <Card className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* Progress indicator */}
          <div className="mb-6 relative h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          </div>
          <div className="text-xs text-slate-600 mb-6 text-right">Step 3 of 4</div>
          
          {/* Header with network icon */}
          <div className="flex items-center justify-center mb-2">
            <div className="mr-3 p-2 bg-blue-100 rounded-full relative">
              <NetworkNodeIcon />
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Your Profile Details</h1>
          </div>
          
          {/* Subheading */}
          <p className="text-center text-slate-600 mb-8">
            Tell us more about yourself to enhance your connections.
          </p>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name and Email row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="relative space-y-1">
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-white border-slate-300 text-slate-900 pt-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="name" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm">{errors.name}</p>
                )}
              </div>
              
              {/* Email Address */}
              <div className="relative space-y-1">
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] pt-5 focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent focus:neon-shadow transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="email" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    Email Address <span className="text-red-400">*</span>
                  </Label>
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>
            </div>
            
            {/* Company and School row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Company */}
              <div className="relative">
                <div className="relative">
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] pt-5 focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent focus:neon-shadow transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="company" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    Current Company
                  </Label>
                </div>
              </div>
              
              {/* School / University */}
              <div className="relative">
                <div className="relative">
                  <Input
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] pt-5 focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent focus:neon-shadow transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="school" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    School / University
                  </Label>
                </div>
              </div>
            </div>
            
            {/* Spouse and Fraternity row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spouse / Partner Name */}
              <div className="relative">
                <div className="relative">
                  <Input
                    id="spouse"
                    name="spouse"
                    value={formData.spouse}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] pt-5 focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent focus:neon-shadow transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="spouse" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    Spouse / Partner Name (Optional)
                  </Label>
                </div>
              </div>
              
              {/* Fraternity / Sorority */}
              <div className="relative">
                <div className="relative">
                  <Input
                    id="fraternity"
                    name="fraternity"
                    value={formData.fraternity}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] pt-5 focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent focus:neon-shadow transition-all duration-200 peer"
                  />
                  <Label 
                    htmlFor="fraternity" 
                    className="absolute text-[#94A3B8] top-1 left-3 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs"
                  >
                    Fraternity / Sorority (Optional)
                  </Label>
                </div>
              </div>
            </div>
            
            {/* Encouragement Text */}
            <p className="text-center text-sm neon-text italic pt-2">
              The more details you share, the stronger your introductions.
            </p>

            {/* Submit Error */}
            {submitError && (
              <Alert 
                className="mt-4 border border-red-500/30 bg-red-500/10 text-red-400"
              >
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                aria-label="Go back to previous step"
                className="border-[#1E293B] bg-transparent text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-[#F8FAFC] transition-all duration-200"
              >
                Back
              </Button>
              
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                aria-label="Complete profile details and continue"
                className="bg-gradient-to-r from-[#06B6D4] to-[#A855F7] text-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDetailsOnboarding;