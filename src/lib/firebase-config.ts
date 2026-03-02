// Firebase Configuration
// Replace these values with your actual Firebase project credentials
export const firebaseConfig = {
  apiKey: "shlinux001ASDFGHJKL",
  authDomain: "shlinux001ASDFGHJKL.firebaseapp.com",
  databaseURL: "https://shlinux001ASDFGHJKL-default-rtdb.firebaseio.com",
  projectId: "shlinux001ASDFGHJKL",
  storageBucket: "shlinux001ASDFGHJKL.appspot.com",
  messagingSenderId: "shlinux001ASDFGHJKL",
  appId: "shlinux001ASDFGHJKL"
};

// Firebase Realtime Database paths
export const FIREBASE_PATHS = {
  VEHICLES: 'vehicles',
  VEHICLE_METRICS: 'vehicleMetrics',
  HEALTH_PREDICTIONS: 'healthPredictions',
  RL_MODEL: 'rlModel',
  ALERTS: 'alerts',
  SERVICE_RECORDS: 'serviceRecords'
};

// Sensor data structure from STM32
export interface STM32SensorData {
  vehicleId: string;
  timestamp: number;
  engineTemp: number;
  oilPressure: number;
  batteryVoltage: number;
  mileage: number;
  fuelLevel: number;
  tirePressure: number;
  engineRPM: number;
  errorCodes: string[];
  brakeFluidLevel?: number;
  chainTension?: number;
}

// Real-time connection status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
