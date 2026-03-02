'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle } from '@/lib/types';
import { 
  Car, 
  Truck, 
  Bike, 
  Gauge, 
  Thermometer, 
  Battery, 
  Fuel, 
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Wrench,
  Trash2,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface VehicleDashboardProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | undefined;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onRemoveVehicle: (vehicleId: string) => void;
}

export function VehicleDashboard({ vehicles, selectedVehicle, onSelectVehicle, onRemoveVehicle }: VehicleDashboardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Stats
  const avgHealth = Math.round(vehicles.reduce((acc, v) => acc + v.healthScore, 0) / vehicles.length);
  const criticalCount = vehicles.filter(v => v.healthStatus === 'critical').length;
  const warningCount = vehicles.filter(v => v.healthStatus === 'warning').length;
  const healthyCount = vehicles.filter(v => v.healthStatus === 'healthy').length;
  
  // Health trend data
  const healthTrend = vehicles[0]?.healthHistory.slice(-14).map(h => ({
    date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: h.healthScore
  })) || [];
  
  // Radar data for selected vehicle
  const radarData = selectedVehicle ? [
    { metric: 'Engine', value: Math.max(0, 100 - (selectedVehicle.metrics.engineTemp - 70)), fullMark: 100 },
    { metric: 'Oil', value: selectedVehicle.metrics.oilPressure * 1.5, fullMark: 100 },
    { metric: 'Battery', value: selectedVehicle.metrics.batteryVoltage * 7, fullMark: 100 },
    { metric: 'Fuel', value: selectedVehicle.metrics.fuelLevel, fullMark: 100 },
    { metric: 'Tires', value: selectedVehicle.metrics.tirePressure * 3, fullMark: 100 },
    { metric: 'RPM', value: 100 - (selectedVehicle.metrics.engineRPM / 30), fullMark: 100 }
  ] : [];
  
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
      case 'bus':
      case 'van':
        return <Truck className="w-6 h-6" />;
      case 'motorcycle':
      case 'scooter':
        return <Bike className="w-6 h-6" />;
      default:
        return <Car className="w-6 h-6" />;
    }
  };
  
  const getHealthColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="glass-card p-4 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500" />
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Avg Health</span>
          </div>
          <div className="text-3xl font-bold number-display gradient-text">{avgHealth}%</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Healthy</span>
          </div>
          <div className="text-3xl font-bold number-display text-emerald-400">{healthyCount}</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-muted-foreground">Warning</span>
          </div>
          <div className="text-3xl font-bold number-display text-amber-400">{warningCount}</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <div className="text-3xl font-bold number-display text-red-400">{criticalCount}</div>
        </motion.div>
      </div>
      
      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            className={`glass-card p-4 cursor-pointer card-hover relative overflow-hidden ${
              selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectVehicle(vehicle)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Gradient top border */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: getHealthColor(vehicle.healthScore) }}
            />
            
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-xl"
                  style={{ background: `${getHealthColor(vehicle.healthScore)}20` }}
                >
                  {getVehicleIcon(vehicle.type)}
                </div>
                <div>
                  <h3 className="font-semibold">{vehicle.name}</h3>
                  <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  vehicle.healthStatus === 'healthy' ? 'status-healthy' :
                  vehicle.healthStatus === 'warning' ? 'status-warning' : 'status-critical'
                }`}>
                  {vehicle.healthStatus}
                </span>
                {vehicle.riskTrend === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {vehicle.riskTrend === 'declining' && <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            
            {/* Health Score Circle */}
            <div className="flex items-center justify-between mb-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(99, 102, 241, 0.1)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={getHealthColor(vehicle.healthScore)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${vehicle.healthScore * 1.76} 176`}
                    style={{ filter: `drop-shadow(0 0 6px ${getHealthColor(vehicle.healthScore)})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold number-display" style={{ color: getHealthColor(vehicle.healthScore) }}>
                    {vehicle.healthScore}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 flex-1 ml-4">
                <div className="text-center p-1.5 rounded-lg bg-white/5">
                  <Thermometer className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                  <p className="text-xs font-medium">{vehicle.metrics.engineTemp}°C</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-white/5">
                  <Fuel className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                  <p className="text-xs font-medium">{vehicle.metrics.fuelLevel}%</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-white/5">
                  <Battery className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                  <p className="text-xs font-medium">{vehicle.metrics.batteryVoltage.toFixed(2)}V</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-white/5">
                  <Gauge className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                  <p className="text-xs font-medium">{vehicle.metrics.oilPressure} PSI</p>
                </div>
              </div>
            </div>
            
            {/* Error codes */}
            {vehicle.metrics.errorCodes.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <div className="flex gap-1">
                  {vehicle.metrics.errorCodes.map((code, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Selected Vehicle Details */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            key={selectedVehicle.id}
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{ background: `${getHealthColor(selectedVehicle.healthScore)}20` }}
                >
                  {getVehicleIcon(selectedVehicle.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedVehicle.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.licensePlate} • {selectedVehicle.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  onClick={() => setShowDeleteConfirm(selectedVehicle.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm === selectedVehicle.id && (
                <motion.div
                  className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-sm mb-3">Are you sure you want to remove this vehicle?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onRemoveVehicle(selectedVehicle.id);
                        setShowDeleteConfirm(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Trend */}
              <div className="glass-card p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Health Trend (14 Days)
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthTrend}>
                      <defs>
                        <linearGradient id="healthGradientDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(20, 20, 35, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#f8fafc'
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#healthGradientDash)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Metrics Radar */}
              <div className="glass-card p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Metrics Overview
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(99, 102, 241, 0.2)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 8 }} />
                      <Radar name="Metrics" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Detailed Metrics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricDetail
                icon={<Thermometer className="w-5 h-5" />}
                label="Engine Temp"
                value={`${selectedVehicle.metrics.engineTemp}°C`}
                status={selectedVehicle.metrics.engineTemp > 100 ? 'warning' : 'good'}
              />
              <MetricDetail
                icon={<Gauge className="w-5 h-5" />}
                label="Oil Pressure"
                value={`${selectedVehicle.metrics.oilPressure} PSI`}
                status={selectedVehicle.metrics.oilPressure < 25 ? 'warning' : 'good'}
              />
              <MetricDetail
                icon={<Battery className="w-5 h-5" />}
                label="Battery"
                value={`${selectedVehicle.metrics.batteryVoltage.toFixed(2)}V`}
                status={selectedVehicle.metrics.batteryVoltage < 12 ? 'warning' : 'good'}
              />
              <MetricDetail
                icon={<Fuel className="w-5 h-5" />}
                label="Fuel Level"
                value={`${selectedVehicle.metrics.fuelLevel}%`}
                status={selectedVehicle.metrics.fuelLevel < 20 ? 'warning' : 'good'}
              />
            </div>
            
            {/* Additional Info */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Mileage</p>
                <p className="font-semibold number-display">{selectedVehicle.metrics.mileage.toLocaleString()} km</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Tire Pressure</p>
                <p className="font-semibold number-display">{selectedVehicle.metrics.tirePressure} PSI</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Engine RPM</p>
                <p className="font-semibold number-display">{selectedVehicle.metrics.engineRPM}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Driving Context</p>
                <p className="font-semibold capitalize">{selectedVehicle.drivingContext}</p>
              </div>
            </div>
            
            {/* Predicted Failure */}
            {selectedVehicle.predictedFailureDays && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Potential Failure Predicted</p>
                  <p className="text-sm text-muted-foreground">Estimated in ~{selectedVehicle.predictedFailureDays} days. Schedule maintenance soon.</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricDetail({ icon, label, value, status }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}) {
  const colors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400'
  };
  
  return (
    <div className="p-4 rounded-xl bg-white/5">
      <div className={`flex items-center gap-2 mb-2 ${colors[status]}`}>
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-semibold number-display ${colors[status]}`}>{value}</p>
    </div>
  );
}
