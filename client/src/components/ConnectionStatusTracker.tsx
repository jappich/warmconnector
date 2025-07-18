import React, { useEffect, useState, useRef } from 'react';
import { useInterval } from '@/hooks/use-interval';

// Status types
export interface ConnectionStatus {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  step: string;
  message: string;
  query?: string;
  runId: string;
  resultCount?: number;
  error?: string;
}

interface ConnectionStatusTrackerProps {
  runId: string | null;
  onStatusUpdate?: (status: ConnectionStatus) => void;
  onComplete?: (resultCount: number) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // in milliseconds
}

/**
 * Component that polls for connection search status and provides updates
 */
export default function ConnectionStatusTracker({
  runId,
  onStatusUpdate,
  onComplete,
  onError,
  pollInterval = 2000 // Default poll every 2 seconds
}: ConnectionStatusTrackerProps) {
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastStatus, setLastStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Setup polling
  useEffect(() => {
    if (runId) {
      setIsPolling(true);
      setError(null);
    } else {
      setIsPolling(false);
    }
  }, [runId]);
  
  // Stop polling when complete or error
  useEffect(() => {
    if (lastStatus?.status === 'complete' || lastStatus?.status === 'error') {
      setIsPolling(false);
    }
  }, [lastStatus]);
  
  // Poll for status updates
  useInterval(
    async () => {
      if (!runId) return;
      
      try {
        const response = await fetch(`/api/connection-status/${runId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch status');
          setIsPolling(false);
          if (onError) onError(errorData.message || 'Failed to fetch status');
          return;
        }
        
        const statusData: ConnectionStatus = await response.json();
        setLastStatus(statusData);
        
        // Call the status update callback
        if (onStatusUpdate) onStatusUpdate(statusData);
        
        // Handle completion
        if (statusData.status === 'complete' && onComplete) {
          onComplete(statusData.resultCount || 0);
        }
        
        // Handle error
        if (statusData.status === 'error') {
          setError(statusData.error || 'An error occurred');
          if (onError) onError(statusData.error || 'An error occurred');
        }
        
      } catch (err) {
        console.error('Error polling for status:', err);
        setError('Failed to connect to status service');
        setIsPolling(false);
        if (onError) onError('Failed to connect to status service');
      }
    },
    isPolling ? pollInterval : null // Only poll when active
  );
  
  return null; // This is a non-visual component
}