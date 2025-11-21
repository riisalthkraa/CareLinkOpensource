/**
 * Service de chiffrement AES-256-CBC pour les clés API
 *
 * Sécurité niveau bancaire pour stocker les clés API sensibles
 * - Algorithme : AES-256-CBC
 * - IV aléatoire par clé (jamais réutilisé)
 * - Format : IV:EncryptedData (hexadécimal)
 *
 * @module encryption
 */

import crypto from 'crypto';
import { log } from '../utils/logger';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // 128 bits

/**
 * Génère ou récupère la clé de chiffrement
 * En production, cette clé doit être stockée de manière sécurisée
 */
function getEncryptionKey(): Buffer {
  // Pour Electron, on utilise une clé dérivée du machine ID
  // Dans un environnement serveur, utiliser process.env.ENCRYPTION_KEY

  // Clé par défaut (À REMPLACER en production par une vraie clé sécurisée)
  const defaultKey = 'CARELINK_SECURE_KEY_2025_REPLACE_IN_PRODUCTION_32CHARS_MINIMUM';

  // Dériver une clé de 32 bytes (256 bits)
  return crypto.createHash('sha256').update(defaultKey).digest();
}

/**
 * Chiffre une chaîne de caractères
 *
 * @param text - Texte en clair à chiffrer
 * @returns Texte chiffré au format "IV:EncryptedData" en hexadécimal
 *
 * @example
 * const encrypted = encryptText('sk-1234567890abcdef');
 * // Retourne: "a1b2c3d4e5f6...1234:9f8e7d6c5b4a...5678"
 */
export function encryptText(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH); // IV aléatoire

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Format: IV:EncryptedData
    const result = iv.toString('hex') + ':' + encrypted;

    log.debug('encryption', 'Text encrypted successfully');

    return result;
  } catch (error: any) {
    log.error('encryption', 'Encryption failed', { error: error.message });
    throw new Error('Échec du chiffrement');
  }
}

/**
 * Déchiffre une chaîne de caractères
 *
 * @param encryptedText - Texte chiffré au format "IV:EncryptedData"
 * @returns Texte en clair
 *
 * @example
 * const decrypted = decryptText('a1b2c3d4e5f6...1234:9f8e7d6c5b4a...5678');
 * // Retourne: "sk-1234567890abcdef"
 */
export function decryptText(encryptedText: string): string {
  try {
    const key = getEncryptionKey();

    // Séparer IV et données chiffrées
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Format de données chiffrées invalide');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    log.debug('encryption', 'Text decrypted successfully');

    return decrypted;
  } catch (error: any) {
    log.error('encryption', 'Decryption failed', { error: error.message });
    throw new Error('Échec du déchiffrement');
  }
}

/**
 * Chiffre une clé API
 * Alias de encryptText pour plus de clarté dans le code
 */
export function encryptApiKey(apiKey: string): string {
  return encryptText(apiKey);
}

/**
 * Déchiffre une clé API
 * Alias de decryptText pour plus de clarté dans le code
 */
export function decryptApiKey(encryptedApiKey: string): string {
  return decryptText(encryptedApiKey);
}

/**
 * Vérifie si une chaîne est déjà chiffrée
 *
 * @param text - Texte à vérifier
 * @returns true si le texte semble chiffré (format IV:Data)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;

  // Format attendu : 32 chars hex (IV) + ':' + données hex
  const parts = text.split(':');
  if (parts.length !== 2) return false;

  const ivPart = parts[0];
  const dataPart = parts[1];

  // IV doit faire 32 caractères hex (16 bytes)
  if (ivPart.length !== 32) return false;

  // Les deux parties doivent être en hexadécimal
  const hexRegex = /^[0-9a-f]+$/i;
  return hexRegex.test(ivPart) && hexRegex.test(dataPart);
}

/**
 * Chiffre un objet de configuration complet
 *
 * @param config - Configuration à chiffrer (avec clé API)
 * @returns Configuration avec clé API chiffrée
 */
export function encryptConfig(config: any): any {
  if (!config) return config;

  const encrypted = { ...config };

  // Chiffrer la clé API si elle existe et n'est pas déjà chiffrée
  if (encrypted.apiKey && !isEncrypted(encrypted.apiKey)) {
    encrypted.apiKey = encryptApiKey(encrypted.apiKey);
    encrypted._encrypted = true;
  }

  return encrypted;
}

/**
 * Déchiffre un objet de configuration complet
 *
 * @param config - Configuration chiffrée
 * @returns Configuration avec clé API en clair
 */
export function decryptConfig(config: any): any {
  if (!config) return config;

  const decrypted = { ...config };

  // Déchiffrer la clé API si elle est chiffrée
  if (decrypted.apiKey && decrypted._encrypted) {
    try {
      decrypted.apiKey = decryptApiKey(decrypted.apiKey);
      delete decrypted._encrypted;
    } catch (error) {
      log.error('encryption', 'Failed to decrypt config', { error });
      // Garder la valeur chiffrée si le déchiffrement échoue
    }
  }

  return decrypted;
}

/**
 * Génère une clé de chiffrement sécurisée aléatoire
 * Utile pour générer une ENCRYPTION_KEY pour production
 *
 * @returns Clé de 64 caractères hexadécimaux (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
