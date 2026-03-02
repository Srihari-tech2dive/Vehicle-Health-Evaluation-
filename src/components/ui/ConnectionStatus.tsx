'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, Cloud, CloudOff, Activity, Zap } from 'lucide-react';
import type { ConnectionStatus } from '@/lib/firebase-config';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  lastUpdated?: Date | null;
  showLabel?: boolean;
  compact?: boolean;
}

export function ConnectionStatusIndicator({ 
  status, 
  lastUpdated, 
  showLabel = true,
  compact = false 
}: ConnectionStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          label: 'Live',
          pulse: true
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-500/30',
          label: 'Connecting',
          pulse: false
        };
      case 'error':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Error',
          pulse: false
        };
      case 'disconnected':
      default:
        return {
          icon: <CloudOff className="w-4 h-4" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          label: 'Offline',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} border ${config.borderColor}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="relative">
          {config.icon}
          {config.pulse && (
            <motion.div
              className={`absolute inset-0 rounded-full ${config.bgColor}`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        {showLabel && (
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${config.bgColor} border ${config.borderColor} backdrop-blur-sm`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative">
        <motion.div className={config.color}>
          {config.icon}
        </motion.div>
        {config.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.bgColor}`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      
      <div className="flex flex-col">
        {showLabel && (
          <span className={`text-sm font-semibold ${config.color}`}>
            {config.label}
          </span>
        )}
        {lastUpdated && status === 'connected' && (
          <span className="text-xs text-muted-foreground">
            Updated {formatTimeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {status === 'connected' && (
        <motion.div
          className="ml-auto flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <Zap className="w-3 h-3 text-amber-400" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Real-time data flow indicator
export function DataFlowIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${isActive ? 'bg-primary' : 'bg-gray-600'}`}
          animate={{
            height: isActive ? [4, 12, 4] : 4,
            opacity: isActive ? [0.5, 1, 0.5] : 0.5
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  );
}

// Firebase status badge
export function FirebaseStatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <motion.div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
      whileHover={{ scale: 1.02 }}
    >
      <Cloud className={`w-3.5 h-3.5 ${
        status === 'connected' ? 'text-emerald-400' :
        status === 'connecting' ? 'text-amber-400' : 'text-gray-400'
      }`} />
      <span className="text-xs font-medium">Firebase</span>
      <ConnectionStatusIndicator status={status} showLabel={false} compact />
    </motion.div>
  );
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return `${Math.floor(hours / 24)}d ago`;
}
