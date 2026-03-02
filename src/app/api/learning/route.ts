import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const insights = store.getLearningInsights();
    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch learning insights' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const insight = store.runLearning();
    return NextResponse.json(insight);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to run learning' }, { status: 500 });
  }
}
