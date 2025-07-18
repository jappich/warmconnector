import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import SimpleNavigation from "@/components/SimpleNavigation";
import ExclusiveLanding from "@/pages/ExclusiveLanding";
import AnimatedLanding from "@/pages/AnimatedLanding";
import SimpleDashboard from "@/pages/SimpleDashboard";
import SimpleConnectionFinder from "@/pages/SimpleConnectionFinder";
import FindIntro from "@/pages/FindIntro";
import FindConnectionsPage from "@/pages/FindConnectionsPage";
import NetworkMap from "@/pages/NetworkMap.jsx";
import SimpleAIAssistant from "@/pages/SimpleAIAssistant";
import UserProfile from "@/pages/UserProfile";
import DualAIDemo from "@/pages/DualAIDemo";
import Onboard from "@/pages/Onboard";

export default function AppRouterPremium() {
  const [location] = useLocation();
  
  const userProfile = {
    name: "Alex Johnson",
    title: "CEO & Founder",
    company: "TechVenture Inc.",
    avatar: undefined,
    memberSince: "2024",
    connectionsCount: 847
  };

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20, scale: 0.98 },
    enter: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, scale: 0.98, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Switch>
        {/* Public landing pages */}
        <Route path="/landing">
          <AnimatePresence mode="wait">
            <motion.div
              key="/landing"
              initial="initial"
              animate="enter"
              exit="exit"
              variants={pageVariants}
            >
              <ExclusiveLanding />
            </motion.div>
          </AnimatePresence>
        </Route>
        
        <Route path="/animated">
          <AnimatePresence mode="wait">
            <motion.div
              key="/animated"
              initial="initial"
              animate="enter"
              exit="exit"
              variants={pageVariants}
            >
              <AnimatedLanding />
            </motion.div>
          </AnimatePresence>
        </Route>
        
        {/* Premium member experience */}
        <Route>
          <SimpleNavigation />
          
          {/* Main Content with Clean Navigation */}
          <div className="lg:ml-64">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
              >
                <Switch>
                  <Route path="/" component={SimpleDashboard} />
                  <Route path="/dashboard" component={SimpleDashboard} />
                  <Route path="/onboard" component={Onboard} />
                  <Route path="/enhanced-connection-finder" component={SimpleConnectionFinder} />
                  <Route path="/find-connections" component={FindConnectionsPage} />
                  <Route path="/find-intro" component={FindIntro} />
                  <Route path="/network-map" component={NetworkMap} />
                  <Route path="/networking-intelligence" component={SimpleAIAssistant} />
                  <Route path="/dual-ai-demo" component={DualAIDemo} />
                  <Route path="/profile" component={UserProfile} />
                  <Route>
                    <div className="container mx-auto px-4 py-8 text-center">
                      <h1 className="text-2xl text-slate-800 mb-4">Page Not Found</h1>
                      <p className="text-slate-600 mb-4">This page doesn't exist in our network.</p>
                    </div>
                  </Route>
                </Switch>
              </motion.div>
            </AnimatePresence>
          </div>
        </Route>
      </Switch>
    </div>
  );
}