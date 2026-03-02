import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const alerts = store.getAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;
    
    if (alertId) {
      const alert = store.acknowledgeAlert(alertId);
      if (alert) {
        return NextResponse.json(alert);
      }
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
  }
}
