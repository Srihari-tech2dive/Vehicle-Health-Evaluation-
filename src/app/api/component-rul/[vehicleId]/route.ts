import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const rul = store.getComponentRUL(vehicleId);
    return NextResponse.json(rul);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch component RUL' }, { status: 500 });
  }
}
