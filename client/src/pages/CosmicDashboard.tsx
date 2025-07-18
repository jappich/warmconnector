import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Network, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import AIChatbot from '@/components/AIChatbot';
import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";

// Animated starmap component with interactive cursor effects
const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Enhanced star properties with interaction support
    const stars: Array<{
      x: number;
      y: number;
      originalX: number;
      originalY: number;
      radius: number;
      opacity: number;
      speed: number;
      angle: number;
      swayX: number;
      swayY: number;
      interactionRadius: number;
      swayStrength: number;
    }> = [];

    // Create stars with interaction properties
    const createStars = () => {
      const numStars = 150;
      for (let i = 0; i < numStars; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({
          x,
          y,
          originalX: x,
          originalY: y,
          radius: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.5 + 0.1,
          angle: Math.random() * Math.PI * 2,
          swayX: 0,
          swayY: 0,
          interactionRadius: Math.random() * 100 + 80,
          swayStrength: Math.random() * 15 + 10
        });
      }
    };

    createStars();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines between nearby stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const star1 = stars[i];
          const star2 = stars[j];
          const distance = Math.sqrt(
            Math.pow(star1.x - star2.x, 2) + Math.pow(star1.y - star2.y, 2)
          );

          if (distance < 100) {
            const opacity = (100 - distance) / 100 * 0.3;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.stroke();
          }
        }
      }

      // Draw and animate stars with interactive effects
      stars.forEach((star) => {
        // Calculate distance to mouse
        const dx = mouseRef.current.x - star.originalX;
        const dy = mouseRef.current.y - star.originalY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply cursor interaction
        if (distance < star.interactionRadius) {
          const force = (star.interactionRadius - distance) / star.interactionRadius;
          const angle = Math.atan2(dy, dx);
          
          // Create smooth sway effect
          star.swayX += Math.cos(angle) * force * star.swayStrength * 0.1;
          star.swayY += Math.sin(angle) * force * star.swayStrength * 0.1;
          
          // Add gentle rotation around cursor
          const rotationAngle = Date.now() * 0.001 + distance * 0.01;
          star.swayX += Math.cos(rotationAngle) * force * 2;
          star.swayY += Math.sin(rotationAngle) * force * 2;
        }

        // Apply damping to return to original position
        star.swayX *= 0.92;
        star.swayY *= 0.92;

        // Update position with natural drift and interaction
        star.originalX += Math.cos(star.angle) * star.speed;
        star.originalY += Math.sin(star.angle) * star.speed;

        // Current position includes sway
        star.x = star.originalX + star.swayX;
        star.y = star.originalY + star.swayY;

        // Wrap around edges for original position
        if (star.originalX < 0) star.originalX = canvas.width;
        if (star.originalX > canvas.width) star.originalX = 0;
        if (star.originalY < 0) star.originalY = canvas.height;
        if (star.originalY > canvas.height) star.originalY = 0;

        // Enhanced opacity based on interaction
        const interactionBoost = distance < star.interactionRadius 
          ? (star.interactionRadius - distance) / star.interactionRadius * 0.3 
          : 0;
        const currentOpacity = Math.min(1, star.opacity + interactionBoost);

        // Draw star with interaction effects
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced glow effect for larger stars or when interacting
        if (star.radius > 1.5 || interactionBoost > 0) {
          const glowIntensity = star.radius > 1.5 ? 0.5 : interactionBoost;
          ctx.shadowColor = `rgba(59, 130, 246, ${glowIntensity})`;
          ctx.shadowBlur = 8 + interactionBoost * 15;
          ctx.fillStyle = `rgba(59, 130, 246, ${currentOpacity * glowIntensity})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * (1.5 + interactionBoost), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
    />
  );
};

export default function CosmicDashboard() {

  return (
    <div className="min-h-screen bg-cosmic-background text-white relative overflow-hidden">
      {/* Animated starfield background */}
      <StarField />
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-8 lg:ml-64 lg:pt-0 pt-16 relative z-10">
        {/* Professional welcome header */}
        <div className="text-center mb-16 max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={wcLogoPath}
                alt="WarmConnect" 
                className="h-24 w-24 object-contain"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white tracking-tight mb-4">
              Welcome to <span className="font-semibold text-cosmic-accent">WARMCONNECT</span>
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Professional networking platform for discovering warm introduction paths through your connections.
          </p>
          
          {/* Primary action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find-connection">
              <Button 
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg font-medium"
              >
                Find Connection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/find-intro">
              <Button 
                className="px-8 py-4 text-lg bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg font-medium"
              >
                Find Introduction
              </Button>
            </Link>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Network Stats */}
            <div className="glass-card shadow-lg">
              <h3 className="text-lg text-white mb-4 font-medium">Network Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Total Connections</span>
                  <span className="text-blue-400 font-medium">34+</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Industries Covered</span>
                  <span className="text-blue-400 font-medium">4</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Average Path Length</span>
                  <span className="text-blue-600 font-medium">3.2 hops</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg text-white mb-4 font-medium">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/find-connection">
                  <Button className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm py-2 font-medium">
                    Find Connection
                  </Button>
                </Link>
                <Link href="/find-intro">
                  <Button className="w-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm py-2 font-medium">
                    Find Introduction
                  </Button>
                </Link>
                <Link href="/network-map">
                  <Button className="w-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-sm py-2 font-medium">
                    View Network Map
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg text-gray-900 mb-4 font-medium">Recent Activity</h3>
              <div className="space-y-3 text-sm">
                <div className="text-gray-700">
                  <div className="text-green-600 font-medium">New connection found</div>
                  <div className="text-gray-500">Path to Satya Nadella (4 hops)</div>
                </div>
                <div className="text-gray-700">
                  <div className="text-blue-600 font-medium">Network expanded</div>
                  <div className="text-gray-500">Added 5 tech industry contacts</div>
                </div>
                <div className="text-gray-700">
                  <div className="text-purple-600 font-medium">AI strategy generated</div>
                  <div className="text-gray-500">Introduction to Marc Andreessen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl text-gray-900 mb-6 text-center font-light">
              Platform <span className="text-gray-500 font-normal">CAPABILITIES</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Smart connection discovery with minimal input</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>6+ hop pathfinding across industries</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>AI-powered networking strategies</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Industry peer clustering (Tech, VC, Finance)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Functional role matching across companies</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>Real-time introduction request workflow</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        
      </div>
      
      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}