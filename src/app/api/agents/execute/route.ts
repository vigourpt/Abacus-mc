import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAgentBySlug, createTask, updateTaskStatus, getTaskById } from '@/lib/db';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExecuteRequest {
  agentSlug: string;
  task: string;
}

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

    // Start async execution
    executeAgentTask(taskId, agent.content, body.task).catch(err => {
      console.error(`Task ${taskId} failed:`, err);
      updateTaskStatus(taskId, 'failed', undefined, err.message);
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

async function executeAgentTask(taskId: string, agentContent: string, userTask: string): Promise<void> {
  updateTaskStatus(taskId, 'running');

  try {
    const client = getGatewayClient();
    
    // Extract system prompt from agent markdown content
    // The agent content contains markdown with system prompt instructions
    const systemPrompt = extractSystemPrompt(agentContent);
    
    // Execute via gateway
    const result = await client.agentInvoke(
      userTask,
      undefined, // Use default agent
      systemPrompt || undefined
    );

    updateTaskStatus(taskId, 'completed', result.result);
  } catch (error) {
    console.error(`Task ${taskId} execution error:`, error);
    updateTaskStatus(taskId, 'failed', undefined, error instanceof Error ? error.message : String(error));
  }
}

function extractSystemPrompt(agentContent: string): string {
  // The agent content is markdown - extract the core instructions
  // Typically the system prompt is at the top before any markdown headers
  
  // Remove common frontmatter
  let content = agentContent.replace(/^---[\s\S]*?---\n/, '');
  
  // If there's a # Role or # Persona section, extract everything before it as system prompt
  const roleMatch = content.match(/^#\s+(?:Role|Persona|Agent)[\s\S]*?$/mi);
  
  if (roleMatch && roleMatch.index && roleMatch.index > 0) {
    return content.slice(0, roleMatch.index).trim();
  }
  
  // Otherwise return the whole content as the system prompt
  return content.trim();
}
