'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Vehicle, Alert, MechanicShop, ServiceRecord, LearningInsight, EvaluationRule, DriverFeedback, UserRole, PDFAnalysisResult } from '@/lib/types';
import { DriverView } from '@/components/roles/DriverView';
import { MechanicView } from '@/components/roles/MechanicView';
import { FleetManagerView } from '@/components/roles/FleetManagerView';
import { MechanicMap } from '@/components/map/MechanicMap';
import { VehicleDashboard } from '@/components/dashboard/VehicleDashboard';
import { MobileNav } from '@/components/navigation/MobileNav';
import { ConnectionStatusIndicator, DataFlowIndicator, FirebaseStatusBadge } from '@/components/ui/ConnectionStatus';
import { useRealtimeAllVehicles, useFirebaseStatus, useRLNotifications } from '@/hooks/useRealtimeVehicleData';
import type { ConnectionStatus } from '@/lib/firebase-config';
import dynamic from 'next/dynamic';
import { 
  Car, 
  Truck, 
  Bike, 
  User, 
  Wrench, 
  LayoutDashboard,
  Plus,
  X,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  Gauge,
  Map as MapIcon,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  Wifi,
  Cloud
} from 'lucide-react';

export default function VehicleHealthDashboard() {
  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [currentRole, setCurrentRole] = useState<UserRole>('driver');
  const [currentView, setCurrentView] = useState<'role' | 'dashboard' | 'map'>('role');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mechanicShops, setMechanicShops] = useState<MechanicShop[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [rules, setRules] = useState<EvaluationRule[]>([]);
  const [feedbacks, setFeedbacks] = useState<DriverFeedback[]>([]);
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [rlNotification, setRlNotification] = useState<{show: boolean; title: string; message: string} | null>(null);
  
  // Real-time connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const { notifications: rlNotifications, addNotification: addRLNotification } = useRLNotifications();
  
  // Mount check for theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vehiclesRes, alertsRes, shopsRes, insightsRes, rulesRes, feedbacksRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/alerts'),
          fetch('/api/mechanic-shops'),
          fetch('/api/learning'),
          fetch('/api/rules'),
          fetch('/api/driver-feedback')
        ]);
        
        const vehiclesData = await vehiclesRes.json();
        const alertsData = await alertsRes.json();
        const shopsData = await shopsRes.json();
        const insightsData = await insightsRes.json();
        const rulesData = await rulesRes.json();
        const feedbacksData = await feedbacksRes.json();
        
        setVehicles(vehiclesData);
        setAlerts(alertsData);
        setMechanicShops(shopsData);
        setLearningInsights(insightsData);
        setRules(rulesData);
        setFeedbacks(feedbacksData);
        
        if (vehiclesData.length > 0) {
          setSelectedVehicle(vehiclesData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    setConnectionStatus('connected');
    
    // Set up real-time simulation interval (simulating Firebase RTDB updates)
    const interval = setInterval(simulateUpdates, 3000); // Faster updates for real-time feel
    return () => clearInterval(interval);
  }, []);
  
  // Simulate real-time updates (simulating Firebase RTDB data from STM32)
  const simulateUpdates = async () => {
    try {
      setConnectionStatus('connecting');
      const res = await fetch('/api/simulate', { method: 'POST' });
      const data = await res.json();
      setVehicles(data);
      setLastDataUpdate(new Date());
      setConnectionStatus('connected');
      
      if (selectedVehicle) {
        const updated = data.find((v: Vehicle) => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (error) {
      console.error('Real-time update failed:', error);
      setConnectionStatus('error');
    }
  };
  
  // Acknowledge alert
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, []);
  
  // Toggle driving context
  const handleToggleContext = useCallback(async () => {
    if (!selectedVehicle) return;
    
    const newContext = selectedVehicle.drivingContext === 'city' ? 'highway' : 'city';
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateContext',
          vehicleId: selectedVehicle.id,
          context: newContext
        })
      });
      const updated = await res.json();
      setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
      setSelectedVehicle(updated);
    } catch (error) {
      console.error('Failed to update context:', error);
    }
  }, [selectedVehicle]);
  
  // Report issue
  const handleReportIssue = useCallback(async (data: { vehicleId: string; driverName: string; issueType: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }) => {
    try {
      const res = await fetch('/api/driver-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const newFeedback = await res.json();
      setFeedbacks(prev => [newFeedback, ...prev]);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, []);
  
  // Run learning
  const handleRunLearning = useCallback(async () => {
    try {
      const res = await fetch('/api/learning', { method: 'POST' });
      const insight = await res.json();
      setLearningInsights(prev => [insight, ...prev]);
    } catch (error) {
      console.error('Failed to run learning:', error);
    }
  }, []);
  
  // Toggle rule
  const handleToggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, updates: { enabled } })
      });
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  }, []);
  
  // Update feedback status
  const handleUpdateFeedbackStatus = useCallback(async (feedbackId: string, status: 'pending' | 'acknowledged' | 'resolved') => {
    try {
      const res = await fetch('/api/driver-feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status })
      });
      const updated = await res.json();
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? updated : f));
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  }, []);
  
  // Add vehicle
  const handleAddVehicle = useCallback(async (vehicleData: {
    name: string;
    type: string;
    category: string;
    licensePlate: string;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
  }) => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          vehicle: vehicleData
        })
      });
      
      if (res.ok) {
        const newVehicle = await res.json();
        setVehicles(prev => [...prev, newVehicle]);
        setShowAddVehicle(false);
      }
    } catch (error) {
      console.error('Failed to add vehicle:', error);
    }
  }, []);
  
  // Remove vehicle
  const handleRemoveVehicle = useCallback(async (vehicleId: string) => {
    try {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', vehicleId })
      });
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(vehicles[0]);
      }
    } catch (error) {
      console.error('Failed to remove vehicle:', error);
    }
  }, [selectedVehicle, vehicles]);
  
  // Set vehicle priority
  const handleSetPriority = useCallback(async (vehicleId: string, priority: 'high' | 'medium' | 'low') => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setPriority', vehicleId, priority })
      });
      const updated = await res.json();
      setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(updated);
      }
    } catch (error) {
      console.error('Failed to set priority:', error);
    }
  }, [selectedVehicle]);
  
  // Handle PDF upload result
  const handlePDFUploaded = useCallback((result: { vehicle: Vehicle; analysis: PDFAnalysisResult; notification?: { title: string; message: string } }) => {
    setVehicles(prev => prev.map(v => v.id === result.vehicle.id ? result.vehicle : v));
    setSelectedVehicle(result.vehicle);
    
    // Add all RL insights
    const newInsights = result.analysis.rlModelUpdate.patternsLearned.map((pattern, i) => ({
      id: `insight-pdf-${Date.now()}-${i}`,
      type: 'new_pattern' as const,
      message: `RL Learned: ${pattern}`,
      confidence: result.analysis.rlModelUpdate.confidenceLevel,
      timestamp: new Date()
    }));
    setLearningInsights(prev => [...newInsights, ...prev]);
    
    // Show RL notification
    if (result.notification || result.analysis.rlModelUpdate.patternsLearned.length > 0) {
      setRlNotification({
        show: true,
        title: result.notification?.title || '🤖 AI Learning Updated',
        message: result.notification?.message || `RL model learned ${result.analysis.rlModelUpdate.patternsLearned.length} new pattern(s) from service report.`
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => setRlNotification(null), 5000);
    }
  }, []);
  
  // Fetch service records when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      fetch(`/api/service-history/${selectedVehicle.id}`)
        .then(res => res.json())
        .then(setServiceRecords)
        .catch(console.error);
    }
  }, [selectedVehicle]);
  
  // Role icons
  const roleIcons = {
    driver: <User className="w-5 h-5" />,
    mechanic: <Wrench className="w-5 h-5" />,
    fleet_manager: <LayoutDashboard className="w-5 h-5" />
  };
  
  const roleLabels = {
    driver: 'Driver',
    mechanic: 'Mechanic',
    fleet_manager: 'Fleet Manager'
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="glass-card p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          </motion.div>
          <p className="text-lg font-medium">Initializing Vehicle System...</p>
          <p className="text-sm text-muted-foreground mt-2">Loading health data</p>
        </motion.div>
      </div>
    );
  }
  
  const criticalCount = vehicles.filter(v => v.healthStatus === 'critical').length;
  const warningCount = vehicles.filter(v => v.healthStatus === 'warning').length;
  
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Vehicle Health</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Diagnostics</p>
              </div>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex bg-white/5 dark:bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                {[
                  { id: 'role', label: 'Role View', icon: <User className="w-4 h-4" /> },
                  { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-4 h-4" /> },
                  { id: 'map', label: 'Map', icon: <MapIcon className="w-4 h-4" /> }
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id as typeof currentView)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === view.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {view.icon}
                    <span>{view.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Role Switcher */}
              {currentView === 'role' && (
                <div className="flex bg-white/5 dark:bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                  {(Object.keys(roleLabels) as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => setCurrentRole(role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentRole === role
                          ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      {roleIcons[role]}
                      <span>{roleLabels[role]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Real-time Connection Status */}
              <ConnectionStatusIndicator 
                status={connectionStatus} 
                lastUpdated={lastDataUpdate}
                compact
              />
              
              {/* Data Flow Indicator */}
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
                <DataFlowIndicator isActive={connectionStatus === 'connected'} />
              </div>
              
              {/* Status indicator */}
              <motion.div 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-white/5"
                animate={criticalCount > 0 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: criticalCount > 0 ? Infinity : 0 }}
              >
                <span className={`w-2 h-2 rounded-full ${
                  criticalCount > 0 ? 'bg-red-500' : warningCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                } ${criticalCount > 0 ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">
                  {criticalCount > 0 ? `${criticalCount} Critical` : warningCount > 0 ? `${warningCount} Warning` : 'All Good'}
                </span>
              </motion.div>
              
              {/* Notifications */}
              <motion.button
                className="relative p-2 rounded-xl glass-button"
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                {alerts.filter(a => !a.acknowledged).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alerts.filter(a => !a.acknowledged).length}
                  </span>
                )}
              </motion.button>
              
              {/* Theme Toggle */}
              {mounted && (
                <motion.button
                  className="p-2 rounded-xl glass-button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <Sun className="w-5 h-5 text-amber-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Moon className="w-5 h-5 text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
              
              {/* Add Vehicle Button */}
              {vehicles.length < 6 && currentRole === 'fleet_manager' && (
                <motion.button
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium shadow-lg shadow-primary/30"
                  onClick={() => setShowAddVehicle(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Vehicle
                </motion.button>
              )}
              
              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 rounded-xl glass-button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              className="absolute right-4 top-full mt-2 w-80 glass-card-dark p-4 z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="p-2 rounded-lg bg-white/5 flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.type === 'critical' ? 'bg-red-500' : 
                      alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.vehicleName}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No notifications</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Role Views */}
          {currentView === 'role' && (
            <motion.div
              key="role-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {currentRole === 'driver' && (
                <DriverView
                  vehicle={selectedVehicle}
                  allVehicles={vehicles}
                  onSelectVehicle={setSelectedVehicle}
                  onReportIssue={handleReportIssue}
                  onToggleContext={handleToggleContext}
                  onSetPriority={handleSetPriority}
                  onAddVehicle={() => setShowAddVehicle(true)}
                  onPDFUploaded={handlePDFUploaded}
                />
              )}
              {currentRole === 'mechanic' && (
                <MechanicView
                  vehicles={vehicles}
                  serviceRecords={serviceRecords}
                  alerts={alerts}
                />
              )}
              {currentRole === 'fleet_manager' && (
                <FleetManagerView
                  vehicles={vehicles}
                  alerts={alerts}
                  insights={learningInsights}
                  rules={rules}
                  feedbacks={feedbacks}
                  onRunLearning={handleRunLearning}
                  onToggleRule={handleToggleRule}
                  onUpdateFeedbackStatus={handleUpdateFeedbackStatus}
                />
              )}
            </motion.div>
          )}
          
          {/* Vehicle Dashboard */}
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VehicleDashboard
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={setSelectedVehicle}
                onRemoveVehicle={handleRemoveVehicle}
              />
            </motion.div>
          )}
          
          {/* Map View */}
          {currentView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-200px)]"
            >
              <MechanicMap
                shops={mechanicShops}
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Map Section - Show for role view */}
        {currentView === 'role' && (
          <motion.div 
            className="mt-6 h-[350px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MechanicMap
              shops={mechanicShops}
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
            />
          </motion.div>
        )}
      </main>
      
      {/* Footer - Desktop */}
      <footer className="hidden md:block glass-card border-t border-white/10 py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Vehicle Health Evaluation System v2.0
              </p>
              {/* Firebase Status Badge */}
              <FirebaseStatusBadge status={connectionStatus} />
            </div>
            <div className="flex items-center gap-4">
              {lastDataUpdate && (
                <span className="text-xs text-muted-foreground">
                  Last sync: {lastDataUpdate.toLocaleTimeString()}
                </span>
              )}
              <p className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  criticalCount > 0 ? 'bg-red-400 animate-pulse' :
                  warningCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {criticalCount > 0 ? `${criticalCount} Critical Alerts` : 'All Systems Normal'}
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Mobile Navigation */}
      <MobileNav
        currentView={currentView}
        currentRole={currentRole}
        onViewChange={setCurrentView}
        onRoleChange={setCurrentRole}
        onAddVehicle={() => setShowAddVehicle(true)}
        canAddVehicle={vehicles.length < 6}
      />
      
      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onAdd={handleAddVehicle}
      />
      
      {/* Mobile Menu */}
      <MobileMenuModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentRole={currentRole}
        currentView={currentView}
        onRoleChange={(role) => {
          setCurrentRole(role);
          setCurrentView('role');
        }}
        onViewChange={setCurrentView}
        theme={mounted ? theme : 'dark'}
        onThemeChange={setTheme}
      />
      
      {/* RL Learning Notification Toast */}
      <AnimatePresence>
        {rlNotification && (
          <motion.div
            className="fixed bottom-24 md:bottom-8 right-4 z-50 max-w-sm"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            <div className="glass-card-dark p-4 border border-purple-500/30 shadow-lg shadow-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-400">{rlNotification.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{rlNotification.message}</p>
                </div>
                <button
                  onClick={() => setRlNotification(null)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add Vehicle Modal
function AddVehicleModal({ isOpen, onClose, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; type: string; category: string; licensePlate: string; make?: string; model?: string; year?: number; mileage?: number }) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sedan',
    category: 'car' as 'car' | 'two-wheeler' | 'heavy',
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0
  });
  
  const vehicleTypes = {
    car: ['sedan', 'suv', 'hatchback'],
    'two-wheeler': ['motorcycle', 'scooter'],
    heavy: ['truck', 'bus', 'van']
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.licensePlate) return;
    onAdd({
      name: formData.name,
      type: formData.type,
      category: formData.category,
      licensePlate: formData.licensePlate,
      make: formData.make || undefined,
      model: formData.model || undefined,
      year: formData.year || undefined,
      mileage: formData.mileage || undefined
    });
    setFormData({ 
      name: '', 
      type: 'sedan', 
      category: 'car', 
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0
    });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card-dark p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold gradient-text">Add New Vehicle</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Vehicle Name */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Vehicle Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                  placeholder="e.g., City Cruiser"
                />
              </div>
              
              {/* License Plate */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">License Plate *</label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                  placeholder="e.g., AB-1234"
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['car', 'two-wheeler', 'heavy'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat, type: vehicleTypes[cat][0] })}
                      className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                        formData.category === cat
                          ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      {cat === 'car' && <Car className="w-5 h-5" />}
                      {cat === 'two-wheeler' && <Bike className="w-5 h-5" />}
                      {cat === 'heavy' && <Truck className="w-5 h-5" />}
                      {cat === 'two-wheeler' ? 'Two-Wheeler' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Type */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {vehicleTypes[formData.category].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        formData.type === type
                          ? 'bg-primary/30 text-primary border border-primary/50'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Make & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={e => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                    placeholder="e.g., Toyota"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                    placeholder="e.g., Camry"
                  />
                </div>
              </div>
              
              {/* Year & Mileage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                    placeholder="e.g., 2023"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Current Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage || ''}
                    onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                    placeholder="e.g., 50000"
                    min={0}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/10 text-foreground font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.licensePlate}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium disabled:opacity-50 shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Vehicle
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mobile Menu Modal
function MobileMenuModal({ isOpen, onClose, currentRole, currentView, onRoleChange, onViewChange, theme, onThemeChange }: {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentView: string;
  onRoleChange: (role: UserRole) => void;
  onViewChange: (view: 'role' | 'dashboard' | 'map') => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}) {
  const roleIcons = {
    driver: <User className="w-5 h-5" />,
    mechanic: <Wrench className="w-5 h-5" />,
    fleet_manager: <LayoutDashboard className="w-5 h-5" />
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-80 glass-card-dark p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold gradient-text">Menu</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Views */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">View</p>
              <div className="space-y-2">
                {[
                  { id: 'role', label: 'Role View', icon: <User className="w-5 h-5" /> },
                  { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-5 h-5" /> },
                  { id: 'map', label: 'Map', icon: <MapIcon className="w-5 h-5" /> }
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => {
                      onViewChange(view.id as 'role' | 'dashboard' | 'map');
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      currentView === view.id
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {view.icon}
                    <span>{view.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Roles */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Role</p>
              <div className="space-y-2">
                {(Object.keys({ driver: '', mechanic: '', fleet_manager: '' }) as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(role);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      currentRole === role
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {roleIcons[role]}
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Theme */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Theme</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                    theme === 'light' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  Light
                </button>
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                    theme === 'dark' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  Dark
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
