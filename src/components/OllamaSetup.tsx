/**
 * OllamaSetup - Assistant de configuration Ollama
 *
 * Guide l'utilisateur pour installer et configurer Ollama,
 * un système d'IA locale qui fonctionne sans connexion internet.
 *
 * Fonctionnalités:
 * - Détection automatique d'Ollama installé
 * - Instructions d'installation pas à pas
 * - Liste des modèles recommandés
 * - Téléchargement de modèles
 * - Vérification de la version
 *
 * @module OllamaSetup
 *
 * @example
 * <OllamaSetup onStatusChange={(status) => console.log(status)} />
 */

import { useState, useEffect } from 'react';
import { ollamaInstaller } from '../services/ollamaInstaller';

/**
 * États possibles du setup Ollama
 * @typedef {'checking'|'not-installed'|'ready'|'waiting'|'downloading-model'} SetupStatus
 */
type SetupStatus =
  | 'checking'
  | 'not-installed'
  | 'ready'
  | 'waiting'
  | 'downloading-model';

/**
 * Props du composant OllamaSetup
 *
 * @interface OllamaSetupProps
 * @property {function} [onStatusChange] - Callback appelé quand le statut change
 */
interface OllamaSetupProps {
  onStatusChange?: (status: SetupStatus) => void;
}

export function OllamaSetup({ onStatusChange }: OllamaSetupProps) {
  const [status, setStatus] = useState<SetupStatus>('checking');
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [ollamaVersion, setOllamaVersion] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const recommendedModels = ollamaInstaller.getRecommendedModels();

  // Vérifier le statut au chargement
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  // Notifier les changements de statut
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const checkOllamaStatus = async () => {
    setStatus('checking');
    const isInstalled = await ollamaInstaller.isInstalled();

    if (isInstalled) {
      const models = await ollamaInstaller.getInstalledModels();
      const version = await ollamaInstaller.getOllamaVersion();
      setInstalledModels(models);
      setOllamaVersion(version);
      setStatus('ready');
    } else {
      setStatus('not-installed');
    }
  };

  const handleDownload = () => {
    ollamaInstaller.openDownloadPage();
    setShowInstructions(true);
    setStatus('waiting');

    // Commencer à vérifier si Ollama est installé
    startPolling();
  };

  const startPolling = async () => {
    const success = await ollamaInstaller.waitForOllama(60, 2000); // 2 minutes max
    if (success) {
      await checkOllamaStatus();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Rendu selon le statut
  if (status === 'checking') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Vérification du statut d'Ollama...</span>
        </div>
      </div>
    );
  }

  if (status === 'not-installed') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ollama n'est pas installé</h3>
            <p className="text-sm text-gray-600">
              Ollama est requis pour utiliser des modèles IA locaux (gratuits et privés)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
          >
            📥 Télécharger Ollama
          </button>

          {showInstructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Instructions d'installation</h4>
              <div className="text-sm text-blue-800 whitespace-pre-line">
                {ollamaInstaller.getInstallInstructions()}
              </div>
              <button
                onClick={checkOllamaStatus}
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                ✓ J'ai installé Ollama
              </button>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">ℹ️ Pourquoi Ollama ?</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 100% gratuit, aucune clé API requise</li>
              <li>• Vos données restent privées (sur votre machine)</li>
              <li>• Fonctionne hors ligne</li>
              <li>• Modèles performants (Llama, Mistral, Meditron)</li>
              <li>• Idéal pour consultation médicale privée</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">En attente de l'installation d'Ollama...</span>
        </div>
        <p className="text-sm text-gray-500">
          Suivez les instructions d'installation qui se sont ouvertes dans votre navigateur.
        </p>
        <button
          onClick={checkOllamaStatus}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          ✓ Vérifier à nouveau
        </button>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">✅ Ollama est opérationnel</h3>
            {ollamaVersion && (
              <p className="text-sm text-gray-600">Version {ollamaVersion}</p>
            )}
          </div>
        </div>

        {/* Modèles installés */}
        {installedModels.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Modèles installés ({installedModels.length})</h4>
            <div className="space-y-2">
              {installedModels.map((model) => (
                <div
                  key={model}
                  className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 font-mono"
                >
                  {model}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modèles recommandés */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">💡 Modèles recommandés pour le médical</h4>
          <div className="space-y-3">
            {recommendedModels.map((model) => {
              const isInstalled = installedModels.some(m => m.includes(model.name.split(':')[0]));

              return (
                <div
                  key={model.name}
                  className={`border rounded-xl p-3 ${
                    isInstalled
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{model.displayName}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {model.size}
                        </span>
                        {isInstalled && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                            ✓ Installé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      <p className="text-xs text-blue-600 mt-1">🩺 {model.medicalUse}</p>

                      {!isInstalled && (
                        <div className="mt-2 flex items-center space-x-2">
                          <code className="text-xs bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono">
                            {model.command}
                          </code>
                          <button
                            onClick={() => copyToClipboard(model.command)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                            title="Copier la commande"
                          >
                            📋 Copier
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions pour télécharger un modèle */}
        {installedModels.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Aucun modèle installé</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Pour utiliser Ollama dans ChatDoctor, vous devez télécharger au moins un modèle :
            </p>
            <div className="bg-gray-800 text-gray-100 rounded-lg p-3 font-mono text-sm">
              {ollamaInstaller.getModelDownloadInstructions('llama3.2:3b')}
            </div>
          </div>
        )}

        <button
          onClick={checkOllamaStatus}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          🔄 Rafraîchir le statut
        </button>
      </div>
    );
  }

  return null;
}
