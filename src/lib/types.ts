// Vehicle Health Evaluation System Types

export type VehicleCategory = 'car' | 'two-wheeler' | 'heavy';
export type VehicleType = 'truck' | 'car' | 'van' | 'bus' | 'motorcycle' | 'scooter' | 'sedan' | 'suv' | 'hatchback';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline';
export type DrivingContext = 'city' | 'highway';
export type UserRole = 'driver' | 'mechanic' | 'fleet_manager';

export interface VehicleMetrics {
  vehicleId: string;
  engineTemp: number;
  oilPressure: number;
  batteryVoltage: number;
  mileage: number;
  fuelLevel: number;
  tirePressure: number;
  engineRPM: number;
  lastServiceMileage: number;
  timestamp: Date;
  errorCodes: string[];
  chainTension?: number;
  brakeFluidLevel?: number;
}

export interface HealthHistoryEntry {
  timestamp: Date;
  healthScore: number;
  status: HealthStatus;
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  category: VehicleCategory;
  licensePlate: string;
  location: { lat: number; lng: number };
  metrics: VehicleMetrics;
  drivingContext: DrivingContext;
  healthStatus: HealthStatus;
  healthScore: number;
  healthHistory: HealthHistoryEntry[];
  riskTrend: 'improving' | 'stable' | 'declining';
  predictedFailureDays: number | null;
  assignedDriver?: string;
  priority: 'high' | 'medium' | 'low';
  serviceReportAnalyzed?: boolean;
  lastServiceReportDate?: Date;
  serviceReportInsights?: string[];
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceDate: Date;
  serviceType: string;
  mileage: number;
  cost: number;
  issuesAddressed: string[];
  nextServiceRecommendation: {
    type: string;
    dueDate: Date;
    dueMileage: number;
  };
}

export interface MechanicShop {
  id: string;
  name: string;
  type: 'general' | 'specialist' | 'authorized';
  specialization: VehicleCategory[];
  location: { lat: number; lng: number };
  address: string;
  rating: number;
  contact: string;
  services: string[];
  isOpen: boolean;
  lastUpdated: Date;
}

export interface DriverFeedback {
  id: string;
  vehicleId: string;
  driverName: string;
  timestamp: Date;
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'pending' | 'acknowledged' | 'resolved';
}

export interface EmergencyProtocol {
  issueType: string;
  title: string;
  steps: { stepNumber: number; instruction: string }[];
  safeModeRecommendation?: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EvaluationRule {
  id: string;
  name: string;
  metric: keyof VehicleMetrics;
  operator: '>' | '<';
  threshold: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
  learnedFromData: boolean;
  accuracy: number;
  applicableContext: DrivingContext[];
}

export interface LearningInsight {
  id: string;
  type: 'threshold_adjustment' | 'new_pattern' | 'accuracy_improvement';
  message: string;
  confidence: number;
  timestamp: Date;
}

export interface ComponentRUL {
  component: string;
  remainingUsefulLife: number; // in days
  confidence: number;
  lastUpdated: Date;
}

export interface SafeModeRecommendation {
  issueType: string;
  maxSpeed: number;
  duration: string;
  restrictions: string[];
  recommendedAction: string;
}

export interface PDFAnalysisResult {
  vehicleId: string;
  analyzedAt: Date;
  extractedData: {
    serviceDate?: string;
    mileage?: number;
    serviceType?: string;
    issuesFound?: string[];
    componentsReplaced?: string[];
    nextServiceDue?: string;
    recommendations?: string[];
  };
  healthImpact: {
    scoreAdjustment: number;
    affectedComponents: string[];
    predictedIssues: string[];
  };
  insights: string[];
  rlModelUpdate: {
    patternsLearned: string[];
    confidenceLevel: number;
  };
}

export interface NewVehicleInput {
  name: string;
  type: VehicleType;
  category: VehicleCategory;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  lastServiceDate?: Date;
}
