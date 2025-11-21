/**
 * Jest Setup File
 * ===============
 *
 * Configuration globale pour tous les tests
 */

import '@testing-library/jest-dom';

// Mock de window.electronAPI pour les tests
global.window.electronAPI = {
  dbQuery: jest.fn(),
  dbRun: jest.fn(),
  dbGet: jest.fn(),
  authLogin: jest.fn(),
  authRegister: jest.fn(),
  authChangePassword: jest.fn(),
  secureSaveConfig: jest.fn(),
  secureGetConfig: jest.fn(),
  secureDeleteConfig: jest.fn(),
  backupDatabase: jest.fn(),
  restoreDatabase: jest.fn(),
  exportToCSV: jest.fn(),
  openExternal: jest.fn(),
  selectFile: jest.fn(),
  selectDirectory: jest.fn(),
  scanOrdonnance: jest.fn(),
  onBackupProgress: jest.fn(),
  onPythonBackendStatus: jest.fn(),
};

// Mock de fetch pour les appels API
global.fetch = jest.fn();

// Configuration de console pour les tests
global.console = {
  ...console,
  error: jest.fn(), // Silencer les erreurs dans les tests
  warn: jest.fn(),  // Silencer les warnings dans les tests
};
