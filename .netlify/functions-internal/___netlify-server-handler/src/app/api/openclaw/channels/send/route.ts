import { NextResponse } from 'next/server';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { channelId, message } = await request.json();
    
    if (!channelId || !message) {
      return NextResponse.json(
        { error: 'channelId and message are required' },
        { status: 400 }
      );
    }

    const client = getGatewayClient();
    
    const result = await client.request<{
      success: boolean;
      messageId?: string;
    }>('channels.send', {
      channelId,
      message,
    }, 30000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
