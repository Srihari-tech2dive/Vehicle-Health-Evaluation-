import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const shops = store.getMechanicShops();
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mechanic shops' }, { status: 500 });
  }
}
