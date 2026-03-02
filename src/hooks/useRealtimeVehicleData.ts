'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vehicle, VehicleMetrics } from '@/lib/types';
import type { ConnectionStatus } from '@/lib/firebase-config';

// Simulate real-time updates (for demo without actual Firebase connection)
export function useRealtimeVehicleData(vehicleId: string | null) {
  const [metrics, setMetrics] = useState<VehicleMetrics | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(() => 
    vehicleId ? 'connecting' : 'disconnected'
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!vehicleId) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setStatus('disconnected');
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    // Simulate real-time connection with periodic updates
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/vehicles`);
        const vehicles = await res.json();
        const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
        
        if (vehicle && mountedRef.current) {
          setMetrics(vehicle.metrics);
          setLastUpdated(new Date());
          setStatus('connected');
        }
      } catch (error) {
        console.error('Real-time fetch error:', error);
        if (mountedRef.current) {
          setStatus('error');
        }
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling interval (simulating real-time)
    intervalRef.current = setInterval(fetchMetrics, 2000);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [vehicleId]);

  return { metrics, status, lastUpdated };
}

// Hook for all vehicles real-time updates
export function useRealtimeAllVehicles(pollInterval: number = 3000) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      if (mountedRef.current) {
        setVehicles(data);
        setLastUpdated(new Date());
        setStatus('connected');
      }
    } catch (error) {
      console.error('Real-time fetch error:', error);
      if (mountedRef.current) {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchVehicles();

    // Set up polling interval (simulating real-time)
    intervalRef.current = setInterval(fetchVehicles, pollInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchVehicles, pollInterval]);

  // Force refresh function
  const refresh = useCallback(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return { vehicles, status, lastUpdated, refresh };
}

// Hook for Firebase connection status
export function useFirebaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    // Simulate connection check
    const checkConnection = async () => {
      try {
        // In real implementation, this would check Firebase connection
        // For demo, we'll simulate as connected
        if (mountedRef.current) {
          setStatus('connected');
        }
      } catch {
        if (mountedRef.current) {
          setStatus('disconnected');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}

// Hook for real-time health predictions
export function useRealtimeHealthPredictions(vehicleId: string | null) {
  const [prediction, setPrediction] = useState<{
    healthScore: number;
    healthStatus: string;
    predictedFailureDays: number | null;
    riskTrend: string;
    rlAccuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!vehicleId) return;

    const fetchPrediction = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/firebase/sync?vehicleId=${vehicleId}`);
        const data = await res.json();
        
        if (data.vehicle && mountedRef.current) {
          setPrediction({
            healthScore: data.vehicle.healthScore,
            healthStatus: data.vehicle.healthStatus,
            predictedFailureDays: data.vehicle.predictedFailureDays,
            riskTrend: data.vehicle.riskTrend,
            rlAccuracy: 0.89 // Simulated RL accuracy
          });
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchPrediction();
    
    return () => {
      mountedRef.current = false;
    };
  }, [vehicleId]);

  return { prediction, isLoading };
}

// Hook for RL notifications
export function useRLNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);

  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, addNotification, markAsRead, clearAll };
}
