/**
 * Point d'entrée principal de l'application Electron CareLink
 * Gère l'initialisation de la fenêtre, la base de données SQLite et la communication IPC
 * @module electron/main
 */

import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import initSqlJs from 'sql.js';
import * as bcrypt from 'bcrypt';
import { seedDatabase } from './seed-data';
import {
  encrypt,
  decrypt,
  encryptForDB,
  decryptFromDB,
  migrateToEncrypted
} from './encryption';
import {
  createBackup,
  restoreBackup,
  listBackups,
  getBackupStatus,
  deleteBackup,
  startAutomaticBackups,
  stopAutomaticBackups,
  createBackupOnClose,
  getBackupFolderPath,
  initializeBackupManager
} from './backup';
import {
  startPythonBackend,
  stopPythonBackend,
  getBackendStatus,
  restartPythonBackend
} from './python-backend-manager';

// Variables globales de l'application
let mainWindow: BrowserWindow | null = null;
let db: any = null; // Instance de la base de données SQLite
let SQL: any = null; // Module SQL.js

// Configuration sécurité
const BCRYPT_SALT_ROUNDS = 10; // Rounds pour le hashing bcrypt

/**
 * Formatte une taille en bytes en format lisible (KB, MB, GB)
 * @param bytes Nombre de bytes à formatter
 * @returns Taille formatée avec l'unité appropriée
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Initialise la base de données SQLite avec sql.js
 * Crée les tables nécessaires si elles n'existent pas
 * Applique les migrations et charge les données de test si nécessaire
 */
async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'carelink.db');

  // Initialiser sql.js
  SQL = await initSqlJs();

  // Charger la base existante ou créer une nouvelle
  let buffer: Buffer | undefined;
  if (fs.existsSync(dbPath)) {
    buffer = fs.readFileSync(dbPath);
  }

  db = new SQL.Database(buffer);

  // Créer les tables si elles n'existent pas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_setup_complete INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS famille (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS membres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      famille_id INTEGER,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      date_naissance DATE,
      sexe TEXT,
      groupe_sanguin TEXT,
      rhesus TEXT,
      poids REAL,
      taille INTEGER,
      photo TEXT,
      telephone TEXT,
      email TEXT,
      numero_securite_sociale TEXT,
      medecin_traitant TEXT,
      telephone_medecin TEXT,
      contact_urgence_nom TEXT,
      contact_urgence_telephone TEXT,
      contact_urgence_relation TEXT,
      notes TEXT,
      FOREIGN KEY (famille_id) REFERENCES famille(id)
    );

    CREATE TABLE IF NOT EXISTS vaccins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER,
      nom_vaccin TEXT NOT NULL,
      date_administration DATE,
      date_rappel DATE,
      statut TEXT DEFAULT 'à_faire',
      lot TEXT,
      medecin TEXT,
      notes TEXT,
      FOREIGN KEY (membre_id) REFERENCES membres(id)
    );

    CREATE TABLE IF NOT EXISTS traitements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER,
      nom_medicament TEXT NOT NULL,
      dosage TEXT,
      frequence TEXT,
      date_debut DATE,
      date_fin DATE,
      actif INTEGER DEFAULT 1,
      type TEXT,
      stock_restant INTEGER,
      medecin_prescripteur TEXT,
      renouvellement_ordonnance DATE,
      effets_secondaires TEXT,
      notes TEXT,
      FOREIGN KEY (membre_id) REFERENCES membres(id)
    );

    CREATE TABLE IF NOT EXISTS rendez_vous (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER,
      date_rdv DATE,
      heure TEXT,
      medecin TEXT,
      specialite TEXT,
      lieu TEXT,
      telephone_cabinet TEXT,
      motif TEXT,
      statut TEXT DEFAULT 'à_venir',
      rappel INTEGER,
      duree INTEGER,
      notes TEXT,
      FOREIGN KEY (membre_id) REFERENCES membres(id)
    );

    CREATE TABLE IF NOT EXISTS allergies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER,
      type_allergie TEXT,
      nom_allergie TEXT NOT NULL,
      severite TEXT,
      FOREIGN KEY (membre_id) REFERENCES membres(id)
    );

    -- =============================================
    -- DOSSIER MÉDICAL - Tables pour antécédents et diagnostics
    -- =============================================

    -- Table des antécédents médicaux (maladies passées, opérations, hospitalisations)
    CREATE TABLE IF NOT EXISTS antecedents_medicaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER NOT NULL,
      type_antecedent TEXT NOT NULL,  -- 'maladie', 'operation', 'hospitalisation', 'traumatisme', 'autre'
      titre TEXT NOT NULL,             -- Ex: "Appendicite", "Fracture tibia", "Asthme"
      description TEXT,                -- Détails de l'antécédent
      date_debut DATE,                 -- Date de début/survenue
      date_fin DATE,                   -- Date de fin (si applicable)
      actif INTEGER DEFAULT 0,         -- 1 si toujours actif/chronique, 0 si résolu
      severite TEXT,                   -- 'légère', 'modérée', 'grave'
      medecin TEXT,                    -- Médecin ayant traité
      hopital TEXT,                    -- Hôpital/établissement
      notes TEXT,                      -- Notes supplémentaires (peut être chiffré)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
    );

    -- Table des diagnostics actifs (pathologies en cours)
    CREATE TABLE IF NOT EXISTS diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER NOT NULL,
      pathologie TEXT NOT NULL,        -- Ex: "Diabète type 2", "Hypertension", "Allergie sévère aux arachides"
      code_cim10 TEXT,                 -- Code CIM-10 si connu (ex: E11 pour diabète type 2)
      date_diagnostic DATE NOT NULL,   -- Date du diagnostic
      medecin_diagnostic TEXT,         -- Médecin ayant posé le diagnostic
      specialite TEXT,                 -- Spécialité (cardiologue, allergologue, etc.)
      severite TEXT,                   -- 'légère', 'modérée', 'grave', 'critique'
      statut TEXT DEFAULT 'actif',     -- 'actif', 'en_remission', 'guéri', 'stabilisé'
      traitement_lie INTEGER,          -- ID du traitement associé (si applicable)
      notes TEXT,                      -- Notes supplémentaires (peut être chiffré)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
    );

    -- Table des bilans médicaux (analyses, examens, résultats)
    CREATE TABLE IF NOT EXISTS bilans_medicaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER NOT NULL,
      type_bilan TEXT NOT NULL,        -- 'analyse_sang', 'imagerie', 'electro', 'spirometrie', 'autre'
      nom_examen TEXT NOT NULL,        -- Ex: "Bilan lipidique", "IRM cérébrale", "ECG"
      date_examen DATE NOT NULL,       -- Date de l'examen
      medecin_prescripteur TEXT,       -- Médecin ayant prescrit
      laboratoire TEXT,                -- Laboratoire/centre d'imagerie
      resultat_global TEXT,            -- 'normal', 'anormal', 'pathologique', 'en_attente'
      valeurs_principales TEXT,        -- JSON ou texte des valeurs clés (ex: "Cholestérol: 2.1 g/L")
      interpretation TEXT,             -- Interprétation médicale
      fichier_resultat TEXT,           -- Chemin vers le PDF/image du résultat
      notes TEXT,                      -- Notes supplémentaires (peut être chiffré)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
    );

    -- Table des consultations spécialisées (cardio, dermato, etc.)
    CREATE TABLE IF NOT EXISTS consultations_specialisees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER NOT NULL,
      date_consultation DATE NOT NULL,      -- Date de la consultation
      specialite TEXT NOT NULL,             -- 'cardiologie', 'allergologie', 'dermatologie', etc.
      medecin_nom TEXT NOT NULL,            -- Nom du spécialiste
      hopital_cabinet TEXT,                 -- Établissement
      motif_consultation TEXT NOT NULL,     -- Raison de la consultation
      diagnostic_pose TEXT,                 -- Diagnostic établi lors de la consultation
      examens_prescrits TEXT,               -- Examens prescrits (liste)
      traitements_prescrits TEXT,           -- Traitements prescrits (liste)
      suivi_recommande TEXT,                -- Fréquence de suivi recommandée
      prochain_rdv DATE,                    -- Date du prochain RDV recommandé
      compte_rendu TEXT,                    -- Compte-rendu complet (peut être chiffré)
      fichier_cr TEXT,                      -- Chemin vers le CR scanné
      notes TEXT,                           -- Notes supplémentaires
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membre_id INTEGER,
      type_document TEXT NOT NULL,
      nom_fichier TEXT NOT NULL,
      chemin_fichier TEXT NOT NULL,
      date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_document DATE,
      donnees_extraites TEXT,
      notes TEXT,
      FOREIGN KEY (membre_id) REFERENCES membres(id)
    );
  `);

  // Migrations : ajouter les colonnes manquantes si elles n'existent pas
  try {
    // Migration vaccins
    db.exec(`ALTER TABLE vaccins ADD COLUMN lot TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE vaccins ADD COLUMN medecin TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE vaccins ADD COLUMN notes TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }

  // Migration traitements
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN type TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN stock_restant INTEGER;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN medecin_prescripteur TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN renouvellement_ordonnance DATE;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN effets_secondaires TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE traitements ADD COLUMN notes TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }

  // Migration rendez_vous
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN heure TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN specialite TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN lieu TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN telephone_cabinet TEXT;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN statut TEXT DEFAULT 'à_venir';`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN rappel INTEGER;`);
  } catch (e) { /* Colonne existe déjà */ }
  try {
    db.exec(`ALTER TABLE rendez_vous ADD COLUMN duree INTEGER;`);
  } catch (e) { /* Colonne existe déjà */ }

  console.log('Base de données initialisée à:', dbPath);

  // Créer les données de test si la base est vide
  await seedDatabase(db, false);

  // Créer les données de dossier médical pour chaque membre
  await seedMedicalData();

  // Migrer les données existantes vers encryption si nécessaire
  // DÉSACTIVÉ TEMPORAIREMENT - Causing issues with key regeneration
  // await migrateExistingDataToEncryption();

  saveDatabase(); // Sauvegarder après le seed et migration

  // Initialiser le gestionnaire de backups
  initializeBackupManager(dbPath, userDataPath);

  // Démarrer le système de backup automatique
  startAutomaticBackups();

  // Sauvegarder la base de données périodiquement
  setInterval(() => saveDatabase(), 30000); // Toutes les 30 secondes
}

/**
 * Migration: Chiffre les données sensibles existantes non chiffrées
 *
 * Cette fonction migre les données existantes vers le format chiffré.
 * Elle est idempotente et peut être exécutée plusieurs fois sans danger.
 *
 * Champs chiffrés:
 * - membres.notes (notes médicales)
 * - allergies.nom_allergie (description d'allergie)
 * - traitements.notes (notes de traitement)
 * - vaccins.notes (notes de vaccination)
 * - rendez_vous.notes (notes de rendez-vous)
 */
async function migrateExistingDataToEncryption(): Promise<void> {
  try {
    console.log('Starting encryption migration for sensitive data...');

    // Migrer les notes des membres
    const membres = db.exec('SELECT id, notes FROM membres WHERE notes IS NOT NULL AND notes != ""');
    if (membres.length > 0 && membres[0].values) {
      for (const row of membres[0].values) {
        const [id, notes] = row;
        if (notes) {
          const encrypted = migrateToEncrypted(notes as string);
          db.run('UPDATE membres SET notes = ? WHERE id = ?', [encrypted, id]);
        }
      }
      console.log(`Migrated ${membres[0].values.length} member notes to encrypted format`);
    }

    // Migrer les descriptions d'allergies
    const allergies = db.exec('SELECT id, nom_allergie FROM allergies WHERE nom_allergie IS NOT NULL');
    if (allergies.length > 0 && allergies[0].values) {
      for (const row of allergies[0].values) {
        const [id, allergie] = row;
        if (allergie) {
          const encrypted = migrateToEncrypted(allergie as string);
          db.run('UPDATE allergies SET nom_allergie = ? WHERE id = ?', [encrypted, id]);
        }
      }
      console.log(`Migrated ${allergies[0].values.length} allergy descriptions to encrypted format`);
    }

    // Migrer les notes de traitements
    const traitements = db.exec('SELECT id, notes, effets_secondaires FROM traitements WHERE notes IS NOT NULL OR effets_secondaires IS NOT NULL');
    if (traitements.length > 0 && traitements[0].values) {
      for (const row of traitements[0].values) {
        const [id, notes, effets] = row;
        if (notes) {
          const encrypted = migrateToEncrypted(notes as string);
          db.run('UPDATE traitements SET notes = ? WHERE id = ?', [encrypted, id]);
        }
        if (effets) {
          const encrypted = migrateToEncrypted(effets as string);
          db.run('UPDATE traitements SET effets_secondaires = ? WHERE id = ?', [encrypted, id]);
        }
      }
      console.log(`Migrated ${traitements[0].values.length} treatment notes to encrypted format`);
    }

    // Migrer les notes de vaccins
    const vaccins = db.exec('SELECT id, notes FROM vaccins WHERE notes IS NOT NULL AND notes != ""');
    if (vaccins.length > 0 && vaccins[0].values) {
      for (const row of vaccins[0].values) {
        const [id, notes] = row;
        if (notes) {
          const encrypted = migrateToEncrypted(notes as string);
          db.run('UPDATE vaccins SET notes = ? WHERE id = ?', [encrypted, id]);
        }
      }
      console.log(`Migrated ${vaccins[0].values.length} vaccine notes to encrypted format`);
    }

    // Migrer les notes de rendez-vous
    const rdv = db.exec('SELECT id, notes FROM rendez_vous WHERE notes IS NOT NULL AND notes != ""');
    if (rdv.length > 0 && rdv[0].values) {
      for (const row of rdv[0].values) {
        const [id, notes] = row;
        if (notes) {
          const encrypted = migrateToEncrypted(notes as string);
          db.run('UPDATE rendez_vous SET notes = ? WHERE id = ?', [encrypted, id]);
        }
      }
      console.log(`Migrated ${rdv[0].values.length} appointment notes to encrypted format`);
    }

    console.log('Encryption migration completed successfully');
  } catch (error) {
    console.error('Error during encryption migration:', error);
    // Don't throw - migration errors shouldn't prevent app from starting
  }
}

/**
 * Sauvegarde la base de données SQLite sur le disque
 * Appelée périodiquement et lors de la fermeture de l'application
 */
function saveDatabase(): void {
  if (!db) return;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'carelink.db');

  try {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    console.log('Base de données sauvegardée');
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
  }
}

/**
 * Crée des données de dossier médical pour chaque membre
 * Appelée après seedDatabase si les tables de dossier médical sont vides
 */
async function seedMedicalData(): Promise<void> {
  if (!db) return;

  try {
    // Vérifier si les données existent déjà
    const existingData = db.exec('SELECT COUNT(*) as count FROM antecedents_medicaux');
    if (existingData.length > 0 && existingData[0].values[0][0] > 0) {
      console.log('✅ Données médicales déjà présentes');
      return;
    }

    console.log('📋 Création de données de dossier médical pour chaque membre...');

    // Récupérer tous les membres
    const membres = db.exec('SELECT id, prenom, nom, date_naissance FROM membres');

    if (membres.length === 0 || !membres[0].values) {
      console.log('❌ Aucun membre trouvé');
      return;
    }

    let totalCreated = 0;

    for (const [id, prenom, nom, dateNaissance] of membres[0].values) {
      console.log(`👤 ${prenom} ${nom} (ID: ${id})`);

      // Calculer l'âge
      const age = new Date().getFullYear() - new Date(dateNaissance as string).getFullYear();

      // 1. ANTÉCÉDENTS MÉDICAUX (selon l'âge)
      if (age > 50) {
        db.run(`INSERT INTO antecedents_medicaux
          (membre_id, type_antecedent, titre, description, date_debut, actif, severite)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, 'maladie', 'Hypertension artérielle', 'Sous traitement depuis 5 ans', '2019-03-15', 1, 'modérée']
        );
        totalCreated++;
      }

      if (age > 60) {
        db.run(`INSERT INTO antecedents_medicaux
          (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, 'traumatisme', 'Fracture poignet gauche', 'Chute à domicile, consolidation complète', '2018-11-20', '2019-02-15', 0, 'modérée']
        );
        totalCreated++;
      }

      // 2. DIAGNOSTICS ACTIFS
      if (age > 55) {
        db.run(`INSERT INTO diagnostics
          (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, 'Arthrose genou droit', 'M17.1', '2022-06-10', 'Dr. Martin', 'Rhumatologue', 'modérée', 'actif']
        );
        totalCreated++;
      }

      if (age > 65) {
        db.run(`INSERT INTO diagnostics
          (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, severite, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, 'Cholestérol élevé', 'E78.0', '2021-03-22', 'Dr. Rousseau', 'légère', 'actif']
        );
        totalCreated++;
      }

      // 3. BILANS MÉDICAUX (pour tous)
      db.run(`INSERT INTO bilans_medicaux
        (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, resultat_global, valeurs_principales)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'analyse_sang', 'Bilan sanguin complet', '2024-09-15', 'Dr. Rousseau', 'normal', 'Glycémie: 0.95 g/L, Cholestérol: 1.8 g/L']
      );
      totalCreated++;

      if (age > 50) {
        db.run(`INSERT INTO bilans_medicaux
          (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, resultat_global, interpretation)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, 'electro', 'Électrocardiogramme (ECG)', '2024-05-20', 'Dr. Leblanc', 'normal', 'Rythme sinusal normal, pas d\'anomalie détectée']
        );
        totalCreated++;
      }

      // 4. CONSULTATIONS SPÉCIALISÉES
      if (age > 55) {
        db.run(`INSERT INTO consultations_specialisees
          (membre_id, specialite, medecin_nom, date_consultation, motif_consultation, diagnostic_pose, traitements_prescrits)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, 'Cardiologie', 'Dr. Leblanc', '2024-03-12', 'Bilan cardiologique de routine', 'Tension artérielle bien contrôlée', 'Poursuite du traitement actuel']
        );
        totalCreated++;
      }

      if (age > 40 && age < 60) {
        db.run(`INSERT INTO consultations_specialisees
          (membre_id, specialite, medecin_nom, date_consultation, motif_consultation, diagnostic_pose)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [id, 'Ophtalmologie', 'Dr. Durand', '2024-07-08', 'Contrôle vision', 'Vision stable, légère presbytie']
        );
        totalCreated++;
      }
    }

    console.log(`✅ ${totalCreated} entrées de dossier médical créées!`);
  } catch (error) {
    console.error('Erreur lors de la création des données médicales:', error);
  }
}

/**
 * Crée la fenêtre principale de l'application
 * Configure les paramètres de sécurité et charge l'interface
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // En développement, charger depuis Vite
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger depuis dist/renderer/index.html
    // __dirname pointe vers dist/ dans l'app packagée
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initDatabase();

  // Démarrer le backend Python en arrière-plan
  console.log('🚀 Démarrage de CareLink...');
  startPythonBackend().then((success) => {
    if (success) {
      console.log('✅ Backend Python activé - Mode Enhanced');
    } else {
      console.log('⚠️  Mode Standard - Fallback vers Tesseract.js');
    }
  }).catch((error) => {
    console.error('❌ Erreur backend Python:', error);
    console.log('⚠️  Mode Standard - Fallback vers Tesseract.js');
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Créer un backup avant de fermer
  await createBackupOnClose();

  if (db) {
    saveDatabase();
    db.close();
  }
  // Arrêter le service de backup automatique
  stopAutomaticBackups();

  // Arrêter le backend Python
  stopPythonBackend();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers pour la communication avec React
ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Erreur query:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:run', async (event, sql, params = []) => {
  try {
    db.run(sql, params);

    // Récupérer le dernier ID inséré
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const lastId = lastIdStmt.getAsObject().id;
    lastIdStmt.free();

    // Sauvegarder après chaque modification
    saveDatabase();

    return { success: true, data: { lastInsertRowid: lastId } };
  } catch (error: any) {
    console.error('Erreur run:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Handler pour sauvegarder un fichier (document d'ordonnance)
ipcMain.handle('save-document', async (event, fileName: string, fileData: Buffer) => {
  try {
    const userDataPath = app.getPath('userData');
    const documentsDir = path.join(userDataPath, 'documents');

    // Créer le dossier documents s'il n'existe pas
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    // Créer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(documentsDir, uniqueFileName);

    // Sauvegarder le fichier
    fs.writeFileSync(filePath, fileData);

    return { success: true, filePath: filePath };
  } catch (error: any) {
    console.error('Erreur sauvegarde document:', error);
    return { success: false, error: error.message };
  }
});

// Handler pour sauvegarder dans le dossier Téléchargements
ipcMain.handle('save-to-downloads', async (event, fileName: string, content: string, encoding: 'utf8' | 'base64' = 'utf8') => {
  try {
    const downloadsPath = app.getPath('downloads');
    const filePath = path.join(downloadsPath, fileName);

    // Sauvegarder le fichier selon l'encodage
    if (encoding === 'base64') {
      // Extraire les données base64 (enlever le préfixe data:image/png;base64,)
      const base64Data = content.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return { success: true, filePath: filePath };
  } catch (error: any) {
    console.error('Erreur sauvegarde dans Téléchargements:', error);
    return { success: false, error: error.message };
  }
});

// ========== AUTHENTICATION HANDLERS (avec bcrypt) ==========

/**
 * Handler pour créer un utilisateur avec mot de passe hashé
 *
 * Utilise bcrypt pour hasher le mot de passe avant de le stocker en base.
 * Salt rounds: 10 (bon équilibre sécurité/performance)
 */
ipcMain.handle('auth:register', async (event, username: string, password: string) => {
  try {
    // Hash le mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insérer l'utilisateur avec le mot de passe hashé
    const result = await new Promise((resolve, reject) => {
      try {
        db.run(
          'INSERT INTO users (username, password, is_setup_complete) VALUES (?, ?, 1)',
          [username, hashedPassword]
        );

        // Récupérer le dernier ID inséré
        const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
        lastIdStmt.step();
        const lastId = lastIdStmt.getAsObject().id;
        lastIdStmt.free();

        saveDatabase();

        resolve({ success: true, data: { lastInsertRowid: lastId } });
      } catch (error: any) {
        reject(error);
      }
    });

    return result;
  } catch (error: any) {
    console.error('Erreur registration:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour vérifier les identifiants de connexion
 *
 * Compare le mot de passe fourni avec le hash stocké en utilisant bcrypt.compare().
 * Gère aussi la rétrocompatibilité avec les anciens mots de passe en clair.
 */
ipcMain.handle('auth:login', async (event, username: string, password: string) => {
  try {
    // Récupérer l'utilisateur
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);

    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Vérifier le mot de passe
    let isPasswordValid = false;

    // Déterminer si le mot de passe est hashé ou en clair (legacy)
    const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

    if (isHashed) {
      // Mot de passe hashé - utiliser bcrypt.compare
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Mot de passe en clair (legacy) - comparaison directe
      isPasswordValid = password === user.password;

      // Si le mot de passe est valide, le migrer vers hash
      if (isPasswordValid) {
        console.log('Migrating legacy password to bcrypt hash for user:', username);
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        saveDatabase();
      }
    }

    if (isPasswordValid) {
      return { success: true, data: [user] };
    } else {
      return { success: false, error: 'Mot de passe incorrect' };
    }
  } catch (error: any) {
    console.error('Erreur login:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour changer le mot de passe d'un utilisateur
 *
 * Hash le nouveau mot de passe avant de le stocker.
 */
ipcMain.handle('auth:change-password', async (event, userId: number, oldPassword: string, newPassword: string) => {
  try {
    // Vérifier l'ancien mot de passe
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);

    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Vérifier l'ancien mot de passe
    const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    let isOldPasswordValid = false;

    if (isHashed) {
      isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    } else {
      isOldPasswordValid = oldPassword === user.password;
    }

    if (!isOldPasswordValid) {
      return { success: false, error: 'Ancien mot de passe incorrect' };
    }

    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Mettre à jour le mot de passe
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    saveDatabase();

    return { success: true };
  } catch (error: any) {
    console.error('Erreur changement mot de passe:', error);
    return { success: false, error: error.message };
  }
});

// ========== ENCRYPTION HANDLERS ==========

/**
 * Handler pour chiffrer du texte
 */
ipcMain.handle('encrypt:text', async (event, plaintext: string) => {
  try {
    const encrypted = encryptForDB(plaintext);
    return { success: true, data: encrypted };
  } catch (error: any) {
    console.error('Erreur encryption:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour déchiffrer du texte
 */
ipcMain.handle('decrypt:text', async (event, encryptedData: string) => {
  try {
    const decrypted = decryptFromDB(encryptedData);
    return { success: true, data: decrypted };
  } catch (error: any) {
    console.error('Erreur decryption:', error);
    return { success: false, error: error.message };
  }
});

// ========== BACKUP HANDLERS ==========

/**
 * Handler pour créer un backup manuel
 */
ipcMain.handle('backup:create', async () => {
  try {
    const result = await createBackup();
    return result;
  } catch (error: any) {
    console.error('Erreur backup creation:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour lister tous les backups
 */
ipcMain.handle('backup:list', async () => {
  try {
    const backups = await listBackups();

    // Transformer les données pour correspondre au format frontend
    const transformedBackups = backups.map(backup => ({
      filename: backup.filename,
      path: backup.path,
      timestamp: backup.timestamp.getTime(), // Convertir Date en Unix timestamp
      date: backup.timestamp.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      size: backup.size,
      sizeFormatted: formatBytes(backup.size),
      type: backup.type
    }));

    return { success: true, data: transformedBackups };
  } catch (error: any) {
    console.error('Erreur backup list:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour obtenir le statut des backups
 */
ipcMain.handle('backup:status', async () => {
  try {
    const status = await getBackupStatus();

    // Transformer les données pour le frontend
    let lastBackup = null;
    if (status.backupsList && status.backupsList.length > 0) {
      const latest = status.backupsList[0]; // Premier = plus récent
      lastBackup = {
        filename: latest.filename,
        path: latest.path,
        timestamp: latest.timestamp.getTime(),
        date: latest.timestamp.toLocaleString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        size: latest.size,
        sizeFormatted: formatBytes(latest.size),
        type: latest.type
      };
    }

    const transformedStatus = {
      totalBackups: status.totalBackups,
      totalSize: status.totalSize,
      totalSizeFormatted: status.totalSizeFormatted,
      lastBackup: lastBackup,
      backupFolder: getBackupFolderPath()
    };

    return { success: true, data: transformedStatus };
  } catch (error: any) {
    console.error('Erreur backup status:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour restaurer un backup
 */
ipcMain.handle('backup:restore', async (event, backupFileName: string) => {
  try {
    const result = await restoreBackup(backupFileName);
    return result;
  } catch (error: any) {
    console.error('Erreur backup restore:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour supprimer un backup
 */
ipcMain.handle('backup:delete', async (event, backupFileName: string) => {
  try {
    const result = await deleteBackup(backupFileName);
    return result;
  } catch (error: any) {
    console.error('Erreur backup delete:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour obtenir le chemin du dossier de backups
 */
ipcMain.handle('backup:get-folder', async () => {
  try {
    const folder = getBackupFolderPath();
    return { success: true, data: folder };
  } catch (error: any) {
    console.error('Erreur backup get-folder:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC Handlers pour le Stockage Sécurisé des Clés API
// ============================================================================

/**
 * Secure storage for API keys using Electron's safeStorage
 * Keys are encrypted with OS-level encryption (Windows DPAPI, macOS Keychain, Linux Secret Service)
 */
const SECURE_KEYS_FILE = path.join(app.getPath('userData'), 'secure-keys.dat');

/**
 * Saves an encrypted API key or config to secure storage
 */
ipcMain.handle('secure:save-config', async (_event, key: string, value: string) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return { success: false, error: 'Chiffrement système non disponible' };
    }

    // Read existing keys
    let keys: Record<string, string> = {};
    if (fs.existsSync(SECURE_KEYS_FILE)) {
      try {
        const encryptedData = fs.readFileSync(SECURE_KEYS_FILE);
        const decrypted = safeStorage.decryptString(encryptedData);
        keys = JSON.parse(decrypted);
      } catch (error) {
        console.warn('Could not read existing keys, creating new file');
      }
    }

    // Update with new key
    keys[key] = value;

    // Encrypt and save
    const jsonString = JSON.stringify(keys);
    const encrypted = safeStorage.encryptString(jsonString);
    fs.writeFileSync(SECURE_KEYS_FILE, encrypted, { mode: 0o600 });

    console.log(`✅ Clé sécurisée '${key}' sauvegardée`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur sauvegarde clé sécurisée:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Retrieves an encrypted API key or config from secure storage
 */
ipcMain.handle('secure:get-config', async (_event, key: string) => {
  try {
    if (!fs.existsSync(SECURE_KEYS_FILE)) {
      return { success: true, data: null };
    }

    if (!safeStorage.isEncryptionAvailable()) {
      return { success: false, error: 'Chiffrement système non disponible' };
    }

    const encryptedData = fs.readFileSync(SECURE_KEYS_FILE);
    const decrypted = safeStorage.decryptString(encryptedData);
    const keys: Record<string, string> = JSON.parse(decrypted);

    return { success: true, data: keys[key] || null };
  } catch (error: any) {
    console.error('Erreur lecture clé sécurisée:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Deletes a specific key from secure storage
 */
ipcMain.handle('secure:delete-config', async (_event, key: string) => {
  try {
    if (!fs.existsSync(SECURE_KEYS_FILE)) {
      return { success: true };
    }

    if (!safeStorage.isEncryptionAvailable()) {
      return { success: false, error: 'Chiffrement système non disponible' };
    }

    const encryptedData = fs.readFileSync(SECURE_KEYS_FILE);
    const decrypted = safeStorage.decryptString(encryptedData);
    const keys: Record<string, string> = JSON.parse(decrypted);

    delete keys[key];

    // Save updated keys
    const jsonString = JSON.stringify(keys);
    const encrypted = safeStorage.encryptString(jsonString);
    fs.writeFileSync(SECURE_KEYS_FILE, encrypted, { mode: 0o600 });

    console.log(`✅ Clé sécurisée '${key}' supprimée`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur suppression clé sécurisée:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC Handlers pour le Backend Python
// ============================================================================

/**
 * Handler pour vérifier l'état du backend Python
 */
ipcMain.handle('python:backend-status', async () => {
  try {
    const status = await getBackendStatus();
    return { success: true, data: status };
  } catch (error: any) {
    console.error('Erreur backend status:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour redémarrer le backend Python
 */
ipcMain.handle('python:backend-restart', async () => {
  try {
    const success = await restartPythonBackend();
    return { success, message: success ? 'Backend redémarré' : 'Échec du redémarrage' };
  } catch (error: any) {
    console.error('Erreur backend restart:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================
// Claude API Handlers (ChatDoctor)
// ============================================================

// Variable pour stocker la clé API Claude (en mémoire uniquement pour sécurité)
let claudeAPIKey: string | null = null;

/**
 * Handler pour définir la clé API Claude
 */
ipcMain.handle('claude:set-api-key', async (_event, apiKey: string) => {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, error: 'Clé API invalide' };
    }
    claudeAPIKey = apiKey.trim();
    console.log('✅ Clé API Claude configurée');
    return { success: true };
  } catch (error: any) {
    console.error('Erreur configuration clé API:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour récupérer le statut de la clé API
 */
ipcMain.handle('claude:get-api-key', async () => {
  try {
    return {
      success: true,
      data: claudeAPIKey ? '***configurée***' : null
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

/**
 * Handler pour appeler l'API Claude
 */
ipcMain.handle('claude:call-api', async (_event, params: {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}) => {
  try {
    if (!claudeAPIKey) {
      return {
        success: false,
        error: 'Clé API Claude non configurée. Veuillez la configurer dans les paramètres.'
      };
    }

    const { systemPrompt, messages, maxTokens = 1500, temperature = 0.7 } = params;

    // Appel à l'API Claude (Anthropic)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeAPIKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Claude:', errorData);
      return {
        success: false,
        error: `API Claude error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      };
    }

    const data = await response.json();

    // Extraire le contenu de la réponse
    const content = data.content?.[0]?.text || '';

    return {
      success: true,
      data: { content }
    };

  } catch (error: any) {
    console.error('Erreur appel API Claude:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue lors de l\'appel à Claude'
    };
  }
});
