import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import type { Vehicle, VehicleMetrics } from '@/lib/types';

// API endpoint to sync local store with Firebase data
// This is called when Firebase pushes new data

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, vehicleId, data } = body;

    switch (action) {
      case 'updateMetrics':
        // Update vehicle metrics from Firebase/STM32
        const updatedVehicle = store.updateVehicleMetrics(vehicleId, {
          engineTemp: data.engineTemp,
          oilPressure: data.oilPressure,
          batteryVoltage: data.batteryVoltage,
          mileage: data.mileage,
          fuelLevel: data.fuelLevel,
          tirePressure: data.tirePressure,
          engineRPM: data.engineRPM,
          errorCodes: data.errorCodes || [],
          brakeFluidLevel: data.brakeFluidLevel,
          chainTension: data.chainTension,
          timestamp: new Date()
        });
        
        if (updatedVehicle) {
          // Return updated health predictions for Firebase
          return NextResponse.json({
            success: true,
            vehicle: {
              id: updatedVehicle.id,
              healthScore: updatedVehicle.healthScore,
              healthStatus: updatedVehicle.healthStatus,
              predictedFailureDays: updatedVehicle.predictedFailureDays,
              riskTrend: updatedVehicle.riskTrend
            }
          });
        }
        break;

      case 'getVehicles':
        const vehicles = store.getVehicles();
        return NextResponse.json({ vehicles });

      case 'getVehicle':
        const vehicle = store.getVehicle(vehicleId);
        return NextResponse.json({ vehicle });

      case 'runRL':
        const insight = store.runLearning();
        return NextResponse.json({ insight });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  } catch (error) {
    console.error('Firebase sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');

  if (vehicleId) {
    const vehicle = store.getVehicle(vehicleId);
    return NextResponse.json({ vehicle });
  }

  const vehicles = store.getVehicles();
  return NextResponse.json({ vehicles });
}
