import WebSocket from 'ws';
import crypto from 'crypto';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:45397';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'MzLeAvE5uphx5w6WzwFHxJQdP1s4OalJ';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

interface GatewayMessage {
  type?: string;
  event?: string;
  id?: string;
  [key: string]: unknown;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

interface AgentSession {
  id: string;
  agentId?: string;
  status: 'active' | 'idle' | 'complete' | 'failed';
  createdAt: number;
  lastActivity: number;
  taskCount: number;
}

interface QueuedTask {
  id: string;
  agentId?: string;
  task: string;
  systemPrompt?: string;
  dependsOn?: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * OpenClawClient — proper gateway protocol with challenge/response auth
 * Supports multi-agent orchestration with session tracking and task queue
 */
class OpenClawClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, PendingRequest>();
  private reconnectAttempts = 0;
  private listeners = new Map<string, Set<(data: GatewayMessage) => void>>();
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isAuthenticated = false;

  // Session management
  private sessions = new Map<string, AgentSession>();
  private sessionCounter = 0;

  // Task queue for orchestration
  private taskQueue: QueuedTask[] = [];
  private runningTasks = new Map<string, QueuedTask>();

  constructor() {}

  // ─────────────────────────────────────────────────────────────────────────
  // Connection & Auth
  // ─────────────────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
        resolve();
        return;
      }

      const wsUrl = GATEWAY_URL.includes('://') ? GATEWAY_URL : `ws://${GATEWAY_URL}`;
      console.log(`[OpenClaw] Connecting to ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        console.error('[OpenClaw] Failed to create WebSocket:', error);
        reject(error);
        return;
      }

      const rejectTimer = setTimeout(() => {
        reject(new Error('Challenge timeout'));
      }, 15000);

      this.ws.onopen = () => {
        console.log('[OpenClaw] WebSocket opened, waiting for challenge...');
      };

      this.ws.onmessage = (event) => {
        const msg: GatewayMessage = JSON.parse(event.data as string);

        // Challenge from gateway
        if (msg.event === 'connect.challenge') {
          clearTimeout(rejectTimer);
          this.handleChallenge(msg.payload as { nonce: string; ts: number });
          resolve();
        }

        // Hello snapshot on successful auth
        if (msg.event === 'hello') {
          this.isAuthenticated = true;
          this.reconnectAttempts = 0;
          this.startPing();
          this.processHelloSnapshot(msg.payload as { snapshot?: unknown; agents?: unknown[]; sessions?: unknown[] });
        }

        // Handle pending requests
        if (msg.id && this.pendingRequests.has(msg.id as string)) {
          this.handleResponse(msg);
        }

        // Handle events
        if (msg.event && this.listeners.has(msg.event)) {
          const listeners = this.listeners.get(msg.event)!;
          listeners.forEach(cb => { try { cb(msg); } catch (e) { console.error(e); } });
        }

        // Handle task.progress events for running tasks
        if (msg.event === 'task.progress' && msg.id) {
          this.handleTaskProgress(msg);
        }

        // Handle task.complete
        if (msg.event === 'task.complete' && msg.id) {
          this.handleTaskComplete(msg);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[OpenClaw] WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log(`[OpenClaw] Disconnected: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.isAuthenticated = false;
        this.stopPing();
        this.attemptReconnect();
      };
    });
  }

  private handleChallenge(payload: { nonce: string; ts: number }) {
    const sigPayload = `token:${GATEWAY_TOKEN}|nonce:${payload.nonce}|ts:${payload.ts}`;
    const signature = crypto.createHmac('sha256', GATEWAY_TOKEN)
      .update(sigPayload)
      .digest('hex');

    this.send('connect', {
      minProtocol: 3,
      maxProtocol: 3,
      client: { id: 'abacus-mc', version: '1.0.0', platform: 'nextjs', mode: 'api' },
      role: 'operator',
      scopes: ['operator.admin', 'agent.invoke', 'session.list', 'session.create'],
      auth: { token: GATEWAY_TOKEN },
      locale: 'en-GB',
      caps: [],
      commands: [],
      permissions: {},
    }).then((res: unknown) => {
      const r = res as { ok?: boolean };
      if (r.ok) {
        console.log('[OpenClaw] Authenticated successfully');
        this.isConnected = true;
      } else {
        console.error('[OpenClaw] Auth failed:', res);
      }
    }).catch((err) => {
      console.error('[OpenClaw] Auth error:', err);
    });
  }

  private processHelloSnapshot(payload: { agents?: unknown[]; sessions?: unknown[] }) {
    const snap = payload || {};
    const agents = (snap.agents || []) as Array<{ id: string; name?: string }>;
    const sessions = (snap.sessions || []) as Array<{ id: string; agentId?: string }>;

    // Register existing sessions
    for (const s of sessions) {
      this.sessions.set(s.id, {
        id: s.id,
        agentId: s.agentId,
        status: 'active',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        taskCount: 0,
      });
    }
    console.log(`[OpenClaw] Hello: ${agents.length} agents, ${sessions.length} sessions`);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[OpenClaw] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    console.log(`[OpenClaw] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${this.reconnectAttempts})...`);
    setTimeout(() => { this.connect().catch(console.error); }, RECONNECT_DELAY);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Message Handling
  // ─────────────────────────────────────────────────────────────────────────

  private send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const id = `${Date.now()}-${++this.messageId}`;
      const message: GatewayMessage = { type: 'req', id, method, params };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify(message));
    });
  }

  // Public request method for ad-hoc gateway queries
  async request<T = unknown>(method: string, params: Record<string, unknown> = {}, timeout = 30000): Promise<T> {
    return this.send(method, params) as Promise<T>;
  }

  private handleResponse(msg: GatewayMessage) {
    const id = msg.id as string;
    if (!this.pendingRequests.has(id)) return;
    const pending = this.pendingRequests.get(id)!;
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);

    if (msg.type === 'error') {
      pending.reject(new Error((msg.error as string) || 'Unknown error'));
    } else {
      pending.resolve(msg);
    }
  }

  private handleTaskProgress(msg: GatewayMessage) {
    const taskId = msg.id as string;
    const task = this.runningTasks.get(taskId);
    if (task) {
      task.startedAt = Date.now();
      const listeners = this.listeners.get('task.progress');
      listeners?.forEach(cb => { try { cb({ ...msg, taskId }); } catch (e) { console.error(e); } });
    }
  }

  private handleTaskComplete(msg: GatewayMessage) {
    const taskId = msg.id as string;
    const task = this.runningTasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = msg.result as string;
      task.completedAt = Date.now();
      this.runningTasks.delete(taskId);
      this.processQueue();
      const listeners = this.listeners.get('task.complete');
      listeners?.forEach(cb => { try { cb({ ...msg, taskId }); } catch (e) { console.error(e); } });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Invoke an agent task via the gateway
   * @param task The task description
   * @param agentId Optional specific agent ID (defaults to any available)
   * @param systemPrompt Optional system prompt override
   * @param sessionId Optional session ID (creates new if not provided)
   */
  async agentInvoke(
    task: string,
    agentId?: string,
    systemPrompt?: string,
    sessionId?: string
  ): Promise<{ sessionId: string; taskId: string; status: string }> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      await this.connect();
    }

    // Create or use session
    const sid = sessionId || this.createSession(agentId);

    const taskId = `${sid}-${Date.now()}`;

    // Build invoke payload
    const payload: Record<string, unknown> = {
      task,
      streaming: true,
    };
    if (agentId) payload.agentId = agentId;
    if (systemPrompt) payload.systemPrompt = systemPrompt;
    if (sessionId) payload.sessionId = sessionId;

    try {
      // Send invoke request
      const response = await this.send('agent.invoke', payload) as Record<string, unknown>;
      
      // Track running task
      const queuedTask: QueuedTask = {
        id: taskId,
        agentId,
        task,
        systemPrompt,
        status: 'running',
        createdAt: Date.now(),
        startedAt: Date.now(),
      };
      this.runningTasks.set(taskId, queuedTask);

      return {
        sessionId: sid,
        taskId,
        status: (response.status as string) || 'dispatched',
      };
    } catch (error) {
      throw new Error(`agentInvoke failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Invoke multiple agents in sequence (DAG execution)
   * Each task waits for its dependencies to complete
   */
  async invokeSequence(tasks: Array<{
    task: string;
    agentId?: string;
    systemPrompt?: string;
    dependsOn?: string[];
  }>): Promise<Array<{ taskId: string; sessionId: string; status: string }>> {
    const results: Array<{ taskId: string; sessionId: string; status: string }> = [];
    const taskIdMap = new Map<string, string>();

    for (const t of tasks) {
      // Resolve dependencies
      if (t.dependsOn) {
        for (const dep of t.dependsOn) {
          const depTaskId = taskIdMap.get(dep);
          if (depTaskId) {
            // Wait for dependency
            await this.waitForTask(depTaskId);
          }
        }
      }

      const result = await this.agentInvoke(t.task, t.agentId, t.systemPrompt);
      taskIdMap.set(t.task, result.taskId);
      results.push(result);
    }

    return results;
  }

  /**
   * Invoke multiple agents in parallel
   */
  async invokeParallel(tasks: Array<{
    task: string;
    agentId?: string;
    systemPrompt?: string;
  }>): Promise<Array<{ taskId: string; sessionId: string; status: string }>> {
    return Promise.all(tasks.map(t => this.agentInvoke(t.task, t.agentId, t.systemPrompt)));
  }

  private waitForTask(taskId: string, timeoutMs = 120000): Promise<void> {
    return new Promise((resolve, reject) => {
      const task = this.runningTasks.get(taskId);
      if (!task) {
        resolve(); // Task already completed or never existed
        return;
      }

      const timeout = setTimeout(() => {
        this.listeners.get('task.complete')?.forEach(cb => {
          // Remove listener if timeout
        });
        reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const originalCb = (...args: unknown[]) => {
        clearTimeout(timeout);
        resolve();
      };

      this.on('task.complete', originalCb as (data: GatewayMessage) => void);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────────────────

  createSession(agentId?: string): string {
    const id = `session-${++this.sessionCounter}-${Date.now()}`;
    this.sessions.set(id, {
      id,
      agentId,
      status: 'active',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      taskCount: 0,
    });
    return id;
  }

  getSession(id: string): AgentSession | undefined {
    return this.sessions.get(id);
  }

  listSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }

  closeSession(id: string): void {
    this.sessions.delete(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Task Queue (for orchestration)
  // ─────────────────────────────────────────────────────────────────────────

  enqueueTask(task: {
    task: string;
    agentId?: string;
    systemPrompt?: string;
    dependsOn?: string[];
  }): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queuedTask: QueuedTask = {
      id,
      agentId: task.agentId,
      task: task.task,
      systemPrompt: task.systemPrompt,
      dependsOn: task.dependsOn,
      status: 'queued',
      createdAt: Date.now(),
    };
    this.taskQueue.push(queuedTask);
    this.processQueue();
    return id;
  }

  getTaskStatus(taskId: string): QueuedTask | undefined {
    return this.runningTasks.get(taskId) || this.taskQueue.find(t => t.id === taskId);
  }

  private processQueue() {
    // Filter out completed/failed tasks from queue
    this.taskQueue = this.taskQueue.filter(t => t.status === 'queued');

    // Process next task if slot available
    if (this.runningTasks.size < 5) { // Max 5 concurrent
      const next = this.taskQueue.shift();
      if (next) {
        this.agentInvoke(next.task, next.agentId, next.systemPrompt).then(() => {
          next.status = 'completed';
        }).catch((err) => {
          next.status = 'failed';
          next.error = err.message;
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event Listeners
  // ─────────────────────────────────────────────────────────────────────────

  on(event: string, callback: (data: GatewayMessage) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: GatewayMessage) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.sessions.clear();
    this.taskQueue = [];
    this.runningTasks.clear();
  }

  get connected() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  get authenticated() {
    return this.isAuthenticated;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────────────────────────

let client: OpenClawClient | null = null;

export function getGatewayClient(): OpenClawClient {
  if (!client) {
    client = new OpenClawClient();
  }
  return client;
}

export function resetGatewayClient() {
  if (client) { client.disconnect(); client = null; }
}

export type { AgentSession, QueuedTask };