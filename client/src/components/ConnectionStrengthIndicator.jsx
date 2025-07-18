import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  Star,
  Clock
} from 'lucide-react';

const ConnectionStrengthIndicator = ({ 
  fromPersonId, 
  toPersonId, 
  showDetails = false, 
  size = 'default',
  className = '' 
}) => {
  const [strengthData, setStrengthData] = useState(null);

  // Fetch connection strength data from your MongoDB
  const { data: connectionData, isLoading } = useQuery({
    queryKey: ['/api/connections/strength', fromPersonId, toPersonId],
    enabled: !!(fromPersonId && toPersonId)
  });

  useEffect(() => {
    if (connectionData) {
      setStrengthData(connectionData);
    }
  }, [connectionData]);

  const getStrengthLevel = (score) => {
    if (score >= 80) return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' };
    if (score >= 60) return { level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    if (score >= 40) return { level: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-400' };
    return { level: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-400' };
  };

  const getStrengthFactors = (data) => {
    const factors = [];
    
    if (data?.interactions?.count > 0) {
      factors.push({
        icon: MessageSquare,
        label: 'Recent Interactions',
        value: data.interactions.count,
        weight: data.interactions.weight || 0
      });
    }
    
    if (data?.mutualConnections > 0) {
      factors.push({
        icon: Users,
        label: 'Mutual Connections',
        value: data.mutualConnections,
        weight: data.mutualConnectionsWeight || 0
      });
    }
    
    if (data?.sharedCompanyHistory) {
      factors.push({
        icon: Building2,
        label: 'Shared Company History',
        value: 'Yes',
        weight: data.sharedCompanyWeight || 0
      });
    }
    
    if (data?.connectionAge) {
      factors.push({
        icon: Clock,
        label: 'Connection Duration',
        value: data.connectionAge,
        weight: data.connectionAgeWeight || 0
      });
    }
    
    if (data?.engagementScore > 0) {
      factors.push({
        icon: Star,
        label: 'Engagement Quality',
        value: `${data.engagementScore}%`,
        weight: data.engagementWeight || 0
      });
    }

    return factors.sort((a, b) => b.weight - a.weight);
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-16 h-2 bg-gray-700 rounded animate-pulse"></div>
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  if (!strengthData) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-16 h-2 bg-gray-700 rounded"></div>
        <span className="text-gray-500 text-sm">No data</span>
      </div>
    );
  }

  const strength = getStrengthLevel(strengthData.score || 0);
  const factors = getStrengthFactors(strengthData);
  const trend = strengthData.trend || 0;

  const IndicatorContent = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-sm">Connection Strength</span>
        <div className="flex items-center space-x-1">
          {getTrendIcon(trend)}
          <span className={`text-xs ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Progress 
          value={strengthData.score || 0} 
          className={`flex-1 h-2 ${size === 'small' ? 'h-1' : ''}`}
        />
        <Badge variant="outline" className={`${strength.textColor} text-xs`}>
          {strengthData.score || 0}%
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className={strength.textColor}>{strength.level}</span>
        <span className="text-gray-500">
          Updated {strengthData.lastCalculated ? 
            new Date(strengthData.lastCalculated).toLocaleDateString() : 
            'recently'
          }
        </span>
      </div>
    </div>
  );

  const DetailedView = () => (
    <div className="space-y-4">
      <IndicatorContent />
      
      {factors.length > 0 && (
        <div className="border-t border-gray-600 pt-3">
          <h4 className="text-white text-sm font-medium mb-2">Strength Factors</h4>
          <div className="space-y-2">
            {factors.map((factor, index) => {
              const Icon = factor.icon;
              return (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300">{factor.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white">{factor.value}</span>
                    <div className="w-8 h-1 bg-gray-700 rounded">
                      <div 
                        className={`h-1 rounded ${strength.color}`}
                        style={{ width: `${(factor.weight / 100) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {strengthData.recommendations && strengthData.recommendations.length > 0 && (
        <div className="border-t border-gray-600 pt-3">
          <h4 className="text-white text-sm font-medium mb-2">Recommendations</h4>
          <div className="space-y-1">
            {strengthData.recommendations.map((rec, index) => (
              <div key={index} className="text-xs text-gray-400">
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (showDetails) {
    return (
      <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
        <DetailedView />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`cursor-help ${className}`}>
            <IndicatorContent />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <DetailedView />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStrengthIndicator;