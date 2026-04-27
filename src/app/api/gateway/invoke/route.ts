import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/gateway/invoke
 * Direct agent invocation via OpenClaw gateway
 * 
 * Body:
 * {
 *   "task": "Write a blog post about AI agents",
 *   "agentId": "optional-specific-agent-id",
 *   "systemPrompt": "Optional override",
 *   "sessionId": "optional-existing-session"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.task) {
      return NextResponse.json({ error: 'Missing task' }, { status: 400 });
    }

    const client = getGatewayClient();

    if (!client.connected) {
      await client.connect();
    }

    if (!client.authenticated) {
      return NextResponse.json(
        { error: 'Gateway authentication failed' },
        { status: 401 }
      );
    }

    const result = await client.agentInvoke(
      body.task,
      body.agentId,
      body.systemPrompt,
      body.sessionId
    );

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      taskId: result.taskId,
      status: result.status,
    });
  } catch (error) {
    console.error('Gateway invoke error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Invocation failed',
    }, { status: 500 });
  }
}

/**
 * GET /api/gateway/invoke?sessionId=xxx
 * List sessions or get specific session info
 */
export async function GET(request: NextRequest) {
  const client = getGatewayClient();
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (sessionId) {
    const session = client.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  // List all sessions
  return NextResponse.json({
    sessions: client.listSessions(),
    connected: client.connected,
    authenticated: client.authenticated,
  });
}

/**
 * DELETE /api/gateway/invoke?sessionId=xxx
 * Close a specific session
 */
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const client = getGatewayClient();
  client.closeSession(sessionId);

  return NextResponse.json({ success: true, sessionId });
}