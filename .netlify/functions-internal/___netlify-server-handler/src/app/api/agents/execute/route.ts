import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAgentBySlug, createTask, updateTaskStatus, getTaskById, logActivity } from '@/lib/db';
import { getGatewayClient, type AgentSession } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExecuteRequest {
  agentSlug: string;
  task: string;
  sessionId?: string;
  stream?: boolean;
}

interface InvokeResult {
  sessionId: string;
  taskId: string;
  status: string;
}

/**
 * POST /api/agents/execute
 * Execute a task via a specific agent (by slug)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();

    if (!body.agentSlug || !body.task) {
      return NextResponse.json(
        { error: 'Missing agentSlug or task' },
        { status: 400 }
      );
    }

    // Load agent definition from database
    const agent = getAgentBySlug(body.agentSlug);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${body.agentSlug}' not found` },
        { status: 404 }
      );
    }

    // Create task in database
    const taskId = uuidv4();
    createTask(taskId, body.agentSlug, body.task);
    logActivity('task.created', `Task queued for agent ${body.agentSlug}`, body.agentSlug, taskId);

    // Start async execution
    executeAgentTask(taskId, agent.content, body.task, body.sessionId).catch(err => {
      console.error(`Task ${taskId} failed:`, err);
      updateTaskStatus(taskId, 'failed', undefined, err.message);
      logActivity('task.failed', err.message, body.agentSlug, taskId);
    });

    return NextResponse.json({
      taskId,
      status: 'pending',
      message: 'Task created and queuing for execution',
    });
  } catch (error) {
    console.error('Execute error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/execute?taskId=xxx
 * Get task status and result
 */
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('taskId');
  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  const task = getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
    result: task.result,
    error: task.error,
    createdAt: task.created_at,
    completedAt: task.completed_at,
  });
}

// ─────────────────────────────────────────────────────────────────────────

async function executeAgentTask(
  taskId: string,
  agentContent: string,
  userTask: string,
  sessionId?: string
): Promise<void> {
  updateTaskStatus(taskId, 'running');
  logActivity('task.started', `Executing task via OpenClaw gateway`, undefined, taskId);

  try {
    const client = getGatewayClient();

    // Ensure connected and authenticated
    if (!client.connected) {
      await client.connect();
    }

    // Extract system prompt from agent markdown content
    const systemPrompt = extractSystemPrompt(agentContent);

    // Use provided session or create new one
    const sid = sessionId || client.createSession();

    // Invoke the agent via gateway
    const result = await client.agentInvoke(
      userTask,
      undefined, // let gateway pick available agent
      systemPrompt || undefined,
      sid
    ) as InvokeResult;

    // Update task with session info
    logActivity('task.dispatched', `Task dispatched to gateway (session: ${result.sessionId}, taskId: ${result.taskId})`, undefined, taskId);

    // For now, mark as completed since gateway handles async execution
    // In a full implementation, you'd stream results back via WebSocket
    updateTaskStatus(taskId, 'completed', JSON.stringify({
      sessionId: result.sessionId,
      taskId: result.taskId,
      status: result.status,
      gateway: 'managed',
    }));

    logActivity('task.completed', `Task completed via gateway`, undefined, taskId);
  } catch (error) {
    console.error(`Task ${taskId} execution error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateTaskStatus(taskId, 'failed', undefined, errorMessage);
    logActivity('task.error', errorMessage, undefined, taskId);
    throw error;
  }
}

function extractSystemPrompt(agentContent: string): string {
  // Remove frontmatter
  let content = agentContent.replace(/^---[\s\S]*?---\n/, '');
  // Extract everything before # Role / # Persona / # Agent header
  const roleMatch = content.match(/^#\s+(?:Role|Persona|Agent)[\s\S]*?$/mi);
  if (roleMatch && roleMatch.index && roleMatch.index > 0) {
    return content.slice(0, roleMatch.index).trim();
  }
  return content.trim();
}