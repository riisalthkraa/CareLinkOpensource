/**
 * AI Config Loader
 * =================
 *
 * Service pour charger les configurations IA au démarrage de l'application
 * depuis le stockage sécurisé Electron.
 *
 * @module aiConfigLoader
 */

import { aiManager, AIProviderConfig } from '../utils/aiProviders';
import { log } from '../utils/logger';

/**
 * Charge toutes les configurations IA sauvegardées depuis le stockage sécurisé
 * et les restaure dans aiManager.
 *
 * Doit être appelé au démarrage de l'application (dans App.tsx)
 */
export async function loadAIConfigsFromStorage(): Promise<void> {
  try {
    log.info('aiConfigLoader', 'Loading AI configurations from secure storage...');

    const result = await window.electronAPI.secureGetConfig('aiConfigs');

    if (!result.success) {
      log.warn('aiConfigLoader', 'No saved configurations found or error loading', { error: result.error });
      return;
    }

    if (!result.data) {
      log.info('aiConfigLoader', 'No AI configurations to load (empty storage)');
      return;
    }

    try {
      const savedConfigs: AIProviderConfig[] = JSON.parse(result.data);

      if (!Array.isArray(savedConfigs)) {
        log.error('aiConfigLoader', 'Invalid config format (not an array)');
        return;
      }

      log.info('aiConfigLoader', `Found ${savedConfigs.length} saved configurations`);

      // Restaurer chaque configuration dans aiManager
      savedConfigs.forEach(config => {
        aiManager.addConfig(config);
        log.debug('aiConfigLoader', `Restored config: ${config.name || config.provider} (priority ${config.priority})`);
      });

      const activeConfigs = savedConfigs.filter(c => c.isActive);
      log.info('aiConfigLoader', `✅ Successfully loaded ${savedConfigs.length} configs (${activeConfigs.length} active)`);

    } catch (parseError) {
      log.error('aiConfigLoader', 'Failed to parse saved configurations', { error: parseError });
    }

  } catch (error: any) {
    log.error('aiConfigLoader', 'Failed to load AI configurations', { error: error.message });
  }
}

/**
 * Vérifie si au moins une configuration IA est active
 *
 * @returns true si au moins un provider actif existe
 */
export function isAIConfigured(): boolean {
  const configs = aiManager.getAllConfigs();
  const activeConfigs = configs.filter(c => c.isActive);
  return activeConfigs.length > 0;
}

/**
 * Récupère la configuration prioritaire active
 *
 * @returns La configuration avec la plus haute priorité, ou null si aucune
 */
export function getPrimaryConfig(): AIProviderConfig | null {
  const configs = aiManager.getAllConfigs();
  const activeConfigs = configs
    .filter(c => c.isActive)
    .sort((a, b) => (b.priority || 50) - (a.priority || 50));

  return activeConfigs.length > 0 ? activeConfigs[0] : null;
}
