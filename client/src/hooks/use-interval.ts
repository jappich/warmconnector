import { useEffect, useRef } from 'react';

/**
 * Custom hook for setting up an interval that can be paused
 * @param callback Function to call on each interval
 * @param delay Interval delay in ms, or null to pause
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();
  
  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}