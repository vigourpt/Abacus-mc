// =====================================================
// WebSocket Client for OpenClaw Gateway
// =====================================================

import WebSocket from 'ws';
import { createChildLogger } from './logger';
import { getOrCreateDeviceIdentity, createAuthPayload } from './device-identity';
import type { GatewayConnection, RealtimeEvent } from '@/types';

const logger = createChildLogger('websocket');

// Protocol version for OpenClaw 2026.x
const PROTOCOL_VERSION = 3;

export type EventHandler = (event: RealtimeEvent) => void;

export class OpenClawWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: EventHandler[] = [];
  private connection: GatewayConnection;

  constructor(
    host: string = process.env.OPENCLAW_GATEWAY_HOST || '127.0.0.1',
    port: number = parseInt(process.env.OPENCLAW_GATEWAY_PORT || '18789')
  ) {
    this.connection = {
      id: 'primary',
      host,
      port,
      status: 'disconnected',
    };
  }

  /**
   * Connect to OpenClaw Gateway
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info('Already connected to gateway');
      return;
    }

    const identity = getOrCreateDeviceIdentity();
    this.connection.deviceIdentity = identity;
    this.connection.status = 'connecting';

    const url = `ws://${this.connection.host}:${this.connection.port}/v${PROTOCOL_VERSION}/control`;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url, {
          headers: {
            'X-OpenClaw-Version': PROTOCOL_VERSION.toString(),
            'X-Device-Id': identity.deviceId,
          },
        });

        this.ws.on('open', () => {
          logger.info({ url }, 'Connected to OpenClaw Gateway');
          this.connection.status = 'connected';
          this.connection.lastConnected = new Date();
          
          // Send authentication
          this.authenticate(identity);
          
          // Start ping interval
          this.startPing();
          
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', (code, reason) => {
          logger.info({ code, reason: reason.toString() }, 'Disconnected from gateway');
          this.connection.status = 'disconnected';
          this.cleanup();
          this.scheduleReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error({ error }, 'WebSocket error');
          this.connection.status = 'error';
          reject(error);
        });
      } catch (error) {
        logger.error({ error }, 'Failed to connect to gateway');
        this.connection.status = 'error';
        reject(error);
      }
    });
  }

  /**
   * Send authentication payload
   */
  private authenticate(identity: ReturnType<typeof getOrCreateDeviceIdentity>): void {
    const authPayload = createAuthPayload(identity);
    this.send({
      type: 'auth',
      payload: authPayload,
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle pong
      if (message.type === 'pong') {
        return;
      }

      // Create event
      const event: RealtimeEvent = {
        type: message.type,
        payload: message.payload,
        timestamp: new Date(),
      };

      // Notify handlers
      this.eventHandlers.forEach((handler) => handler(event));
    } catch (error) {
      logger.error({ error, data }, 'Failed to parse message');
    }
  }

  /**
   * Send message to gateway
   */
  send(message: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message: not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Start ping interval
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000);
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        logger.error({ error }, 'Reconnection failed');
      });
    }, 5000);
  }

  /**
   * Cleanup timers
   */
  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Disconnect from gateway
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.cleanup();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connection.status = 'disconnected';
  }

  /**
   * Get connection status
   */
  getConnection(): GatewayConnection {
    return { ...this.connection };
  }
}

// Singleton instance
let wsInstance: OpenClawWebSocket | null = null;

export function getWebSocketClient(): OpenClawWebSocket {
  if (!wsInstance) {
    wsInstance = new OpenClawWebSocket();
  }
  return wsInstance;
}
