// =====================================================
// OpenClaw WebSocket Client - Enhanced Connection Manager
// Phase 3: Full OpenClaw Integration
// =====================================================

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { createChildLogger } from './logger';
import { getOrCreateDeviceIdentity, createAuthPayload, signMessage } from './device-identity';
import {
  getOpenClawConfig,
  getWebSocketUrl,
  OPENCLAW_PROTOCOL_VERSION,
  type OpenClawConnectionConfig,
} from './openclaw-config';
import type { DeviceIdentity, GatewayConnection } from '@/types';

const logger = createChildLogger('openclaw-client');

// Message types from/to OpenClaw
export interface OpenClawMessage {
  id: string;
  type: OpenClawMessageType;
  payload: unknown;
  timestamp?: number;
  signature?: string;
}

export type OpenClawMessageType =
  | 'auth'
  | 'auth_response'
  | 'ping'
  | 'pong'
  | 'channel_message'
  | 'agent_response'
  | 'agent_sync'
  | 'agent_sync_response'
  | 'channel_subscribe'
  | 'channel_unsubscribe'
  | 'error'
  | 'system';

// Queued message for offline handling
interface QueuedMessage {
  message: OpenClawMessage;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
  retries: number;
}

// Event types
export interface OpenClawClientEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  authenticated: () => void;
  authError: (error: Error) => void;
  message: (message: OpenClawMessage) => void;
  channelMessage: (channelId: string, message: unknown) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
  queueFull: () => void;
}

// Connection states
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Enhanced OpenClaw WebSocket Client
 * Features:
 * - Connection lifecycle management
 * - Automatic reconnection with exponential backoff
 * - Message queue for offline scenarios
 * - Ed25519 authentication
 * - Heartbeat/ping-pong
 * - Event-based architecture
 */
export class OpenClawClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: OpenClawConnectionConfig;
  private identity: DeviceIdentity;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pongTimer: NodeJS.Timeout | null = null;
  private messageQueue: QueuedMessage[] = [];
  private pendingResponses: Map<string, QueuedMessage> = new Map();
  private lastPingTime = 0;
  private latency = 0;
  private messageCounter = 0;

  constructor(config?: Partial<OpenClawConnectionConfig>) {
    super();
    const fullConfig = getOpenClawConfig();
    this.config = { ...fullConfig.connection, ...config };
    this.identity = getOrCreateDeviceIdentity();
    logger.info({ deviceId: this.identity.deviceId }, 'OpenClaw client initialized');
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): GatewayConnection {
    return {
      id: this.identity.deviceId,
      host: this.config.host,
      port: this.config.port,
      status: this.state === 'connected' ? 'connected' :
              this.state === 'connecting' || this.state === 'authenticating' ? 'connecting' :
              this.state === 'error' ? 'error' : 'disconnected',
      deviceIdentity: this.identity,
    };
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Connect to OpenClaw gateway
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      logger.info('Already connected or connecting');
      return;
    }

    this.state = 'connecting';
    const url = getWebSocketUrl(this.config);

    return new Promise((resolve, reject) => {
      try {
        const originUrl = process.env.OPENCLAW_ORIGIN_URL || process.env.NEXT_PUBLIC_APP_URL || '';
        const headers: Record<string, string> = {
          'X-OpenClaw-Version': OPENCLAW_PROTOCOL_VERSION.toString(),
          'X-Device-Id': this.identity.deviceId,
          'X-Public-Key': this.identity.publicKey,
        };
        if (originUrl) {
          headers['Origin'] = originUrl;
        }

        this.ws = new WebSocket(url, { headers });

        const connectionTimeout = setTimeout(() => {
          if (this.state === 'connecting') {
            this.handleError(new Error('Connection timeout'));
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.on('open', () => {
          clearTimeout(connectionTimeout);
          logger.info({ url }, 'WebSocket connected, authenticating...');
          this.state = 'authenticating';
          this.authenticate()
            .then(() => {
              this.state = 'connected';
              this.reconnectAttempts = 0;
              this.startPingLoop();
              this.drainQueue();
              this.emit('connected');
              resolve();
            })
            .catch((error) => {
              this.handleError(error as Error);
              reject(error);
            });
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', (code, reason) => {
          clearTimeout(connectionTimeout);
          this.handleDisconnect(code, reason.toString());
        });

        this.ws.on('error', (error) => {
          clearTimeout(connectionTimeout);
          if (this.state === 'connecting') {
            reject(error);
          }
          this.handleError(error as Error);
        });

      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from gateway
   */
  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = this.config.maxReconnectAttempts; // Prevent reconnection

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.state = 'disconnected';
    this.emit('disconnected', 'Client requested disconnect');
    logger.info('Disconnected from OpenClaw gateway');
  }

  /**
   * Send a message to the gateway
   */
  async send(type: OpenClawMessageType, payload: unknown, waitForResponse = false): Promise<unknown> {
    const message: OpenClawMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: Date.now(),
    };

    // Sign critical messages
    if (['agent_sync', 'agent_response', 'channel_message'].includes(type)) {
      message.signature = signMessage(JSON.stringify(payload), this.identity);
    }

    // If connected, send immediately
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      return this.sendImmediate(message, waitForResponse);
    }

    // Otherwise, queue the message
    return this.queueMessage(message);
  }

  /**
   * Subscribe to a channel
   */
  async subscribeToChannel(channelId: string): Promise<void> {
    await this.send('channel_subscribe', { channelId });
    logger.info({ channelId }, 'Subscribed to channel');
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribeFromChannel(channelId: string): Promise<void> {
    await this.send('channel_unsubscribe', { channelId });
    logger.info({ channelId }, 'Unsubscribed from channel');
  }

  /**
   * Send a message to a channel
   */
  async sendToChannel(channelId: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.send('channel_message', {
      channelId,
      content,
      metadata,
      agentId: this.identity.deviceId,
    });
  }

  /**
   * Sync an agent to OpenClaw
   */
  async syncAgent(agent: {
    slug: string;
    name: string;
    description: string;
    capabilities: string[];
    systemPrompt: string;
  }): Promise<unknown> {
    return this.send('agent_sync', agent, true);
  }

  // =====================================================
  // Private Methods
  // =====================================================

  private async authenticate(): Promise<void> {
    const authPayload = createAuthPayload(this.identity);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      const authHandler = (message: OpenClawMessage) => {
        if (message.type === 'auth_response') {
          clearTimeout(timeout);
          this.off('message', authHandler);
          
          const response = message.payload as { success: boolean; error?: string };
          if (response.success) {
            logger.info('Authentication successful');
            this.emit('authenticated');
            resolve();
          } else {
            const error = new Error(response.error || 'Authentication failed');
            this.emit('authError', error);
            reject(error);
          }
        }
      };

      this.on('message', authHandler);

      // Send auth message
      this.sendRaw({
        id: this.generateMessageId(),
        type: 'auth',
        payload: authPayload,
        timestamp: Date.now(),
      });
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as OpenClawMessage;

      // Handle pong messages
      if (message.type === 'pong') {
        this.handlePong();
        return;
      }

      // Handle pending response
      if (message.id && this.pendingResponses.has(message.id)) {
        const pending = this.pendingResponses.get(message.id)!;
        this.pendingResponses.delete(message.id);
        pending.resolve(message.payload);
        return;
      }

      // Emit general message event
      this.emit('message', message);

      // Handle specific message types
      switch (message.type) {
        case 'channel_message':
          const channelPayload = message.payload as { channelId: string };
          this.emit('channelMessage', channelPayload.channelId, message.payload);
          break;
        case 'error':
          const errorPayload = message.payload as { message: string };
          logger.error({ payload: message.payload }, 'Server error');
          this.emit('error', new Error(errorPayload.message));
          break;
        case 'system':
          logger.info({ payload: message.payload }, 'System message');
          break;
      }

    } catch (error) {
      logger.error({ error, data }, 'Failed to parse message');
    }
  }

  private handleDisconnect(code: number, reason: string): void {
    this.clearTimers();
    const wasConnected = this.state === 'connected';
    this.state = 'disconnected';

    logger.info({ code, reason }, 'Disconnected from gateway');
    this.emit('disconnected', reason);

    // Attempt reconnection if it was an unexpected disconnect
    if (wasConnected && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Error): void {
    logger.error({ error }, 'WebSocket error');
    this.state = 'error';
    this.emit('error', error);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );

    logger.info(
      { attempt: this.reconnectAttempts, delay },
      'Scheduling reconnection'
    );

    this.state = 'reconnecting';
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        logger.error({ error }, 'Reconnection failed');
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  private startPingLoop(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.sendRaw({ id: 'ping', type: 'ping', payload: { timestamp: this.lastPingTime } });
        
        // Set pong timeout
        this.pongTimer = setTimeout(() => {
          logger.warn('Pong timeout, connection may be stale');
          this.ws?.close(4000, 'Pong timeout');
        }, 10000);
      }
    }, this.config.pingInterval);
  }

  private handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    this.latency = Date.now() - this.lastPingTime;
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private sendRaw(message: OpenClawMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private async sendImmediate(message: OpenClawMessage, waitForResponse: boolean): Promise<unknown> {
    if (waitForResponse) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingResponses.delete(message.id);
          reject(new Error('Response timeout'));
        }, this.config.messageTimeout);

        this.pendingResponses.set(message.id, {
          message,
          resolve: (value) => {
            clearTimeout(timeout);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
          timestamp: Date.now(),
          retries: 0,
        });

        this.sendRaw(message);
      });
    }

    this.sendRaw(message);
    return Promise.resolve();
  }

  private queueMessage(message: OpenClawMessage): Promise<unknown> {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.emit('queueFull');
      return Promise.reject(new Error('Message queue is full'));
    }

    return new Promise((resolve, reject) => {
      this.messageQueue.push({
        message,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0,
      });

      logger.debug(
        { queueSize: this.messageQueue.length },
        'Message queued for later delivery'
      );
    });
  }

  private async drainQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    logger.info(
      { count: this.messageQueue.length },
      'Draining message queue'
    );

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const item of queue) {
      try {
        const result = await this.sendImmediate(item.message, false);
        item.resolve(result);
      } catch (error) {
        if (item.retries < 3) {
          item.retries++;
          this.messageQueue.push(item);
        } else {
          item.reject(error as Error);
        }
      }
    }
  }

  private generateMessageId(): string {
    return `msg-${this.identity.deviceId.substring(0, 8)}-${++this.messageCounter}-${Date.now()}`;
  }
}

// Singleton instance
let clientInstance: OpenClawClient | null = null;

/**
 * Get or create OpenClaw client instance
 */
export function getOpenClawClient(config?: Partial<OpenClawConnectionConfig>): OpenClawClient {
  if (!clientInstance) {
    clientInstance = new OpenClawClient(config);
  }
  return clientInstance;
}

/**
 * Reset client instance (for testing)
 */
export function resetOpenClawClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

export default OpenClawClient;
