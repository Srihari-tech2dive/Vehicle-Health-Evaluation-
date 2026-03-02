'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  Wrench, 
  Car, 
  Truck, 
  Bike,
  Navigation,
  X,
  RefreshCw
} from 'lucide-react';
import { MechanicShop, Vehicle } from '@/lib/types';

const shopColors = {
  general: '#10b981',
  specialist: '#f59e0b',
  authorized: '#6366f1'
};

interface MechanicMapProps {
  shops: MechanicShop[];
  vehicles: Vehicle[];
  selectedVehicle?: Vehicle;
}

// Leaflet type
type LMap = import('leaflet').Map;
type LMarker = import('leaflet').Marker;
type LDivIcon = import('leaflet').DivIcon;

export function MechanicMap({ shops, vehicles, selectedVehicle }: MechanicMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  
  // Load leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      LRef.current = (window as unknown as { L: typeof import('leaflet') }).L;
      setMapLoaded(true);
    };
    document.head.appendChild(script);
    
    return () => {
      // Cleanup link and script if needed
    };
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current || !LRef.current) return;
    
    const L = LRef.current;
    const map = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    mapInstanceRef.current = map;
    
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded]);
  
  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    
    const L = LRef.current;
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add vehicle markers
    vehicles.forEach(vehicle => {
      const color = vehicle.healthScore >= 75 ? '#10b981' : vehicle.healthScore >= 50 ? '#f59e0b' : '#ef4444';
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: #6366f1;
          border-radius: 50%;
          border: 3px solid ${color};
          box-shadow: 0 0 10px ${color};
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const marker = L.marker([vehicle.location.lat, vehicle.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px; padding: 8px;">
            <strong>${vehicle.name}</strong><br/>
            <small style="color: #888">${vehicle.licensePlate}</small><br/>
            <span style="color: ${color}; margin-top: 4px; display: inline-block;">
              Health: ${vehicle.healthScore}%
            </span>
          </div>
        `);
      
      markersRef.current.push(marker);
    });
    
    // Add shop markers
    shops.forEach(shop => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background: ${shopColors[shop.type]};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
      
      const marker = L.marker([shop.location.lat, shop.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px; padding: 8px;">
            <strong>${shop.name}</strong><br/>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
              <span style="color: #f59e0b">★</span> ${shop.rating}
            </div>
            <span style="color: ${shop.isOpen ? '#10b981' : '#ef4444'}; margin-top: 4px; display: inline-block;">
              ${shop.isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
        `);
      
      markersRef.current.push(marker);
    });
  }, [mapLoaded, vehicles, shops]);
  
  // Update map center
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedVehicle) return;
    mapInstanceRef.current.setView([selectedVehicle.location.lat, selectedVehicle.location.lng], 14);
  }, [selectedVehicle]);
  
  const getSpecializationIcon = (specs: string[]) => {
    if (specs.includes('car')) return <Car className="w-4 h-4" />;
    if (specs.includes('heavy')) return <Truck className="w-4 h-4" />;
    if (specs.includes('two-wheeler')) return <Bike className="w-4 h-4" />;
    return <Wrench className="w-4 h-4" />;
  };
  
  if (!mapLoaded) {
    return (
      <motion.div 
        className="glass-card overflow-hidden h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Nearby Mechanic Shops
            </h3>
          </div>
        </div>
        <div className="h-[calc(100%-60px)] flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="glass-card overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Nearby Mechanic Shops
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Auto-updates every 30 min
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative" style={{ height: 'calc(100% - 60px)' }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 glass-card-dark p-3 text-xs z-[1000]">
          <p className="font-medium mb-2 text-foreground">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
              <span className="text-muted-foreground">Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-muted-foreground">General Shop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-muted-foreground">Specialist</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
              <span className="text-muted-foreground">Authorized</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
