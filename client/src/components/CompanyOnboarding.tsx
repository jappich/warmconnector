import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NetworkNodeIcon from "./NetworkNodeIcon";
import { ONBOARD_URL, API_KEY } from "@/lib/config";

interface OnboardingFormData {
  domain: string;
  allowAll: boolean;
  confirmed: boolean;
}

interface CompanyOnboardingProps {
  onSubmit?: (data: OnboardingFormData) => Promise<void>;
  onSubmitSuccess?: () => void;
}

const CompanyOnboarding = ({ onSubmit, onSubmitSuccess }: CompanyOnboardingProps) => {
  const [formData, setFormData] = useState<OnboardingFormData>({
    domain: "",
    allowAll: false,
    confirmed: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [domainError, setDomainError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const validateDomain = (domain: string) => {
    if (!domain) {
      return "Please enter a domain";
    }
    if (!domain.includes(".")) {
      return "Please enter a valid domain";
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === "domain") {
      setDomainError(validateDomain(value));
    }
    
    // Clear previous submit status when form is edited
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, allowAll: checked });
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, confirmed: checked });
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateDomain(formData.domain);
    setDomainError(error);
    
    if (!error && formData.confirmed) {
      setIsLoading(true);
      setSubmitStatus(null);
      
      try {
        // If onSubmit prop is provided, use that
        if (onSubmit) {
          await onSubmit(formData);
          setSubmitStatus({
            type: "success",
            message: `Successfully requested access for ${formData.domain}`
          });
          // Call onSubmitSuccess if provided
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
          return;
        }
        
        // Otherwise, use our local API endpoint or direct webhook URL
        const response = await fetch(ONBOARD_URL || '/api/onboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY ? { 'x-api-key': API_KEY } : {})
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        
        setSubmitStatus({
          type: "success",
          message: `Successfully requested access for ${formData.domain}`
        });
        
        // Call onSubmitSuccess if provided
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
      } catch (error) {
        console.error("Error submitting form:", error);
        setSubmitStatus({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to submit your request. Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormValid = !!formData.domain && !domainError && formData.confirmed;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Decorative background elements */}
      <motion.div 
        className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-3xl"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* Progress indicator */}
          <div className="mb-6 relative h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-blue-600"></div>
          </div>
          <div className="text-xs text-gray-500 mb-6 text-right">Step 1 of 4</div>
          
          {/* Header with network node icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="mr-3 p-2 bg-blue-100 rounded-full relative">
              <NetworkNodeIcon />
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-30"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to WarmConnector</h1>
          </div>

          {/* Status message */}
          {submitStatus && (
            <Alert 
              className={`mb-6 border ${
                submitStatus.type === "success" 
                  ? "border-green-200 bg-green-50 text-green-800" 
                  : "border-red-200 bg-red-50 text-red-800"
              } animate-fadeIn`}
            >
              <AlertDescription>
                {submitStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Onboarding Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Email Domain Input */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-gray-700">Company Email Domain</Label>
              <Input
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                placeholder="e.g. mycompany.com"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200"
              />
              {domainError && (
                <p className="text-red-600 text-sm mt-1">{domainError}</p>
              )}
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="allowAll" className="text-gray-700">
                Enable all employees to join
              </Label>
              <Switch
                id="allowAll"
                checked={formData.allowAll}
                onCheckedChange={handleSwitchChange}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirmed"
                checked={formData.confirmed}
                onCheckedChange={handleCheckboxChange}
                className="border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor="confirmed"
                className="text-sm text-gray-600 leading-tight font-normal"
              >
                I confirm I have permission to enroll my entire organization.
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full mt-6 py-6 bg-blue-600 text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:bg-gray-400"
              aria-label="Request access for your company"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                "Request Access"
              )}
            </Button>
          </form>

          {/* Bottom decorative element */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              By submitting, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
};

export default CompanyOnboarding;
