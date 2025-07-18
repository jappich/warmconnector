import React from 'react';

interface CosmicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const CosmicLayout: React.FC<CosmicLayoutProps> = ({ children, className = '' }) => {
  return (
    <main className={`min-h-screen bg-cosmic-background text-white relative ${className}`}>
      {/* Cosmic background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-cosmic-background via-cosmic-secondary to-cosmic-background opacity-90 pointer-events-none" />
      
      {/* Content wrapper */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
};

export default CosmicLayout;