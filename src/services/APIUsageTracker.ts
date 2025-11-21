/**
 * API Usage Tracker - Suivi des coûts et usage IA
 * ================================================
 *
 * Service pour tracker et analyser l'utilisation des APIs IA :
 * - OpenAI, Anthropic, Google Gemini
 * - Tokens consommés
 * - Coûts estimés
 * - Statistiques et rapports
 *
 * Inspiré de MatchPro IA (Module Tracking)
 *
 * @module services/APIUsageTracker
 */

import { log } from '../utils/logger';
import { AIProvider, AIResponse } from '../utils/aiProviders';

/**
 * Entrée d'usage API
 */
export interface APIUsageEntry {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  costEur: number;
  responseTimeMs: number;
  createdAt: Date;
  success: boolean;
}

/**
 * Statistiques d'usage
 */
export interface UsageStats {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  requestsByModel: {
    [model: string]: number;
  };
}

/**
 * Coûts par provider (€ par 1000 tokens)
 */
const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'openai': {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  } as any,
  'anthropic': {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
  } as any,
  'google': {
    'gemini-2.5-flash': { input: 0, output: 0 },  // Gratuit
    'gemini-2.5-pro': { input: 0, output: 0 },    // Gratuit
    'gemini-2.0-flash': { input: 0, output: 0 },  // Gratuit
    'gemini-flash-latest': { input: 0, output: 0 }  // Gratuit
  } as any,
  'local': {
    default: { input: 0, output: 0 }  // Ollama gratuit
  }
};

/**
 * Service de tracking d'usage API
 */
class APIUsageTrackerService {
  private readonly TABLE_NAME = 'api_usage';

  /**
   * Initialise la table de tracking (si elle n'existe pas)
   */
  async initialize(): Promise<void> {
    try {
      await window.electronAPI.dbQuery(
        `CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          tokens_input INTEGER DEFAULT 0,
          tokens_output INTEGER DEFAULT 0,
          tokens_total INTEGER DEFAULT 0,
          cost_eur REAL DEFAULT 0,
          response_time_ms INTEGER DEFAULT 0,
          success INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        []
      );

      // Index pour requêtes optimisées
      await window.electronAPI.dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON ${this.TABLE_NAME}(provider)`,
        []
      );

      await window.electronAPI.dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON ${this.TABLE_NAME}(created_at)`,
        []
      );

      log.info('APIUsageTracker', 'Table initialized');

    } catch (error: any) {
      log.error('APIUsageTracker', 'Failed to initialize table', { error: error.message });
      // Ne pas throw - l'app peut fonctionner sans tracking
    }
  }

  /**
   * Estime le coût d'un appel API
   */
  private estimateCost(
    provider: string,
    model: string,
    tokensInput: number = 0,
    tokensOutput: number = 0
  ): number {
    const providerCosts = COST_PER_1K_TOKENS[provider];
    if (!providerCosts) return 0;

    const modelCosts = providerCosts[model] || providerCosts['default'];
    if (!modelCosts) return 0;

    const inputCost = (tokensInput / 1000) * modelCosts.input;
    const outputCost = (tokensOutput / 1000) * modelCosts.output;

    return inputCost + outputCost;
  }

  /**
   * Track un appel API
   */
  async track(params: {
    provider: string;
    model: string;
    endpoint: string;
    response: AIResponse;
    responseTimeMs: number;
  }): Promise<void> {
    try {
      const { provider, model, endpoint, response, responseTimeMs } = params;

      const tokensInput = response.usage?.prompt_tokens || 0;
      const tokensOutput = response.usage?.completion_tokens || 0;
      const tokensTotal = response.usage?.total_tokens || (tokensInput + tokensOutput);

      const costEur = this.estimateCost(provider, model, tokensInput, tokensOutput);

      const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await window.electronAPI.dbQuery(
        `INSERT INTO ${this.TABLE_NAME}
         (id, provider, model, endpoint, tokens_input, tokens_output, tokens_total, cost_eur, response_time_ms, success)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          provider,
          model,
          endpoint,
          tokensInput,
          tokensOutput,
          tokensTotal,
          costEur,
          responseTimeMs,
          response.success ? 1 : 0
        ]
      );

      log.debug('APIUsageTracker', `Tracked: ${provider}/${model}`, {
        tokens: tokensTotal,
        cost: `${costEur.toFixed(4)}€`,
        time: `${responseTimeMs}ms`
      });

    } catch (error: any) {
      log.error('APIUsageTracker', 'Failed to track usage', { error: error.message });
      // Ne pas throw - ne pas bloquer l'app pour un problème de tracking
    }
  }

  /**
   * Récupère les statistiques d'usage pour une période
   */
  async getStats(daysBack: number = 30): Promise<UsageStats[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);
      const sinceStr = since.toISOString();

      const result = await window.electronAPI.dbQuery(
        `SELECT
          provider,
          COUNT(*) as total_requests,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
          SUM(tokens_total) as total_tokens,
          SUM(cost_eur) as total_cost,
          AVG(response_time_ms) as avg_response_time,
          model
         FROM ${this.TABLE_NAME}
         WHERE created_at >= ?
         GROUP BY provider, model`,
        [sinceStr]
      );

      if (!result.success) {
        return [];
      }

      // Agréger par provider
      const statsByProvider: Map<string, UsageStats> = new Map();

      for (const row of result.data) {
        const provider = row.provider;

        if (!statsByProvider.has(provider)) {
          statsByProvider.set(provider, {
            provider,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            avgResponseTime: 0,
            requestsByModel: {}
          });
        }

        const stats = statsByProvider.get(provider)!;
        stats.totalRequests += row.total_requests;
        stats.successfulRequests += row.successful_requests;
        stats.failedRequests += row.failed_requests;
        stats.totalTokens += row.total_tokens || 0;
        stats.totalCost += row.total_cost || 0;
        stats.avgResponseTime += row.avg_response_time || 0;
        stats.requestsByModel[row.model] = row.total_requests;
      }

      // Moyenne des temps de réponse
      for (const stats of statsByProvider.values()) {
        stats.avgResponseTime = stats.avgResponseTime / Object.keys(stats.requestsByModel).length;
      }

      return Array.from(statsByProvider.values());

    } catch (error: any) {
      log.error('APIUsageTracker', 'Failed to get stats', { error: error.message });
      return [];
    }
  }

  /**
   * Récupère l'historique complet
   */
  async getHistory(limit: number = 100): Promise<APIUsageEntry[]> {
    try {
      const result = await window.electronAPI.dbQuery(
        `SELECT * FROM ${this.TABLE_NAME}
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );

      if (!result.success) {
        return [];
      }

      return result.data.map((row: any) => ({
        id: row.id,
        provider: row.provider,
        model: row.model,
        endpoint: row.endpoint,
        tokensInput: row.tokens_input,
        tokensOutput: row.tokens_output,
        tokensTotal: row.tokens_total,
        costEur: row.cost_eur,
        responseTimeMs: row.response_time_ms,
        createdAt: new Date(row.created_at),
        success: row.success === 1
      }));

    } catch (error: any) {
      log.error('APIUsageTracker', 'Failed to get history', { error: error.message });
      return [];
    }
  }

  /**
   * Nettoie les anciennes entrées (> X jours)
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysToKeep);
      const sinceStr = since.toISOString();

      const result = await window.electronAPI.dbQuery(
        `DELETE FROM ${this.TABLE_NAME}
         WHERE created_at < ?`,
        [sinceStr]
      );

      const deleted = result.success ? result.changes || 0 : 0;

      log.info('APIUsageTracker', `Cleaned up ${deleted} old entries`);

      return deleted;

    } catch (error: any) {
      log.error('APIUsageTracker', 'Failed to cleanup', { error: error.message });
      return 0;
    }
  }
}

// Export singleton
export const apiUsageTracker = new APIUsageTrackerService();
export default apiUsageTracker;
