'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  off, 
  set, 
  push, 
  update,
  Database,
  serverTimestamp,
  onDisconnect
} from 'firebase/database';
import { firebaseConfig, FIREBASE_PATHS, STM32SensorData, ConnectionStatus } from './firebase-config';
import type { Vehicle, VehicleMetrics, HealthHistoryEntry } from './types';

// Initialize Firebase (singleton)
let app: FirebaseApp;
let database: Database;

function getFirebaseApp() {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    database = getDatabase(app);
  }
  return { app, database };
}

// Hook for real-time vehicle metrics
export function useVehicleMetricsRealtime(vehicleId: string | null) {
  const [metrics, setMetrics] = useState<VehicleMetrics | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(() => 
    vehicleId ? 'connecting' : 'disconnected'
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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

    const { database } = getFirebaseApp();
    const metricsRef = ref(database, `${FIREBASE_PATHS.VEHICLE_METRICS}/${vehicleId}`);

    const unsubscribe = onValue(
      metricsRef,
      (snapshot) => {
        if (!mountedRef.current) return;
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setMetrics({
            vehicleId,
            engineTemp: data.engineTemp ?? 85,
            oilPressure: data.oilPressure ?? 40,
            batteryVoltage: data.batteryVoltage ?? 13.5,
            mileage: data.mileage ?? 50000,
            fuelLevel: data.fuelLevel ?? 75,
            tirePressure: data.tirePressure ?? 32,
            engineRPM: data.engineRPM ?? 800,
            lastServiceMileage: data.lastServiceMileage ?? 45000,
            timestamp: new Date(data.timestamp || Date.now()),
            errorCodes: data.errorCodes || [],
            brakeFluidLevel: data.brakeFluidLevel,
            chainTension: data.chainTension
          });
          setLastUpdated(new Date());
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      },
      (error) => {
        console.error('Firebase metrics error:', error);
        if (mountedRef.current) {
          setStatus('error');
        }
      }
    );

    return () => {
      mountedRef.current = false;
      off(metricsRef);
      unsubscribe();
    };
  }, [vehicleId]);

  return { metrics, status, lastUpdated };
}

// Hook for all vehicles real-time updates
export function useAllVehiclesRealtime() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    const { database } = getFirebaseApp();
    const vehiclesRef = ref(database, FIREBASE_PATHS.VEHICLES);

    const unsubscribe = onValue(
      vehiclesRef,
      (snapshot) => {
        if (!mountedRef.current) return;
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const vehiclesList: Vehicle[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            metrics: {
              ...data[key].metrics,
              timestamp: new Date(data[key].metrics?.timestamp || Date.now())
            },
            healthHistory: data[key].healthHistory?.map((h: { timestamp: number | string; healthScore: number; status: string }) => ({
              timestamp: new Date(h.timestamp),
              healthScore: h.healthScore,
              status: h.status
            })) || []
          }));
          setVehicles(vehiclesList);
          setLastUpdated(new Date());
          setStatus('connected');
        } else {
          setVehicles([]);
          setStatus('disconnected');
        }
      },
      (error) => {
        console.error('Firebase vehicles error:', error);
        if (mountedRef.current) {
          setStatus('error');
        }
      }
    );

    return () => {
      mountedRef.current = false;
      off(vehiclesRef);
      unsubscribe();
    };
  }, []);

  return { vehicles, status, lastUpdated };
}

// Hook for connection status
export function useFirebaseConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const { database } = getFirebaseApp();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const connectedRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (!mountedRef.current) return;
      
      if (snap.val() === true) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    });

    return () => {
      mountedRef.current = false;
      off(connectedRef);
      unsubscribe();
    };
  }, [database]);

  return status;
}

// Update vehicle metrics in Firebase
export async function updateVehicleMetricsInFirebase(vehicleId: string, metrics: Partial<VehicleMetrics>) {
  const { database } = getFirebaseApp();
  const metricsRef = ref(database, `${FIREBASE_PATHS.VEHICLE_METRICS}/${vehicleId}`);
  
  await update(metricsRef, {
    ...metrics,
    timestamp: serverTimestamp()
  });
}

// Update health predictions in Firebase
export async function updateHealthPredictionsInFirebase(
  vehicleId: string, 
  predictions: {
    healthScore: number;
    healthStatus: string;
    predictedFailureDays: number | null;
    riskTrend: string;
  }
) {
  const { database } = getFirebaseApp();
  const predictionsRef = ref(database, `${FIREBASE_PATHS.HEALTH_PREDICTIONS}/${vehicleId}`);
  
  await update(predictionsRef, {
    ...predictions,
    lastUpdated: serverTimestamp()
  });
}

// Push new health history entry
export async function pushHealthHistoryEntry(
  vehicleId: string,
  entry: {
    healthScore: number;
    status: string;
  }
) {
  const { database } = getFirebaseApp();
  const historyRef = ref(database, `${FIREBASE_PATHS.VEHICLES}/${vehicleId}/healthHistory`);
  const newEntryRef = push(historyRef);
  
  await set(newEntryRef, {
    ...entry,
    timestamp: serverTimestamp()
  });
}

// Push RL learning result
export async function pushRLLearningResult(
  result: {
    type: string;
    message: string;
    confidence: number;
    patternsLearned: string[];
  }
) {
  const { database } = getFirebaseApp();
  const rlRef = ref(database, `${FIREBASE_PATHS.RL_MODEL}/learningHistory`);
  const newResultRef = push(rlRef);
  
  await set(newResultRef, {
    ...result,
    timestamp: serverTimestamp()
  });
}

// Simulate STM32 data upload (for testing)
export async function simulateSTM32DataUpload(vehicleId: string, data: Partial<STM32SensorData>) {
  const { database } = getFirebaseApp();
  const metricsRef = ref(database, `${FIREBASE_PATHS.VEHICLE_METRICS}/${vehicleId}`);
  
  await set(metricsRef, {
    ...data,
    vehicleId,
    timestamp: Date.now()
  });
}

// Export database instance for advanced use
export function getDatabaseInstance() {
  const { database } = getFirebaseApp();
  return database;
}
