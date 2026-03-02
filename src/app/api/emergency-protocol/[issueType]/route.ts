import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueType: string }> }
) {
  try {
    const { issueType } = await params;
    const protocol = store.getEmergencyProtocol(issueType);
    const safeMode = store.getSafeModeRecommendation(issueType);
    
    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
    }
    
    return NextResponse.json({ protocol, safeMode });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch emergency protocol' }, { status: 500 });
  }
}
