import { NextResponse } from 'next/server';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getGatewayClient();
    
    // Try to get gateway status by making a simple request
    // If the gateway is reachable, it will be connected
    try {
      await client.request('ping', {}, 5000);
      return NextResponse.json({
        gateway: {
          connected: true
        }
      });
    } catch {
      // Gateway not reachable or not connected
      return NextResponse.json({
        gateway: {
          connected: false
        }
      });
    }
  } catch (error) {
    console.error('Failed to get gateway status:', error);
    return NextResponse.json({
      gateway: {
        connected: false
      }
    });
  }
}
