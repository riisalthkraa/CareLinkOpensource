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
import { apiUsageTracker } from '../services/APIUsageTracker';

/**
 * Providers supportés
 */
export enum AIProvider {
  BASIC = 'basic',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  LOCAL = 'local'
}

/**
 * Configuration d'un provider
 */
export interface AIProviderConfig {
  id?: string;              // Identifiant unique de la config
  name?: string;            // Nom personnalisé (ex: "Gemini Principal", "Claude Backup")
  provider: AIProvider;
  apiKey?: string;
  model: string;
  endpoint?: string;        // Pour local/custom
  priority?: number;        // Priorité 1-100 (plus haut = prioritaire)
  isActive?: boolean;       // Actif/Inactif
  createdAt?: Date;         // Date de création
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
 * Gère les appels à différentes APIs IA avec support multi-provider et priorités
 */
class AIProviderManager {
  private config: AIProviderConfig | null = null;
  private configs: AIProviderConfig[] = [];  // ⭐ NOUVEAU : Plusieurs configs

  /**
   * Configure le provider (legacy - pour compatibilité)
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
   * ⭐ NOUVEAU : Ajoute une configuration multi-provider
   */
  addConfig(config: AIProviderConfig): void {
    // Générer un ID si non fourni
    if (!config.id) {
      config.id = `${config.provider}_${Date.now()}`;
    }

    // Définir priorité par défaut
    if (config.priority === undefined) {
      config.priority = 50;
    }

    // Actif par défaut
    if (config.isActive === undefined) {
      config.isActive = true;
    }

    // Date de création
    config.createdAt = new Date();

    // Remplacer si même ID existe
    const existingIndex = this.configs.findIndex(c => c.id === config.id);
    if (existingIndex >= 0) {
      this.configs[existingIndex] = config;
    } else {
      this.configs.push(config);
    }

    // Trier par priorité décroissante
    this.configs.sort((a, b) => (b.priority || 50) - (a.priority || 50));

    log.info('AIProviderManager', `Config added: ${config.name || config.provider} (priority ${config.priority})`);
  }

  /**
   * ⭐ NOUVEAU : Récupère toutes les configurations
   */
  getAllConfigs(): AIProviderConfig[] {
    return [...this.configs];
  }

  /**
   * ⭐ NOUVEAU : Supprime une configuration
   */
  removeConfig(id: string): void {
    this.configs = this.configs.filter(c => c.id !== id);
    log.info('AIProviderManager', `Config removed: ${id}`);
  }

  /**
   * ⭐ NOUVEAU : Active/désactive une configuration
   */
  toggleConfig(id: string, isActive: boolean): void {
    const config = this.configs.find(c => c.id === id);
    if (config) {
      config.isActive = isActive;
      log.info('AIProviderManager', `Config ${id} ${isActive ? 'activated' : 'deactivated'}`);
    }
  }

  /**
   * ⭐ NOUVEAU : Met à jour la priorité
   */
  setPriority(id: string, priority: number): void {
    const config = this.configs.find(c => c.id === id);
    if (config) {
      config.priority = priority;
      // Re-trier
      this.configs.sort((a, b) => (b.priority || 50) - (a.priority || 50));
      log.info('AIProviderManager', `Config ${id} priority set to ${priority}`);
    }
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
   * ⭐ NOUVEAU : Support multi-provider avec fallback automatique
   */
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // Mode multi-provider avec priorités
    if (this.configs.length > 0) {
      return this.chatWithFallback(messages);
    }

    // Mode legacy (single config)
    if (!this.config) {
      log.error('AIProviderManager', 'No configuration set');
      return {
        success: false,
        error: 'Aucun provider configuré. Allez dans Configuration pour définir votre API.'
      };
    }

    return this.callProvider(this.config, messages);
  }

  /**
   * ⭐ NOUVEAU : Appel avec fallback automatique sur plusieurs providers
   */
  private async chatWithFallback(messages: AIMessage[]): Promise<AIResponse> {
    const activeConfigs = this.configs.filter(c => c.isActive);

    if (activeConfigs.length === 0) {
      log.error('AIProviderManager', 'No active configurations');
      return {
        success: false,
        error: 'Aucun provider actif. Activez au moins un provider dans Configuration.'
      };
    }

    // Essayer chaque provider par ordre de priorité
    for (let i = 0; i < activeConfigs.length; i++) {
      const config = activeConfigs[i];

      try {
        log.info('AIProviderManager', `Trying provider ${config.name || config.provider} (priority ${config.priority})`);

        const response = await this.callProvider(config, messages);

        if (response.success) {
          log.info('AIProviderManager', `✅ Success with ${config.name || config.provider}`);
          return response;
        }

        // Erreur mais pas critique, essayer le suivant
        log.warn('AIProviderManager', `Provider ${config.name || config.provider} returned error: ${response.error}`);

      } catch (error: any) {
        log.error('AIProviderManager', `Provider ${config.name || config.provider} failed`, { error: error.message });
      }

      // Si c'est pas le dernier, on continue avec le suivant
      if (i < activeConfigs.length - 1) {
        log.info('AIProviderManager', `Falling back to next provider...`);
      }
    }

    // Tous ont échoué
    return {
      success: false,
      error: `Tous les providers IA sont indisponibles (${activeConfigs.length} essayés). Vérifiez vos configurations.`
    };
  }

  /**
   * ⭐ NOUVEAU : Appelle un provider spécifique (avec tracking)
   */
  private async callProvider(config: AIProviderConfig, messages: AIMessage[]): Promise<AIResponse> {
    // Sauvegarder temporairement la config pour les méthodes legacy
    const previousConfig = this.config;
    this.config = config;

    const startTime = Date.now();

    try {
      let response: AIResponse;

      switch (config.provider) {
        case AIProvider.BASIC:
          response = await this.callBasic(messages);
          break;
        case AIProvider.OPENAI:
          response = await this.callOpenAI(messages);
          break;
        case AIProvider.ANTHROPIC:
          response = await this.callAnthropic(messages);
          break;
        case AIProvider.GOOGLE:
          response = await this.callGoogle(messages);
          break;
        case AIProvider.LOCAL:
          response = await this.callLocal(messages);
          break;
        default:
          response = {
            success: false,
            error: `Provider non supporté: ${config.provider}`
          };
      }

      // ⭐ TRACKING : Enregistrer l'usage
      const responseTimeMs = Date.now() - startTime;

      if (config.provider !== AIProvider.BASIC) {  // Ne pas tracker le mode basique
        apiUsageTracker.track({
          provider: config.provider,
          model: config.model,
          endpoint: 'chat',
          response,
          responseTimeMs
        }).catch(err => {
          log.warn('AIProviderManager', 'Failed to track usage', { error: err.message });
        });
      }

      return response;

    } finally {
      // Restaurer la config précédente
      this.config = previousConfig;
    }
  }

  /**
   * Mode Basique - Analyse par mots-clés (pas d'API)
   */
  private async callBasic(messages: AIMessage[]): Promise<AIResponse> {
    try {
      log.debug('AIProviderManager', 'Using Basic mode (keywords analysis)');

      // Récupérer le dernier message utilisateur
      const userMessage = messages.filter(m => m.role === 'user').pop();
      if (!userMessage) {
        return {
          success: false,
          error: 'Aucun message utilisateur trouvé'
        };
      }

      const text = userMessage.content.toLowerCase();

      // Analyse de mots-clés médicaux
      let response = '';

      // Détection de symptômes
      if (text.includes('douleur') || text.includes('mal')) {
        response += '🩺 **Symptôme détecté**\n\n';

        if (text.includes('tête')) {
          response += 'Vous mentionnez une douleur à la tête. Voici quelques conseils :\n\n';
          response += '- Reposez-vous dans un endroit calme et sombre\n';
          response += '- Hydratez-vous bien\n';
          response += '- Évitez les écrans\n\n';
          response += '⚠️ Si la douleur persiste plus de 48h ou s\'aggrave, consultez un médecin.\n';
        } else if (text.includes('ventre') || text.includes('abdomen')) {
          response += 'Vous mentionnez une douleur abdominale. Quelques recommandations :\n\n';
          response += '- Évitez les aliments gras ou épicés\n';
          response += '- Privilégiez une alimentation légère\n';
          response += '- Reposez-vous\n\n';
          response += '🚨 Si douleur intense ou persistante, consultez rapidement.\n';
        } else {
          response += 'Vous mentionnez une douleur. Il est important de :\n\n';
          response += '- Noter l\'intensité (échelle de 1 à 10)\n';
          response += '- Observer la fréquence et la durée\n';
          response += '- Consulter si la douleur persiste\n\n';
        }
      }

      // Détection de fièvre
      else if (text.includes('fièvre') || text.includes('température')) {
        response += '🌡️ **Fièvre détectée**\n\n';
        response += 'Conseils pour gérer la fièvre :\n\n';
        response += '- Reposez-vous\n';
        response += '- Buvez beaucoup d\'eau\n';
        response += '- Prenez du paracétamol si nécessaire\n';
        response += '- Surveillez votre température\n\n';
        response += '⚠️ Consultez si > 39°C ou persistance > 3 jours.\n';
      }

      // Détection de questions sur médicaments
      else if (text.includes('médicament') || text.includes('traitement') || text.includes('prescription')) {
        response += '💊 **Question sur les médicaments**\n\n';
        response += '⚠️ **Je ne suis pas un médecin** et ne peux pas prescrire de médicaments.\n\n';
        response += 'Pour toute question sur vos traitements :\n';
        response += '- Consultez votre médecin traitant\n';
        response += '- Ou contactez votre pharmacien\n\n';
        response += '📋 Vous pouvez utiliser CareLink pour suivre vos traitements actuels.\n';
      }

      // Détection d'urgence
      else if (text.includes('urgence') || text.includes('grave') || text.includes('samu')) {
        response += '🚨 **URGENCE**\n\n';
        response += '**APPELEZ IMMÉDIATEMENT :**\n';
        response += '- 🚑 **15** (SAMU)\n';
        response += '- 🚨 **112** (Urgences européennes)\n\n';
        response += 'Ne perdez pas de temps avec cette application en cas d\'urgence vitale.\n';
      }

      // Message général
      else {
        response += '👋 **Bonjour**\n\n';
        response += 'Je suis un assistant médical basique (mode sans API).\n\n';
        response += '💡 **Ce que je peux faire :**\n';
        response += '- Répondre à des questions simples\n';
        response += '- Donner des conseils généraux\n';
        response += '- Vous orienter vers les bons professionnels\n\n';
        response += '⚠️ **Important :** Je ne remplace pas un médecin. Pour un diagnostic ou un traitement, consultez toujours un professionnel de santé.\n\n';
        response += '📝 Posez-moi une question sur vos symptômes ou votre santé.\n';
      }

      // Toujours ajouter le disclaimer
      response += '\n\n---\n';
      response += '_Mode Basique activé - Pour des réponses plus précises, configurez une clé API dans Paramètres._';

      return {
        success: true,
        content: response
      };

    } catch (error: any) {
      log.error('AIProviderManager', 'Basic mode failed', { error: error.message });
      return {
        success: false,
        error: 'Erreur dans le mode basique'
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

      // Utiliser v1beta pour Gemini 1.5+, 2.0+, 2.5+ et 3.0+
      // v1 pour les anciens modèles (gemini-pro, gemini-1.0-pro)
      const needsV1Beta = this.config.model.includes('1.5') ||
                          this.config.model.includes('2.0') ||
                          this.config.model.includes('2.5') ||
                          this.config.model.includes('3.0') ||
                          this.config.model.includes('-flash') ||
                          this.config.model.includes('-pro') ||
                          this.config.model.includes('-exp');
      const apiVersion = needsV1Beta ? 'v1beta' : 'v1';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
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
  [AIProvider.BASIC]: [
    { id: 'basic', name: 'Mode Basique (mots-clés)', power: '⭐⭐', cost: 'Gratuit', offline: true }
  ],
  [AIProvider.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4 Omni (Recommandé)', power: '⭐⭐⭐⭐⭐', cost: '$$$', offline: false },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', power: '⭐⭐⭐⭐⭐', cost: '$$$', offline: false },
    { id: 'gpt-4', name: 'GPT-4', power: '⭐⭐⭐⭐⭐', cost: '$$$$', offline: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', power: '⭐⭐⭐', cost: '$', offline: false }
  ],
  [AIProvider.ANTHROPIC]: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Recommandé)', power: '⭐⭐⭐⭐⭐', cost: '$$$', offline: false },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', power: '⭐⭐⭐⭐⭐', cost: '$$$$', offline: false },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', power: '⭐⭐⭐⭐', cost: '$$', offline: false },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', power: '⭐⭐⭐', cost: '$', offline: false }
  ],
  [AIProvider.GOOGLE]: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommandé) ⚡', power: '⭐⭐⭐⭐⭐', cost: 'Gratuit (15 req/min)', offline: false },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Plus puissant)', power: '⭐⭐⭐⭐⭐', cost: 'Gratuit (15 req/min)', offline: false },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', power: '⭐⭐⭐⭐', cost: 'Gratuit', offline: false },
    { id: 'gemini-flash-latest', name: 'Gemini Flash (Auto-update)', power: '⭐⭐⭐⭐', cost: 'Gratuit', offline: false }
  ],
  [AIProvider.LOCAL]: [
    { id: 'llama3.2:3b', name: 'Llama 3.2 3B (Recommandé) 🩺', power: '⭐⭐⭐⭐', cost: 'Gratuit', offline: true },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B (Rapide)', power: '⭐⭐⭐', cost: 'Gratuit', offline: true },
    { id: 'mistral', name: 'Mistral 7B', power: '⭐⭐⭐⭐', cost: 'Gratuit', offline: true },
    { id: 'gemma2:2b', name: 'Gemma 2 2B', power: '⭐⭐⭐', cost: 'Gratuit', offline: true },
    { id: 'meditron', name: 'Meditron (Spécial médical)', power: '⭐⭐⭐⭐⭐', cost: 'Gratuit', offline: true }
  ]
};

export default aiManager;
