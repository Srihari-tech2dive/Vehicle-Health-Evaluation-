'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, Alert } from '@/lib/types';
import { 
  Car, 
  Truck, 
  Bike, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Info,
  X,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useMemo } from 'react';

interface FleetOverviewProps {
  vehicles: Vehicle[];
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string) => void;
}

export function FleetOverview({ vehicles, alerts, onAcknowledgeAlert }: FleetOverviewProps) {
  const stats = useMemo(() => {
    const healthy = vehicles.filter(v => v.healthStatus === 'healthy').length;
    const warning = vehicles.filter(v => v.healthStatus === 'warning').length;
    const critical = vehicles.filter(v => v.healthStatus === 'critical').length;
    const avgScore = Math.round(vehicles.reduce((acc, v) => acc + v.healthScore, 0) / vehicles.length);
    
    const cars = vehicles.filter(v => v.category === 'car').length;
    const twoWheelers = vehicles.filter(v => v.category === 'two-wheeler').length;
    const heavy = vehicles.filter(v => v.category === 'heavy').length;
    
    return { healthy, warning, critical, avgScore, cars, twoWheelers, heavy };
  }, [vehicles]);
  
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Healthy" 
          value={stats.healthy} 
          total={vehicles.length}
          icon={<CheckCircle className="w-5 h-5" />}
          color="#10b981"
          delay={0}
        />
        <StatCard 
          title="Warning" 
          value={stats.warning} 
          total={vehicles.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="#f59e0b"
          delay={0.1}
        />
        <StatCard 
          title="Critical" 
          value={stats.critical} 
          total={vehicles.length}
          icon={<AlertCircle className="w-5 h-5" />}
          color="#ef4444"
          delay={0.2}
        />
        <StatCard 
          title="Avg Health" 
          value={stats.avgScore}
          suffix="%"
          icon={<Activity className="w-5 h-5" />}
          color="#6366f1"
          delay={0.3}
        />
      </div>
      
      {/* Vehicle Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Vehicle Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <DistributionItem 
            icon={<Car className="w-6 h-6" />}
            label="Cars"
            count={stats.cars}
            percentage={Math.round((stats.cars / vehicles.length) * 100)}
            color="#6366f1"
          />
          <DistributionItem 
            icon={<Bike className="w-6 h-6" />}
            label="Two-Wheelers"
            count={stats.twoWheelers}
            percentage={Math.round((stats.twoWheelers / vehicles.length) * 100)}
            color="#10b981"
          />
          <DistributionItem 
            icon={<Truck className="w-6 h-6" />}
            label="Heavy Vehicles"
            count={stats.heavy}
            percentage={Math.round((stats.heavy / vehicles.length) * 100)}
            color="#f59e0b"
          />
        </div>
      </div>
      
      {/* Active Alerts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
          {unacknowledgedAlerts.length > 0 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
              {unacknowledgedAlerts.length} unacknowledged
            </span>
          )}
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {unacknowledgedAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active alerts</p>
              </div>
            ) : (
              unacknowledgedAlerts.map((alert, index) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={() => onAcknowledgeAlert(alert.id)}
                  index={index}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, total, suffix, icon, color, delay }: {
  title: string;
  value: number;
  total?: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span 
          className="text-3xl font-bold number-display"
          style={{ color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: 'spring' }}
        >
          {value}
        </motion.span>
        {suffix && <span className="text-lg" style={{ color }}>{suffix}</span>}
        {total !== undefined && (
          <span className="text-muted-foreground text-sm">/ {total}</span>
        )}
      </div>
    </motion.div>
  );
}

function DistributionItem({ icon, label, count, percentage, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div 
        className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `2px solid ${color}40`
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold number-display" style={{ color }}>{count}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xs" style={{ color }}>{percentage}%</div>
    </div>
  );
}

function AlertItem({ alert, onAcknowledge, index }: { 
  alert: Alert; 
  onAcknowledge: () => void;
  index: number;
}) {
  const colors = {
    critical: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: AlertCircle },
    warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertTriangle },
    info: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: Info }
  };
  
  const style = colors[alert.type];
  const Icon = style.icon;
  
  return (
    <motion.div
      className={`flex items-center justify-between p-3 rounded-lg ${style.bg} border ${style.border} alert-slide-in`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${style.text}`} />
        <div>
          <p className="font-medium text-foreground">{alert.vehicleName}</p>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAcknowledge();
        }}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}
