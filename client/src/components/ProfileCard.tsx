import React from 'react';
import { Building2, MapPin, Mail, Calendar, Users, TrendingUp, Network } from 'lucide-react';

interface ProfileCardProps {
  user?: {
    name: string;
    title: string;
    company: string;
    location: string;
    email: string;
    joinDate: string;
    avatar?: string;
    initials: string;
    profileCompletion: number;
    connectionScore: number;
    totalConnections: number;
    introductions: number;
    networkStrength: number;
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  user = {
    name: "John Smith",
    title: "Senior Product Manager",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    email: "john.smith@company.com",
    joinDate: "Joined 06/14/2023",
    initials: "JS",
    profileCompletion: 85,
    connectionScore: 72,
    totalConnections: 247,
    introductions: 15,
    networkStrength: 82
  }
}) => {
  // Circle progress component for rings
  const CircularProgress = ({ 
    percentage, 
    size = 120, 
    strokeWidth = 8, 
    color = "from-blue-400 to-cyan-400",
    children 
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    children?: React.ReactNode;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {color === "from-blue-400 to-cyan-400" ? (
                <>
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0C17] flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Profile Card */}
      <div className="relative group">
        <div 
          className="
            bg-white/5 backdrop-blur-2xl border border-white/10 
            rounded-3xl p-8 w-full max-w-md mx-auto
            shadow-2xl shadow-blue-500/10
            transition-all duration-300 ease-out
            hover:scale-[1.02] hover:shadow-blue-500/20
            hover:bg-white/[0.07]
          "
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
          }}
        >
          {/* Avatar and Connection Score */}
          <div className="flex items-center justify-between mb-8">
            {/* Profile Completion Ring with Avatar */}
            <div className="relative">
              <CircularProgress 
                percentage={user.profileCompletion} 
                size={120}
                strokeWidth={6}
                color="from-blue-400 to-cyan-400"
              >
                <div className="
                  w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 
                  rounded-full flex items-center justify-center
                  text-2xl font-bold text-white border-2 border-white/20
                ">
                  {user.initials}
                </div>
              </CircularProgress>
            </div>

            {/* Connection Score Ring */}
            <div className="relative">
              <CircularProgress 
                percentage={user.connectionScore} 
                size={100}
                strokeWidth={6}
                color="from-purple-500 to-pink-500"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{user.connectionScore}%</div>
                  <div className="text-xs text-gray-400 mt-1">Connection score</div>
                </div>
              </CircularProgress>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
            <p className="text-gray-400 text-lg mb-6">{user.title}</p>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Building2 className="w-5 h-5 mr-3 text-blue-400" />
                <span>{user.company}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="w-5 h-5 mr-3 text-blue-400" />
                <span>{user.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Profile Completion</span>
              <span className="text-blue-400 text-sm">{user.profileCompletion}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${user.profileCompletion}%` }}
              />
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{user.totalConnections}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center">
                <Users className="w-3 h-3 mr-1" />
                Total Connections
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{user.introductions}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Introductions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{user.networkStrength}%</div>
              <div className="text-xs text-gray-400 flex items-center justify-center">
                <Network className="w-3 h-3 mr-1" />
                Network Strength
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;