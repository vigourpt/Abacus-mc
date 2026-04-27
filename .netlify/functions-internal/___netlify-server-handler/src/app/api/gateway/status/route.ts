import { NextResponse } from 'next/server';
import { getGatewayClient, type AgentSession } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:45397';

/**
 * GET /api/gateway/status
 * Check OpenClaw gateway connection status and list agents/sessions
 * Note: In serverless, WS connections to internal VPS gateway aren't possible
 * directly. This endpoint reports the configured gateway URL for client-side
 * WebSocket connection, and checks if the MC server can reach the gateway.
 */
export async function GET() {
  const client = getGatewayClient();

  // In serverless (Netlify), we can't make outbound WebSocket connections easily
  // The gateway is on the VPS internal network. Report configured state.
  const configuredUrl = GATEWAY_URL;
  const isLocalGateway = configuredUrl.includes('127.0.0.1') || configuredUrl.includes('localhost');

  let connected = false;
  let authenticated = false;
  let sessions: AgentSession[] = [];
  let error: string | undefined;

  // Only try to connect if gateway is external (not localhost/serverless-incompatible)
  if (!isLocalGateway && client.connected) {
    connected = true;
    authenticated = client.authenticated;
    sessions = client.listSessions();
  } else if (!isLocalGateway) {
    try {
      await client.connect();
      connected = client.connected;
      authenticated = client.authenticated;
      sessions = client.listSessions();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Connection failed';
    }
  } else {
    error = 'Gateway is on localhost/VPS internal network — not reachable from serverless';
  }

  return NextResponse.json({
    connected,
    authenticated,
    error,
    sessions: sessions.map(s => ({
      id: s.id,
      agentId: s.agentId,
      status: s.status,
      taskCount: s.taskCount,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
    })),
    gateway: configuredUrl,
    note: isLocalGateway
      ? 'For serverless deployment, set OPENCLAW_GATEWAY_URL to an externally accessible WebSocket endpoint (e.g., wss://gateway.vigourclaw.cloud). Client browser will connect directly to this URL.'
      : 'Attempting connection to gateway...',
  });
}

/**
 * POST /api/gateway/connect
 * Force a reconnection to the gateway
 */
export async function POST() {
  const client = getGatewayClient();

  try {
    if (client.connected) {
      client.disconnect();
    }
    await client.connect();
    return NextResponse.json({ connected: true, message: 'Reconnected successfully' });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    }, { status: 500 });
  }
}