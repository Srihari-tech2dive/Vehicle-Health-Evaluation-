'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, EmergencyProtocol, SafeModeRecommendation, PDFAnalysisResult } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Fuel, 
  Battery, 
  Thermometer,
  Gauge,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Building2,
  Route,
  X,
  Upload,
  FileText,
  Sparkles,
  Plus,
  Star,
  Car,
  Bike,
  Truck,
  Loader2,
  Check,
  MoreHorizontal,
  MinusCircle
} from 'lucide-react';
import { HealthGauge } from '@/components/vehicle/VehicleCard';
import { issueTypes } from '@/lib/store';

interface DriverViewProps {
  vehicle: Vehicle | undefined;
  allVehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onReportIssue: (data: { vehicleId: string; driverName: string; issueType: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }) => void;
  onToggleContext: () => void;
  onSetPriority: (vehicleId: string, priority: 'high' | 'medium' | 'low') => void;
  onAddVehicle: () => void;
  onPDFUploaded: (result: { vehicle: Vehicle; analysis: PDFAnalysisResult }) => void;
}

export function DriverView({ 
  vehicle, 
  allVehicles, 
  onSelectVehicle, 
  onToggleContext, 
  onSetPriority,
  onAddVehicle,
  onPDFUploaded
}: DriverViewProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showMoreVehicles, setShowMoreVehicles] = useState(false);
  const [emergencyData, setEmergencyData] = useState<{ protocol: EmergencyProtocol; safeMode: SafeModeRecommendation | null } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfAnalysisResult, setPdfAnalysisResult] = useState<PDFAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [feedbackForm, setFeedbackForm] = useState({
    driverName: '',
    issueType: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: ''
  });
  
  // Track selected vehicles (up to 3) with order
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  // Sound alert for critical issues
  useEffect(() => {
    if (vehicle?.healthStatus === 'critical' && soundEnabled) {
      const playAlert = () => {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 200);
      };
      
      playAlert();
      const interval = setInterval(playAlert, 2000);
      
      return () => clearInterval(interval);
    }
  }, [vehicle?.healthStatus, soundEnabled]);
  
  const canDrive = vehicle && vehicle.healthStatus !== 'critical';
  
  const handleEmergency = async () => {
    if (!vehicle) return;
    
    const issueType = vehicle.metrics.engineTemp > 100 ? 'engineTemp' :
                      vehicle.metrics.oilPressure < 25 ? 'oilPressure' :
                      vehicle.metrics.batteryVoltage < 12 ? 'batteryVoltage' :
                      vehicle.metrics.tirePressure < 28 ? 'tirePressure' : 'engineTemp';
    
    try {
      const res = await fetch(`/api/emergency-protocol/${issueType}`);
      const data = await res.json();
      setEmergencyData(data);
      setShowEmergencyModal(true);
    } catch (error) {
      console.error('Failed to fetch emergency protocol:', error);
    }
  };
  
  const handleSubmitFeedback = () => {
    if (!vehicle || !feedbackForm.issueType || !feedbackForm.description) return;
    
    onReportIssue({
      vehicleId: vehicle.id,
      driverName: feedbackForm.driverName || 'Anonymous',
      issueType: feedbackForm.issueType,
      severity: feedbackForm.severity,
      description: feedbackForm.description
    });
    
    setFeedbackForm({ driverName: '', issueType: '', severity: 'medium', description: '' });
    setShowFeedbackModal(false);
  };
  
  const handleVehicleSelect = (v: Vehicle) => {
    // Add to selected list (max 3)
    setSelectedVehicles(prev => {
      const newSelected = prev.filter(id => id !== v.id);
      if (newSelected.length < 3) {
        newSelected.push(v.id);
      } else {
        // Remove first and add new
        newSelected.shift();
        newSelected.push(v.id);
      }
      return newSelected;
    });
    
    onSelectVehicle(v);
    onSetPriority(v.id, 'high');
  };
  
  const handleDeactivateVehicle = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVehicles(prev => prev.filter(id => id !== v.id));
    onSetPriority(v.id, 'medium');
  };
  
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;
    
    setIsUploading(true);
    setShowPDFModal(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleId', vehicle.id);
      
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        setPdfAnalysisResult(data.analysis);
        onPDFUploaded(data);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const getVehicleIcon = (category: string) => {
    switch (category) {
      case 'two-wheeler': return <Bike className="w-4 h-4" />;
      case 'heavy': return <Truck className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };
  
  const getSelectionOrder = (vehicleId: string) => {
    return selectedVehicles.indexOf(vehicleId);
  };
  
  const getPriorityColor = (vehicleId: string) => {
    const order = getSelectionOrder(vehicleId);
    if (order === -1) return null;
    if (order === selectedVehicles.length - 1) return 'last'; // Most recent
    if (order === 0) return 'first';
    if (order === 1) return 'second';
    return 'third';
  };
  
  // Sort vehicles: selected ones first (by order), then others
  const sortedVehicles = [...allVehicles].sort((a, b) => {
    const aIndex = selectedVehicles.indexOf(a.id);
    const bIndex = selectedVehicles.indexOf(b.id);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
  
  // Split vehicles: first 4 visible, rest in "more"
  const visibleVehicles = sortedVehicles.slice(0, 4);
  const moreVehicles = sortedVehicles.slice(4);
  
  // Format battery voltage to 2 decimal places
  const formatBattery = (voltage: number) => voltage.toFixed(2);
  
  return (
    <div className="space-y-6">
      {/* 1st: Driving Mode Toggle - PROMINENT AT TOP */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-6 border-2 border-primary/30 shadow-xl shadow-primary/10">
          {/* Animated background gradient */}
          <div className={`absolute inset-0 opacity-10 ${vehicle?.drivingContext === 'highway' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`p-3 rounded-2xl ${vehicle?.drivingContext === 'highway' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {vehicle?.drivingContext === 'highway' 
                    ? <Route className="w-7 h-7 text-white" /> 
                    : <Building2 className="w-7 h-7 text-white" />
                  }
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Driving Mode</p>
                  <p className="text-2xl font-bold">
                    {vehicle?.drivingContext === 'highway' ? '🛣️ Highway Mode' : '🏙️ City Mode'}
                  </p>
                </div>
              </div>
              
              {/* Large Toggle Switch */}
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium transition-colors ${vehicle?.drivingContext === 'city' ? 'text-amber-400 scale-110' : 'text-muted-foreground'}`}>
                  City
                </span>
                
                <motion.button
                  onClick={onToggleContext}
                  className={`relative w-28 h-14 rounded-full transition-all duration-300 shadow-lg ${
                    vehicle?.drivingContext === 'highway' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/40' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!vehicle}
                >
                  <motion.div
                    className="absolute top-1.5 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center"
                    animate={{ left: vehicle?.drivingContext === 'highway' ? '58px' : '6px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {vehicle?.drivingContext === 'highway' 
                      ? <Route className="w-5 h-5 text-blue-500" /> 
                      : <Building2 className="w-5 h-5 text-amber-500" />
                    }
                  </motion.div>
                </motion.button>
                
                <span className={`text-sm font-medium transition-colors ${vehicle?.drivingContext === 'highway' ? 'text-blue-400 scale-110' : 'text-muted-foreground'}`}>
                  Highway
                </span>
              </div>
            </div>
            
            {/* Mode info */}
            {vehicle && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  <span>Temp threshold: <span className="font-semibold text-foreground">{vehicle.drivingContext === 'highway' ? '105°C' : '100°C'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Context-aware evaluation <span className="text-emerald-400">active</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* 2nd: Quick Actions - Sound & PDF Upload */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all glass-card ${
            soundEnabled 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-white/5 text-muted-foreground border border-white/10'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
        
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all glass-card"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!vehicle}
        >
          <Upload className="w-5 h-5" />
          Upload Service PDF
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePDFUpload}
          className="hidden"
        />
        
        {vehicle?.serviceReportAnalyzed && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            <FileText className="w-4 h-4" />
            PDF Analyzed
          </div>
        )}
      </div>
      
      {/* 3rd: Go/No-Go Indicator */}
      {!vehicle ? (
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Select a vehicle to view its status</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="glass-card p-8 text-center gradient-border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-6">
              <motion.div
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                  canDrive ? 'go-indicator' : 'no-go-indicator'
                }`}
                animate={canDrive ? {} : { scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: canDrive ? 0 : Infinity }}
              >
                {canDrive ? (
                  <CheckCircle className="w-16 h-16 text-white" />
                ) : (
                  <XCircle className="w-16 h-16 text-white" />
                )}
              </motion.div>
            </div>
            
            <h2 className={`text-3xl font-bold mb-2 ${canDrive ? 'text-emerald-400' : 'text-red-400'}`}>
              {canDrive ? '✅ SAFE TO DRIVE' : '⚠️ DO NOT DRIVE'}
            </h2>
            <p className="text-muted-foreground">
              {canDrive 
                ? 'Vehicle is in good condition for operation'
                : 'Critical issues detected. Vehicle needs attention.'}
            </p>
            
            {!canDrive && (
              <motion.button
                className="mt-4 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl flex items-center gap-2 mx-auto shadow-lg shadow-red-500/30"
                onClick={handleEmergency}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AlertTriangle className="w-5 h-5" />
                Emergency Protocol
              </motion.button>
            )}
          </motion.div>
          
          {/* 4th: Vehicle Status Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{vehicle.name}</h3>
                  {getSelectionOrder(vehicle.id) !== -1 && (
                    <Star className={`w-5 h-5 ${
                      getPriorityColor(vehicle.id) === 'last' ? 'text-rose-400' :
                      getPriorityColor(vehicle.id) === 'first' ? 'text-amber-400' :
                      'text-cyan-400'
                    }`} />
                  )}
                </div>
                <p className="text-muted-foreground">{vehicle.licensePlate}</p>
              </div>
              <HealthGauge score={vehicle.healthScore} size={100} />
            </div>
            
            {/* PDF Analysis Badge */}
            {vehicle.serviceReportAnalyzed && vehicle.serviceReportInsights && (
              <motion.div
                className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">PDF Analysis Applied</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {vehicle.serviceReportInsights.slice(0, 2).map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-purple-400 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickMetric 
                icon={<Thermometer className="w-5 h-5" />}
                label="Engine Temp"
                value={`${vehicle.metrics.engineTemp}°C`}
                warning={vehicle.metrics.engineTemp > (vehicle.drivingContext === 'highway' ? 105 : 100)}
                threshold={vehicle.drivingContext === 'highway' ? 105 : 100}
              />
              <QuickMetric 
                icon={<Gauge className="w-5 h-5" />}
                label="Oil Pressure"
                value={`${vehicle.metrics.oilPressure} PSI`}
                warning={vehicle.metrics.oilPressure < 25}
                threshold={25}
              />
              <QuickMetric 
                icon={<Fuel className="w-5 h-5" />}
                label="Fuel Level"
                value={`${vehicle.metrics.fuelLevel}%`}
                warning={vehicle.metrics.fuelLevel < 20}
                threshold={20}
              />
              <QuickMetric 
                icon={<Battery className="w-5 h-5" />}
                label="Battery"
                value={`${formatBattery(vehicle.metrics.batteryVoltage)}V`}
                warning={vehicle.metrics.batteryVoltage < 12}
                threshold={12}
              />
            </div>
            
            {/* Expandable detailed metrics */}
            <button
              className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpandedMetrics(!expandedMetrics)}
            >
              {expandedMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expandedMetrics ? 'Less Details' : 'More Details'}
            </button>
            
            <AnimatePresence>
              {expandedMetrics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Mileage</p>
                      <p className="font-semibold number-display">{vehicle.metrics.mileage.toLocaleString()} km</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Tire Pressure</p>
                      <p className="font-semibold number-display">{vehicle.metrics.tirePressure} PSI</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Engine RPM</p>
                      <p className="font-semibold number-display">{vehicle.metrics.engineRPM}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Last Service</p>
                      <p className="font-semibold number-display">{vehicle.metrics.lastServiceMileage.toLocaleString()} km</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      
      {/* 5th: Vehicle Selector */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-muted-foreground">
            Select Vehicle ({selectedVehicles.length}/3 active)
          </label>
          <motion.button
            onClick={onAddVehicle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </motion.button>
        </div>
        
        {/* Priority Legend */}
        {selectedVehicles.length > 0 && (
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="text-muted-foreground">Active:</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>1st</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>2nd</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>3rd (Current)</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleVehicles.map(v => {
            const selectionOrder = getSelectionOrder(v.id);
            const isSelected = selectionOrder !== -1;
            const priorityColor = getPriorityColor(v.id);
            
            return (
              <motion.button
                key={v.id}
                onClick={() => handleVehicleSelect(v)}
                className={`relative p-4 rounded-xl text-left transition-all overflow-hidden ${
                  vehicle?.id === v.id 
                    ? 'bg-gradient-to-r from-primary/30 to-purple-500/30 border-2 border-primary shadow-lg shadow-primary/20' 
                    : isSelected
                      ? priorityColor === 'last' 
                        ? 'bg-rose-500/10 border-2 border-rose-500/40'
                        : priorityColor === 'first'
                          ? 'bg-amber-500/10 border-2 border-amber-500/40'
                          : 'bg-cyan-500/10 border-2 border-cyan-500/40'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSelected && (
                  <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full ${
                    priorityColor === 'last' ? 'bg-rose-500/30' :
                    priorityColor === 'first' ? 'bg-amber-500/30' :
                    'bg-cyan-500/30'
                  }`} />
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getVehicleIcon(v.category)}
                    <p className="font-semibold">{v.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          priorityColor === 'last' ? 'bg-rose-500/30 text-rose-400' :
                          priorityColor === 'first' ? 'bg-amber-500/30 text-amber-400' :
                          'bg-cyan-500/30 text-cyan-400'
                        }`}>
                          #{selectionOrder + 1}
                        </span>
                        <motion.button
                          onClick={(e) => handleDeactivateVehicle(v, e)}
                          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MinusCircle className="w-4 h-4 text-muted-foreground hover:text-red-400" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">{v.licensePlate}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    v.healthStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                    v.healthStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {v.healthScore}% Health
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {/* More Vehicles Button */}
        {moreVehicles.length > 0 && (
          <motion.button
            onClick={() => setShowMoreVehicles(true)}
            className="w-full mt-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <MoreHorizontal className="w-4 h-4" />
            {moreVehicles.length} more vehicle{moreVehicles.length > 1 ? 's' : ''}
          </motion.button>
        )}
      </div>
      
      {/* Action Buttons */}
      {vehicle && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            className="glass-button p-4 rounded-xl flex items-center justify-center gap-2"
            onClick={() => setShowFeedbackModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageSquare className="w-5 h-5" />
            Report Issue
          </motion.button>
          <motion.button
            className="glass-button p-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
            onClick={handleEmergency}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Emergency Help
          </motion.button>
        </div>
      )}
      
      {/* Error Codes Warning */}
      {vehicle && vehicle.metrics.errorCodes.length > 0 && (
        <motion.div 
          className="glass-card p-4 border border-red-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-400">Error Codes Detected</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicle.metrics.errorCodes.map((code, i) => (
                  <span key={i} className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/30 font-mono">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleSubmitFeedback}
        form={feedbackForm}
        setForm={setFeedbackForm}
      />
      
      {/* Emergency Modal */}
      <EmergencyModalComponent
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        data={emergencyData}
      />
      
      {/* PDF Analysis Modal */}
      <PDFAnalysisModal
        isOpen={showPDFModal}
        onClose={() => {
          setShowPDFModal(false);
          setPdfAnalysisResult(null);
        }}
        isLoading={isUploading}
        result={pdfAnalysisResult}
      />
      
      {/* More Vehicles Modal */}
      <MoreVehiclesModal
        isOpen={showMoreVehicles}
        onClose={() => setShowMoreVehicles(false)}
        vehicles={moreVehicles}
        selectedVehicles={selectedVehicles}
        onSelect={handleVehicleSelect}
        onDeactivate={handleDeactivateVehicle}
        getSelectionOrder={getSelectionOrder}
        getPriorityColor={getPriorityColor}
        getVehicleIcon={getVehicleIcon}
      />
    </div>
  );
}

function QuickMetric({ icon, label, value, warning, threshold }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: boolean;
  threshold?: number;
}) {
  return (
    <motion.div 
      className={`p-3 rounded-xl transition-all ${warning ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}
      animate={warning ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1, repeat: warning ? Infinity : 0 }}
    >
      <div className={`flex items-center gap-2 mb-1 ${warning ? 'text-red-400' : 'text-muted-foreground'}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-lg font-semibold number-display ${warning ? 'text-red-400' : ''}`}>{value}</p>
      {threshold && (
        <p className="text-[10px] text-muted-foreground mt-0.5">Threshold: {threshold}{label.includes('Temp') ? '°C' : label.includes('Pressure') ? ' PSI' : label.includes('Fuel') ? '%' : 'V'}</p>
      )}
    </motion.div>
  );
}

function FeedbackModal({ isOpen, onClose, onSubmit, form, setForm }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: { driverName: string; issueType: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string };
  setForm: (form: { driverName: string; issueType: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }) => void;
}) {
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
            className="glass-card-dark p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold gradient-text">Report an Issue</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Your Name (Optional)</label>
                <input
                  type="text"
                  value={form.driverName}
                  onChange={e => setForm({ ...form, driverName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-foreground"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Issue Type *</label>
                <select
                  value={form.issueType}
                  onChange={e => setForm({ ...form, issueType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-foreground bg-transparent"
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map(type => (
                    <option key={type} value={type} className="bg-gray-900">{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setForm({ ...form, severity: level })}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        form.severity === level
                          ? level === 'critical' ? 'bg-red-500/30 text-red-400 border border-red-500/50' :
                            level === 'high' ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' :
                            level === 'medium' ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' :
                            'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                          : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-foreground min-h-[100px]"
                  placeholder="Describe the issue you're experiencing..."
                />
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
                onClick={onSubmit}
                disabled={!form.issueType || !form.description}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium disabled:opacity-50 shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Report
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EmergencyModalComponent({ isOpen, onClose, data }: {
  isOpen: boolean;
  onClose: () => void;
  data: { protocol: EmergencyProtocol; safeMode: SafeModeRecommendation | null } | null;
}) {
  return (
    <AnimatePresence>
      {isOpen && data && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card-dark p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{data.protocol.title}</h3>
                <p className="text-sm text-red-400">Emergency Protocol</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-4">Follow these steps:</h4>
              <div className="space-y-3">
                {data.protocol.steps.map((step, index) => (
                  <motion.div 
                    key={step.stepNumber} 
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {step.stepNumber}
                    </div>
                    <p className="text-muted-foreground pt-1">{step.instruction}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {data.safeMode && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                <h4 className="font-semibold text-amber-400 mb-2">⚠️ Safe Mode Recommendation</h4>
                <p className="text-sm text-muted-foreground">{data.safeMode.recommendedAction}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.safeMode.restrictions.map((r, i) => (
                    <span key={i} className="px-2 py-1 bg-white/10 text-xs rounded-lg">{r}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/10 text-foreground font-medium hover:bg-white/20 transition-colors"
              >
                Close
              </button>
              <motion.button 
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Find Mechanic
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PDFAnalysisModal({ isOpen, onClose, isLoading, result }: {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result: PDFAnalysisResult | null;
}) {
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
            className="glass-card-dark p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">PDF Analysis</h3>
                <p className="text-sm text-purple-400">AI-Powered Service Report Analysis</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-muted-foreground">Analyzing your service report...</p>
                <p className="text-xs text-muted-foreground mt-2">Using AI to extract health insights</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Health Impact */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400 mb-2">Health Score Impact</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${result.healthImpact.scoreAdjustment >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.healthImpact.scoreAdjustment >= 0 ? '+' : ''}{result.healthImpact.scoreAdjustment}
                    </span>
                    <span className="text-muted-foreground">points adjustment</span>
                  </div>
                </div>
                
                {/* Extracted Data */}
                {result.extractedData.serviceType && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Service Type</p>
                    <p className="font-medium">{result.extractedData.serviceType}</p>
                  </div>
                )}
                
                {/* Issues Found */}
                {result.extractedData.issuesFound && result.extractedData.issuesFound.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm font-medium text-amber-400 mb-2">Issues Found</p>
                    <ul className="space-y-1">
                      {result.extractedData.issuesFound.map((issue, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Insights */}
                <div>
                  <h4 className="text-sm font-medium mb-2">AI Insights</h4>
                  <ul className="space-y-2">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* RL Model Update */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-muted-foreground mb-2">RL Model Updated</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-400">Confidence:</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${result.rlModelUpdate.confidenceLevel * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-400">{Math.round(result.rlModelUpdate.confidenceLevel * 100)}%</span>
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/30"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MoreVehiclesModal({ 
  isOpen, 
  onClose, 
  vehicles, 
  selectedVehicles,
  onSelect, 
  onDeactivate,
  getSelectionOrder,
  getPriorityColor,
  getVehicleIcon
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicles: string[];
  onSelect: (v: Vehicle) => void;
  onDeactivate: (v: Vehicle, e: React.MouseEvent) => void;
  getSelectionOrder: (id: string) => number;
  getPriorityColor: (id: string) => string | null;
  getVehicleIcon: (category: string) => React.ReactNode;
}) {
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
            className="glass-card-dark p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">More Vehicles</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {vehicles.map(v => {
                const selectionOrder = getSelectionOrder(v.id);
                const isSelected = selectionOrder !== -1;
                const priorityColor = getPriorityColor(v.id);
                
                return (
                  <motion.button
                    key={v.id}
                    onClick={() => {
                      onSelect(v);
                      onClose();
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      isSelected
                        ? priorityColor === 'last' 
                          ? 'bg-rose-500/10 border-2 border-rose-500/40'
                          : priorityColor === 'first'
                            ? 'bg-amber-500/10 border-2 border-amber-500/40'
                            : 'bg-cyan-500/10 border-2 border-cyan-500/40'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getVehicleIcon(v.category)}
                        <div>
                          <p className="font-semibold">{v.name}</p>
                          <p className="text-xs text-muted-foreground">{v.licensePlate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          v.healthStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                          v.healthStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {v.healthScore}%
                        </span>
                        
                        {isSelected && (
                          <>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              priorityColor === 'last' ? 'bg-rose-500/30 text-rose-400' :
                              priorityColor === 'first' ? 'bg-amber-500/30 text-amber-400' :
                              'bg-cyan-500/30 text-cyan-400'
                            }`}>
                              #{selectionOrder + 1}
                            </span>
                            <motion.button
                              onClick={(e) => {
                                onDeactivate(v, e);
                              }}
                              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <MinusCircle className="w-4 h-4 text-muted-foreground hover:text-red-400" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
