/**
 * Module de gestion des backups pour CareLink
 *
 * G�re la cr�ation, restauration, suppression et rotation automatique des backups.
 * Supporte la compression ZIP, les backups automatiques et la sauvegarde � la fermeture.
 */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { app, BrowserWindow } from 'electron';
import { createWriteStream, promises as fsPromises } from 'fs';
import { Readable } from 'stream';

/**
 * Interface contenant les informations d'un backup
 */
interface BackupInfo {
  filename: string;
  type: 'manual' | 'auto' | 'close';
  timestamp: Date;
  size: number;
  path: string;
}

/**
 * Interface contenant le statut des backups
 */
interface BackupStatus {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  lastBackupTime: Date | null;
  lastBackupPath: string | null;
  oldestBackupTime: Date | null;
  newestBackupTime: Date | null;
  backupsList: BackupInfo[];
}

/**
 * Classe de gestion des backups
 */
class BackupManager {
  private backupDir: string;
  private databasePath: string;
  private appDataDir: string;
  private automaticBackupInterval: NodeJS.Timeout | null = null;
  private lastBackupTime: Date | null = null;

  /**
   * Constructeur du gestionnaire de backups
   * @param {string} databasePath - Chemin vers la base de donn�es
   * @param {string} appDataDir - R�pertoire de donn�es de l'application
   */
  constructor(databasePath: string, appDataDir: string) {
    this.databasePath = databasePath;
    this.appDataDir = appDataDir;
    this.backupDir = path.join(appDataDir, 'backups');

    // Cr�er le r�pertoire backups s'il n'existe pas
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Convertit une taille en bytes en format lisible
   * @param {number} bytes - Nombre de bytes
   * @returns {string} Taille format�e (ex: "2.5 MB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * G�n�re un nom de fichier de backup
   * @param {string} type - Type de backup ('manual', 'auto', 'close')
   * @returns {string} Nom de fichier au format: carelink_backup_[type]_YYYY-MM-DD_HH-MM-SS.zip
   */
  private generateBackupFilename(type: 'manual' | 'auto' | 'close'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `carelink_backup_${type}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.zip`;
  }

  /**
   * Parse le nom d'un fichier de backup pour en extraire les informations
   * @param {string} filename - Nom du fichier de backup
   * @returns {object} Objet contenant {type, timestamp} ou null si invalide
   */
  private parseBackupFilename(filename: string): { type: 'manual' | 'auto' | 'close'; timestamp: Date } | null {
    const regex = /carelink_backup_(manual|auto|close)_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.zip/;
    const match = filename.match(regex);

    if (!match) {
      return null;
    }

    const [, type, year, month, day, hours, minutes, seconds] = match;
    const timestamp = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );

    return {
      type: type as 'manual' | 'auto' | 'close',
      timestamp
    };
  }

  /**
   * Cr�e un backup compress� en ZIP
   * @param {string} type - Type de backup ('manual', 'auto', 'close')
   * @returns {Promise<string>} Chemin du backup cr��
   */
  async createBackup(type: 'manual' | 'auto' | 'close' = 'manual'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const filename = this.generateBackupFilename(type);
        const backupPath = path.join(this.backupDir, filename);

        // V�rifier que la base de donn�es existe
        if (!fs.existsSync(this.databasePath)) {
          reject(new Error(`La base de donn�es n'existe pas: ${this.databasePath}`));
          return;
        }

        // Cr�er le fichier ZIP
        const output = createWriteStream(backupPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
          console.log(`Backup cr��: ${filename} (${this.formatBytes(archive.pointer())})`);
          this.lastBackupTime = new Date();

          // Effectuer la rotation des anciens backups
          await this.performBackupRotation().catch(err => {
            console.warn('Erreur lors de la rotation des backups:', err);
          });

          resolve(backupPath);
        });

        output.on('error', (err) => {
          console.error('Erreur lors de la fermeture du backup:', err);
          reject(err);
        });

        archive.on('error', (err) => {
          console.error('Erreur lors de la cr�ation du backup:', err);
          reject(err);
        });

        archive.pipe(output);

        // Ajouter la base de donn�es au ZIP
        archive.file(this.databasePath, { name: 'database.db' });

        // Cr�er un fichier JSON avec les m�tadonn�es
        const metadata = {
          type,
          timestamp: new Date().toISOString(),
          appVersion: app.getVersion(),
          platform: process.platform,
          databaseSize: fs.statSync(this.databasePath).size,
          description: `Backup ${type} de CareLink`
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

        // Finaliser le ZIP
        archive.finalize();
      } catch (error) {
        console.error('Erreur lors de la cr�ation du backup:', error);
        reject(error);
      }
    });
  }

  /**
   * Liste tous les backups disponibles
   * @returns {Promise<BackupInfo[]>} Tableau des informations de backup
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fsPromises.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (!file.endsWith('.zip')) continue;

        const backupPath = path.join(this.backupDir, file);
        const stats = fs.statSync(backupPath);
        const parsed = this.parseBackupFilename(file);

        if (parsed) {
          backups.push({
            filename: file,
            type: parsed.type,
            timestamp: parsed.timestamp,
            size: stats.size,
            path: backupPath
          });
        }
      }

      // Trier par date d�croissante
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return backups;
    } catch (error) {
      console.error('Erreur lors de la lecture des backups:', error);
      return [];
    }
  }

  /**
   * Restaure un backup existant
   * @param {string} filename - Nom du fichier de backup � restaurer
   * @returns {Promise<void>}
   */
  async restoreBackup(filename: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const backupPath = path.join(this.backupDir, filename);

        // V�rifier que le backup existe
        if (!fs.existsSync(backupPath)) {
          reject(new Error(`Le backup n'existe pas: ${filename}`));
          return;
        }

        // Cr�er un backup de s�curit� de la BD actuelle
        const securityBackupPath = path.join(
          this.backupDir,
          `carelink_security_backup_${Date.now()}.db`
        );
        fs.copyFileSync(this.databasePath, securityBackupPath);
        console.log(`Backup de s�curit� cr��: ${securityBackupPath}`);

        // Cr�er un r�pertoire temporaire pour l'extraction
        const tempDir = path.join(this.backupDir, `temp_restore_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Extraire le ZIP
        const stream = fs.createReadStream(backupPath);

        stream
          .pipe(unzipper.Extract({ path: tempDir }))
          .on('close', () => {
            try {
              // V�rifier que la base de donn�es a �t� extraite
              const extractedDbPath = path.join(tempDir, 'database.db');
              if (!fs.existsSync(extractedDbPath)) {
                throw new Error('La base de donn�es n\'a pas �t� trouv�e dans le backup');
              }

              // Remplacer la base de donn�es actuelle
              fs.copyFileSync(extractedDbPath, this.databasePath);
              console.log(`Base de donn�es restaur�e depuis: ${filename}`);

              // Nettoyer le r�pertoire temporaire
              fs.rmSync(tempDir, { recursive: true, force: true });

              resolve();
            } catch (error) {
              // Restaurer le backup de s�curit� en cas d'erreur
              fs.copyFileSync(securityBackupPath, this.databasePath);
              fs.rmSync(tempDir, { recursive: true, force: true });
              console.error('Erreur lors de la restauration, BD restaur�e depuis backup de s�curit�');
              reject(error);
            }
          })
          .on('error', (error) => {
            // Restaurer le backup de s�curit� en cas d'erreur
            fs.copyFileSync(securityBackupPath, this.databasePath);
            fs.rmSync(tempDir, { recursive: true, force: true });
            reject(error);
          });
      } catch (error) {
        console.error('Erreur lors de la restauration du backup:', error);
        reject(error);
      }
    });
  }

  /**
   * Supprime un backup
   * @param {string} filename - Nom du fichier de backup � supprimer
   * @returns {Promise<void>}
   */
  async deleteBackup(filename: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, filename);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Le backup n'existe pas: ${filename}`);
      }

      fs.unlinkSync(backupPath);
      console.log(`Backup supprim�: ${filename}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du backup:', error);
      throw error;
    }
  }

  /**
   * Effectue la rotation des backups (supprime les backups > 30 jours)
   * @returns {Promise<void>}
   */
  async performBackupRotation(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.timestamp < thirtyDaysAgo) {
          try {
            await this.deleteBackup(backup.filename);
            deletedCount++;
          } catch (error) {
            console.warn(`Impossible de supprimer le backup ${backup.filename}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`Rotation effectu�e: ${deletedCount} backup(s) supprim�(s)`);
      }
    } catch (error) {
      console.error('Erreur lors de la rotation des backups:', error);
      throw error;
    }
  }

  /**
   * Obtient le statut actuel des backups
   * @returns {Promise<BackupStatus>} Statut complet des backups
   */
  async getBackupStatus(): Promise<BackupStatus> {
    try {
      const backups = await this.listBackups();

      let totalSize = 0;
      let lastBackupTime = null;
      let lastBackupPath = null;
      let oldestBackupTime = null;
      let newestBackupTime = null;

      for (const backup of backups) {
        totalSize += backup.size;

        if (!newestBackupTime || backup.timestamp > newestBackupTime) {
          newestBackupTime = backup.timestamp;
        }

        if (!oldestBackupTime || backup.timestamp < oldestBackupTime) {
          oldestBackupTime = backup.timestamp;
        }
      }

      // Le plus r�cent est le premier dans la liste tri�e
      if (backups.length > 0) {
        lastBackupTime = backups[0].timestamp;
        lastBackupPath = backups[0].path;
      }

      return {
        totalBackups: backups.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        lastBackupTime,
        lastBackupPath,
        oldestBackupTime,
        newestBackupTime,
        backupsList: backups
      };
    } catch (error) {
      console.error('Erreur lors de la r�cup�ration du statut des backups:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        totalSizeFormatted: '0 Bytes',
        lastBackupTime: null,
        lastBackupPath: null,
        oldestBackupTime: null,
        newestBackupTime: null,
        backupsList: []
      };
    }
  }

  /**
   * D�marre les backups automatiques (toutes les 24 heures)
   * @returns {void}
   */
  startAutomaticBackups(): void {
    if (this.automaticBackupInterval) {
      console.warn('Les backups automatiques sont d�j� activ�s');
      return;
    }

    console.log('Activation des backups automatiques (toutes les 24 heures)');

    // Effectuer un backup imm�diatement
    this.createBackup('auto').catch(err => {
      console.error('Erreur lors du backup automatique initial:', err);
    });

    // Planifier les backups toutes les 24 heures
    this.automaticBackupInterval = setInterval(() => {
      this.createBackup('auto').catch(err => {
        console.error('Erreur lors du backup automatique:', err);
      });
    }, 24 * 60 * 60 * 1000); // 24 heures en millisecondes
  }

  /**
   * Arr�te les backups automatiques
   * @returns {void}
   */
  stopAutomaticBackups(): void {
    if (this.automaticBackupInterval) {
      clearInterval(this.automaticBackupInterval);
      this.automaticBackupInterval = null;
      console.log('Backups automatiques d�sactiv�s');
    }
  }

  /**
   * Cr�e un backup lors de la fermeture de l'application
   * @param {BrowserWindow} mainWindow - Fen�tre principale Electron
   * @returns {void}
   */
  async createBackupOnClose(mainWindow?: BrowserWindow): Promise<void> {
    if (mainWindow) {
      mainWindow.on('close', async () => {
        try {
          console.log('Cr�ation d\'un backup avant la fermeture...');
          await this.createBackup('close');
          console.log('Backup de fermeture cr�� avec succ�s');
        } catch (error) {
          console.error('Erreur lors de la cr�ation du backup de fermeture:', error);
        }
      });
    } else {
      // Si pas de fenêtre, créer le backup immédiatement
      try {
        console.log('Cr�ation d\'un backup avant la fermeture...');
        await this.createBackup('close');
        console.log('Backup de fermeture cr�� avec succ�s');
      } catch (error) {
        console.error('Erreur lors de la cr�ation du backup de fermeture:', error);
      }
    }
  }

  /**
   * Exporte un backup vers un emplacement externe
   * @param {string} filename - Nom du backup � exporter
   * @param {string} destinationPath - Chemin de destination
   * @returns {Promise<void>}
   */
  async exportBackup(filename: string, destinationPath: string): Promise<void> {
    try {
      const sourcePath = path.join(this.backupDir, filename);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Le backup n'existe pas: ${filename}`);
      }

      // V�rifier que le r�pertoire de destination existe
      const destDir = path.dirname(destinationPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copier le fichier
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`Backup export�: ${filename} -> ${destinationPath}`);
    } catch (error) {
      console.error('Erreur lors de l\'export du backup:', error);
      throw error;
    }
  }

  /**
   * Importe un backup depuis un emplacement externe
   * @param {string} sourcePath - Chemin du fichier de backup � importer
   * @returns {Promise<string>} Nom du backup import�
   */
  async importBackup(sourcePath: string): Promise<string> {
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Le fichier n'existe pas: ${sourcePath}`);
      }

      // G�n�rer un nom unique pour le backup import�
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `carelink_backup_import_${timestamp}.zip`;
      const destPath = path.join(this.backupDir, filename);

      // Copier le fichier
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Backup import�: ${sourcePath} -> ${filename}`);

      return filename;
    } catch (error) {
      console.error('Erreur lors de l\'import du backup:', error);
      throw error;
    }
  }

  /**
   * Obtient le chemin du dossier des backups
   * @returns {string} Chemin du dossier des backups
   */
  getBackupFolder(): string {
    return this.backupDir;
  }

  /**
   * Nettoie les ressources (arr�te les intervalles, etc.)
   * @returns {void}
   */
  cleanup(): void {
    this.stopAutomaticBackups();
  }
}

/**
 * Instance globale du gestionnaire de backups
 */
let backupManager: BackupManager | null = null;

/**
 * Initialise le gestionnaire de backups
 * @param {string} databasePath - Chemin vers la base de donn�es
 * @param {string} appDataDir - R�pertoire de donn�es de l'application
 * @returns {BackupManager} Instance du gestionnaire de backups
 */
export function initializeBackupManager(
  databasePath: string,
  appDataDir: string
): BackupManager {
  if (backupManager) {
    return backupManager;
  }

  backupManager = new BackupManager(databasePath, appDataDir);
  return backupManager;
}

/**
 * Obtient l'instance du gestionnaire de backups
 * @returns {BackupManager | null} Instance du gestionnaire ou null
 */
export function getBackupManager(): BackupManager | null {
  return backupManager;
}

/**
 * Cr�e un backup manuel
 * @returns {Promise<string>} Chemin du backup cr��
 */
export async function createBackup(): Promise<string> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.createBackup('manual');
}

/**
 * Liste tous les backups
 * @returns {Promise<BackupInfo[]>} Tableau des informations de backup
 */
export async function listBackups(): Promise<BackupInfo[]> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.listBackups();
}

/**
 * Restaure un backup
 * @param {string} filename - Nom du backup � restaurer
 * @returns {Promise<void>}
 */
export async function restoreBackup(filename: string): Promise<void> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.restoreBackup(filename);
}

/**
 * Supprime un backup
 * @param {string} filename - Nom du backup � supprimer
 * @returns {Promise<void>}
 */
export async function deleteBackup(filename: string): Promise<void> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.deleteBackup(filename);
}

/**
 * Effectue la rotation des backups
 * @returns {Promise<void>}
 */
export async function performBackupRotation(): Promise<void> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.performBackupRotation();
}

/**
 * Obtient le statut des backups
 * @returns {Promise<BackupStatus>} Statut des backups
 */
export async function getBackupStatus(): Promise<BackupStatus> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.getBackupStatus();
}

/**
 * D�marre les backups automatiques
 * @returns {void}
 */
export function startAutomaticBackups(): void {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  backupManager.startAutomaticBackups();
}

/**
 * Arr�te les backups automatiques
 * @returns {void}
 */
export function stopAutomaticBackups(): void {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  backupManager.stopAutomaticBackups();
}

/**
 * Cr�e un backup � la fermeture
 * @param {BrowserWindow} mainWindow - Fen�tre principale Electron
 * @returns {void}
 */
export async function createBackupOnClose(mainWindow?: BrowserWindow): Promise<void> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  await backupManager.createBackupOnClose(mainWindow);
}

/**
 * Obtient le chemin du dossier des backups
 * @returns {string} Chemin du dossier des backups
 */
export function getBackupFolderPath(): string {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.getBackupFolder();
}

/**
 * Exporte un backup
 * @param {string} filename - Nom du backup � exporter
 * @param {string} destinationPath - Chemin de destination
 * @returns {Promise<void>}
 */
export async function exportBackup(filename: string, destinationPath: string): Promise<void> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.exportBackup(filename, destinationPath);
}

/**
 * Importe un backup
 * @param {string} sourcePath - Chemin du fichier � importer
 * @returns {Promise<string>} Nom du backup import�
 */
export async function importBackup(sourcePath: string): Promise<string> {
  if (!backupManager) {
    throw new Error('Le gestionnaire de backups n\'a pas �t� initialis�');
  }
  return backupManager.importBackup(sourcePath);
}

/**
 * Nettoie les ressources
 * @returns {void}
 */
export function cleanupBackupManager(): void {
  if (backupManager) {
    backupManager.cleanup();
    backupManager = null;
  }
}

// Exports des interfaces
export type { BackupInfo, BackupStatus };
