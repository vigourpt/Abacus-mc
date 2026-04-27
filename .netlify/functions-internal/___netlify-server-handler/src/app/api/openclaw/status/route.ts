import { NextResponse } from 'next/server';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getGatewayClient();
    
    // Try to connect first if not connected
    if (!client.connected) {
      try {
        await client.connect();
      } catch (connectError) {
        console.error('[Status] Connection failed:', connectError);
        return NextResponse.json({
          gateway: {
            connected: false,
            error: 'Failed to connect to gateway'
          }
        });
      }
    }

    // Try to ping the gateway
    try {
      await client.request('ping', {}, 5000);
      return NextResponse.json({
        gateway: {
          connected: true,
          url: process.env.OPENCLAW_GATEWAY_URL || 'ws://localhost:45397'
        }
      });
    } catch (pingError) {
      console.error('[Status] Ping failed:', pingError);
      return NextResponse.json({
        gateway: {
          connected: client.connected,
          error: pingError instanceof Error ? pingError.message : 'Ping failed'
        }
      });
    }
  } catch (error) {
    console.error('[Status] Unexpected error:', error);
    return NextResponse.json({
      gateway: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
