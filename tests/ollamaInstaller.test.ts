/**
 * Tests pour OllamaInstaller
 * ===========================
 *
 * Tests du service de détection et installation d'Ollama
 */

import { OllamaInstaller } from '../src/services/ollamaInstaller';

describe('OllamaInstaller', () => {
  let installer: OllamaInstaller;

  beforeEach(() => {
    installer = new OllamaInstaller();
    global.fetch = jest.fn();
    global.window.open = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isInstalled()', () => {
    test('should return true when Ollama is running', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await installer.isInstalled();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    test('should return false when Ollama is not running', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await installer.isInstalled();

      expect(result).toBe(false);
    });

    test('should timeout after 2 seconds', async () => {
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 3000))
      );

      const result = await installer.isInstalled();

      expect(result).toBe(false);
    });
  });

  describe('getInstalledModels()', () => {
    test('should return list of installed models', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:3b' },
            { name: 'mistral:latest' },
            { name: 'meditron:7b' }
          ]
        })
      });

      const models = await installer.getInstalledModels();

      expect(models).toEqual(['llama3.2:3b', 'mistral:latest', 'meditron:7b']);
    });

    test('should return empty array when no models installed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      });

      const models = await installer.getInstalledModels();

      expect(models).toEqual([]);
    });

    test('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection error'));

      const models = await installer.getInstalledModels();

      expect(models).toEqual([]);
    });
  });

  describe('hasModel()', () => {
    test('should return true when model is installed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:3b' },
            { name: 'mistral:latest' }
          ]
        })
      });

      const result = await installer.hasModel('llama3.2');

      expect(result).toBe(true);
    });

    test('should return false when model is not installed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:3b' }
          ]
        })
      });

      const result = await installer.hasModel('mistral');

      expect(result).toBe(false);
    });
  });

  describe('openDownloadPage()', () => {
    test('should open Windows download page on Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      installer.openDownloadPage();

      expect(window.open).toHaveBeenCalledWith(
        'https://ollama.com/download/OllamaSetup.exe',
        '_blank'
      );
    });

    test('should open Mac download page on macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true
      });

      installer.openDownloadPage();

      expect(window.open).toHaveBeenCalledWith(
        'https://ollama.com/download/Ollama-darwin.zip',
        '_blank'
      );
    });

    test('should open generic download page on Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true
      });

      installer.openDownloadPage();

      expect(window.open).toHaveBeenCalledWith(
        'https://ollama.com/download',
        '_blank'
      );
    });
  });

  describe('getInstallInstructions()', () => {
    test('should return Windows instructions on Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      const instructions = installer.getInstallInstructions();

      expect(instructions).toContain('OllamaSetup.exe');
      expect(instructions).toContain('Exécutez l\'installeur');
    });

    test('should return macOS instructions on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true
      });

      const instructions = installer.getInstallInstructions();

      expect(instructions).toContain('macOS');
      expect(instructions).toContain('Applications');
    });

    test('should return Linux instructions on Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true
      });

      const instructions = installer.getInstallInstructions();

      expect(instructions).toContain('curl');
      expect(instructions).toContain('ollama serve');
    });
  });

  describe('waitForOllama()', () => {
    test('should return true when Ollama becomes available', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount >= 3) {
          return Promise.resolve({ ok: true });
        }
        return Promise.reject(new Error('Not ready'));
      });

      const result = await installer.waitForOllama(5, 100);

      expect(result).toBe(true);
      expect(callCount).toBe(3);
    });

    test('should return false after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Never ready'));

      const result = await installer.waitForOllama(3, 50);

      expect(result).toBe(false);
    });
  });

  describe('getRecommendedModels()', () => {
    test('should return list of medical models', () => {
      const models = installer.getRecommendedModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models).toContainEqual(
        expect.objectContaining({
          name: 'llama3.2:3b',
          displayName: expect.any(String),
          size: expect.any(String),
          description: expect.any(String),
          command: 'ollama pull llama3.2:3b',
          medicalUse: expect.any(String)
        })
      );

      // Should include Meditron (medical-specific model)
      const meditron = models.find(m => m.name === 'meditron');
      expect(meditron).toBeDefined();
      expect(meditron?.medicalUse).toContain('médical');
    });
  });

  describe('getOllamaVersion()', () => {
    test('should return version when available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.29' })
      });

      const version = await installer.getOllamaVersion();

      expect(version).toBe('0.1.29');
    });

    test('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const version = await installer.getOllamaVersion();

      expect(version).toBeNull();
    });
  });

  describe('testModel()', () => {
    test('should return success when model responds', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Je suis prêt à vous aider avec vos questions médicales.'
        })
      });

      const result = await installer.testModel('llama3.2:3b');

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('should return error on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await installer.testModel('nonexistent-model');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur HTTP');
    });

    test('should return error on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      const result = await installer.testModel('llama3.2:3b');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getModelDownloadInstructions()', () => {
    test('should return instructions for specific model', () => {
      const instructions = installer.getModelDownloadInstructions('llama3.2:3b');

      expect(instructions).toContain('llama3.2:3b');
      expect(instructions).toContain('ollama pull');
      expect(instructions).toContain('terminal');
    });

    test('should use default model if not specified', () => {
      const instructions = installer.getModelDownloadInstructions();

      expect(instructions).toContain('llama3.2');
    });
  });
});
