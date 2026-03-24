import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:45397';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'MzLeAvE5uphx5w6WzwFHxJQdP1s4OalJ';

export interface GatewayMessage {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface GatewayResponse {
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

export type MessageHandler = (message: GatewayResponse | Record<string, unknown>) => void;

interface PendingRequest {
  resolve: (value: GatewayResponse['payload']) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout | null;
}

export class OpenClawGatewayClient {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectPromise: Promise<void> | null = null;
  private isConnected: boolean = false;
  private nonce: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  async connect(): Promise<void> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(GATEWAY_URL, {
          maxPayload: 25 * 1024 * 1024,
        });

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Gateway connection timeout'));
          this.cleanup();
        }, 10000);

        this.ws.on('open', () => {
          console.log('[Gateway] Connected to', GATEWAY_URL);
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message, {
              onConnect: () => {
                clearTimeout(connectionTimeout);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.connectPromise = null;
                resolve();
              },
              onChallenge: (nonce: string) => {
                this.nonce = nonce;
                this.sendConnect();
              },
              onResponse: (response: GatewayResponse) => {
                const pending = this.pendingRequests.get(response.id);
                if (pending) {
                  if (pending.timeout) clearTimeout(pending.timeout);
                  this.pendingRequests.delete(response.id);
                  if (response.ok) {
                    pending.resolve(response.payload);
                  } else {
                    pending.reject(new Error(response.error?.message || 'Unknown error'));
                  }
                }
              },
              onEvent: (event: Record<string, unknown>) => {
                this.messageHandlers.forEach(handler => handler({
                  id: '',
                  ok: true,
                  payload: event as Record<string, unknown>,
                }));
              },
            });
          } catch (err) {
            console.error('[Gateway] Failed to parse message:', err);
          }
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          console.log('[Gateway] Disconnected:', code, reason.toString());
          this.isConnected = false;
          this.flushPendingErrors(new Error(`Gateway closed (${code}): ${reason.toString()}`));
          this.scheduleReconnect();
        });

        this.ws.on('error', (err: Error) => {
          console.error('[Gateway] Error:', err.message);
          if (!this.isConnected) {
            clearTimeout(connectionTimeout);
            this.connectPromise = null;
            reject(err);
          }
        });

      } catch (err) {
        this.connectPromise = null;
        reject(err);
      }
    });

    return this.connectPromise;
  }

  private handleMessage(
    message: Record<string, unknown>,
    callbacks: {
      onConnect: () => void;
      onChallenge: (nonce: string) => void;
      onResponse: (response: GatewayResponse) => void;
      onEvent: (event: Record<string, unknown>) => void;
    }
  ): void {
    // Connect challenge
    if (message.event === 'connect.challenge' && typeof message.payload === 'object') {
      const payload = message.payload as { nonce?: string };
      if (payload.nonce) {
        callbacks.onChallenge(payload.nonce);
      }
      return;
    }

    // Hello/connect response
    if (message.method === 'connect' && message.type === 'resp') {
      callbacks.onConnect();
      return;
    }

    // Response
    if (message.id && (message.ok !== undefined || message.error !== undefined)) {
      callbacks.onResponse(message as unknown as GatewayResponse);
      return;
    }

    // Event
    if (message.event) {
      callbacks.onEvent(message);
      return;
    }
  }

  private sendConnect(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.nonce) {
      return;
    }

    const frame = {
      type: 'req',
      id: randomUUID(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'cli',
          displayName: 'Mission Control',
          version: '1.0.0',
          platform: process.platform,
          mode: 'backend',
        },
        role: 'operator',
        scopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'],
      },
    };

    this.ws.send(JSON.stringify(frame));
  }

  async request<T = unknown>(method: string, params: Record<string, unknown> = {}, timeoutMs: number = 60000): Promise<T> {
    await this.connect();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Gateway not connected');
    }

    const id = randomUUID();
    const frame: GatewayMessage = { type: 'req', id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Gateway request timeout for ${method}`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        timeout,
      });

      this.ws?.send(JSON.stringify(frame));
    });
  }

  async agentInvoke(message: string, agentId?: string, extraSystemPrompt?: string): Promise<{ runId: string; result: string }> {
    const result = await this.request<{
      runId: string;
      sessionId: string;
    }>('agent', {
      message,
      agentId: agentId || 'main',
      extraSystemPrompt,
      idempotencyKey: randomUUID(),
      timeout: 300000, // 5 minute timeout for agent tasks
    }, 300000);

    // Wait for task completion
    const completion = await this.waitForCompletion(result.runId, 300000);

    return {
      runId: result.runId,
      result: completion,
    };
  }

  private async waitForCompletion(runId: string, timeoutMs: number = 300000): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.request<{
        status: string;
        result?: string;
        statsLine?: string;
      }>('agent.wait', {
        runId,
        timeoutMs: Math.min(30000, timeoutMs - (Date.now() - startTime)),
      });

      if (status.status === 'ok' || status.status === 'completed') {
        return status.result || 'Task completed';
      }

      if (status.status === 'error' || status.status === 'timeout') {
        throw new Error(`Agent task ${status.status}: ${status.result}`);
      }

      // Wait a bit before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Agent task timed out');
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private flushPendingErrors(err: Error): void {
    for (const [, pending] of this.pendingRequests) {
      if (pending.timeout) clearTimeout(pending.timeout);
      pending.reject(err);
    }
    this.pendingRequests.clear();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gateway] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Gateway] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('[Gateway] Reconnect failed:', err.message);
      });
    }, delay);
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.connectPromise = null;
  }

  async disconnect(): Promise<void> {
    this.cleanup();
    this.flushPendingErrors(new Error('Gateway client stopped'));
  }
}

// Singleton instance
let clientInstance: OpenClawGatewayClient | null = null;

export function getGatewayClient(): OpenClawGatewayClient {
  if (!clientInstance) {
    clientInstance = new OpenClawGatewayClient();
  }
  return clientInstance;
}
