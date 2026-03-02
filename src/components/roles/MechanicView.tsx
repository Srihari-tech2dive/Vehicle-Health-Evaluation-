'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, ServiceRecord, ComponentRUL, Alert } from '@/lib/types';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  Activity,
  Gauge,
  Thermometer,
  Battery,
  Fuel,
  Car,
  Truck,
  Bike
} from 'lucide-react';
import { HealthGauge } from '@/components/vehicle/VehicleCard';

interface MechanicViewProps {
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  alerts: Alert[];
}

export function MechanicView({ vehicles, serviceRecords, alerts }: MechanicViewProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [componentRUL, setComponentRUL] = useState<ComponentRUL[]>([]);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  
  // Sort vehicles by priority (critical first, then warning, then healthy)
  const prioritizedVehicles = [...vehicles].sort((a, b) => {
    const order = { critical: 0, warning: 1, healthy: 2, offline: 3 };
    return order[a.healthStatus] - order[b.healthStatus];
  });
  
  useEffect(() => {
    if (selectedVehicle) {
      fetch(`/api/component-rul/${selectedVehicle.id}`)
        .then(res => res.json())
        .then(setComponentRUL)
        .catch(console.error);
    }
  }, [selectedVehicle]);
  
  const vehicleAlerts = selectedVehicle 
    ? alerts.filter(a => a.vehicleId === selectedVehicle.id)
    : [];
  
  const vehicleRecords = selectedVehicle
    ? serviceRecords.filter(r => r.vehicleId === selectedVehicle.id).slice(0, 5)
    : [];
  
  return (
    <div className="space-y-6">
      {/* Diagnostic Queue */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Diagnostic Queue
          </h3>
          <span className="text-sm text-muted-foreground">
            {vehicles.filter(v => v.healthStatus === 'critical' || v.healthStatus === 'warning').length} vehicles need attention
          </span>
        </div>
        
        <div className="space-y-3">
          {prioritizedVehicles.map((vehicle, index) => (
            <DiagnosticQueueItem
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              isSelected={selectedVehicle?.id === vehicle.id}
              onSelect={() => setSelectedVehicle(vehicle)}
              expanded={expandedVehicle === vehicle.id}
              onToggleExpand={() => setExpandedVehicle(
                expandedVehicle === vehicle.id ? null : vehicle.id
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Selected Vehicle Details */}
      <AnimatePresence mode="wait">
        {selectedVehicle && (
          <motion.div
            key={selectedVehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Vehicle Info & Evidence */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedVehicle.name}</h3>
                  <p className="text-muted-foreground">{selectedVehicle.licensePlate}</p>
                </div>
                <HealthGauge score={selectedVehicle.healthScore} size={80} />
              </div>
              
              {/* Evidence Panel */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Issue Evidence
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {selectedVehicle.metrics.engineTemp > (selectedVehicle.drivingContext === 'highway' ? 105 : 100) && (
                    <EvidenceCard
                      icon={<Thermometer className="w-5 h-5" />}
                      title="High Engine Temp"
                      value={`${selectedVehicle.metrics.engineTemp}°C`}
                      threshold={`${selectedVehicle.drivingContext === 'highway' ? 105 : 100}°C`}
                      critical
                    />
                  )}
                  {selectedVehicle.metrics.oilPressure < 25 && (
                    <EvidenceCard
                      icon={<Gauge className="w-5 h-5" />}
                      title="Low Oil Pressure"
                      value={`${selectedVehicle.metrics.oilPressure} PSI`}
                      threshold="25 PSI"
                      critical={selectedVehicle.metrics.oilPressure < 20}
                    />
                  )}
                  {selectedVehicle.metrics.batteryVoltage < 12 && (
                    <EvidenceCard
                      icon={<Battery className="w-5 h-5" />}
                      title="Low Battery"
                      value={`${selectedVehicle.metrics.batteryVoltage.toFixed(2)}V`}
                      threshold="12V"
                      critical={selectedVehicle.metrics.batteryVoltage < 11.5}
                    />
                  )}
                  {selectedVehicle.metrics.fuelLevel < 20 && (
                    <EvidenceCard
                      icon={<Fuel className="w-5 h-5" />}
                      title="Low Fuel"
                      value={`${selectedVehicle.metrics.fuelLevel}%`}
                      threshold="20%"
                    />
                  )}
                </div>
                
                {selectedVehicle.metrics.errorCodes.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-medium text-red-400 mb-2">Error Codes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVehicle.metrics.errorCodes.map((code, i) => (
                        <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded border border-red-500/30">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* RUL Predictions */}
            <div className="glass-card p-6">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Component RUL Predictions
              </h4>
              
              <div className="space-y-3">
                {componentRUL.map((component) => (
                  <RULBar key={component.component} data={component} />
                ))}
              </div>
              
              {/* Service Schedule */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Next Service
                </h4>
                {vehicleRecords[0]?.nextServiceRecommendation && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="font-medium">{vehicleRecords[0].nextServiceRecommendation.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Due at {vehicleRecords[0].nextServiceRecommendation.dueMileage.toLocaleString()} km
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Service History */}
      {selectedVehicle && vehicleRecords.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            Repair History
          </h4>
          
          <div className="space-y-3">
            {vehicleRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium">{record.serviceType}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.serviceDate).toLocaleDateString()} • {record.mileage.toLocaleString()} km
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${record.cost}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {record.issuesAddressed.slice(0, 2).map((issue, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 text-xs rounded">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosticQueueItem({ vehicle, index, isSelected, onSelect, expanded, onToggleExpand }: {
  vehicle: Vehicle;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const getIcon = () => {
    if (vehicle.category === 'heavy') return <Truck className="w-5 h-5" />;
    if (vehicle.category === 'two-wheeler') return <Bike className="w-5 h-5" />;
    return <Car className="w-5 h-5" />;
  };
  
  const statusColor = vehicle.healthStatus === 'critical' ? '#ef4444' :
                      vehicle.healthStatus === 'warning' ? '#f59e0b' : '#10b981';
  
  return (
    <motion.div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected 
          ? 'border-primary bg-primary/10' 
          : vehicle.healthStatus === 'critical' 
            ? 'border-red-500/30 bg-red-500/5' 
            : vehicle.healthStatus === 'warning'
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-white/10 bg-white/5'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ background: `${statusColor}20` }}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{vehicle.name}</h4>
              <span 
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  background: `${statusColor}20`,
                  color: statusColor
                }}
              >
                {vehicle.healthStatus}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold number-display" style={{ color: statusColor }}>
              {vehicle.healthScore}%
            </div>
            <div className="text-xs text-muted-foreground">Health</div>
          </div>
          
          {vehicle.healthStatus !== 'healthy' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && vehicle.healthStatus !== 'healthy' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-4 gap-2 text-sm">
              <div className="p-2 rounded bg-white/5">
                <p className="text-muted-foreground text-xs">Engine Temp</p>
                <p className={`font-medium ${vehicle.metrics.engineTemp > 100 ? 'text-red-400' : ''}`}>
                  {vehicle.metrics.engineTemp}°C
                </p>
              </div>
              <div className="p-2 rounded bg-white/5">
                <p className="text-muted-foreground text-xs">Oil Pressure</p>
                <p className={`font-medium ${vehicle.metrics.oilPressure < 25 ? 'text-red-400' : ''}`}>
                  {vehicle.metrics.oilPressure} PSI
                </p>
              </div>
              <div className="p-2 rounded bg-white/5">
                <p className="text-muted-foreground text-xs">Battery</p>
                <p className={`font-medium ${vehicle.metrics.batteryVoltage < 12 ? 'text-red-400' : ''}`}>
                  {vehicle.metrics.batteryVoltage.toFixed(2)}V
                </p>
              </div>
              <div className="p-2 rounded bg-white/5">
                <p className="text-muted-foreground text-xs">Error Codes</p>
                <p className={`font-medium ${vehicle.metrics.errorCodes.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {vehicle.metrics.errorCodes.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EvidenceCard({ icon, title, value, threshold, critical }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  threshold: string;
  critical?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${critical ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={critical ? 'text-red-400' : 'text-amber-400'}>{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className={`text-lg font-semibold number-display ${critical ? 'text-red-400' : 'text-amber-400'}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">Threshold: {threshold}</p>
    </div>
  );
}

function RULBar({ data }: { data: ComponentRUL }) {
  const percentage = Math.min(100, (data.remainingUsefulLife / 730) * 100);
  const color = percentage > 60 ? '#10b981' : percentage > 30 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="p-3 rounded-lg bg-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{data.component}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{data.remainingUsefulLife} days</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>
            {Math.round(data.confidence * 100)}% conf
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
