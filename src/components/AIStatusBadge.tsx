/**
 * AIStatusBadge - Indicateur d'état de l'IA
 *
 * Badge visuel affichant l'état de l'IA dans le Sidebar.
 * Se met à jour automatiquement toutes les 10 secondes.
 *
 * États possibles:
 * - `active` (vert) : API cloud configurée (Gemini, Claude, OpenAI)
 * - `partial` (orange) : Ollama local actif
 * - `demo` (rouge) : Aucune IA configurée, mode démonstration
 *
 * @module AIStatusBadge
 *
 * @example
 * // Dans le Sidebar
 * <AIStatusBadge />
 */

import { useState, useEffect } from 'react';
import { aiManager } from '../utils/aiProviders';
import { ollamaInstaller } from '../services/ollamaInstaller';

/**
 * États possibles du badge IA
 * @typedef {'active'|'partial'|'demo'} AIStatus
 */
type AIStatus = 'active' | 'partial' | 'demo';

export function AIStatusBadge() {
  const [status, setStatus] = useState<AIStatus>('demo');
  const [providerName, setProviderName] = useState<string>('Aucune IA');

  useEffect(() => {
    checkAIStatus();
    // Vérifier toutes les 10 secondes
    const interval = setInterval(checkAIStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAIStatus = async () => {
    try {
      // Vérifier les configurations actives
      const configs = aiManager.getAllConfigs();
      const activeConfigs = configs.filter(c => c.isActive);

      if (activeConfigs.length === 0) {
        // Aucune configuration active
        setStatus('demo');
        setProviderName('Mode démo');
        return;
      }

      // Trier par priorité (plus haute en premier)
      const sortedConfigs = [...activeConfigs].sort((a, b) =>
        (b.priority || 50) - (a.priority || 50)
      );

      const topConfig = sortedConfigs[0];

      // Si Ollama est le provider principal
      if (topConfig.provider === 'local') {
        setStatus('partial');
        setProviderName('Ollama');
      } else {
        // API configurée (Gemini, Claude, OpenAI)
        setStatus('active');
        const providerNames: Record<string, string> = {
          'google': 'Gemini',
          'anthropic': 'Claude',
          'openai': 'OpenAI'
        };
        setProviderName(providerNames[topConfig.provider] || topConfig.provider);
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setStatus('demo');
      setProviderName('Erreur');
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          dotColor: '#10b981',
          textColor: '#047857',
          label: 'Activé',
          pulse: true
        };
      case 'partial':
        return {
          dotColor: '#f59e0b',
          textColor: '#d97706',
          label: 'Partiel',
          pulse: false
        };
      case 'demo':
      default:
        return {
          dotColor: '#ef4444',
          textColor: '#dc2626',
          label: 'Démo',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      marginTop: '10px',
      fontSize: '12px'
    }}>
      <span style={{ color: '#fff', opacity: 0.7, fontWeight: 600 }}>
        STATUT IA :
      </span>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: config.dotColor
      }}></div>
      <span style={{ color: config.textColor, fontWeight: 600 }}>
        {providerName}
      </span>
    </div>
  );
}
