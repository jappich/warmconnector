import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Users, Zap, Crown, Star, ChevronRight, Check, Globe, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react';

export default function AnimatedLanding() {
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

  const navLinks = ['Features', 'About', 'Pricing', 'Contact'];

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
      icon: <Users className="h-6 w-6" />,
      title: "Premium Network",
      description: "Access to 10,000+ industry leaders"
    }
  ];

  const testimonials = [
    {
      quote: "I met my cofounder through WarmConnector in one day. The connections here are incredible.",
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
      quote: "The quality of connections on WarmConnector is unmatched. This is the future of networking.",
      author: "Elena Rodriguez",
      title: "Chief Innovation Officer", 
      avatar: "ER"
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

            {/* Navigation Links */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {navLinks.map((label, index) => (
                <motion.a
                  key={label}
                  href="#"
                  className="text-white hover:text-amber-400 transition-colors"
                  variants={slideUp}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ delay: 0.2 * index, duration: 0.4 }}
                >
                  {label}
                </motion.a>
              ))}
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
        <motion.div 
          className="container mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={slideUp}>
            <Badge className="mb-6 bg-amber-400/20 text-amber-400 border-amber-400/30 px-4 py-2 text-sm">
              By Invitation Only
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            variants={fadeIn}
          >
            The new <span className="text-gray-500 italic">(oddly cute)</span> face of modern delivery
          </motion.h1>
          
          <motion.p 
            className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            variants={fadeIn}
          >
            Join the exclusive network where every introduction is warm, every connection is meaningful, 
            and every opportunity is within reach. This isn't LinkedIn—this is professional networking evolved.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            variants={staggerContainer}
          >
            {[
              { icon: Star, text: "Invite-only community", color: "text-amber-400" },
              { icon: Users, text: "10,000+ verified professionals", color: "text-blue-400" },
              { icon: TrendingUp, text: "500+ successful connections daily", color: "text-green-400" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="flex items-center space-x-2 text-slate-300"
                variants={slideUp}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <item.icon className={`h-5 w-5 ${item.color} ${item.icon === Star ? 'fill-current' : ''}`} />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
                    <Input
                      type="email"
                      placeholder="Enter your email for exclusive access"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={handleJoinWaitlist}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-semibold"
                    >
                      Request Invitation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                  <Check className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-white mb-2">Request Received!</h3>
                  <p className="text-slate-300">We'll review your application and get back to you within 48 hours.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <motion.div
          className="container mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={slideUp}>
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose WarmConnector?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Experience networking like never before with our exclusive features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                  <CardHeader className="text-center">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-300 text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-black/20">
        <motion.div
          className="container mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={slideUp}>
            <h2 className="text-4xl font-bold text-white mb-4">What Our Members Say</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Real stories from professionals who transformed their networking
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={slideUp}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{testimonial.author}</h4>
                        <p className="text-slate-400 text-sm">{testimonial.title}</p>
                      </div>
                    </div>
                    <p className="text-slate-300 italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Product Images with Hover Effects */}
      <section className="py-20 px-6">
        <motion.div
          className="container mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 className="text-4xl font-bold text-white mb-16" variants={slideUp}>
            Experience the Future
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2].map((item) => (
              <motion.div
                key={item}
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                className="relative overflow-hidden rounded-xl"
              >
                <motion.img
                  src={`/robots/robot${item}.png`}
                  alt={`Product ${item}`}
                  className="w-full h-64 object-cover bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Innovation {item}</h3>
                  <p className="text-slate-300">The future is here</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex items-center justify-center space-x-2 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Crown className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold text-white">WarmConnector</span>
          </motion.div>
          <p className="text-slate-400">© 2024 WarmConnector. All rights reserved.</p>
        </motion.div>
      </footer>
    </div>
  );
}