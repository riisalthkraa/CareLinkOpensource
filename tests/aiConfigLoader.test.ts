/**
 * Tests pour aiConfigLoader
 * ==========================
 *
 * Tests du service de chargement des configurations IA
 */

import { loadAIConfigsFromStorage, isAIConfigured, getPrimaryConfig } from '../src/services/aiConfigLoader';
import { aiManager, AIProvider, AIProviderConfig } from '../src/utils/aiProviders';

// Mock de aiManager
jest.mock('../src/utils/aiProviders', () => ({
  ...jest.requireActual('../src/utils/aiProviders'),
  aiManager: {
    addConfig: jest.fn(),
    getAllConfigs: jest.fn()
  },
  AIProvider: {
    GOOGLE: 'google',
    ANTHROPIC: 'anthropic',
    OPENAI: 'openai',
    LOCAL: 'local',
    BASIC: 'basic'
  }
}));

describe('aiConfigLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadAIConfigsFromStorage', () => {
    test('should load and restore saved configurations', async () => {
      const mockConfigs: AIProviderConfig[] = [
        {
          id: 'config-1',
          provider: AIProvider.GOOGLE,
          apiKey: 'test-key-1',
          model: 'gemini-2.5-flash',
          priority: 100,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: 'config-2',
          provider: AIProvider.ANTHROPIC,
          apiKey: 'test-key-2',
          model: 'claude-3-5-sonnet-20241022',
          priority: 50,
          isActive: true,
          createdAt: new Date()
        }
      ];

      (window.electronAPI.secureGetConfig as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: JSON.stringify(mockConfigs)
      });

      await loadAIConfigsFromStorage();

      expect(window.electronAPI.secureGetConfig).toHaveBeenCalledWith('aiConfigs');
      expect(aiManager.addConfig).toHaveBeenCalledTimes(2);
      expect(aiManager.addConfig).toHaveBeenCalledWith(expect.objectContaining({
        id: 'config-1',
        provider: AIProvider.GOOGLE
      }));
      expect(aiManager.addConfig).toHaveBeenCalledWith(expect.objectContaining({
        id: 'config-2',
        provider: AIProvider.ANTHROPIC
      }));
    });

    test('should handle empty storage', async () => {
      (window.electronAPI.secureGetConfig as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: null
      });

      await loadAIConfigsFromStorage();

      expect(aiManager.addConfig).not.toHaveBeenCalled();
    });

    test('should handle storage error', async () => {
      (window.electronAPI.secureGetConfig as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Storage error'
      });

      await loadAIConfigsFromStorage();

      expect(aiManager.addConfig).not.toHaveBeenCalled();
    });

    test('should handle JSON parse error', async () => {
      (window.electronAPI.secureGetConfig as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: 'invalid-json'
      });

      await loadAIConfigsFromStorage();

      expect(aiManager.addConfig).not.toHaveBeenCalled();
    });

    test('should handle non-array data', async () => {
      (window.electronAPI.secureGetConfig as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: JSON.stringify({ invalid: 'data' })
      });

      await loadAIConfigsFromStorage();

      expect(aiManager.addConfig).not.toHaveBeenCalled();
    });
  });

  describe('isAIConfigured', () => {
    test('should return true when active configs exist', () => {
      (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
        { provider: AIProvider.GOOGLE, isActive: true },
        { provider: AIProvider.ANTHROPIC, isActive: false }
      ]);

      const result = isAIConfigured();

      expect(result).toBe(true);
    });

    test('should return false when no configs exist', () => {
      (aiManager.getAllConfigs as jest.Mock).mockReturnValue([]);

      const result = isAIConfigured();

      expect(result).toBe(false);
    });

    test('should return false when all configs are inactive', () => {
      (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
        { provider: AIProvider.GOOGLE, isActive: false },
        { provider: AIProvider.ANTHROPIC, isActive: false }
      ]);

      const result = isAIConfigured();

      expect(result).toBe(false);
    });
  });

  describe('getPrimaryConfig', () => {
    test('should return config with highest priority', () => {
      const configs = [
        { provider: AIProvider.GOOGLE, priority: 50, isActive: true },
        { provider: AIProvider.ANTHROPIC, priority: 100, isActive: true },
        { provider: AIProvider.OPENAI, priority: 25, isActive: true }
      ];

      (aiManager.getAllConfigs as jest.Mock).mockReturnValue(configs);

      const result = getPrimaryConfig();

      expect(result).toEqual(expect.objectContaining({
        provider: AIProvider.ANTHROPIC,
        priority: 100
      }));
    });

    test('should ignore inactive configs', () => {
      const configs = [
        { provider: AIProvider.GOOGLE, priority: 100, isActive: false },
        { provider: AIProvider.ANTHROPIC, priority: 50, isActive: true }
      ];

      (aiManager.getAllConfigs as jest.Mock).mockReturnValue(configs);

      const result = getPrimaryConfig();

      expect(result).toEqual(expect.objectContaining({
        provider: AIProvider.ANTHROPIC
      }));
    });

    test('should return null when no active configs', () => {
      (aiManager.getAllConfigs as jest.Mock).mockReturnValue([]);

      const result = getPrimaryConfig();

      expect(result).toBeNull();
    });

    test('should handle configs without priority (default 50)', () => {
      const configs = [
        { provider: AIProvider.GOOGLE, isActive: true },
        { provider: AIProvider.ANTHROPIC, priority: 75, isActive: true }
      ];

      (aiManager.getAllConfigs as jest.Mock).mockReturnValue(configs);

      const result = getPrimaryConfig();

      expect(result).toEqual(expect.objectContaining({
        provider: AIProvider.ANTHROPIC,
        priority: 75
      }));
    });
  });
});
