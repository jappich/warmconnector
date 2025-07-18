import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Zap, Star, Globe, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  type: 'connections' | 'opportunities' | 'introductions' | 'network';
  onAction?: () => void;
}

export default function EmptyStates({ type, onAction }: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'connections':
        return {
          icon: <Users className="h-16 w-16 text-amber-400" />,
          title: "Your Elite Network Awaits",
          description: "Connect with decision-makers who shape industries. Every introduction is warm, every connection is meaningful.",
          actionText: "Find Your First Elite Connection",
          microcopy: "Join 10,000+ executives who never network cold again",
          benefits: [
            "Access verified C-suite professionals",
            "87% response rate vs 2% on LinkedIn", 
            "Warm introductions through mutual connections"
          ]
        };
      
      case 'opportunities':
        return {
          icon: <Sparkles className="h-16 w-16 text-amber-400" />,
          title: "Hidden Opportunities Are Waiting",
          description: "Our AI discovers partnership potential, collaboration opportunities, and strategic connections you never knew existed.",
          actionText: "Unlock Hidden Opportunities",
          microcopy: "Members discover $2.4M in opportunities on average",
          benefits: [
            "AI-powered opportunity detection",
            "Strategic partnership identification",
            "Real-time market insights"
          ]
        };
      
      case 'introductions':
        return {
          icon: <MessageCircle className="h-16 w-16 text-amber-400" />,
          title: "Your Next Game-Changing Introduction",
          description: "The right introduction at the right moment can transform your business. Let us help you make that connection.",
          actionText: "Request Strategic Introduction",
          microcopy: "Average deal size from our introductions: $850K",
          benefits: [
            "Curated high-value introductions",
            "Double-warm introduction paths",
            "Strategic timing optimization"
          ]
        };
      
      case 'network':
        return {
          icon: <Globe className="h-16 w-16 text-amber-400" />,
          title: "Map Your Network Empire",
          description: "Visualize the hidden connections between your contacts. Discover the shortest path to anyone in your extended network.",
          actionText: "Explore Network Map",
          microcopy: "See why Forbes calls us 'LinkedIn for the 1%'",
          benefits: [
            "Interactive network visualization",
            "Shortest path algorithms",
            "Connection strength analytics"
          ]
        };
      
      default:
        return {
          icon: <Crown className="h-16 w-16 text-amber-400" />,
          title: "Welcome to Excellence",
          description: "Your exclusive networking experience begins here.",
          actionText: "Get Started",
          microcopy: "Elite members only",
          benefits: []
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <Card className="max-w-2xl w-full bg-gradient-to-br from-white/5 to-white/10 border-amber-400/20 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            {content.icon}
          </div>
          
          <div className="space-y-3">
            <CardTitle className="text-3xl font-bold text-white">
              {content.title}
            </CardTitle>
            <CardDescription className="text-lg text-slate-300 leading-relaxed">
              {content.description}
            </CardDescription>
          </div>
          
          <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 px-4 py-2 text-sm">
            {content.microcopy}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {content.benefits.length > 0 && (
            <div className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 text-slate-300"
                >
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={onAction}
              className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold px-8 py-3 text-lg"
            >
              {content.actionText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-slate-400 italic">
              "The most exclusive professional network. Period."
            </p>
            <div className="flex items-center justify-center mt-2 space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
              ))}
              <span className="text-xs text-slate-400 ml-2">Trusted by industry leaders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}