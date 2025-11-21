/**
 * Encryption Utilities for CareLink
 *
 * Provides AES-256-GCM encryption for sensitive medical data including:
 * - Medical notes
 * - Allergy descriptions
 * - Treatment notes
 * - Other sensitive text fields
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV (Initialization Vector) per encryption
 * - Automatic key generation and secure storage
 * - Authentication tags to prevent tampering
 *
 * @module electron/encryption
 */

import * as crypto from 'crypto';
import Store from 'electron-store';

// Constants for encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Generates or retrieves a persistent master key for electron-store
 * This key is derived from machine-specific entropy for better security
 */
function getMasterKey(): string {
  const { app } = require('electron');
  const fs = require('fs');
  const path = require('path');

  const keyPath = path.join(app.getPath('userData'), '.master-key');

  // Try to read existing key
  if (fs.existsSync(keyPath)) {
    try {
      return fs.readFileSync(keyPath, 'utf8');
    } catch (error) {
      console.error('Failed to read master key, generating new one');
    }
  }

  // Generate new secure key using machine-specific entropy
  const machineId = require('os').hostname() + require('os').platform();
  const randomBytes = crypto.randomBytes(32);
  const masterKey = crypto.pbkdf2Sync(
    randomBytes.toString('hex') + machineId,
    'carelink-salt-v1',
    100000,
    32,
    'sha512'
  ).toString('hex');

  // Store for future use with restricted permissions
  try {
    fs.writeFileSync(keyPath, masterKey, { mode: 0o600 });
    console.log('New master key generated and stored securely');
  } catch (error) {
    console.error('Failed to store master key:', error);
  }

  return masterKey;
}

/**
 * Secure store for encryption keys
 * Uses electron-store with a dynamically generated master key
 */
let secureStore: Store;
try {
  secureStore = new Store({
    name: 'carelink-secure',
    encryptionKey: getMasterKey() // Dynamically generated master key
  });
} catch (error) {
  console.warn('Existing secure store corrupted, resetting...');
  // Delete corrupted file and recreate
  const fs = require('fs');
  const path = require('path');
  const { app } = require('electron');
  const storePath = path.join(app.getPath('userData'), 'carelink-secure.json');
  if (fs.existsSync(storePath)) {
    fs.unlinkSync(storePath);
  }
  secureStore = new Store({
    name: 'carelink-secure',
    encryptionKey: getMasterKey()
  });
  console.log('Secure store recreated successfully');
}

/**
 * Interface for encrypted data storage
 */
export interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
}

/**
 * Generates a new encryption key or retrieves existing one
 *
 * The key is generated once on first use and stored securely using electron-store.
 * Subsequent calls retrieve the same key to ensure data consistency.
 *
 * @returns {Buffer} The 256-bit encryption key
 */
export function getEncryptionKey(): Buffer {
  let key = secureStore.get('encryptionKey') as string | undefined;

  if (!key) {
    // Generate new random 256-bit key on first use
    const newKey = crypto.randomBytes(KEY_LENGTH);
    key = newKey.toString('base64');
    secureStore.set('encryptionKey', key);
    console.log('New encryption key generated and stored securely');
  }

  return Buffer.from(key, 'base64');
}

/**
 * Encrypts sensitive text data using AES-256-GCM
 *
 * Process:
 * 1. Generates a unique random IV for this encryption
 * 2. Creates cipher with AES-256-GCM algorithm
 * 3. Encrypts the plaintext
 * 4. Extracts authentication tag for integrity verification
 * 5. Returns encrypted data, IV, and auth tag (all base64 encoded)
 *
 * @param {string | null | undefined} plaintext - The text to encrypt (null/undefined returns null)
 * @returns {EncryptedData | null} Encrypted data object or null if input is null/undefined
 *
 * @example
 * const encrypted = encrypt("Sensitive medical note");
 * // Returns: { encrypted: "...", iv: "...", authTag: "..." }
 */
export function encrypt(plaintext: string | null | undefined): EncryptedData | null {
  // Handle null/undefined values - don't encrypt empty data
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return null;
  }

  try {
    const key = getEncryptionKey();

    // Generate unique IV for this encryption operation
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag for integrity verification
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data that was encrypted with the encrypt() function
 *
 * Process:
 * 1. Decodes base64 IV and auth tag
 * 2. Creates decipher with AES-256-GCM
 * 3. Sets authentication tag for integrity verification
 * 4. Decrypts the data
 * 5. Returns original plaintext
 *
 * @param {EncryptedData | null | undefined} encryptedData - The encrypted data object
 * @returns {string | null} Decrypted plaintext or null if input is null/undefined
 *
 * @throws {Error} If decryption fails or data has been tampered with
 *
 * @example
 * const decrypted = decrypt(encryptedData);
 * // Returns: "Sensitive medical note"
 */
export function decrypt(encryptedData: EncryptedData | null | undefined): string | null {
  // Handle null/undefined values
  if (encryptedData === null || encryptedData === undefined) {
    return null;
  }

  try {
    const key = getEncryptionKey();

    // Decode base64 encoded values
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set auth tag for integrity verification
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
  }
}

/**
 * Encrypts sensitive field and returns database-ready JSON string
 *
 * Convenience function that encrypts data and converts to JSON string
 * for direct storage in SQLite TEXT fields.
 *
 * @param {string | null | undefined} plaintext - The text to encrypt
 * @returns {string | null} JSON string of encrypted data or null
 *
 * @example
 * const dbValue = encryptForDB("Allergic to penicillin");
 * // Store dbValue in database TEXT field
 */
export function encryptForDB(plaintext: string | null | undefined): string | null {
  const encrypted = encrypt(plaintext);
  return encrypted ? JSON.stringify(encrypted) : null;
}

/**
 * Decrypts data from database JSON string
 *
 * Convenience function that parses JSON from database and decrypts.
 * Handles both encrypted (JSON) and legacy unencrypted (plain text) values.
 *
 * @param {string | null | undefined} dbValue - The database value (JSON string or plain text)
 * @returns {string | null} Decrypted plaintext or original plain text
 *
 * @example
 * const plaintext = decryptFromDB(dbValue);
 * // Returns: "Allergic to penicillin"
 */
export function decryptFromDB(dbValue: string | null | undefined): string | null {
  if (dbValue === null || dbValue === undefined || dbValue === '') {
    return null;
  }

  try {
    // Try to parse as JSON (encrypted data)
    const encryptedData = JSON.parse(dbValue) as EncryptedData;

    // Validate it has the expected structure
    if (encryptedData.encrypted && encryptedData.iv && encryptedData.authTag) {
      return decrypt(encryptedData);
    }

    // If it doesn't have expected structure, treat as plain text (legacy data)
    return dbValue;
  } catch (error) {
    // If JSON parsing fails, it's plain text (legacy unencrypted data)
    return dbValue;
  }
}

/**
 * Checks if a database value is encrypted
 *
 * Useful for migrations and debugging.
 *
 * @param {string | null | undefined} dbValue - The database value to check
 * @returns {boolean} True if the value is encrypted, false otherwise
 */
export function isEncrypted(dbValue: string | null | undefined): boolean {
  if (dbValue === null || dbValue === undefined || dbValue === '') {
    return false;
  }

  try {
    const parsed = JSON.parse(dbValue);
    return !!(parsed.encrypted && parsed.iv && parsed.authTag);
  } catch {
    return false;
  }
}

/**
 * Migrates a plain text value to encrypted format
 *
 * Used during database migrations to encrypt existing unencrypted data.
 * Safe to call on already-encrypted data (returns as-is).
 *
 * @param {string | null | undefined} value - The value to migrate
 * @returns {string | null} Encrypted JSON string or null
 */
export function migrateToEncrypted(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // If already encrypted, return as-is
  if (isEncrypted(value)) {
    return value;
  }

  // Encrypt the plain text value
  return encryptForDB(value);
}
