import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const rules = store.getRules();
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;
    
    if (ruleId && updates) {
      const rule = store.updateRule(ruleId, updates);
      if (rule) {
        return NextResponse.json(rule);
      }
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Rule ID and updates required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}
