'use client';

import { motion } from 'framer-motion';
import { UserRole } from '@/lib/types';
import { 
  User, 
  Wrench, 
  LayoutDashboard, 
  Gauge, 
  Map as MapIcon,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  currentView: 'role' | 'dashboard' | 'map';
  currentRole: UserRole;
  onViewChange: (view: 'role' | 'dashboard' | 'map') => void;
  onRoleChange: (role: UserRole) => void;
  onAddVehicle: () => void;
  canAddVehicle: boolean;
}

export function MobileNav({ 
  currentView, 
  currentRole, 
  onViewChange, 
  onRoleChange,
  onAddVehicle,
  canAddVehicle
}: MobileNavProps) {
  const navItems = [
    { id: 'role', label: 'Role', icon: <User className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-5 h-5" /> },
    { id: 'map', label: 'Map', icon: <MapIcon className="w-5 h-5" /> }
  ];
  
  const roleItems = [
    { id: 'driver' as UserRole, label: 'Driver', icon: <User className="w-4 h-4" /> },
    { id: 'mechanic' as UserRole, label: 'Mechanic', icon: <Wrench className="w-4 h-4" /> },
    { id: 'fleet_manager' as UserRole, label: 'Manager', icon: <LayoutDashboard className="w-4 h-4" /> }
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 mobile-nav z-40 px-4 py-2 safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {/* Main Views */}
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onViewChange(item.id as 'role' | 'dashboard' | 'map')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              currentView === item.id
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              {item.icon}
              {currentView === item.id && (
                <motion.div
                  className="absolute -inset-1 rounded-lg bg-primary/20"
                  layoutId="navIndicator"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </motion.button>
        ))}
        
        {/* Add Vehicle Button */}
        {canAddVehicle && (
          <motion.button
            onClick={onAddVehicle}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">Add</span>
          </motion.button>
        )}
      </div>
      
      {/* Role Selector (only shown in role view) */}
      {currentView === 'role' && (
        <motion.div
          className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {roleItems.map((role) => (
            <motion.button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentRole === role.id
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-muted-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {role.icon}
              <span>{role.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </nav>
  );
}
