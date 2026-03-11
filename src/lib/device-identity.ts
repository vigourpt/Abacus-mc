// =====================================================
// Ed25519 Device Identity for OpenClaw Integration
// =====================================================

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import fs from 'fs';
import path from 'path';
import { generateId } from './utils';
import { createChildLogger } from './logger';
import type { DeviceIdentity } from '@/types';

const logger = createChildLogger('device-identity');
const IDENTITY_PATH = path.join(process.cwd(), '.data', 'device-identity.json');

/**
 * Generate a new Ed25519 key pair for device identity
 */
export function generateDeviceIdentity(): DeviceIdentity {
  const keyPair = nacl.sign.keyPair();
  
  const identity: DeviceIdentity = {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey),
    deviceId: generateId(),
    createdAt: new Date(),
  };

  logger.info({ deviceId: identity.deviceId }, 'Generated new device identity');
  return identity;
}

/**
 * Save device identity to disk
 */
export function saveDeviceIdentity(identity: DeviceIdentity): void {
  const dir = path.dirname(IDENTITY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(IDENTITY_PATH, JSON.stringify(identity, null, 2));
  logger.info({ path: IDENTITY_PATH }, 'Saved device identity');
}

/**
 * Load device identity from disk
 */
export function loadDeviceIdentity(): DeviceIdentity | null {
  if (!fs.existsSync(IDENTITY_PATH)) {
    return null;
  }

  try {
    const data = fs.readFileSync(IDENTITY_PATH, 'utf-8');
    const identity = JSON.parse(data) as DeviceIdentity;
    logger.info({ deviceId: identity.deviceId }, 'Loaded device identity');
    return identity;
  } catch (error) {
    logger.error({ error }, 'Failed to load device identity');
    return null;
  }
}

/**
 * Get or create device identity
 */
export function getOrCreateDeviceIdentity(): DeviceIdentity {
  let identity = loadDeviceIdentity();
  
  if (!identity) {
    identity = generateDeviceIdentity();
    saveDeviceIdentity(identity);
  }

  return identity;
}

/**
 * Sign a message using the device's private key
 */
export function signMessage(message: string, identity: DeviceIdentity): string {
  const privateKey = naclUtil.decodeBase64(identity.privateKey);
  const messageBytes = naclUtil.decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, privateKey);
  return naclUtil.encodeBase64(signature);
}

/**
 * Verify a signed message
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = naclUtil.decodeUTF8(message);
    const signatureBytes = naclUtil.decodeBase64(signature);
    const publicKeyBytes = naclUtil.decodeBase64(publicKey);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Create authentication payload for OpenClaw Gateway
 */
export function createAuthPayload(identity: DeviceIdentity): {
  deviceId: string;
  publicKey: string;
  timestamp: number;
  signature: string;
} {
  const timestamp = Date.now();
  const message = `${identity.deviceId}:${timestamp}`;
  const signature = signMessage(message, identity);

  return {
    deviceId: identity.deviceId,
    publicKey: identity.publicKey,
    timestamp,
    signature,
  };
}
