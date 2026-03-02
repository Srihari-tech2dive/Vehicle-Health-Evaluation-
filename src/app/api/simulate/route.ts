import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST() {
  try {
    const vehicles = store.simulateUpdates();
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to simulate updates' }, { status: 500 });
  }
}
