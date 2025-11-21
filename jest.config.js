/**
 * Jest Configuration for CareLink
 * ===============================
 *
 * Configuration complète pour les tests unitaires et d'intégration
 * avec support TypeScript, React, et génération de rapports HTML
 */

module.exports = {
  // Preset pour TypeScript avec ts-jest
  preset: 'ts-jest',

  // Environnement de test (jsdom pour simuler le DOM)
  testEnvironment: 'jsdom',

  // Racine des tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Patterns pour trouver les fichiers de test
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // Transformation des fichiers TypeScript et JSX
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Extensions de fichiers à considérer
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Configuration des modules
  moduleNameMapper: {
    // Mock des CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Mock des images et assets
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Setup après l'environnement
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Couverture de code
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.tsx',
  ],

  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },

  // Dossier de sortie de la couverture
  coverageDirectory: 'coverage',

  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'CareLink - Test Report',
        outputPath: 'test-web-published/index.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
        sort: 'status',
        executionTimeWarningThreshold: 5,
        customScriptPath: null,
        theme: 'defaultTheme',
      },
    ],
  ],

  // Timeout global (10s)
  testTimeout: 10000,

  // Verbose pour plus de détails
  verbose: true,

  // Ignorer certains dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],

  // Globals pour ts-jest
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
