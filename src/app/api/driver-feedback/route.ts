import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const feedbacks = store.getDriverFeedbacks();
    return NextResponse.json(feedbacks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, driverName, issueType, severity, description } = body;
    
    if (!vehicleId || !driverName || !issueType || !severity || !description) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    
    const feedback = store.addDriverFeedback({
      vehicleId,
      driverName,
      issueType,
      severity,
      description
    });
    
    return NextResponse.json(feedback);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackId, status } = body;
    
    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Feedback ID and status required' }, { status: 400 });
    }
    
    const feedback = store.updateFeedbackStatus(feedbackId, status);
    if (feedback) {
      return NextResponse.json(feedback);
    }
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
