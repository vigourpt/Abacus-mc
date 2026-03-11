// =====================================================
// OpenClaw Sync API - Sync agents to gateway
// POST /api/openclaw/sync
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  syncAllAgentsToOpenClaw,
  syncAgentToOpenClaw,
  pullAgentsFromOpenClaw,
  bidirectionalSync,
} from '@/lib/agent-sync';
import { getOpenClawClient } from '@/lib/openclaw-client';
import { createChildLogger } from '@/lib/logger';

const logger = createChildLogger('api-openclaw-sync');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'push', agentSlug } = body;

    const client = getOpenClawClient();

    // Check connection status
    if (client.getState() !== 'connected') {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to OpenClaw gateway',
          hint: 'Call POST /api/openclaw/connect first',
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'push':
        // Push all agents to OpenClaw
        result = await syncAllAgentsToOpenClaw();
        logger.info(result, 'Agents pushed to OpenClaw');
        return NextResponse.json({
          success: true,
          action: 'push',
          result,
        });

      case 'push_one':
        // Push single agent
        if (!agentSlug) {
          return NextResponse.json(
            { success: false, error: 'agentSlug required for push_one' },
            { status: 400 }
          );
        }
        const pushSuccess = await syncAgentToOpenClaw(agentSlug);
        return NextResponse.json({
          success: pushSuccess,
          action: 'push_one',
          agentSlug,
        });

      case 'pull':
        // Pull agents from OpenClaw
        const pulled = await pullAgentsFromOpenClaw();
        logger.info({ count: pulled }, 'Agents pulled from OpenClaw');
        return NextResponse.json({
          success: true,
          action: 'pull',
          pulled,
        });

      case 'bidirectional':
        // Full bidirectional sync
        result = await bidirectionalSync();
        logger.info(result, 'Bidirectional sync completed');
        return NextResponse.json({
          success: true,
          action: 'bidirectional',
          result,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['push', 'push_one', 'pull', 'bidirectional'],
          },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error({ error }, 'Sync failed');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
