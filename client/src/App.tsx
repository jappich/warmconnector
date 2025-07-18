import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import AuthenticatedHome from "@/pages/AuthenticatedHome";
import FindIntro from "@/pages/FindIntro";
import MyConnections from "@/pages/MyConnections";
import DataManagement from "@/pages/DataManagement";
import Onboarding from "@/pages/Onboarding";
import MyAccount from "@/pages/MyAccount";
import BusinessChatDemo from "@/pages/BusinessChatDemo";
import TestBusinessChat from "@/pages/TestBusinessChat";
import SimpleChatDemo from "@/pages/SimpleChatDemo";
import LayoutShell from "@/components/LayoutShell";

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public demo routes - accessible without auth */}
      <Route path="/simple-chat" component={SimpleChatDemo} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
                <p className="text-slate-400 mb-4">The page you're looking for doesn't exist.</p>
                <a href="/simple-chat" className="text-purple-400 hover:text-purple-300 underline">
                  Try the Business Chat Demo
                </a>
              </div>
            </div>
          </Route>
        </>
      ) : (
        <LayoutShell>
          <Switch>
            <Route path="/" component={AuthenticatedHome} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/find-intro" component={FindIntro} />
            <Route path="/my-connections" component={MyConnections} />
            <Route path="/data-management" component={DataManagement} />
            <Route path="/my-account" component={MyAccount} />
            <Route path="/business-chat-demo" component={() => (
              <>
                <BusinessChatDemo />
              </>
            )} />
            <Route path="/test-chat" component={TestBusinessChat} />
            <Route>
              <div className="min-h-screen bg-bgPrimary flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-textPrimary mb-4">Page Not Found</h1>
                  <p className="text-textMuted mb-4">The page you're looking for doesn't exist.</p>
                  <a href="/simple-chat" className="text-accent hover:text-accentSub underline">
                    Try the Business Chat Demo
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
        </LayoutShell>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;