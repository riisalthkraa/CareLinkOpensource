/**
 * Setup Tests
 * Configuration globale pour les tests Jest
 */

import '@testing-library/jest-dom';

// Mock de window.electronAPI pour les tests
global.window.electronAPI = {
  dbQuery: jest.fn(),
  showNotification: jest.fn(),
  openExternal: jest.fn(),
  // Ajoutez d'autres méthodes selon les besoins
} as any;

// Suppression des erreurs console pendant les tests (optionnel)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();
