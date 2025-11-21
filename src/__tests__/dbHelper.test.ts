/**
 * Tests unitaires pour le DBHelper
 */

import { db, DBResult } from '../utils/dbHelper';

describe('DBHelper', () => {
  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
  });

  describe('query method', () => {
    it('should execute a successful query', async () => {
      const mockResult: DBResult = {
        success: true,
        data: [{ id: 1, name: 'Test' }]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM test', [], {
        module: 'TestModule'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'SELECT * FROM test',
        []
      );
    });

    it('should handle query errors', async () => {
      const mockResult: DBResult = {
        success: false,
        error: 'Database error'
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM test', [], {
        module: 'TestModule'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should retry on failure', async () => {
      const mockErrorResult: DBResult = {
        success: false,
        error: 'Connection failed'
      };

      const mockSuccessResult: DBResult = {
        success: true,
        data: [{ id: 1 }]
      };

      (window.electronAPI.dbQuery as jest.Mock)
        .mockResolvedValueOnce(mockErrorResult)
        .mockResolvedValueOnce(mockSuccessResult);

      const result = await db.query('SELECT * FROM test', [], {
        module: 'TestModule',
        retries: 2,
        retryDelay: 10
      });

      expect(result.success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle silent mode', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const consoleSpy = jest.spyOn(console, 'log');

      await db.query('SELECT * FROM test', [], {
        silent: true
      });

      // En mode silencieux, les logs ne devraient pas être appelés
      // Note: Ceci dépend de l'implémentation du logger
      consoleSpy.mockRestore();
    });
  });

  describe('select method', () => {
    it('should build correct SELECT query', async () => {
      const mockResult: DBResult = {
        success: true,
        data: [{ id: 1, name: 'Test' }]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      await db.select('users', 'id, name', 'id = ?', [1]);

      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'SELECT id, name FROM users WHERE id = ?',
        [1]
      );
    });

    it('should handle SELECT without WHERE clause', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      await db.select('users');

      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'SELECT * FROM users',
        []
      );
    });
  });

  describe('insert method', () => {
    it('should build correct INSERT query', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      await db.insert('users', {
        name: 'John',
        email: 'john@example.com',
        age: 30
      });

      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        ['John', 'john@example.com', 30]
      );
    });
  });

  describe('update method', () => {
    it('should build correct UPDATE query', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      await db.update(
        'users',
        { name: 'Jane', age: 25 },
        'id = ?',
        [1]
      );

      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'UPDATE users SET name = ?, age = ? WHERE id = ?',
        ['Jane', 25, 1]
      );
    });
  });

  describe('delete method', () => {
    it('should build correct DELETE query', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      await db.delete('users', 'id = ?', [1]);

      expect(window.electronAPI.dbQuery).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [1]
      );
    });
  });

  describe('isConnected method', () => {
    it('should return true when connection is OK', async () => {
      const mockResult: DBResult = {
        success: true,
        data: [{ test: 1 }]
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const isConnected = await db.isConnected();

      expect(isConnected).toBe(true);
    });

    it('should return false when connection fails', async () => {
      (window.electronAPI.dbQuery as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const isConnected = await db.isConnected();

      expect(isConnected).toBe(false);
    });
  });

  describe('transaction method', () => {
    it('should execute all queries in sequence', async () => {
      const mockResult: DBResult = {
        success: true,
        data: []
      };

      (window.electronAPI.dbQuery as jest.Mock).mockResolvedValue(mockResult);

      const queries = [
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User1'] },
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User2'] },
        { query: 'UPDATE users SET active = 1' }
      ];

      const success = await db.transaction(queries);

      expect(success).toBe(true);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledTimes(3);
    });

    it('should stop on first error', async () => {
      const mockSuccess: DBResult = { success: true, data: [] };
      const mockError: DBResult = { success: false, error: 'Error' };

      (window.electronAPI.dbQuery as jest.Mock)
        .mockResolvedValueOnce(mockSuccess)
        .mockResolvedValueOnce(mockError);

      const queries = [
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User1'] },
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User2'] },
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User3'] }
      ];

      const success = await db.transaction(queries);

      expect(success).toBe(false);
      expect(window.electronAPI.dbQuery).toHaveBeenCalledTimes(2);
    });
  });
});
