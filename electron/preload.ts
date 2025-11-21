/**
 * Script de préchargement Electron pour CareLink
 * Expose de manière sécurisée les API Electron au processus de rendu
 * Utilise contextBridge pour maintenir l'isolation du contexte
 * @module electron/preload
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * API exposée de manière sécurisée au processus de rendu
 * Toutes les communications avec le processus principal passent par cette interface
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Base de données
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
  dbRun: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),

  // Chemins système
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Fichiers
  saveDocument: (fileName: string, fileData: Buffer) => ipcRenderer.invoke('save-document', fileName, fileData),
  saveToDownloads: (fileName: string, content: string, encoding?: 'utf8' | 'base64') => ipcRenderer.invoke('save-to-downloads', fileName, content, encoding),

  // Notifications
  showNotification: (title: string, body: string) => {
    new Notification(title, { body });
  },

  // Authentication (avec bcrypt)
  authRegister: (username: string, password: string) => ipcRenderer.invoke('auth:register', username, password),
  authLogin: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  authChangePassword: (userId: number, oldPassword: string, newPassword: string) => ipcRenderer.invoke('auth:change-password', userId, oldPassword, newPassword),

  // Encryption
  encryptText: (plaintext: string) => ipcRenderer.invoke('encrypt:text', plaintext),
  decryptText: (encryptedData: string) => ipcRenderer.invoke('decrypt:text', encryptedData),

  // Backup
  backupCreate: () => ipcRenderer.invoke('backup:create'),
  backupList: () => ipcRenderer.invoke('backup:list'),
  backupStatus: () => ipcRenderer.invoke('backup:status'),
  backupRestore: (backupFileName: string) => ipcRenderer.invoke('backup:restore', backupFileName),
  backupDelete: (backupFileName: string) => ipcRenderer.invoke('backup:delete', backupFileName),
  backupGetFolder: () => ipcRenderer.invoke('backup:get-folder'),

  // Python Backend
  pythonBackendStatus: () => ipcRenderer.invoke('python:backend-status'),
  pythonBackendRestart: () => ipcRenderer.invoke('python:backend-restart'),

  // Claude API (ChatDoctor)
  callClaudeAPI: (params: any) => ipcRenderer.invoke('claude:call-api', params),
  setClaudeAPIKey: (apiKey: string) => ipcRenderer.invoke('claude:set-api-key', apiKey),
  getClaudeAPIKey: () => ipcRenderer.invoke('claude:get-api-key'),

  // Secure Storage for API Keys
  secureSaveConfig: (key: string, value: string) => ipcRenderer.invoke('secure:save-config', key, value),
  secureGetConfig: (key: string) => ipcRenderer.invoke('secure:get-config', key),
  secureDeleteConfig: (key: string) => ipcRenderer.invoke('secure:delete-config', key)
});

// Types pour TypeScript
declare global {
  interface Window {
    electronAPI: {
      dbQuery: (sql: string, params?: any[]) => Promise<any>;
      dbRun: (sql: string, params?: any[]) => Promise<any>;
      getAppPath: () => Promise<string>;
      saveDocument: (fileName: string, fileData: Buffer) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveToDownloads: (fileName: string, content: string, encoding?: 'utf8' | 'base64') => Promise<{ success: boolean; filePath?: string; error?: string }>;
      showNotification: (title: string, body: string) => void;

      // Authentication
      authRegister: (username: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      authLogin: (username: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      authChangePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

      // Encryption
      encryptText: (plaintext: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      decryptText: (encryptedData: string) => Promise<{ success: boolean; data?: string; error?: string }>;

      // Backup
      backupCreate: () => Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }>;
      backupList: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      backupStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
      backupRestore: (backupFileName: string) => Promise<{ success: boolean; error?: string; restoredFrom?: string }>;
      backupDelete: (backupFileName: string) => Promise<{ success: boolean; error?: string }>;
      backupGetFolder: () => Promise<{ success: boolean; data?: string; error?: string }>;

      // Python Backend
      pythonBackendStatus: () => Promise<{ success: boolean; data?: { running: boolean; healthy: boolean; mode: string }; error?: string }>;
      pythonBackendRestart: () => Promise<{ success: boolean; message?: string; error?: string }>;

      // Claude API (ChatDoctor)
      callClaudeAPI: (params: {
        systemPrompt: string;
        messages: Array<{ role: string; content: string }>;
        maxTokens?: number;
        temperature?: number;
      }) => Promise<{ success: boolean; data?: { content: string }; error?: string }>;
      setClaudeAPIKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
      getClaudeAPIKey: () => Promise<{ success: boolean; data?: string; error?: string }>;

      // Secure Storage for API Keys
      secureSaveConfig: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
      secureGetConfig: (key: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      secureDeleteConfig: (key: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
