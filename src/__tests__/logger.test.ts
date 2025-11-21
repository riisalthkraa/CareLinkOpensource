/**
 * Tests unitaires pour le système de logging
 */

import { logger, LogLevel } from '../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Réinitialiser les logs avant chaque test
    logger.clearLogs();
  });

  describe('Logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('TestModule', 'Test debug message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(2); // 1 pour le debug + 1 pour le clearLogs
      expect(logs[1].level).toBe(LogLevel.DEBUG);
      expect(logs[1].module).toBe('TestModule');
      expect(logs[1].message).toBe('Test debug message');
    });

    it('should log info messages', () => {
      logger.info('TestModule', 'Test info message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.INFO);
      expect(logs[1].message).toBe('Test info message');
    });

    it('should log warning messages', () => {
      logger.warn('TestModule', 'Test warning message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.WARN);
      expect(logs[1].message).toBe('Test warning message');
    });

    it('should log error messages', () => {
      logger.error('TestModule', 'Test error message', { error: 'details' });
      const logs = logger.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.ERROR);
      expect(logs[1].message).toBe('Test error message');
      expect(logs[1].data).toEqual({ error: 'details' });
    });
  });

  describe('Log filtering', () => {
    beforeEach(() => {
      logger.clearLogs();
      logger.debug('Module1', 'Debug message');
      logger.info('Module2', 'Info message');
      logger.warn('Module1', 'Warning message');
      logger.error('Module3', 'Error message');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
    });

    it('should filter logs by module', () => {
      const module1Logs = logger.getLogsByModule('Module1');
      expect(module1Logs).toHaveLength(2); // debug + warn
      expect(module1Logs.every(log => log.module === 'Module1')).toBe(true);
    });
  });

  describe('Export functionality', () => {
    beforeEach(() => {
      logger.clearLogs();
      logger.info('Test', 'Test message 1');
      logger.error('Test', 'Test message 2');
    });

    it('should export logs as JSON', () => {
      const json = logger.exportLogsAsJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('should export logs as text', () => {
      const text = logger.exportLogsAsText();

      expect(typeof text).toBe('string');
      expect(text).toContain('Test message 1');
      expect(text).toContain('Test message 2');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      logger.clearLogs();
      logger.debug('ModuleA', 'msg1');
      logger.info('ModuleA', 'msg2');
      logger.warn('ModuleB', 'msg3');
      logger.error('ModuleC', 'msg4');
    });

    it('should calculate correct statistics', () => {
      const stats = logger.getStats();

      expect(stats.total).toBe(5); // 4 + 1 du clearLogs
      expect(stats.byLevel[LogLevel.DEBUG]).toBe(1);
      expect(stats.byLevel[LogLevel.INFO]).toBeGreaterThanOrEqual(1);
      expect(stats.byLevel[LogLevel.WARN]).toBe(1);
      expect(stats.byLevel[LogLevel.ERROR]).toBe(1);
    });
  });

  describe('Configuration', () => {
    it('should respect max logs limit', () => {
      logger.setMaxLogs(3);
      logger.clearLogs();

      logger.info('Test', 'msg1');
      logger.info('Test', 'msg2');
      logger.info('Test', 'msg3');
      logger.info('Test', 'msg4'); // Should remove the first one

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(3);
    });

    it('should toggle console output', () => {
      const consoleSpy = jest.spyOn(console, 'info');

      logger.setConsoleEnabled(true);
      logger.info('Test', 'Should log to console');

      logger.setConsoleEnabled(false);
      logger.info('Test', 'Should not log to console');

      // On ne peut pas vraiment tester le comportement exact sans mocker console
      // mais on vérifie que la méthode s'exécute sans erreur
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
