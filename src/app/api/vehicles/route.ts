import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const vehicles = store.getVehicles();
    return NextResponse.json(vehicles);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, vehicleId, context, metrics, priority } = body;
    
    if (action === 'updateContext' && vehicleId && context) {
      const vehicle = store.setDrivingContext(vehicleId, context);
      if (vehicle) {
        return NextResponse.json(vehicle);
      }
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    if (action === 'updateMetrics' && vehicleId && metrics) {
      const vehicle = store.updateVehicleMetrics(vehicleId, metrics);
      if (vehicle) {
        return NextResponse.json(vehicle);
      }
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    if (action === 'add') {
      const newVehicle = store.addVehicle(body.vehicle);
      if (newVehicle) {
        return NextResponse.json(newVehicle);
      }
      return NextResponse.json({ error: 'Maximum 6 vehicles allowed' }, { status: 400 });
    }
    
    if (action === 'remove' && vehicleId) {
      const removed = store.removeVehicle(vehicleId);
      if (removed) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    if (action === 'setPriority' && vehicleId && priority) {
      const vehicle = store.setVehiclePriority(vehicleId, priority);
      if (vehicle) {
        return NextResponse.json(vehicle);
      }
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
