/**
 * Tests pour AIProviderManager
 * =============================
 *
 * Tests complets du système multi-provider avec fallback
 */

import { AIProviderManager, AIProvider, AIProviderConfig, AIMessage } from '../src/utils/aiProviders';

describe('AIProviderManager', () => {
  let manager: AIProviderManager;

  beforeEach(() => {
    // Créer une nouvelle instance pour chaque test
    manager = new AIProviderManager();

    // Mock de fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Management', () => {
    test('should add a configuration with default values', () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
      };

      manager.addConfig(config);
      const configs = manager.getAllConfigs();

      expect(configs).toHaveLength(1);
      expect(configs[0]).toMatchObject({
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
        priority: 50, // Default priority
        isActive: true, // Default active state
      });
      expect(configs[0].id).toBeDefined();
      expect(configs[0].createdAt).toBeInstanceOf(Date);
    });

    test('should add multiple configurations and sort by priority', () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 25,
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 100,
      });

      manager.addConfig({
        provider: AIProvider.OPENAI,
        apiKey: 'key3',
        model: 'gpt-4o',
        priority: 50,
      });

      const configs = manager.getAllConfigs();

      expect(configs).toHaveLength(3);
      expect(configs[0].provider).toBe(AIProvider.ANTHROPIC); // Priority 100
      expect(configs[1].provider).toBe(AIProvider.OPENAI);    // Priority 50
      expect(configs[2].provider).toBe(AIProvider.GOOGLE);    // Priority 25
    });

    test('should remove a configuration by ID', () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
      };

      manager.addConfig(config);
      const configs = manager.getAllConfigs();
      const configId = configs[0].id!;

      manager.removeConfig(configId);

      expect(manager.getAllConfigs()).toHaveLength(0);
    });

    test('should toggle configuration active state', () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
      };

      manager.addConfig(config);
      const configId = manager.getAllConfigs()[0].id!;

      manager.toggleConfig(configId, false);
      expect(manager.getAllConfigs()[0].isActive).toBe(false);

      manager.toggleConfig(configId, true);
      expect(manager.getAllConfigs()[0].isActive).toBe(true);
    });

    test('should update priority and re-sort', () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 50,
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 25,
      });

      const configs = manager.getAllConfigs();
      const secondConfigId = configs[1].id!; // Claude with priority 25

      manager.setPriority(secondConfigId, 100);

      const updatedConfigs = manager.getAllConfigs();
      expect(updatedConfigs[0].provider).toBe(AIProvider.ANTHROPIC); // Now first
      expect(updatedConfigs[0].priority).toBe(100);
    });
  });

  describe('Multi-Provider Fallback', () => {
    test('should use highest priority provider first', async () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 100,
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
      });

      // Mock successful Google API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response from Gemini' }] }
          }]
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Response from Gemini');
    });

    test('should fallback to next provider if first fails', async () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 100,
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
      });

      // Mock Google API failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Mock Claude API success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response from Claude' }]
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Response from Claude');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Called both providers
    });

    test('should return error if all providers fail', async () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 100,
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
      });

      // Mock both API failures
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Tous les providers IA sont indisponibles');
    });

    test('should skip inactive providers', async () => {
      manager.addConfig({
        provider: AIProvider.GOOGLE,
        apiKey: 'key1',
        model: 'gemini-2.5-flash',
        priority: 100,
        isActive: false, // Inactive
      });

      manager.addConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: 'key2',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
        isActive: true,
      });

      // Mock Claude API success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response from Claude' }]
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Response from Claude');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called Claude
    });
  });

  describe('Provider-specific calls', () => {
    test('should call Google Gemini API correctly', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-google-key',
        model: 'gemini-2.5-flash',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Gemini response' }] }
          }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30
          }
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Gemini response');
      expect(response.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      });

      // Vérifier l'URL et les headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should call Anthropic Claude API correctly', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.ANTHROPIC,
        apiKey: 'test-anthropic-key',
        model: 'claude-3-5-sonnet-20241022',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Claude response' }],
          usage: {
            input_tokens: 15,
            output_tokens: 25
          }
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Claude response');
      expect(response.usage).toEqual({
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40
      });

      // Vérifier l'URL et les headers
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01'
          })
        })
      );
    });

    test('should call OpenAI API correctly', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.OPENAI,
        apiKey: 'test-openai-key',
        model: 'gpt-4o',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'GPT response' }
          }],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 18,
            total_tokens: 30
          }
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('GPT response');
      expect(response.usage).toEqual({
        prompt_tokens: 12,
        completion_tokens: 18,
        total_tokens: 30
      });

      // Vérifier l'URL et les headers
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-openai-key'
          })
        })
      );
    });

    test('should call Ollama local API correctly', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.LOCAL,
        model: 'llama3.2:3b',
        endpoint: 'http://localhost:11434',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Ollama response' }
        })
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Ollama response');

      // Vérifier l'URL et les paramètres
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"llama3.2:3b"')
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should return error when no configuration is set', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Aucun provider');
    });

    test('should handle API errors gracefully', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    test('should handle network errors', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
      };

      manager.setConfig(config);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Basic Mode', () => {
    test('should work in basic mode without API key', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.BASIC,
        model: 'basic',
      };

      manager.setConfig(config);

      const messages: AIMessage[] = [
        { role: 'user', content: 'fièvre mal de tête' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content).toContain('symptômes'); // Should analyze keywords
    });

    test('should detect urgency keywords in basic mode', async () => {
      const config: AIProviderConfig = {
        provider: AIProvider.BASIC,
        model: 'basic',
      };

      manager.setConfig(config);

      const messages: AIMessage[] = [
        { role: 'user', content: 'douleur thoracique intense' }
      ];

      const response = await manager.chat(messages);

      expect(response.success).toBe(true);
      expect(response.content?.toLowerCase()).toContain('urgence');
    });
  });
});
