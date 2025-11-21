/**
 * AI Providers - Gestionnaire multi-API pour IA
 *
 * Support multiple providers:
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Local (Ollama)
 *
 * @module aiProviders
 */

import { log } from './logger';

/**
 * Providers supportés
 */
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  LOCAL = 'local'
}

/**
 * Configuration d'un provider
 */
export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  endpoint?: string; // Pour local/custom
}

/**
 * Message de conversation
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Réponse de l'IA
 */
export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Classe AIProviderManager
 * Gère les appels à différentes APIs IA
 */
class AIProviderManager {
  private config: AIProviderConfig | null = null;

  /**
   * Configure le provider
   */
  setConfig(config: AIProviderConfig): void {
    this.config = config;
    log.info('AIProviderManager', `Provider configured: ${config.provider} - ${config.model}`);
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): AIProviderConfig | null {
    return this.config;
  }

  /**
   * Teste la connexion au provider
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Aucune configuration définie' };
    }

    try {
      const response = await this.chat([
        { role: 'user', content: 'Test' }
      ]);

      return { success: response.success, error: response.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie un message et reçoit une réponse
   */
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config) {
      log.error('AIProviderManager', 'No configuration set');
      return {
        success: false,
        error: 'Aucun provider configuré. Allez dans Configuration pour définir votre API.'
      };
    }

    switch (this.config.provider) {
      case AIProvider.OPENAI:
        return this.callOpenAI(messages);
      case AIProvider.ANTHROPIC:
        return this.callAnthropic(messages);
      case AIProvider.GOOGLE:
        return this.callGoogle(messages);
      case AIProvider.LOCAL:
        return this.callLocal(messages);
      default:
        return {
          success: false,
          error: `Provider non supporté: ${this.config.provider}`
        };
    }
  }

  /**
   * Appel OpenAI API
   */
  private async callOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config?.apiKey) {
      return {
        success: false,
        error: 'Clé API OpenAI manquante'
      };
    }

    try {
      log.debug('AIProviderManager', 'Calling OpenAI API', {
        model: this.config.model,
        messages: messages.length
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        log.error('AIProviderManager', 'OpenAI API error', { error });
        return {
          success: false,
          error: error.error?.message || 'Erreur OpenAI API'
        };
      }

      const data = await response.json();

      log.info('AIProviderManager', 'OpenAI response received', {
        tokens: data.usage
      });

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      };
    } catch (error: any) {
      log.error('AIProviderManager', 'OpenAI call failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Appel Anthropic API
   */
  private async callAnthropic(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config?.apiKey) {
      return {
        success: false,
        error: 'Clé API Anthropic manquante'
      };
    }

    try {
      log.debug('AIProviderManager', 'Calling Anthropic API', {
        model: this.config.model,
        messages: messages.length
      });

      // Séparer system message des autres
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          system: systemMessage?.content,
          messages: conversationMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        log.error('AIProviderManager', 'Anthropic API error', { error });
        return {
          success: false,
          error: error.error?.message || 'Erreur Anthropic API'
        };
      }

      const data = await response.json();

      log.info('AIProviderManager', 'Anthropic response received', {
        tokens: data.usage
      });

      return {
        success: true,
        content: data.content[0]?.text || '',
        usage: {
          prompt_tokens: data.usage?.input_tokens,
          completion_tokens: data.usage?.output_tokens,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    } catch (error: any) {
      log.error('AIProviderManager', 'Anthropic call failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Appel Google Gemini API
   */
  private async callGoogle(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config?.apiKey) {
      return {
        success: false,
        error: 'Clé API Google manquante'
      };
    }

    try {
      log.debug('AIProviderManager', 'Calling Google Gemini API', {
        model: this.config.model,
        messages: messages.length
      });

      // Convertir messages au format Gemini
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const systemMessage = messages.find(m => m.role === 'system');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            systemInstruction: systemMessage ? {
              parts: [{ text: systemMessage.content }]
            } : undefined,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        log.error('AIProviderManager', 'Google API error', { error });
        return {
          success: false,
          error: error.error?.message || 'Erreur Google API'
        };
      }

      const data = await response.json();

      log.info('AIProviderManager', 'Google response received');

      return {
        success: true,
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      };
    } catch (error: any) {
      log.error('AIProviderManager', 'Google call failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Appel Local (Ollama)
   */
  private async callLocal(messages: AIMessage[]): Promise<AIResponse> {
    const endpoint = this.config?.endpoint || 'http://localhost:11434';

    try {
      log.debug('AIProviderManager', 'Calling Local API (Ollama)', {
        endpoint,
        model: this.config?.model
      });

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config?.model || 'llama2',
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Erreur serveur local. Vérifiez qu\'Ollama est en cours d\'exécution.'
        };
      }

      const data = await response.json();

      log.info('AIProviderManager', 'Local response received');

      return {
        success: true,
        content: data.message?.content || ''
      };
    } catch (error: any) {
      log.error('AIProviderManager', 'Local call failed', { error: error.message });
      return {
        success: false,
        error: `Impossible de contacter le serveur local: ${error.message}`
      };
    }
  }
}

/**
 * Instance singleton
 */
export const aiManager = new AIProviderManager();

/**
 * Modèles disponibles par provider
 */
export const AVAILABLE_MODELS = {
  [AIProvider.OPENAI]: [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ],
  [AIProvider.ANTHROPIC]: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
  ],
  [AIProvider.GOOGLE]: [
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
  ],
  [AIProvider.LOCAL]: [
    { id: 'llama2', name: 'Llama 2' },
    { id: 'llama2:13b', name: 'Llama 2 13B' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'codellama', name: 'Code Llama' }
  ]
};

export default aiManager;
