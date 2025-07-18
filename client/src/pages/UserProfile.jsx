import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProfileCard from '@/components/ProfileCard';

export default function UserProfile() {
  // Get user profile data
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    initialData: {
      name: 'John Smith',
      email: 'john.smith@company.com',
      company: 'TechCorp Inc.',
      title: 'Senior Product Manager',
      location: 'San Francisco, CA',
      joinDate: 'Joined 06/14/2023',
      initials: 'JS',
      profileCompletion: 85,
      connectionScore: 72,
      totalConnections: 247,
      introductions: 15,
      networkStrength: 82
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C17] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-96 h-96 bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return <ProfileCard user={userProfile} />;
}