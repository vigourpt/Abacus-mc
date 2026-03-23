import { NextResponse } from 'next/server';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getGatewayClient();
    
    // Try to get channel info from the gateway
    const channels = await client.request<{
      channels: Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        connected: boolean;
      }>;
    }>('channels.list', {}, 10000);

    return NextResponse.json(channels.channels || []);
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    
    // Return mock data if gateway is not available
    return NextResponse.json([
      { id: '1', name: 'Telegram', type: 'telegram', status: 'connected', connected: true },
      { id: '2', name: 'WhatsApp', type: 'whatsapp', status: 'disconnected', connected: false },
    ]);
  }
}
