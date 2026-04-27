import { NextResponse } from 'next/server';
import { getGatewayClient, type AgentSession } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/gateway/status
 * Check OpenClaw gateway connection status and list agents/sessions
 */
export async function GET() {
  const client = getGatewayClient();

  let connected = false;
  let authenticated = false;
  let agents: string[] = [];
  let sessions: AgentSession[] = [];

  if (client.connected) {
    connected = true;
    authenticated = client.authenticated;
    sessions = client.listSessions();
    // Note: agent list would come from gateway hello snapshot
    // For now, return session info
  } else {
    // Try to connect
    try {
      await client.connect();
      connected = client.connected;
      authenticated = client.authenticated;
      sessions = client.listSessions();
    } catch (err) {
      return NextResponse.json({
        connected: false,
        authenticated: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        agents: [],
        sessions: [],
      });
    }
  }

  return NextResponse.json({
    connected,
    authenticated,
    agentCount: agents.length,
    sessions: sessions.map(s => ({
      id: s.id,
      agentId: s.agentId,
      status: s.status,
      taskCount: s.taskCount,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
    })),
    gateway: 'ws://127.0.0.1:45397',
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