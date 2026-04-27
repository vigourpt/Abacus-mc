import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTask, updateTaskStatus, logActivity } from '@/lib/db';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OrchestrationTask {
  id?: string;           // Optional client-provided ID
  agentSlug?: string;   // Optional — if provided, use agent's system prompt
  task: string;         // Task description
  systemPrompt?: string; // Optional override
  dependsOn?: string[];  // IDs of tasks that must complete first
}

interface OrchestrateRequest {
  workflowName?: string;
  tasks: OrchestrationTask[];
  mode?: 'parallel' | 'sequence' | 'dag';
}

/**
 * POST /api/orchestrate
 * Orchestrate multiple agent tasks in parallel, sequence, or DAG mode
 * 
 * Example body:
 * {
 *   "workflowName": "Content Pipeline",
 *   "mode": "dag",
 *   "tasks": [
 *     { "id": "research", "task": "Find top 5 AI trends", "systemPrompt": "You are a research agent" },
 *     { "id": "write", "task": "Write article about #{research.output}", "dependsOn": ["research"] },
 *     { "id": "publish", "task": "Publish to blog", "dependsOn": ["write"] }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: OrchestrateRequest = await request.json();

    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty tasks array' },
        { status: 400 }
      );
    }

    const workflowId = uuidv4();
    const mode = body.mode || 'dag';

    logActivity('workflow.started', `Workflow ${workflowId} started (mode: ${mode}, ${body.tasks.length} tasks)`, undefined, workflowId);

    // Create workflow master task
    const masterTaskId = uuidv4();
    createTask(masterTaskId, 'orchestrator', `Workflow: ${body.workflowName || 'unnamed'}`);

    // Track results
    const results: Array<{
      id: string;
      taskId: string;
      status: string;
      error?: string;
    }> = [];

    // Connect to gateway
    const client = getGatewayClient();
    if (!client.connected) {
      await client.connect();
    }

    if (mode === 'parallel') {
      // Execute all tasks in parallel
      const parallelResults = await executeParallel(client, body.tasks, workflowId);
      results.push(...parallelResults);
    } else if (mode === 'sequence') {
      // Execute tasks in order
      const seqResults = await executeSequence(client, body.tasks, workflowId);
      results.push(...seqResults);
    } else {
      // DAG mode — resolve dependencies and execute
      const dagResults = await executeDag(client, body.tasks, workflowId);
      results.push(...dagResults);
    }

    updateTaskStatus(masterTaskId, 'completed', JSON.stringify({ results }));
    logActivity('workflow.completed', `Workflow ${workflowId} completed (${results.length} tasks)`, undefined, workflowId);

    return NextResponse.json({
      workflowId,
      masterTaskId,
      mode,
      taskCount: body.tasks.length,
      results,
    });
  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orchestrate?workflowId=xxx
 * Get status of a workflow and its tasks
 */
export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get('workflowId');
  if (!workflowId) {
    return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
  }

  // Return workflow status (would need a workflow tracking table for full impl)
  return NextResponse.json({
    workflowId,
    status: 'processed',
    message: 'Workflow status endpoint — integrate with workflow tracking table for full status',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Parallel execution
// ─────────────────────────────────────────────────────────────────────────

async function executeParallel(
  client: ReturnType<typeof getGatewayClient>,
  tasks: OrchestrationTask[],
  workflowId: string
): Promise<Array<{ id: string; taskId: string; status: string; error?: string }>> {
  const clientTasks = tasks.map(t => ({
    task: t.task,
    agentId: t.agentSlug,
    systemPrompt: t.systemPrompt,
  }));

  const invokeResults = await client.invokeParallel(clientTasks);

  return invokeResults.map((r, i) => ({
    id: tasks[i].id || `task-${i}`,
    taskId: r.taskId,
    status: 'dispatched',
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Sequence execution
// ─────────────────────────────────────────────────────────────────────────

async function executeSequence(
  client: ReturnType<typeof getGatewayClient>,
  tasks: OrchestrationTask[],
  workflowId: string
): Promise<Array<{ id: string; taskId: string; status: string; error?: string }>> {
  const results: Array<{ id: string; taskId: string; status: string; error?: string }> = [];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const taskId = uuidv4();
    createTask(taskId, t.agentSlug || 'orchestrator', t.task);

    try {
      const result = await client.agentInvoke(
        t.task,
        t.agentSlug,
        t.systemPrompt
      );

      results.push({
        id: t.id || `task-${i}`,
        taskId: result.taskId,
        status: 'completed',
      });
      updateTaskStatus(taskId, 'completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      results.push({
        id: t.id || `task-${i}`,
        taskId,
        status: 'failed',
        error: errorMessage,
      });
      updateTaskStatus(taskId, 'failed', undefined, errorMessage);
      logActivity('workflow.task_failed', `Task ${t.id || i} failed: ${errorMessage}`, undefined, workflowId);
      // Continue with remaining tasks in sequence
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────
// DAG execution (respects dependencies)
// ─────────────────────────────────────────────────────────────────────────

async function executeDag(
  client: ReturnType<typeof getGatewayClient>,
  tasks: OrchestrationTask[],
  workflowId: string
): Promise<Array<{ id: string; taskId: string; status: string; error?: string }>> {
  type TaskResult = { id: string; taskId: string; status: string; error?: string };

  const results: TaskResult[] = [];
  const taskMap = new Map<string, OrchestrationTask>();
  const taskResultMap = new Map<string, TaskResult>();

  // Build task map
  tasks.forEach((t, i) => {
    const id = t.id || `task-${i}`;
    taskMap.set(id, t);
  });

  // Build dependency graph
  const pending = new Set<string>();
  const completed = new Set<string>();

  tasks.forEach((t, i) => {
    const id = t.id || `task-${i}`;
    pending.add(id);
  });

  // Process tasks respecting dependencies
  while (pending.size > 0) {
    // Find tasks with all dependencies satisfied
    let scheduled = false;

    for (const taskId of pending) {
      const task = taskMap.get(taskId)!;
      const deps = task.dependsOn || [];

      const depsDone = deps.every(d => completed.has(d) && taskResultMap.get(d)?.status === 'completed');

      if (depsDone) {
        // Execute this task
        const result = await executeSingleTask(client, task, taskId);
        taskResultMap.set(taskId, result);
        results.push(result);
        pending.delete(taskId);
        if (result.status === 'completed') {
          completed.add(taskId);
        }
        scheduled = true;
        break; // Process one at a time to respect sequence within DAG
      }
    }

    if (!scheduled && pending.size > 0) {
      // Deadlock — tasks with unmet dependencies
      const stuck = Array.from(pending).map(id => {
        const t = taskMap.get(id)!;
        const unmetDeps = (t.dependsOn || []).filter(d => !completed.has(d));
        return `${id} (blocked by: ${unmetDeps.join(', ')})`;
      });
      logActivity('workflow.deadlock', `DAG deadlock detected: ${stuck.join('; ')}`, undefined, workflowId);
      break;
    }
  }

  return results;
}

async function executeSingleTask(
  client: ReturnType<typeof getGatewayClient>,
  task: OrchestrationTask,
  id: string
): Promise<{ id: string; taskId: string; status: string; error?: string }> {
  const dbTaskId = uuidv4();
  createTask(dbTaskId, task.agentSlug || 'orchestrator', task.task);

  try {
    const result = await client.agentInvoke(
      task.task,
      task.agentSlug,
      task.systemPrompt
    );

    updateTaskStatus(dbTaskId, 'completed');
    return {
      id,
      taskId: result.taskId,
      status: 'completed',
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    updateTaskStatus(dbTaskId, 'failed', undefined, errorMessage);
    return {
      id,
      taskId: dbTaskId,
      status: 'failed',
      error: errorMessage,
    };
  }
}