/**
 * Python Backend Manager
 * ======================
 *
 * Gère le cycle de vie du backend Python embarqué :
 * - Démarrage automatique au lancement de l'app
 * - Vérification de l'état
 * - Arrêt propre à la fermeture
 * - Fallback transparent si erreur
 *
 * @module electron/python-backend-manager
 */

import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

const BACKEND_PORT = 8003; // Port du backend ML
const BACKEND_HOST = '127.0.0.1';
const HEALTH_CHECK_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/health`;
const STARTUP_TIMEOUT = 30000; // 30 secondes max pour démarrer

let backendProcess: ChildProcess | null = null;
let isBackendRunning = false;

/**
 * Trouver l'exécutable Python backend
 *
 * @returns Chemin vers l'exécutable ou null si non trouvé
 */
function findBackendExecutable(): string | null {
  // En développement
  if (!app.isPackaged) {
    const devExe = path.join(
      app.getAppPath(),
      'services',
      'ia-health',
      'dist',
      process.platform === 'win32' ? 'main.exe' : 'main'
    );

    if (fs.existsSync(devExe)) {
      return devExe;
    }
  }

  // En production (app packagée)
  const prodExe = path.join(
    process.resourcesPath,
    'python-backend',
    process.platform === 'win32' ? 'main.exe' : 'main'
  );

  if (fs.existsSync(prodExe)) {
    return prodExe;
  }

  return null;
}

/**
 * Vérifier si le backend répond
 *
 * @returns Promise<boolean>
 */
function checkBackendHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_CHECK_URL, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Attendre que le backend soit prêt
 *
 * @param maxAttempts Nombre max de tentatives
 * @param interval Intervalle entre tentatives (ms)
 * @returns Promise<boolean>
 */
async function waitForBackend(
  maxAttempts: number = 30,
  interval: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkBackendHealth();

    if (isHealthy) {
      console.log('✅ Backend Python prêt');
      return true;
    }

    // Attendre avant la prochaine tentative
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Démarrer le backend Python
 *
 * @returns Promise<boolean> - true si démarré avec succès
 */
export async function startPythonBackend(): Promise<boolean> {
  try {
    console.log('🚀 Démarrage du backend Python...');

    // Trouver l'exécutable
    const exePath = findBackendExecutable();

    if (!exePath) {
      console.warn('⚠️  Backend Python ML non trouvé - Mode fallback activé');
      console.warn('   L\'app utilisera l\'analyse basique par mots-clés');
      return false;
    }

    console.log(`📦 Exécutable trouvé: ${exePath}`);

    // Vérifier si un backend est déjà en cours d'exécution
    const alreadyRunning = await checkBackendHealth();
    if (alreadyRunning) {
      console.log('ℹ️  Backend Python déjà actif');
      isBackendRunning = true;
      return true;
    }

    // Lancer le processus
    backendProcess = spawn(exePath, [], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'], // Capturer stdout/stderr
      windowsHide: true, // Masquer la console sur Windows
    });

    // Logger les sorties (optionnel - désactiver en production)
    if (!app.isPackaged) {
      backendProcess.stdout?.on('data', (data) => {
        console.log(`[Python] ${data.toString().trim()}`);
      });

      backendProcess.stderr?.on('data', (data) => {
        console.error(`[Python Error] ${data.toString().trim()}`);
      });
    }

    // Gérer la fermeture inattendue
    backendProcess.on('exit', (code, signal) => {
      console.log(`⚠️  Backend Python arrêté (code: ${code}, signal: ${signal})`);
      isBackendRunning = false;
      backendProcess = null;
    });

    backendProcess.on('error', (err) => {
      console.error('❌ Erreur backend Python:', err);
      isBackendRunning = false;
      backendProcess = null;
    });

    // Attendre que le backend soit prêt
    console.log('⏳ Attente du démarrage du backend...');
    const isReady = await waitForBackend();

    if (isReady) {
      isBackendRunning = true;
      console.log('✅ Backend Python démarré avec succès');
      return true;
    } else {
      console.error('❌ Timeout: Le backend n\'a pas démarré à temps');
      stopPythonBackend();
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du backend:', error);
    return false;
  }
}

/**
 * Arrêter le backend Python
 */
export function stopPythonBackend(): void {
  if (backendProcess) {
    console.log('🛑 Arrêt du backend Python...');

    try {
      // Tuer le processus
      if (process.platform === 'win32') {
        // Sur Windows, utiliser taskkill pour tuer le processus et ses enfants
        spawn('taskkill', ['/pid', backendProcess.pid!.toString(), '/f', '/t']);
      } else {
        // Sur Unix, envoyer SIGTERM
        backendProcess.kill('SIGTERM');
      }

      backendProcess = null;
      isBackendRunning = false;
      console.log('✅ Backend Python arrêté');
    } catch (error) {
      console.error('⚠️  Erreur lors de l\'arrêt du backend:', error);
    }
  }
}

/**
 * Obtenir l'état du backend
 *
 * @returns Objet avec l'état du backend
 */
export async function getBackendStatus(): Promise<{
  running: boolean;
  healthy: boolean;
  mode: 'python' | 'fallback';
}> {
  const healthy = isBackendRunning ? await checkBackendHealth() : false;

  return {
    running: isBackendRunning,
    healthy,
    mode: healthy ? 'python' : 'fallback',
  };
}

/**
 * Redémarrer le backend
 */
export async function restartPythonBackend(): Promise<boolean> {
  console.log('🔄 Redémarrage du backend Python...');
  stopPythonBackend();

  // Attendre un peu avant de redémarrer
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return startPythonBackend();
}
