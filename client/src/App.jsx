import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/queryClient';

// Components
import Navbar from '@/components/Navbar';
import FindIntro from '@/pages/FindIntro';
import MyAccount from '@/pages/MyAccount';
import MyConnections from '@/pages/MyConnections';
import DataManagement from '@/pages/DataManagement';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Login from '@/pages/Login';

import { AuthProvider, useAuth } from '@/context/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      <main className="pt-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/find-intro" component={FindIntro} />
          <Route path="/my-connections" component={MyConnections} />
          <Route path="/data-management" component={DataManagement} />
          <Route path="/my-account" component={MyAccount} />
          <Route>
            <div className="container mx-auto px-4 py-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
              <p className="text-gray-400">The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;