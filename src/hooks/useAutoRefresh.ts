/**
 * Hook useAutoRefresh - Auto-refresh des données
 * ================================================
 *
 * Hook React personnalisé pour gérer le rafraîchissement automatique
 * des données avec un intervalle configurable.
 *
 * Inspiré de MatchPro IA pour Dashboard temps réel
 *
 * @module hooks/useAutoRefresh
 */

import { useEffect, useRef } from 'react';

export interface UseAutoRefreshOptions {
  /**
   * Intervalle de rafraîchissement en millisecondes
   * @default 30000 (30 secondes)
   */
  interval?: number;

  /**
   * Active/désactive l'auto-refresh
   * @default true
   */
  enabled?: boolean;

  /**
   * Fonction à appeler lors du rafraîchissement
   */
  onRefresh: () => void | Promise<void>;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
}

/**
 * Hook pour auto-refresh des données
 *
 * @param options - Options de configuration
 *
 * @example
 * ```tsx
 * // Auto-refresh toutes les 15 secondes
 * useAutoRefresh({
 *   interval: 15000,
 *   enabled: true,
 *   onRefresh: async () => {
 *     await loadData();
 *   }
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Dashboard stats avec auto-refresh 30s
 * const [stats, setStats] = useState(null);
 *
 * const loadStats = async () => {
 *   const data = await fetchStats();
 *   setStats(data);
 * };
 *
 * useAutoRefresh({
 *   interval: 30000, // 30s
 *   onRefresh: loadStats
 * });
 * ```
 */
export function useAutoRefresh(options: UseAutoRefreshOptions): void {
  const {
    interval = 30000,
    enabled = true,
    onRefresh,
    onError
  } = options;

  const intervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    // Ne rien faire si désactivé
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fonction de refresh avec gestion d'erreurs
    const refresh = async () => {
      // Éviter les appels simultanés
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;

      try {
        await onRefresh();
      } catch (error) {
        console.error('Auto-refresh error:', error);
        if (onError) {
          onError(error as Error);
        }
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Démarrer l'intervalle
    intervalRef.current = window.setInterval(refresh, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled, onRefresh, onError]);
}

/**
 * Intervalles prédéfinis pour différents types de données
 */
export const RefreshIntervals = {
  /** Temps réel - 5 secondes */
  REALTIME: 5000,

  /** Rapide - 15 secondes (alertes, urgences) */
  FAST: 15000,

  /** Normal - 30 secondes (dashboard, stats) */
  NORMAL: 30000,

  /** Lent - 60 secondes (données peu changeantes) */
  SLOW: 60000,

  /** Très lent - 5 minutes (données statiques) */
  VERY_SLOW: 300000
} as const;

export default useAutoRefresh;
