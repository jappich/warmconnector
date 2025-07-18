import { useOktaAuth } from '@okta/okta-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NetworkNodeIcon from "@/components/NetworkNodeIcon";

const Login = () => {
  const { oktaAuth, authState } = useOktaAuth();

  const login = async () => {
    await oktaAuth.signInWithRedirect();
  };

  const logout = async () => {
    await oktaAuth.signOut();
  };

  if (!authState) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0F172A] p-4">
        <div className="animate-pulse text-[#94A3B8]">Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0F172A] p-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      <div className="w-full max-w-md mx-auto relative">
        {/* Decorative background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-3xl"></div>

        <Card className="bg-[#1E293B]/80 backdrop-blur-md border border-transparent shadow-lg overflow-hidden neon-border">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="mr-3 p-2 bg-[#06B6D4]/10 rounded-full relative">
                <NetworkNodeIcon />
                <div className="absolute inset-0 rounded-full bg-[#06B6D4]/10 animate-ping opacity-30"></div>
              </div>
              <h1 className="text-2xl font-bold neon-text">WarmConnector</h1>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-[#94A3B8]">
                {authState.isAuthenticated 
                  ? 'Welcome! You are signed in to your account.' 
                  : 'Sign in to access your professional network.'}
              </p>
            </div>

            <div className="flex justify-center">
              {!authState.isAuthenticated ? (
                <Button
                  onClick={login}
                  className="py-5 bg-gradient-to-r from-[#06B6D4] to-[#A855F7] text-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105"
                >
                  Sign In with Okta
                </Button>
              ) : (
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-[#F8FAFC]"
                >
                  Sign Out
                </Button>
              )}
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-[#1E293B]/50 text-center">
              <p className="text-xs text-[#94A3B8]">
                Powered by WarmConnector Network
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;