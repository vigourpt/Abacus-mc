// =====================================================
// Mock OpenClaw Server for Testing
// Phase 3: Full OpenClaw Integration
// =====================================================

import { WebSocketServer, WebSocket } from 'ws';
import { createChildLogger } from '../logger';

const logger = createChildLogger('mock-openclaw');

interface MockMessage {
  id: string;
  type: string;
  payload: unknown;
  timestamp?: number;
  signature?: string;
}

interface MockServerOptions {
  port?: number;
  authDelay?: number;
  simulateLatency?: number;
  failAuth?: boolean;
  disconnectAfter?: number;
}

/**
 * Mock OpenClaw Server for testing
 * Simulates the OpenClaw gateway for integration tests
 */
export class MockOpenClawServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private options: MockServerOptions;
  private messageHistory: MockMessage[] = [];
  private syncedAgents: Map<string, unknown> = new Map();
  private subscribedChannels: Map<WebSocket, Set<string>> = new Map();

  constructor(options: MockServerOptions = {}) {
    this.options = {
      port: options.port || 18789,
      authDelay: options.authDelay || 100,
      simulateLatency: options.simulateLatency || 50,
      failAuth: options.failAuth || false,
      disconnectAfter: options.disconnectAfter,
    };
  }

  /**
   * Start the mock server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.options.port,
          path: '/v3/control',
        });

        this.wss.on('connection', (ws, req) => {
          logger.info({ url: req.url }, 'Mock client connected');
          this.handleConnection(ws);
        });

        this.wss.on('listening', () => {
          logger.info({ port: this.options.port }, 'Mock OpenClaw server started');
          resolve();
        });

        this.wss.on('error', (error) => {
          logger.error({ error }, 'Mock server error');
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the mock server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all clients
      for (const client of this.clients) {
        client.close(1000, 'Server shutting down');
      }
      this.clients.clear();

      if (this.wss) {
        this.wss.close(() => {
          logger.info('Mock OpenClaw server stopped');
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get message history for assertions
   */
  getMessageHistory(): MockMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Get synced agents
   */
  getSyncedAgents(): Map<string, unknown> {
    return new Map(this.syncedAgents);
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(type: string, payload: unknown): void {
    const message: MockMessage = {
      id: `server-${Date.now()}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Simulate a channel message
   */
  simulateChannelMessage(
    channelId: string,
    senderId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    this.broadcast('channel_message', {
      channelId,
      senderId,
      senderName: `User ${senderId}`,
      content,
      timestamp: Date.now(),
      metadata,
    });
  }

  // =====================================================
  // Private Methods
  // =====================================================

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    this.subscribedChannels.set(ws, new Set());

    ws.on('message', (data) => {
      this.handleMessage(ws, data.toString());
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.subscribedChannels.delete(ws);
      logger.info('Mock client disconnected');
    });

    // Auto-disconnect if configured
    if (this.options.disconnectAfter) {
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(4000, 'Test disconnect');
        }
      }, this.options.disconnectAfter);
    }
  }

  private async handleMessage(ws: WebSocket, data: string): Promise<void> {
    try {
      const message = JSON.parse(data) as MockMessage;
      this.messageHistory.push(message);

      // Simulate latency
      if (this.options.simulateLatency) {
        await this.sleep(this.options.simulateLatency);
      }

      switch (message.type) {
        case 'ping':
          this.handlePing(ws, message);
          break;
        case 'auth':
          await this.handleAuth(ws, message);
          break;
        case 'agent_sync':
          this.handleAgentSync(ws, message);
          break;
        case 'channel_subscribe':
          this.handleChannelSubscribe(ws, message);
          break;
        case 'channel_unsubscribe':
          this.handleChannelUnsubscribe(ws, message);
          break;
        case 'channel_message':
          this.handleChannelMessage(ws, message);
          break;
        default:
          logger.warn({ type: message.type }, 'Unknown message type');
      }

    } catch (error) {
      logger.error({ error, data }, 'Failed to process message');
    }
  }

  private handlePing(ws: WebSocket, message: MockMessage): void {
    this.send(ws, {
      id: message.id,
      type: 'pong',
      payload: { timestamp: Date.now() },
    });
  }

  private async handleAuth(ws: WebSocket, message: MockMessage): Promise<void> {
    // Simulate auth delay
    if (this.options.authDelay) {
      await this.sleep(this.options.authDelay);
    }

    if (this.options.failAuth) {
      this.send(ws, {
        id: message.id,
        type: 'auth_response',
        payload: {
          success: false,
          error: 'Authentication failed (test mode)',
        },
      });
      return;
    }

    const authPayload = message.payload as { deviceId: string; publicKey: string };

    this.send(ws, {
      id: message.id,
      type: 'auth_response',
      payload: {
        success: true,
        sessionId: `session-${authPayload.deviceId}-${Date.now()}`,
        expiresAt: Date.now() + 3600000,
      },
    });

    logger.info({ deviceId: authPayload.deviceId }, 'Mock auth successful');
  }

  private handleAgentSync(ws: WebSocket, message: MockMessage): void {
    const payload = message.payload as {
      action?: string;
      agentId?: string;
      slug?: string;
      name?: string;
    };

    switch (payload.action) {
      case 'list':
        this.send(ws, {
          id: message.id,
          type: 'agent_sync_response',
          payload: {
            success: true,
            action: 'list',
            agents: Array.from(this.syncedAgents.values()),
          },
        });
        break;

      case 'delete':
        this.syncedAgents.delete(payload.agentId || '');
        this.send(ws, {
          id: message.id,
          type: 'agent_sync_response',
          payload: {
            success: true,
            action: 'delete',
            agentId: payload.agentId,
          },
        });
        break;

      default:
        // Default: sync/upsert agent
        const agentId = payload.slug || payload.agentId || `agent-${Date.now()}`;
        this.syncedAgents.set(agentId, payload);
        this.send(ws, {
          id: message.id,
          type: 'agent_sync_response',
          payload: {
            success: true,
            action: 'sync',
            agentId,
          },
        });
        logger.info({ agentId }, 'Agent synced to mock server');
    }
  }

  private handleChannelSubscribe(ws: WebSocket, message: MockMessage): void {
    const payload = message.payload as { channelId: string };
    const channels = this.subscribedChannels.get(ws) || new Set();
    channels.add(payload.channelId);
    this.subscribedChannels.set(ws, channels);

    this.send(ws, {
      id: message.id,
      type: 'system',
      payload: {
        event: 'channel_subscribed',
        channelId: payload.channelId,
      },
    });

    logger.info({ channelId: payload.channelId }, 'Channel subscribed');
  }

  private handleChannelUnsubscribe(ws: WebSocket, message: MockMessage): void {
    const payload = message.payload as { channelId: string };
    const channels = this.subscribedChannels.get(ws);
    if (channels) {
      channels.delete(payload.channelId);
    }

    this.send(ws, {
      id: message.id,
      type: 'system',
      payload: {
        event: 'channel_unsubscribed',
        channelId: payload.channelId,
      },
    });

    logger.info({ channelId: payload.channelId }, 'Channel unsubscribed');
  }

  private handleChannelMessage(ws: WebSocket, message: MockMessage): void {
    const payload = message.payload as {
      channelId: string;
      content: string;
      agentId: string;
    };

    // Echo message back to subscribers (simulating channel delivery)
    for (const [client, channels] of this.subscribedChannels.entries()) {
      if (channels.has(payload.channelId) && client !== ws) {
        this.send(client, {
          id: `echo-${message.id}`,
          type: 'channel_message',
          payload: {
            channelId: payload.channelId,
            senderId: payload.agentId,
            senderName: `Agent ${payload.agentId}`,
            content: payload.content,
            timestamp: Date.now(),
          },
        });
      }
    }

    logger.info(
      { channelId: payload.channelId, agentId: payload.agentId },
      'Channel message processed'
    );
  }

  private send(ws: WebSocket, message: MockMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Helper to create and start a mock server
export async function createMockServer(
  options?: MockServerOptions
): Promise<MockOpenClawServer> {
  const server = new MockOpenClawServer(options);
  await server.start();
  return server;
}

export default MockOpenClawServer;
