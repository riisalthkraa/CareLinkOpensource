/**
 * OllamaInstaller - Service de gestion d'Ollama
 *
 * Gère la détection, l'installation et la configuration d'Ollama
 * pour utiliser des modèles IA locaux (gratuits et privés).
 *
 * Ollama permet d'exécuter des LLMs localement sans connexion internet
 * et sans envoyer de données vers des serveurs externes.
 *
 * URL par défaut: http://localhost:11434
 *
 * Méthodes principales:
 * - isInstalled() : Vérifie si Ollama est actif
 * - getInstalledModels() : Liste les modèles disponibles
 * - hasModel() : Vérifie si un modèle spécifique est installé
 * - getRecommendedModels() : Modèles conseillés pour CareLink
 * - openDownloadPage() : Ouvre la page de téléchargement
 * - getOllamaVersion() : Version installée
 *
 * @module OllamaInstaller
 *
 * @example
 * const installer = new OllamaInstaller();
 * if (await installer.isInstalled()) {
 *   const models = await installer.getInstalledModels();
 * }
 */
export class OllamaInstaller {

  /**
   * Vérifie si Ollama est installé et actif
   */
  async isInstalled(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // Timeout 2s
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les modèles installés
   */
  async getInstalledModels(): Promise<string[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Vérifie si un modèle spécifique est installé
   */
  async hasModel(modelName: string): Promise<boolean> {
    const models = await this.getInstalledModels();
    return models.some(m => m.includes(modelName));
  }

  /**
   * Ouvre la page de téléchargement d'Ollama
   */
  openDownloadPage(): void {
    const platform = this.detectPlatform();
    let url = 'https://ollama.com/download';

    if (platform === 'windows') {
      url = 'https://ollama.com/download/OllamaSetup.exe';
    } else if (platform === 'darwin') {
      url = 'https://ollama.com/download/Ollama-darwin.zip';
    } else if (platform === 'linux') {
      url = 'https://ollama.com/download';
    }

    window.open(url, '_blank');
  }

  /**
   * Détecte la plateforme
   */
  private detectPlatform(): 'windows' | 'darwin' | 'linux' {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'darwin';
    return 'linux';
  }

  /**
   * Donne des instructions d'installation selon la plateforme
   */
  getInstallInstructions(): string {
    const platform = this.detectPlatform();

    if (platform === 'windows') {
      return `
1. Téléchargez OllamaSetup.exe
2. Exécutez l'installeur
3. Ollama se lancera automatiquement
4. Revenez ici pour continuer
      `.trim();
    }

    if (platform === 'darwin') {
      return `
1. Téléchargez Ollama pour macOS
2. Ouvrez le fichier .zip
3. Glissez Ollama dans Applications
4. Lancez Ollama depuis Applications
5. Revenez ici pour continuer
      `.trim();
    }

    return `
1. Exécutez dans le terminal:
   curl -fsSL https://ollama.com/install.sh | sh
2. Lancez Ollama:
   ollama serve
3. Revenez ici pour continuer
    `.trim();
  }

  /**
   * Vérifie la connexion toutes les X secondes
   */
  async waitForOllama(maxRetries = 30, intervalMs = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.isInstalled()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return false;
  }

  /**
   * Donne des instructions pour télécharger un modèle
   */
  getModelDownloadInstructions(modelName: string = 'llama3.2'): string {
    return `
Pour télécharger le modèle ${modelName}:

1. Ouvrez un terminal/invite de commandes
2. Exécutez: ollama pull ${modelName}
3. Attendez la fin du téléchargement (~2-3GB)
4. Le modèle sera prêt à utiliser dans CareLink
    `.trim();
  }

  /**
   * Recommandations de modèles médicaux
   */
  getRecommendedModels(): Array<{
    name: string;
    displayName: string;
    size: string;
    description: string;
    command: string;
    medicalUse: string;
  }> {
    return [
      {
        name: 'llama3.2:3b',
        displayName: 'Llama 3.2 (3B)',
        size: '2 GB',
        description: 'Recommandé - Bon équilibre qualité/vitesse',
        command: 'ollama pull llama3.2:3b',
        medicalUse: 'Analyse générale, conseils de santé'
      },
      {
        name: 'llama3.2:1b',
        displayName: 'Llama 3.2 (1B)',
        size: '1 GB',
        description: 'Léger et rapide, idéal pour tests',
        command: 'ollama pull llama3.2:1b',
        medicalUse: 'Réponses rapides, questions simples'
      },
      {
        name: 'mistral',
        displayName: 'Mistral 7B',
        size: '4 GB',
        description: 'Excellente qualité, plus lent',
        command: 'ollama pull mistral',
        medicalUse: 'Analyses approfondies, cas complexes'
      },
      {
        name: 'gemma2:2b',
        displayName: 'Gemma 2 (2B)',
        size: '1.6 GB',
        description: 'Modèle compact de Google',
        command: 'ollama pull gemma2:2b',
        medicalUse: 'Consultations de base'
      },
      {
        name: 'meditron',
        displayName: 'Meditron 7B',
        size: '4 GB',
        description: 'Modèle spécialisé médical',
        command: 'ollama pull meditron',
        medicalUse: 'Spécifiquement entraîné pour le médical'
      }
    ];
  }

  /**
   * Vérifie la version d'Ollama
   */
  async getOllamaVersion(): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:11434/api/version');
      if (!response.ok) return null;

      const data = await response.json();
      return data.version || null;
    } catch {
      return null;
    }
  }

  /**
   * Test un modèle avec une requête simple
   */
  async testModel(modelName: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Bonjour, pouvez-vous m\'aider avec une question médicale?',
          stream: false
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erreur HTTP ${response.status}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response || 'OK'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }
}

// Export singleton
export const ollamaInstaller = new OllamaInstaller();
