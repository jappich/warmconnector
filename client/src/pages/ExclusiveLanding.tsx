import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Zap, Crown, Star, ChevronRight, Check, Globe, MessageCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExclusiveLanding() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleJoinWaitlist = () => {
    if (email) {
      setIsSubmitted(true);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      } 
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.4, 
        ease: "easeOut" 
      } 
    }
  };

  const testimonials = [
    {
      quote: "I met my cofounder through WARMCONNECT in one day. The connections here are incredible.",
      author: "Sarah Chen",
      title: "Founder, TechVenture",
      avatar: "SC"
    },
    {
      quote: "Finally, a networking platform that actually works. No more cold outreach ever again.",
      author: "Marcus Williams",
      title: "VP Business Development",
      avatar: "MW"
    },
    {
      quote: "The quality of connections on WARMCONNECT is unmatched. This is the future of networking.",
      author: "Elena Rodriguez",
      title: "Chief Innovation Officer",
      avatar: "ER"
    }
  ];

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Verified Members Only",
      description: "Exclusive network of pre-vetted professionals"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Warm Introductions",
      description: "Connect through mutual connections in seconds"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Elite Network",
      description: "Access to decision-makers across industries"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full z-50 bg-black/10 backdrop-blur-md border-b border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Crown className="h-8 w-8 text-amber-400" />
              </motion.div>
              <span className="text-2xl font-bold text-white">WARMCONNECT</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30">
                  Elite
                </Badge>
              </motion.div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                Limited Access
              </Badge>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Member Login
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-amber-400/20 text-amber-400 border-amber-400/30 px-4 py-2 text-sm">
              By Invitation Only
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              No More Cold Calls.<br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Warm Connections Only.
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the exclusive network where every introduction is warm, every connection is meaningful, 
              and every opportunity is within reach. This isn't LinkedIn—this is professional networking evolved.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <div className="flex items-center space-x-2 text-slate-300">
                <Star className="h-5 w-5 text-amber-400 fill-current" />
                <span>Invite-only community</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Users className="h-5 w-5 text-blue-400" />
                <span>10,000+ verified professionals</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span>500+ successful connections daily</span>
              </div>
            </div>

            {!isSubmitted ? (
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-amber-400"
                />
                <Button 
                  onClick={handleJoinWaitlist}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold px-8"
                  disabled={!email}
                >
                  Join Waitlist
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 max-w-md mx-auto"
              >
                <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
                <p className="text-slate-300">We'll notify you when your exclusive access is ready.</p>
              </motion.div>
            )}

            <p className="text-sm text-slate-400 mt-4">
              Currently accepting applications from <strong>Series A+ founders</strong> and <strong>VP+ executives</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why WARMCONNECT Section */}
      <section className="py-20 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why WARMCONNECT &gt; LinkedIn
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              LinkedIn connects you to everyone. WARMCONNECT connects you to the right people.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">LinkedIn: Cold Messages</h3>
                  <p className="text-slate-300">"Hi, I'd like to add you to my professional network" - 2% response rate</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">WarmConnector: Warm Introductions</h3>
                  <p className="text-slate-300">"Sarah thought you two should meet" - 87% response rate</p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Unlock Hidden Opportunities</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Meet the right people at the right moment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Never reach out cold again</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Access decision-makers through warm paths</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-amber-400/20 p-3 rounded-lg">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                          <p className="text-slate-300">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Our Members Say
            </h2>
            <p className="text-xl text-slate-300">
              Real stories from our exclusive community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-black font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{testimonial.author}</p>
                        <p className="text-slate-400 text-sm">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-400/20 to-orange-400/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Never Network Cold Again?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join the most exclusive professional network where every connection counts
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold px-8 py-3"
            >
              Request Invitation
              <Crown className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-slate-400">
              Limited to 100 new members this month
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="container mx-auto text-center">
          <p className="text-slate-400">
            © 2024 WarmConnector. Exclusively for high-achieving professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}