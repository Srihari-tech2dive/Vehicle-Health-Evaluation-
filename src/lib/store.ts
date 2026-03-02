import {
  Vehicle,
  MechanicShop,
  ServiceRecord,
  DriverFeedback,
  Alert,
  EvaluationRule,
  LearningInsight,
  EmergencyProtocol,
  HealthHistoryEntry,
  VehicleCategory,
  VehicleType,
  SafeModeRecommendation,
  ComponentRUL,
  PDFAnalysisResult,
  NewVehicleInput
} from './types';

// Helper to generate random data
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate health history
const generateHealthHistory = (baseScore: number): HealthHistoryEntry[] => {
  const history: HealthHistoryEntry[] = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variation = randomBetween(-5, 5);
    const score = Math.max(0, Math.min(100, baseScore + variation));
    let status: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy';
    if (score < 50) status = 'critical';
    else if (score < 75) status = 'warning';
    history.push({ timestamp: date, healthScore: score, status });
  }
  return history;
};

// Vehicle names by category
const vehicleNames: Record<VehicleCategory, { names: string[]; types: VehicleType[] }> = {
  car: {
    names: ['City Cruiser', 'Highway Star', 'Urban Runner', 'Family Ride', 'Daily Driver', 'Weekend Warrior'],
    types: ['sedan', 'suv', 'hatchback']
  },
  'two-wheeler': {
    names: ['Street Blazer', 'Commuter Pro', 'City Hopper'],
    types: ['motorcycle', 'scooter']
  },
  heavy: {
    names: ['Cargo King', 'Transport Giant', 'Heavy Hauler'],
    types: ['truck', 'bus', 'van']
  }
};

// License plate generator
const generateLicensePlate = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const plate = Array.from({ length: 2 }, () => letters[randomBetween(0, 25)]).join('');
  const numbers = randomBetween(1000, 9999);
  return `${plate}-${numbers}`;
};

// Generate vehicles
const generateVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  const categories: VehicleCategory[] = ['car', 'car', 'car', 'two-wheeler', 'two-wheeler', 'heavy', 'heavy', 'heavy'];
  
  // Default location (New York area)
  const baseLocation = { lat: 40.7128, lng: -74.0060 };
  
  let carCount = 0;
  let twoWheelerCount = 0;
  let heavyCount = 0;
  
  for (let i = 0; i < 8; i++) {
    const category = categories[i];
    const { names, types } = vehicleNames[category];
    const type = types[randomBetween(0, types.length - 1)];
    
    let name: string;
    if (category === 'car') {
      name = vehicleNames.car.names[carCount % vehicleNames.car.names.length];
      carCount++;
    } else if (category === 'two-wheeler') {
      name = vehicleNames['two-wheeler'].names[twoWheelerCount % vehicleNames['two-wheeler'].names.length];
      twoWheelerCount++;
    } else {
      name = vehicleNames.heavy.names[heavyCount % vehicleNames.heavy.names.length];
      heavyCount++;
    }
    
    const healthScore = randomBetween(45, 98);
    const healthStatus = healthScore < 50 ? 'critical' : healthScore < 75 ? 'warning' : 'healthy';
    
    vehicles.push({
      id: `vehicle-${i + 1}`,
      name,
      type,
      category,
      licensePlate: generateLicensePlate(),
      location: {
        lat: baseLocation.lat + randomFloat(-0.05, 0.05),
        lng: baseLocation.lng + randomFloat(-0.05, 0.05)
      },
      metrics: {
        vehicleId: `vehicle-${i + 1}`,
        engineTemp: randomBetween(75, 115),
        oilPressure: randomBetween(20, 60),
        batteryVoltage: randomFloat(11.5, 14.5),
        mileage: randomBetween(10000, 150000),
        fuelLevel: randomBetween(15, 95),
        tirePressure: randomBetween(28, 36),
        engineRPM: randomBetween(600, 3000),
        lastServiceMileage: randomBetween(5000, 100000),
        timestamp: new Date(),
        errorCodes: healthStatus === 'critical' 
          ? ['P0300', 'P0171'] 
          : healthStatus === 'warning' 
            ? ['P0420'] 
            : [],
        chainTension: category === 'two-wheeler' ? randomFloat(20, 30) : undefined,
        brakeFluidLevel: randomBetween(60, 100)
      },
      drivingContext: Math.random() > 0.5 ? 'city' : 'highway',
      healthStatus,
      healthScore,
      healthHistory: generateHealthHistory(healthScore),
      riskTrend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
      predictedFailureDays: healthStatus === 'critical' ? randomBetween(1, 14) : healthStatus === 'warning' ? randomBetween(15, 45) : null,
      assignedDriver: `Driver ${i + 1}`,
      priority: 'medium',
      serviceReportAnalyzed: false
    });
  }
  
  return vehicles;
};

// Generate mechanic shops
const generateMechanicShops = (): MechanicShop[] => {
  const baseLocation = { lat: 40.7128, lng: -74.0060 };
  
  return [
    {
      id: 'shop-1',
      name: 'AutoCare Pro',
      type: 'general',
      specialization: ['car', 'two-wheeler'],
      location: { lat: baseLocation.lat + 0.02, lng: baseLocation.lng - 0.01 },
      address: '123 Main St, New York, NY 10001',
      rating: 4.8,
      contact: '+1 (212) 555-0101',
      services: ['Oil Change', 'Brake Service', 'Engine Repair', 'Tire Service'],
      isOpen: true,
      lastUpdated: new Date()
    },
    {
      id: 'shop-2',
      name: 'Heavy Duty Specialists',
      type: 'specialist',
      specialization: ['heavy'],
      location: { lat: baseLocation.lat - 0.03, lng: baseLocation.lng + 0.02 },
      address: '456 Industrial Ave, New York, NY 10002',
      rating: 4.6,
      contact: '+1 (212) 555-0102',
      services: ['Diesel Engine Repair', 'Hydraulic Systems', 'Fleet Maintenance'],
      isOpen: true,
      lastUpdated: new Date()
    },
    {
      id: 'shop-3',
      name: 'Quick Lube Express',
      type: 'general',
      specialization: ['car'],
      location: { lat: baseLocation.lat + 0.01, lng: baseLocation.lng + 0.03 },
      address: '789 Speed Way, New York, NY 10003',
      rating: 4.3,
      contact: '+1 (212) 555-0103',
      services: ['Quick Oil Change', 'Filter Replacement', 'Fluid Check'],
      isOpen: true,
      lastUpdated: new Date()
    },
    {
      id: 'shop-4',
      name: 'Bike Masters',
      type: 'specialist',
      specialization: ['two-wheeler'],
      location: { lat: baseLocation.lat - 0.02, lng: baseLocation.lng - 0.02 },
      address: '321 Rider Lane, New York, NY 10004',
      rating: 4.9,
      contact: '+1 (212) 555-0104',
      services: ['Motorcycle Service', 'Chain Adjustment', 'Tire Replacement'],
      isOpen: false,
      lastUpdated: new Date()
    },
    {
      id: 'shop-5',
      name: 'Authorized Service Center',
      type: 'authorized',
      specialization: ['car', 'two-wheeler', 'heavy'],
      location: { lat: baseLocation.lat + 0.04, lng: baseLocation.lng - 0.03 },
      address: '555 Dealer Blvd, New York, NY 10005',
      rating: 4.7,
      contact: '+1 (212) 555-0105',
      services: ['Warranty Service', 'Genuine Parts', 'Diagnostics', 'ECU Tuning'],
      isOpen: true,
      lastUpdated: new Date()
    },
    {
      id: 'shop-6',
      name: 'Fleet Services Inc.',
      type: 'specialist',
      specialization: ['heavy', 'car'],
      location: { lat: baseLocation.lat - 0.04, lng: baseLocation.lng + 0.01 },
      address: '888 Fleet Road, New York, NY 10006',
      rating: 4.5,
      contact: '+1 (212) 555-0106',
      services: ['Fleet Maintenance', 'Preventive Care', '24/7 Roadside'],
      isOpen: true,
      lastUpdated: new Date()
    }
  ];
};

// Generate service records
const generateServiceRecords = (): ServiceRecord[] => {
  const records: ServiceRecord[] = [];
  const serviceTypes = ['Oil Change', 'Brake Service', 'Tire Rotation', 'Engine Tune-up', 'Full Service', 'Air Filter Replacement'];
  
  for (let v = 1; v <= 8; v++) {
    const numRecords = randomBetween(2, 5);
    for (let r = 0; r < numRecords; r++) {
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() - randomBetween(30, 365));
      
      const serviceType = serviceTypes[randomBetween(0, serviceTypes.length - 1)];
      const mileage = randomBetween(10000, 120000);
      
      const nextServiceDate = new Date();
      nextServiceDate.setDate(nextServiceDate.getDate() + randomBetween(30, 180));
      
      records.push({
        id: `service-${v}-${r}`,
        vehicleId: `vehicle-${v}`,
        serviceDate,
        serviceType,
        mileage,
        cost: randomBetween(50, 500),
        issuesAddressed: serviceType === 'Full Service' 
          ? ['Oil changed', 'Filters replaced', 'Brakes inspected']
          : [serviceType.toLowerCase() + ' completed'],
        nextServiceRecommendation: {
          type: serviceType === 'Oil Change' ? 'Oil Change' : 'Full Service',
          dueDate: nextServiceDate,
          dueMileage: mileage + 5000
        }
      });
    }
  }
  
  return records.sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime());
};

// Generate alerts
const generateAlerts = (vehicles: Vehicle[]): Alert[] => {
  const alerts: Alert[] = [];
  const alertMessages: Record<string, { message: string; threshold: number }> = {
    engineTemp: { message: 'Engine temperature above normal', threshold: 100 },
    oilPressure: { message: 'Oil pressure below normal', threshold: 25 },
    batteryVoltage: { message: 'Battery voltage critical', threshold: 12 },
    fuelLevel: { message: 'Fuel level low', threshold: 20 },
    tirePressure: { message: 'Tire pressure abnormal', threshold: 30 }
  };
  
  vehicles.forEach(vehicle => {
    if (vehicle.healthStatus === 'critical' || vehicle.healthStatus === 'warning') {
      const metrics = ['engineTemp', 'oilPressure', 'batteryVoltage', 'fuelLevel', 'tirePressure'];
      const alertMetric = metrics[randomBetween(0, metrics.length - 1)];
      const alertInfo = alertMessages[alertMetric];
      
      alerts.push({
        id: `alert-${vehicle.id}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        type: vehicle.healthStatus === 'critical' ? 'critical' : 'warning',
        message: alertInfo.message,
        metric: alertMetric,
        value: vehicle.metrics[alertMetric as keyof typeof vehicle.metrics] as number,
        threshold: alertInfo.threshold,
        timestamp: new Date(Date.now() - randomBetween(0, 3600000)),
        acknowledged: false
      });
    }
  });
  
  return alerts;
};

// Default evaluation rules
const defaultRules: EvaluationRule[] = [
  {
    id: 'rule-1',
    name: 'Engine Temperature (City)',
    metric: 'engineTemp',
    operator: '>',
    threshold: 100,
    severity: 'warning',
    enabled: true,
    learnedFromData: false,
    accuracy: 92,
    applicableContext: ['city']
  },
  {
    id: 'rule-2',
    name: 'Engine Temperature (Highway)',
    metric: 'engineTemp',
    operator: '>',
    threshold: 105,
    severity: 'warning',
    enabled: true,
    learnedFromData: false,
    accuracy: 89,
    applicableContext: ['highway']
  },
  {
    id: 'rule-3',
    name: 'Oil Pressure Critical',
    metric: 'oilPressure',
    operator: '<',
    threshold: 20,
    severity: 'critical',
    enabled: true,
    learnedFromData: false,
    accuracy: 95,
    applicableContext: ['city', 'highway']
  },
  {
    id: 'rule-4',
    name: 'Battery Voltage Low',
    metric: 'batteryVoltage',
    operator: '<',
    threshold: 12,
    severity: 'warning',
    enabled: true,
    learnedFromData: true,
    accuracy: 88,
    applicableContext: ['city', 'highway']
  },
  {
    id: 'rule-5',
    name: 'Fuel Level Critical',
    metric: 'fuelLevel',
    operator: '<',
    threshold: 15,
    severity: 'critical',
    enabled: true,
    learnedFromData: false,
    accuracy: 99,
    applicableContext: ['city', 'highway']
  }
];

// Emergency protocols
const emergencyProtocols: Record<string, EmergencyProtocol> = {
  'engineTemp': {
    issueType: 'engineTemp',
    title: 'Engine Overheating Emergency',
    steps: [
      { stepNumber: 1, instruction: 'Turn off the air conditioning immediately' },
      { stepNumber: 2, instruction: 'Turn on the heater to draw heat away from the engine' },
      { stepNumber: 3, instruction: 'Pull over to a safe location as soon as possible' },
      { stepNumber: 4, instruction: 'Turn off the engine and wait at least 15 minutes' },
      { stepNumber: 5, instruction: 'Check coolant level only after engine has cooled' }
    ],
    safeModeRecommendation: 'Drive at reduced speed (max 40 km/h) to the nearest mechanic. Monitor temperature gauge continuously.'
  },
  'oilPressure': {
    issueType: 'oilPressure',
    title: 'Low Oil Pressure Emergency',
    steps: [
      { stepNumber: 1, instruction: 'Stop the vehicle immediately in a safe location' },
      { stepNumber: 2, instruction: 'Turn off the engine to prevent damage' },
      { stepNumber: 3, instruction: 'Check oil level using the dipstick' },
      { stepNumber: 4, instruction: 'If oil is low, add oil if available' },
      { stepNumber: 5, instruction: 'Do not restart if pressure warning persists' }
    ],
    safeModeRecommendation: 'Do not drive. Contact roadside assistance or tow to nearest mechanic.'
  },
  'batteryVoltage': {
    issueType: 'batteryVoltage',
    title: 'Battery Voltage Critical',
    steps: [
      { stepNumber: 1, instruction: 'Turn off all non-essential electrical systems' },
      { stepNumber: 2, instruction: 'Avoid using AC, radio, and other accessories' },
      { stepNumber: 3, instruction: 'Drive to a safe location or mechanic if possible' },
      { stepNumber: 4, instruction: 'Do not turn off engine as it may not restart' }
    ],
    safeModeRecommendation: 'Drive directly to nearest mechanic. Avoid stopping the engine until you reach your destination.'
  },
  'tirePressure': {
    issueType: 'tirePressure',
    title: 'Tire Pressure Warning',
    steps: [
      { stepNumber: 1, instruction: 'Reduce speed immediately' },
      { stepNumber: 2, instruction: 'Avoid sudden turns or braking' },
      { stepNumber: 3, instruction: 'Pull over to inspect tires when safe' },
      { stepNumber: 4, instruction: 'If flat, change tire or use repair kit' },
      { stepNumber: 5, instruction: 'Drive to nearest service station if possible' }
    ],
    safeModeRecommendation: 'Maximum speed 50 km/h. Avoid highways. Navigate to nearest tire service.'
  },
  'brakeFluid': {
    issueType: 'brakeFluid',
    title: 'Brake Fluid Low Warning',
    steps: [
      { stepNumber: 1, instruction: 'Test brakes gently at low speed' },
      { stepNumber: 2, instruction: 'Increase following distance' },
      { stepNumber: 3, instruction: 'Avoid steep descents if possible' },
      { stepNumber: 4, instruction: 'Drive to nearest mechanic immediately' }
    ],
    safeModeRecommendation: 'Drive cautiously. Use engine braking on descents. Maximum speed 60 km/h.'
  }
};

// Safe mode recommendations
const safeModeRecommendations: Record<string, SafeModeRecommendation> = {
  'engineTemp': {
    issueType: 'engineTemp',
    maxSpeed: 40,
    duration: 'Until serviced',
    restrictions: ['No AC usage', 'Monitor temperature', 'No highway driving'],
    recommendedAction: 'Drive to nearest mechanic at reduced speed'
  },
  'oilPressure': {
    issueType: 'oilPressure',
    maxSpeed: 0,
    duration: 'Do not drive',
    restrictions: ['Engine must remain off', 'Tow recommended'],
    recommendedAction: 'Contact roadside assistance'
  },
  'batteryVoltage': {
    issueType: 'batteryVoltage',
    maxSpeed: 60,
    duration: 'Until serviced',
    restrictions: ['No accessories', 'Keep engine running', 'Short trips only'],
    recommendedAction: 'Drive directly to mechanic without stopping'
  },
  'tirePressure': {
    issueType: 'tirePressure',
    maxSpeed: 50,
    duration: 'Until tire serviced',
    restrictions: ['No highway driving', 'Avoid sudden maneuvers'],
    recommendedAction: 'Navigate to nearest tire service station'
  }
};

// Learning insights
const generateLearningInsights = (): LearningInsight[] => {
  return [
    {
      id: 'insight-1',
      type: 'threshold_adjustment',
      message: 'Engine temperature threshold adjusted from 100°C to 102°C for highway driving based on historical data analysis.',
      confidence: 87,
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 'insight-2',
      type: 'new_pattern',
      message: 'New pattern detected: Battery voltage drops 15% faster in vehicles with mileage > 80,000 km.',
      confidence: 79,
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: 'insight-3',
      type: 'accuracy_improvement',
      message: 'Failure prediction accuracy improved from 82% to 89% for oil pressure related issues.',
      confidence: 94,
      timestamp: new Date(Date.now() - 10800000)
    }
  ];
};

// Component RUL predictions
const generateComponentRUL = (vehicleId: string): ComponentRUL[] => {
  return [
    {
      component: 'Engine',
      remainingUsefulLife: randomBetween(180, 730),
      confidence: randomFloat(0.7, 0.95),
      lastUpdated: new Date()
    },
    {
      component: 'Transmission',
      remainingUsefulLife: randomBetween(365, 1095),
      confidence: randomFloat(0.75, 0.92),
      lastUpdated: new Date()
    },
    {
      component: 'Brake Pads',
      remainingUsefulLife: randomBetween(30, 180),
      confidence: randomFloat(0.85, 0.98),
      lastUpdated: new Date()
    },
    {
      component: 'Battery',
      remainingUsefulLife: randomBetween(60, 365),
      confidence: randomFloat(0.8, 0.95),
      lastUpdated: new Date()
    },
    {
      component: 'Tires',
      remainingUsefulLife: randomBetween(90, 365),
      confidence: randomFloat(0.82, 0.96),
      lastUpdated: new Date()
    }
  ];
};

// Issue types for driver feedback
export const issueTypes = [
  'Engine Noise',
  'Brake Issue',
  'Steering Problem',
  'Electrical Issue',
  'AC Not Working',
  'Unusual Vibration',
  'Fluid Leak',
  'Warning Light',
  'Tire Problem',
  'Other'
];

// In-memory store
class VehicleStore {
  private vehicles: Vehicle[] = generateVehicles();
  private mechanicShops: MechanicShop[] = generateMechanicShops();
  private serviceRecords: ServiceRecord[] = generateServiceRecords();
  private alerts: Alert[] = [];
  private driverFeedbacks: DriverFeedback[] = [];
  private rules: EvaluationRule[] = defaultRules;
  private learningInsights: LearningInsight[] = generateLearningInsights();
  
  constructor() {
    this.alerts = generateAlerts(this.vehicles);
  }
  
  // Vehicles
  getVehicles() { return this.vehicles; }
  getVehicle(id: string) { return this.vehicles.find(v => v.id === id); }
  
  addVehicle(vehicle: NewVehicleInput) {
    const healthScore = randomBetween(70, 95);
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `vehicle-${Date.now()}`,
      location: vehicle.location || { lat: 40.7128 + randomFloat(-0.05, 0.05), lng: -74.0060 + randomFloat(-0.05, 0.05) },
      metrics: {
        vehicleId: '',
        engineTemp: 85,
        oilPressure: 40,
        batteryVoltage: 13.5,
        mileage: vehicle.mileage || 50000,
        fuelLevel: 75,
        tirePressure: 32,
        engineRPM: 800,
        lastServiceMileage: (vehicle.mileage || 50000) - 5000,
        timestamp: new Date(),
        errorCodes: [],
        brakeFluidLevel: 85
      },
      drivingContext: 'city',
      healthScore,
      healthStatus: 'healthy',
      healthHistory: generateHealthHistory(healthScore),
      riskTrend: 'stable',
      predictedFailureDays: null,
      priority: 'medium',
      serviceReportAnalyzed: false
    };
    newVehicle.metrics.vehicleId = newVehicle.id;
    
    if (this.vehicles.length < 6) {
      this.vehicles.push(newVehicle);
      return newVehicle;
    }
    return null;
  }
  
  removeVehicle(id: string) {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index > -1) {
      this.vehicles.splice(index, 1);
      return true;
    }
    return false;
  }
  
  updateVehicleMetrics(vehicleId: string, metrics: Partial<Vehicle['metrics']>) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.metrics = { ...vehicle.metrics, ...metrics, timestamp: new Date() };
      this.evaluateVehicleHealth(vehicle);
      return vehicle;
    }
    return null;
  }
  
  setDrivingContext(vehicleId: string, context: 'city' | 'highway') {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.drivingContext = context;
      this.evaluateVehicleHealth(vehicle);
      return vehicle;
    }
    return null;
  }
  
  private evaluateVehicleHealth(vehicle: Vehicle) {
    let score = 100;
    const context = vehicle.drivingContext;
    
    // Engine temp
    const tempThreshold = context === 'highway' ? 105 : 100;
    if (vehicle.metrics.engineTemp > tempThreshold + 10) score -= 30;
    else if (vehicle.metrics.engineTemp > tempThreshold) score -= 15;
    
    // Oil pressure
    if (vehicle.metrics.oilPressure < 20) score -= 25;
    else if (vehicle.metrics.oilPressure < 25) score -= 10;
    
    // Battery
    if (vehicle.metrics.batteryVoltage < 11.5) score -= 20;
    else if (vehicle.metrics.batteryVoltage < 12) score -= 10;
    
    // Fuel
    if (vehicle.metrics.fuelLevel < 10) score -= 15;
    else if (vehicle.metrics.fuelLevel < 20) score -= 5;
    
    // Tire pressure
    if (vehicle.metrics.tirePressure < 28 || vehicle.metrics.tirePressure > 36) score -= 15;
    
    vehicle.healthScore = Math.max(0, Math.min(100, score));
    vehicle.healthStatus = vehicle.healthScore < 50 ? 'critical' : vehicle.healthScore < 75 ? 'warning' : 'healthy';
    vehicle.predictedFailureDays = vehicle.healthStatus === 'critical' ? randomBetween(1, 14) : 
                                    vehicle.healthStatus === 'warning' ? randomBetween(15, 45) : null;
    
    // Update history
    vehicle.healthHistory.push({
      timestamp: new Date(),
      healthScore: vehicle.healthScore,
      status: vehicle.healthStatus
    });
    
    // Keep only last 30 days
    if (vehicle.healthHistory.length > 30) {
      vehicle.healthHistory = vehicle.healthHistory.slice(-30);
    }
  }
  
  // Mechanic Shops
  getMechanicShops() { return this.mechanicShops; }
  
  // Service Records
  getServiceRecords(vehicleId?: string) {
    if (vehicleId) {
      return this.serviceRecords.filter(r => r.vehicleId === vehicleId);
    }
    return this.serviceRecords;
  }
  
  // Alerts
  getAlerts() { return this.alerts; }
  acknowledgeAlert(id: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      return alert;
    }
    return null;
  }
  
  // Driver Feedback
  getDriverFeedbacks() { return this.driverFeedbacks; }
  addDriverFeedback(feedback: Omit<DriverFeedback, 'id' | 'timestamp' | 'status'>) {
    const newFeedback: DriverFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}`,
      timestamp: new Date(),
      status: 'pending'
    };
    this.driverFeedbacks.push(newFeedback);
    return newFeedback;
  }
  
  updateFeedbackStatus(id: string, status: 'pending' | 'acknowledged' | 'resolved') {
    const feedback = this.driverFeedbacks.find(f => f.id === id);
    if (feedback) {
      feedback.status = status;
      return feedback;
    }
    return null;
  }
  
  // Rules
  getRules() { return this.rules; }
  updateRule(id: string, updates: Partial<EvaluationRule>) {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      Object.assign(rule, updates);
      return rule;
    }
    return null;
  }
  
  // Learning
  getLearningInsights() { return this.learningInsights; }
  runLearning() {
    // Simulate learning
    const newInsight: LearningInsight = {
      id: `insight-${Date.now()}`,
      type: 'accuracy_improvement',
      message: `Analysis complete. Overall prediction accuracy improved by ${randomFloat(1, 5)}%`,
      confidence: randomFloat(0.85, 0.98),
      timestamp: new Date()
    };
    this.learningInsights.unshift(newInsight);
    return newInsight;
  }
  
  // Emergency
  getEmergencyProtocol(issueType: string) {
    return emergencyProtocols[issueType] || null;
  }
  
  getSafeModeRecommendation(issueType: string) {
    return safeModeRecommendations[issueType] || null;
  }
  
  // Component RUL
  getComponentRUL(vehicleId: string) {
    return generateComponentRUL(vehicleId);
  }
  
  // Simulate data updates
  simulateUpdates() {
    this.vehicles.forEach(vehicle => {
      // Random metric changes
      vehicle.metrics.engineTemp = Math.max(70, Math.min(120, vehicle.metrics.engineTemp + randomBetween(-2, 2)));
      vehicle.metrics.oilPressure = Math.max(15, Math.min(65, vehicle.metrics.oilPressure + randomBetween(-1, 1)));
      vehicle.metrics.batteryVoltage = Math.max(10, Math.min(15, vehicle.metrics.batteryVoltage + randomFloat(-0.1, 0.1)));
      vehicle.metrics.fuelLevel = Math.max(0, Math.min(100, vehicle.metrics.fuelLevel - randomBetween(0, 2)));
      vehicle.metrics.timestamp = new Date();
      
      this.evaluateVehicleHealth(vehicle);
    });
    
    return this.vehicles;
  }
  
  // Set vehicle priority
  setVehiclePriority(vehicleId: string, priority: 'high' | 'medium' | 'low') {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      // If setting to high, demote other high priority vehicles
      if (priority === 'high') {
        this.vehicles.forEach(v => {
          if (v.id !== vehicleId && v.priority === 'high') {
            v.priority = 'medium';
          }
        });
      }
      vehicle.priority = priority;
      return vehicle;
    }
    return null;
  }
  
  // Get high priority vehicle
  getHighPriorityVehicle() {
    return this.vehicles.find(v => v.priority === 'high') || this.vehicles[0];
  }
  
  // Process PDF analysis result and update vehicle
  processPDFAnalysis(vehicleId: string, analysis: PDFAnalysisResult) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      // Update health score based on analysis
      const newScore = Math.max(0, Math.min(100, vehicle.healthScore + analysis.healthImpact.scoreAdjustment));
      vehicle.healthScore = newScore;
      vehicle.healthStatus = newScore < 50 ? 'critical' : newScore < 75 ? 'warning' : 'healthy';
      
      // Mark as analyzed
      vehicle.serviceReportAnalyzed = true;
      vehicle.lastServiceReportDate = analysis.analyzedAt;
      vehicle.serviceReportInsights = analysis.insights;
      
      // Update history
      vehicle.healthHistory.push({
        timestamp: new Date(),
        healthScore: vehicle.healthScore,
        status: vehicle.healthStatus
      });
      
      // Keep only last 30 entries
      if (vehicle.healthHistory.length > 30) {
        vehicle.healthHistory = vehicle.healthHistory.slice(-30);
      }
      
      // Add learning insight
      const newInsight: LearningInsight = {
        id: `insight-pdf-${Date.now()}`,
        type: 'new_pattern',
        message: `PDF analysis for ${vehicle.name}: ${analysis.rlModelUpdate.patternsLearned.join(', ')}`,
        confidence: analysis.rlModelUpdate.confidenceLevel,
        timestamp: new Date()
      };
      this.learningInsights.unshift(newInsight);
      
      return vehicle;
    }
    return null;
  }
  
  // ============================================
  // Firebase / STM32 Real-time Sync Methods
  // ============================================
  
  // Update vehicle from STM32 sensor data (via Firebase)
  updateFromSTM32Data(vehicleId: string, sensorData: {
    engineTemp: number;
    oilPressure: number;
    batteryVoltage: number;
    mileage: number;
    fuelLevel: number;
    tirePressure: number;
    engineRPM: number;
    errorCodes?: string[];
    brakeFluidLevel?: number;
    chainTension?: number;
  }) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      // Update metrics from STM32
      vehicle.metrics = {
        ...vehicle.metrics,
        engineTemp: sensorData.engineTemp,
        oilPressure: sensorData.oilPressure,
        batteryVoltage: Math.round(sensorData.batteryVoltage * 100) / 100, // Ensure 2 decimal places
        mileage: sensorData.mileage,
        fuelLevel: sensorData.fuelLevel,
        tirePressure: sensorData.tirePressure,
        engineRPM: sensorData.engineRPM,
        errorCodes: sensorData.errorCodes || vehicle.metrics.errorCodes,
        brakeFluidLevel: sensorData.brakeFluidLevel,
        chainTension: sensorData.chainTension,
        timestamp: new Date()
      };
      
      // Re-evaluate health
      this.evaluateVehicleHealth(vehicle);
      
      return vehicle;
    }
    return null;
  }
  
  // Get all vehicle metrics for Firebase sync
  getAllMetricsForFirebase() {
    const metrics: Record<string, any> = {};
    this.vehicles.forEach(v => {
      metrics[v.id] = {
        ...v.metrics,
        timestamp: Date.now()
      };
    });
    return metrics;
  }
  
  // Get health predictions for Firebase
  getHealthPredictionsForFirebase() {
    const predictions: Record<string, any> = {};
    this.vehicles.forEach(v => {
      predictions[v.id] = {
        healthScore: v.healthScore,
        healthStatus: v.healthStatus,
        predictedFailureDays: v.predictedFailureDays,
        riskTrend: v.riskTrend,
        lastUpdated: Date.now()
      };
    });
    return predictions;
  }
  
  // Batch update from Firebase (used when reconnecting)
  batchUpdateFromFirebase(vehiclesData: Array<{
    id: string;
    metrics: any;
    healthScore: number;
    healthStatus: string;
  }>) {
    vehiclesData.forEach(data => {
      const vehicle = this.vehicles.find(v => v.id === data.id);
      if (vehicle) {
        vehicle.metrics = {
          ...vehicle.metrics,
          ...data.metrics,
          timestamp: new Date(data.metrics.timestamp || Date.now())
        };
        vehicle.healthScore = data.healthScore;
        vehicle.healthStatus = data.healthStatus as any;
      }
    });
    return this.vehicles;
  }
  
  // Generate STM32 simulation data (for testing without real hardware)
  generateSTM32SimulationData(vehicleId: string) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;
    
    // Simulate realistic sensor variations
    return {
      vehicleId,
      timestamp: Date.now(),
      engineTemp: vehicle.metrics.engineTemp + randomBetween(-2, 2),
      oilPressure: Math.max(15, Math.min(65, vehicle.metrics.oilPressure + randomBetween(-1, 1))),
      batteryVoltage: Math.round((vehicle.metrics.batteryVoltage + randomFloat(-0.05, 0.05)) * 100) / 100,
      mileage: vehicle.metrics.mileage + randomBetween(0, 5),
      fuelLevel: Math.max(0, vehicle.metrics.fuelLevel - randomBetween(0, 1)),
      tirePressure: vehicle.metrics.tirePressure + randomFloat(-0.2, 0.2),
      engineRPM: Math.max(600, Math.min(4000, vehicle.metrics.engineRPM + randomBetween(-100, 100))),
      errorCodes: vehicle.metrics.errorCodes,
      brakeFluidLevel: vehicle.metrics.brakeFluidLevel,
      chainTension: vehicle.metrics.chainTension
    };
  }
  
  // Run RL learning from sensor data pattern
  runRLOnSensorData(vehicleId: string, historicalData: any[]) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle || historicalData.length === 0) return null;
    
    // Simulate RL pattern detection
    const patterns: string[] = [];
    
    // Analyze battery degradation pattern
    const batteryData = historicalData.map(d => d.batteryVoltage);
    const batteryTrend = batteryData.length > 1 
      ? batteryData[batteryData.length - 1] - batteryData[0]
      : 0;
    
    if (batteryTrend < -0.5) {
      patterns.push('Battery degradation detected');
    }
    
    // Analyze temperature patterns
    const tempData = historicalData.map(d => d.engineTemp);
    const avgTemp = tempData.reduce((a, b) => a + b, 0) / tempData.length;
    
    if (avgTemp > 95) {
      patterns.push('Elevated operating temperature pattern');
    }
    
    // Add insight
    const newInsight: LearningInsight = {
      id: `insight-rl-${Date.now()}`,
      type: 'new_pattern',
      message: `RL Analysis: ${patterns.length > 0 ? patterns.join(', ') : 'No anomalies detected'}`,
      confidence: 0.85 + randomFloat(0, 0.1),
      timestamp: new Date()
    };
    
    this.learningInsights.unshift(newInsight);
    
    return {
      patternsLearned: patterns,
      confidence: newInsight.confidence,
      insight: newInsight
    };
  }
}

// Export singleton instance
export const store = new VehicleStore();
