import { useState, useEffect, useRef } from 'react';
import { useSignInWithEmailAndPassword, useSignInWithGoogle, useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../firebase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import Logo from './Logo';

export default function FirebaseLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const { toast } = useToast();
  
  // Refs for input elements to manage focus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
      }
    };
    
    fetchCsrfToken();
    
    // Set initial focus on email input when component mounts
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);
  
  // Email validation function
  const validateEmail = (value: string) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };
  
  // Password validation function
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    } else if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  // Handle email validation on blur
  const handleEmailBlur = () => {
    validateEmail(email);
  };
  
  // Handle password validation on blur
  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  // Firebase authentication hooks
  const [signInWithEmailAndPassword, signInUser, signInLoading, signInError] = 
    useSignInWithEmailAndPassword(auth);
  
  const [createUserWithEmailAndPassword, createUser, createLoading, createError] = 
    useCreateUserWithEmailAndPassword(auth);
  
  const [signInWithGoogle, googleUser, googleLoading, googleError] = 
    useSignInWithGoogle(auth);

  // Handle form submission for sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email and password before submitting
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (isEmailValid && isPasswordValid) {
      try {
        await signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error("Sign in error:", error);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the form errors before submitting.",
        variant: "destructive"
      });
    }
  };

  // Handle form submission for sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email and password before submitting
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (isEmailValid && isPasswordValid) {
      try {
        await createUserWithEmailAndPassword(email, password);
      } catch (error) {
        console.error("Sign up error:", error);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the form errors before submitting.",
        variant: "destructive"
      });
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  // Show errors
  const renderError = (error: any) => {
    if (!error) return null;
    
    return (
      <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
        {error.message}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto pt-10">
      <div className="mb-12 flex flex-col items-center justify-center">
        <div className="relative">
          <Logo size="xlarge" />
          <p className="text-[0.875rem] text-gray-500 font-light tracking-wider text-center -mt-4">powered by OpenAI</p>
        </div>
      </div>
      
      <div className="relative">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden relative z-10">
          <CardContent className="p-8">
            <Tabs 
              defaultValue="signin" 
              className="space-y-5" 
              onValueChange={(value) => {
                // Clear validation errors when switching tabs
                setEmailError('');
                setPasswordError('');
              }}>
              <TabsList className="grid grid-cols-2 w-full bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="signin" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Create Account</TabsTrigger>
              </TabsList>
              
              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {renderError(signInError)}
                  <input type="hidden" name="_csrf" value={csrfToken} />
                  
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        ref={emailInputRef}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={handleEmailBlur}
                        placeholder=" "
                        className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-300 pt-5 pb-2 px-4 ${emailError ? 'border-red-500' : ''}`}
                        required
                        aria-describedby="email-error"
                        tabIndex={1}
                      />
                      <Label 
                        htmlFor="email" 
                        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                      >
                        Email
                      </Label>
                    </div>
                    <div id="email-error" className={`text-red-500 text-xs mt-1 flex items-center ${emailError ? '' : 'hidden'}`}>
                      {emailError && <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>{emailError}</span>
                      </>}
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center mb-1">
                      <div className="invisible">
                        <Label htmlFor="password" className="text-sm text-gray-500">Password</Label>
                      </div>
                      <a href="#" className="text-xs text-blue-600 hover:text-blue-800">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        ref={passwordInputRef}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={handlePasswordBlur}
                        placeholder=" "
                        className={`bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-300 pt-5 pb-2 px-4 ${passwordError ? 'border-red-500' : ''}`}
                        required
                        aria-describedby="password-error"
                        tabIndex={2}
                      />
                      <Label 
                        htmlFor="password" 
                        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                      >
                        Password
                      </Label>
                    </div>
                    <div id="password-error" className={`text-red-500 text-xs mt-1 flex items-center ${passwordError ? '' : 'hidden'}`}>
                      {passwordError && <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>{passwordError}</span>
                      </>}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none"
                    disabled={signInLoading}
                    tabIndex={3}
                  >
                    {signInLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {renderError(createError)}
                  <input type="hidden" name="_csrf" value={csrfToken} />
                  
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={handleEmailBlur}
                        placeholder=" "
                        className={`bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] placeholder:text-[#94A3B8]/50 focus:ring-[#06B6D4] pt-5 pb-2 px-4 ${emailError ? 'border-red-500' : ''}`}
                        required
                        aria-describedby="signup-email-error"
                      />
                      <Label 
                        htmlFor="signup-email" 
                        className="absolute text-sm text-[#94A3B8] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                      >
                        Email
                      </Label>
                    </div>
                    <div id="signup-email-error" className={`text-red-500 text-xs mt-1 flex items-center ${emailError ? '' : 'hidden'}`}>
                      {emailError && <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>{emailError}</span>
                      </>}
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={handlePasswordBlur}
                        placeholder=" "
                        className={`bg-[#0F172A]/50 border-[#1E293B] text-[#F8FAFC] focus:ring-[#06B6D4] pt-5 pb-2 px-4 ${passwordError ? 'border-red-500' : ''}`}
                        required
                        aria-describedby="signup-password-error"
                      />
                      <Label 
                        htmlFor="signup-password" 
                        className="absolute text-sm text-[#94A3B8] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                      >
                        Password
                      </Label>
                    </div>
                    <div id="signup-password-error" className={`text-red-500 text-xs mt-1 flex items-center ${passwordError ? '' : 'hidden'}`}>
                      {passwordError && <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>{passwordError}</span>
                      </>}
                    </div>
                    <p className="text-xs text-[#94A3B8]">Password must be at least 8 characters</p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none"
                    disabled={createLoading}
                    tabIndex={3}
                  >
                    {createLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600 mr-2"></div>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}