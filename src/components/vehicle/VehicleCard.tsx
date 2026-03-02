'use client';

import { motion } from 'framer-motion';
import { Vehicle } from '@/lib/types';
import { 
  Car, 
  Truck, 
  Bike, 
  Gauge, 
  Fuel, 
  Battery, 
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MapPin
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  selected?: boolean;
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'truck':
    case 'bus':
    case 'van':
      return <Truck className="w-5 h-5" />;
    case 'motorcycle':
    case 'scooter':
      return <Bike className="w-5 h-5" />;
    default:
      return <Car className="w-5 h-5" />;
  }
};

const getHealthColor = (score: number) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

export function HealthGauge({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getHealthColor(score);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="health-gauge-circle" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold number-display"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">Health</span>
      </div>
    </div>
  );
}

export function VehicleCard({ vehicle, onClick, selected }: VehicleCardProps) {
  const healthColor = getHealthColor(vehicle.healthScore);
  
  return (
    <motion.div
      className={`glass-card p-4 cursor-pointer card-hover ${selected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${healthColor}20, ${healthColor}10)` }}
          >
            {getVehicleIcon(vehicle.type)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
            <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon(vehicle.riskTrend)}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            vehicle.drivingContext === 'highway' 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {vehicle.drivingContext}
          </span>
        </div>
      </div>
      
      {/* Health Gauge & Status */}
      <div className="flex items-center gap-4 mb-4">
        <HealthGauge score={vehicle.healthScore} size={80} />
        <div className="flex-1 space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
            vehicle.healthStatus === 'healthy' ? 'status-healthy' :
            vehicle.healthStatus === 'warning' ? 'status-warning' :
            vehicle.healthStatus === 'critical' ? 'status-critical' : 'status-offline'
          }`}>
            {vehicle.healthStatus === 'critical' && <AlertTriangle className="w-3 h-3" />}
            {vehicle.healthStatus.charAt(0).toUpperCase() + vehicle.healthStatus.slice(1)}
          </div>
          
          {vehicle.predictedFailureDays && (
            <p className="text-xs text-red-400">
              ⚠️ Failure predicted in ~{vehicle.predictedFailureDays} days
            </p>
          )}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricItem 
          icon={<Thermometer className="w-3.5 h-3.5" />} 
          label="Temp" 
          value={`${vehicle.metrics.engineTemp}°C`}
          warning={vehicle.metrics.engineTemp > (vehicle.drivingContext === 'highway' ? 105 : 100)}
        />
        <MetricItem 
          icon={<Gauge className="w-3.5 h-3.5" />} 
          label="Oil" 
          value={`${vehicle.metrics.oilPressure} PSI`}
          warning={vehicle.metrics.oilPressure < 25}
        />
        <MetricItem 
          icon={<Fuel className="w-3.5 h-3.5" />} 
          label="Fuel" 
          value={`${vehicle.metrics.fuelLevel}%`}
          warning={vehicle.metrics.fuelLevel < 20}
        />
        <MetricItem 
          icon={<Battery className="w-3.5 h-3.5" />} 
          label="Battery" 
          value={`${vehicle.metrics.batteryVoltage.toFixed(2)}V`}
          warning={vehicle.metrics.batteryVoltage < 12}
        />
      </div>
      
      {/* Error Codes */}
      {vehicle.metrics.errorCodes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Error Codes:</span>
            {vehicle.metrics.errorCodes.map((code, i) => (
              <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                {code}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MetricItem({ icon, label, value, warning }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  warning?: boolean;
}) {
  return (
    <div className={`text-center p-2 rounded-lg ${warning ? 'bg-red-500/10' : 'bg-white/5'}`}>
      <div className={`flex items-center justify-center gap-1 mb-1 ${warning ? 'text-red-400' : 'text-muted-foreground'}`}>
        {icon}
      </div>
      <div className={`text-xs font-medium number-display ${warning ? 'text-red-400' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
