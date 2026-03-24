import { NextResponse } from 'next/server';
import { getRecentActivity, logActivity } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activities = getRecentActivity(100);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { eventType, message, agentSlug, taskId, metadata } = await request.json();
    
    if (!eventType || !message) {
      return NextResponse.json(
        { error: 'eventType and message are required' },
        { status: 400 }
      );
    }

    logActivity(eventType, message, agentSlug, taskId, metadata);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
