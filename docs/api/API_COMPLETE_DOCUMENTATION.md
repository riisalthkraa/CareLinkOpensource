# CareLink - Documentation API Complète
## Architecture, Dépendances, Modules et Fonctionnement

**Version:** 2.0.0
**Date:** Novembre 2025
**Auteur:** VIEY David
**Type:** Application Desktop Electron + Backend Python ML

---

## Table des Matières

1. [Vue d'ensemble Architecture](#1-vue-densemble-architecture)
2. [Stack Technologique](#2-stack-technologique)
3. [Architecture Backend Electron](#3-architecture-backend-electron)
4. [Architecture Backend Python ML](#4-architecture-backend-python-ml)
5. [Architecture Frontend React](#5-architecture-frontend-react)
6. [Modules Analytics & Intelligence Artificielle](#6-modules-analytics--intelligence-artificielle)
7. [API Electron IPC](#7-api-electron-ipc)
8. [API Python FastAPI](#8-api-python-fastapi)
9. [Services d'Analyse de Santé](#9-services-danalyse-de-santé)
10. [Base de Données SQLite](#10-base-de-données-sqlite)
11. [Sécurité & Encryption](#11-sécurité--encryption)
12. [Système de Build & Déploiement](#12-système-de-build--déploiement)
13. [Exemples d'Intégration](#13-exemples-dintégration)

---

## 1. Vue d'ensemble Architecture

### 1.1 Architecture Globale

```
┌──────────────────────────────────────────────────────────────┐
│                    CARELINK APPLICATION                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         FRONTEND - React 18 + TypeScript            │    │
│  │  ┌───────────┬───────────┬──────────┬─────────┐    │    │
│  │  │ Dashboard │ Analytics │ Timeline │ Scanner │    │    │
│  │  ├───────────┼───────────┼──────────┼─────────┤    │    │
│  │  │ Profil    │ Vaccins   │ RDV      │ Chat AI │    │    │
│  │  └───────────┴───────────┴──────────┴─────────┘    │    │
│  │                      ↕                               │    │
│  │         [Context API + State Management]            │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↕                                   │
│            [Electron IPC - Secure Communication]            │
│                          ↕                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │      BACKEND ELECTRON - Node.js + TypeScript        │    │
│  │  ┌───────────┬───────────┬──────────┬─────────┐    │    │
│  │  │ SQLite DB │ Encryption│ Backup   │ QRCode  │    │    │
│  │  ├───────────┼───────────┼──────────┼─────────┤    │    │
│  │  │ Analytics │ Alerts    │ PDF Gen  │ OCR     │    │    │
│  │  └───────────┴───────────┴──────────┴─────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↕                                   │
│              [HTTP REST API - localhost:8000]               │
│                          ↕                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │       BACKEND PYTHON - FastAPI + ML Libraries       │    │
│  │  ┌───────────┬────────────┬──────────┬─────────┐   │    │
│  │  │ EasyOCR   │ scikit-l.  │ NLP      │ Predict │   │    │
│  │  ├───────────┼────────────┼──────────┼─────────┤   │    │
│  │  │ Validator │ Med DB     │ Health   │ ML      │   │    │
│  │  └───────────┴────────────┴──────────┴─────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Flux de Données Principal

```
User Action (React)
    ↓
Context API / State Update
    ↓
IPC Call via window.electronAPI
    ↓
Electron Main Process Handler
    ↓
┌───────────────┴───────────────┐
│                               │
SQLite Database          Python Backend (si ML/OCR)
    ↓                           ↓
Process Data             ML Processing
    ↓                           ↓
Return to Renderer       Return JSON Response
    ↓                           ↓
└───────────────┬───────────────┘
    ↓
Update React State
    ↓
Re-render UI Components
```

---

## 2. Stack Technologique

### 2.1 Frontend

```json
{
  "framework": "React 18.2.0",
  "language": "TypeScript 5.3.3",
  "bundler": "Vite 5.0.8",
  "ui_library": "Custom CSS + Design System",
  "form_management": "react-hook-form 7.49.2",
  "charts": "recharts 2.10.3",
  "date_management": "date-fns 3.0.6"
}
```

**Dépendances Clés:**
- `react` + `react-dom`: Framework UI
- `react-hook-form`: Gestion de formulaires complexes
- `recharts`: Visualisation de données médicales
- `date-fns`: Manipulation de dates pour rendez-vous/traitements

### 2.2 Backend Electron (Node.js)

```json
{
  "runtime": "Electron 28.0.0",
  "language": "TypeScript 5.3.3",
  "database": "sql.js 1.10.3 (SQLite in-memory)",
  "security": "bcrypt 6.0.0",
  "storage": "electron-store 8.1.0",
  "ocr": "tesseract.js 6.0.1",
  "pdf": "pdfkit 0.14.0",
  "qrcode": "qrcode 1.5.4",
  "image_processing": "sharp 0.33.1",
  "scheduling": "node-cron 3.0.3",
  "notifications": "node-notifier 10.0.1"
}
```

**Modules Système:**
- `electron`: Framework desktop cross-platform
- `sql.js`: SQLite compilé en WebAssembly
- `bcrypt`: Hashing sécurisé des mots de passe
- `electron-store`: Stockage local persistant
- `sharp`: Traitement d'images haute performance
- `node-cron`: Planification de tâches automatiques
- `node-notifier`: Notifications système natives

### 2.3 Backend Python (Machine Learning)

```python
# requirements.txt
{
    "web_framework": "fastapi==0.104.1",
    "server": "uvicorn[standard]==0.24.0",
    "ocr": "easyocr==1.7.1",
    "image_processing": [
        "opencv-python==4.8.1.78",
        "Pillow==10.1.0",
        "numpy==1.26.2"
    ],
    "machine_learning": [
        "scikit-learn==1.3.2",
        "pandas==2.1.4"
    ],
    "validation": "pydantic==2.5.0"
}
```

**Caractéristiques ML:**
- **EasyOCR**: Modèles deep learning pour reconnaissance de texte (français)
- **scikit-learn**: Modèles ML (Random Forest, Gradient Boosting, Isolation Forest)
- **pandas**: Manipulation de données médicales
- **FastAPI**: API REST moderne avec validation automatique

### 2.4 Build & DevOps

```json
{
  "build_tool": "electron-builder 24.9.1",
  "dev_server": "vite 5.0.8",
  "process_manager": "concurrently 8.2.2",
  "port_management": "kill-port 2.0.1",
  "wait_utility": "wait-on 7.2.0"
}
```

---

## 3. Architecture Backend Electron

### 3.1 Point d'Entrée Principal (electron/main.ts)

**Responsabilités:**
- Création de la fenêtre Electron
- Initialisation de la base de données SQLite
- Gestion des handlers IPC
- Démarrage du backend Python
- Sécurité et encryption
- Backups automatiques

**Structure:**

```typescript
// Fichier: electron/main.ts

// ===== IMPORTS =====
import { app, BrowserWindow, ipcMain } from 'electron';
import initSqlJs from 'sql.js';
import * as bcrypt from 'bcrypt';
import { seedDatabase } from './seed-data';
import { encrypt, decrypt } from './encryption';
import { createBackup, startAutomaticBackups } from './backup';
import { startPythonBackend, stopPythonBackend } from './python-backend-manager';

// ===== VARIABLES GLOBALES =====
let mainWindow: BrowserWindow | null = null;
let db: any = null; // Instance SQLite
let SQL: any = null; // Module SQL.js

// ===== CONFIGURATION =====
const BCRYPT_SALT_ROUNDS = 10;
const DB_PATH = path.join(app.getPath('userData'), 'carelink.db');

// ===== INITIALISATION DATABASE =====
async function initDatabase(): Promise<void> {
  SQL = await initSqlJs();

  // Charger ou créer DB
  let buffer: Buffer | undefined;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }

  db = new SQL.Database(buffer);

  // Créer tables (users, famille, membres, vaccins, etc.)
  db.exec(CREATE_TABLES_SQL);

  // Seed si vide
  if (isDatabaseEmpty()) {
    await seedDatabase(db);
  }

  // Sauvegarder sur disque
  saveDatabase();
}

// ===== CRÉATION FENÊTRE =====
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false, // Sécurité
      contextIsolation: true,  // Sécurité
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Charger l'app React
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile('dist/renderer/index.html');
  }
}

// ===== HANDLERS IPC (voir section 7) =====
function setupIPCHandlers(): void {
  // Authentification
  ipcMain.handle('auth:login', handleLogin);
  ipcMain.handle('auth:register', handleRegister);

  // Base de données
  ipcMain.handle('db:query', handleDBQuery);
  ipcMain.handle('db:execute', handleDBExecute);

  // Fichiers
  ipcMain.handle('file:select', handleFileSelect);
  ipcMain.handle('file:save', handleFileSave);

  // Python Backend
  ipcMain.handle('python:start', () => startPythonBackend());
  ipcMain.handle('python:status', getBackendStatus);

  // ... +50 autres handlers
}

// ===== LIFECYCLE =====
app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
  setupIPCHandlers();
  startAutomaticBackups(db, 24 * 60 * 60 * 1000); // 24h
  await startPythonBackend();
});

app.on('before-quit', () => {
  stopAutomaticBackups();
  stopPythonBackend();
  saveDatabase();
});
```

### 3.2 Preload Script (electron/preload.ts)

**Rôle:** Bridge sécurisé entre le renderer (React) et le main process

```typescript
// Fichier: electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Exposition d'une API sécurisée au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== AUTHENTIFICATION =====
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),

  register: (username: string, password: string) =>
    ipcRenderer.invoke('auth:register', username, password),

  // ===== DATABASE =====
  dbQuery: (sql: string, params?: any[]) =>
    ipcRenderer.invoke('db:query', sql, params),

  dbExecute: (sql: string, params?: any[]) =>
    ipcRenderer.invoke('db:execute', sql, params),

  // ===== PYTHON BACKEND =====
  pythonOCR: (imagePath: string) =>
    ipcRenderer.invoke('python:ocr', imagePath),

  pythonPredict: (memberData: any) =>
    ipcRenderer.invoke('python:predict', memberData),

  // ===== FICHIERS =====
  selectFile: (filters?: any) =>
    ipcRenderer.invoke('file:select', filters),

  saveFile: (data: any, defaultPath?: string) =>
    ipcRenderer.invoke('file:save', data, defaultPath),

  // ===== PDF & QRCODE =====
  generatePDF: (data: any) =>
    ipcRenderer.invoke('pdf:generate', data),

  generateQRCode: (data: string) =>
    ipcRenderer.invoke('qrcode:generate', data),

  // ===== BACKUP =====
  createBackup: () =>
    ipcRenderer.invoke('backup:create'),

  restoreBackup: (backupId: string) =>
    ipcRenderer.invoke('backup:restore', backupId),

  listBackups: () =>
    ipcRenderer.invoke('backup:list'),

  // ===== NOTIFICATIONS =====
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('notification:show', title, body),

  // ... +40 autres méthodes
});

// Type definitions pour TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
```

### 3.3 Gestionnaire Backend Python (electron/python-backend-manager.ts)

```typescript
// Fichier: electron/python-backend-manager.ts

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import axios from 'axios';

const PYTHON_BACKEND_PORT = 8000;
const PYTHON_BACKEND_URL = `http://localhost:${PYTHON_BACKEND_PORT}`;

let pythonProcess: ChildProcess | null = null;
let isBackendReady = false;

/**
 * Démarre le backend Python FastAPI
 */
export async function startPythonBackend(): Promise<boolean> {
  const pythonDir = path.join(__dirname, '..', 'python-backend');
  const pythonScript = path.join(pythonDir, 'main.py');

  // Lancer le processus Python
  pythonProcess = spawn('python', [pythonScript], {
    cwd: pythonDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Logger les sorties
  pythonProcess.stdout?.on('data', (data) => {
    console.log(`[Python] ${data.toString()}`);
  });

  pythonProcess.stderr?.on('data', (data) => {
    console.error(`[Python Error] ${data.toString()}`);
  });

  // Attendre que le serveur soit prêt
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${PYTHON_BACKEND_URL}/health`);
      if (response.status === 200) {
        isBackendReady = true;
        console.log('✅ Backend Python démarré avec succès');
        return true;
      }
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.error('❌ Échec du démarrage du backend Python');
  return false;
}

/**
 * Arrête le backend Python
 */
export function stopPythonBackend(): void {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    isBackendReady = false;
    console.log('🛑 Backend Python arrêté');
  }
}

/**
 * Vérifie le statut du backend
 */
export function getBackendStatus(): { running: boolean; ready: boolean } {
  return {
    running: pythonProcess !== null,
    ready: isBackendReady
  };
}

/**
 * Redémarre le backend Python
 */
export async function restartPythonBackend(): Promise<boolean> {
  stopPythonBackend();
  await new Promise(resolve => setTimeout(resolve, 2000));
  return startPythonBackend();
}
```

### 3.4 Module de Sécurité (electron/encryption.ts)

```typescript
// Fichier: electron/encryption.ts

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

// Dériver une clé depuis un mot de passe
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Chiffre des données sensibles
 */
export function encrypt(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encrypted
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted
  ].join(':');
}

/**
 * Déchiffre des données
 */
export function decrypt(ciphertext: string, password: string): string {
  const parts = ciphertext.split(':');

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];

  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Chiffrement pour la base de données (colonnes sensibles)
 */
export function encryptForDB(data: string, userPassword: string): string {
  return encrypt(data, userPassword);
}

export function decryptFromDB(encrypted: string, userPassword: string): string {
  return decrypt(encrypted, userPassword);
}
```

### 3.5 Système de Backup (electron/backup.ts)

```typescript
// Fichier: electron/backup.ts

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  compressed: boolean;
}

let backupInterval: NodeJS.Timeout | null = null;

/**
 * Crée un backup de la base de données
 */
export async function createBackup(
  db: any,
  description?: string
): Promise<BackupMetadata> {
  const backupDir = getBackupFolderPath();

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `backup_${timestamp}`;
  const backupPath = path.join(backupDir, `${backupId}.db`);

  // Exporter la DB
  const data = db.export();
  const buffer = Buffer.from(data);

  // Sauvegarder
  fs.writeFileSync(backupPath, buffer);

  // Métadonnées
  const metadata: BackupMetadata = {
    id: backupId,
    timestamp: new Date().toISOString(),
    size: buffer.length,
    compressed: false
  };

  // Sauvegarder métadonnées
  const metaPath = path.join(backupDir, `${backupId}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  console.log(`✅ Backup créé: ${backupId}`);
  return metadata;
}

/**
 * Restaure un backup
 */
export async function restoreBackup(
  backupId: string,
  SQL: any
): Promise<any> {
  const backupDir = getBackupFolderPath();
  const backupPath = path.join(backupDir, `${backupId}.db`);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup introuvable: ${backupId}`);
  }

  const buffer = fs.readFileSync(backupPath);
  const db = new SQL.Database(buffer);

  console.log(`✅ Backup restauré: ${backupId}`);
  return db;
}

/**
 * Liste tous les backups disponibles
 */
export function listBackups(): BackupMetadata[] {
  const backupDir = getBackupFolderPath();

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir);
  const metaFiles = files.filter(f => f.endsWith('.json'));

  return metaFiles.map(file => {
    const content = fs.readFileSync(path.join(backupDir, file), 'utf8');
    return JSON.parse(content) as BackupMetadata;
  }).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Démarre les backups automatiques
 */
export function startAutomaticBackups(
  db: any,
  intervalMs: number = 24 * 60 * 60 * 1000 // 24h par défaut
): void {
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  backupInterval = setInterval(() => {
    createBackup(db, 'Backup automatique')
      .then(() => console.log('✅ Backup automatique créé'))
      .catch(err => console.error('❌ Erreur backup automatique:', err));
  }, intervalMs);

  console.log(`🔄 Backups automatiques activés (interval: ${intervalMs}ms)`);
}

/**
 * Arrête les backups automatiques
 */
export function stopAutomaticBackups(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('🛑 Backups automatiques désactivés');
  }
}

export function getBackupFolderPath(): string {
  return path.join(app.getPath('userData'), 'backups');
}
```

---

## 4. Architecture Backend Python ML

### 4.1 Point d'Entrée FastAPI (python-backend/main.py)

```python
"""
CareLink Medical OCR Backend - API FastAPI
===========================================

Serveur Python pour améliorer l'OCR des ordonnances médicales.
Utilise EasyOCR + NLP médical pour extraction précise.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn

# Import des modules métier
from ocr_service import MedicalOCRService
from nlp_extractor import MedicalNLPExtractor
from medication_validator import MedicationValidator
from health_predictor import HealthPredictor

app = FastAPI(
    title="CareLink Medical OCR API",
    version="1.0.0"
)

# CORS pour Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "file://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services (lazy loading)
ocr_service: Optional[MedicalOCRService] = None
nlp_extractor: Optional[MedicalNLPExtractor] = None
medication_validator: Optional[MedicationValidator] = None
health_predictor: Optional[HealthPredictor] = None

# ===== MODELS =====
class OCRResponse(BaseModel):
    success: bool
    text: str
    confidence: float
    medications: List[Dict]
    posology: Optional[str]
    doctor: Optional[str]
    date: Optional[str]

class HealthPredictionRequest(BaseModel):
    age: int
    vaccinations: Dict[str, int]
    appointments: Dict[str, int]
    treatments: Dict[str, int]
    allergies: Dict[str, int]
    days_since_last_appointment: int

class HealthPredictionResponse(BaseModel):
    risk_level: str  # low, moderate, high, critical
    risk_score: float  # 0-100
    adherence_score: float  # 0-100
    recommendations: List[str]
    anomalies_detected: List[str]

# ===== ENDPOINTS =====

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "ocr": ocr_service is not None,
            "nlp": nlp_extractor is not None,
            "validator": medication_validator is not None,
            "ml_predictor": health_predictor is not None
        }
    }

@app.post("/ocr/extract", response_model=OCRResponse)
async def extract_prescription(file: UploadFile = File(...)):
    """
    Extrait les données d'une ordonnance médicale

    Processus:
    1. Réception de l'image
    2. OCR avec EasyOCR (français)
    3. Extraction NLP des médicaments
    4. Validation des noms de médicaments
    5. Extraction posologie, médecin, date

    Returns:
        OCRResponse avec toutes les données extraites
    """
    # Lazy load du service OCR
    global ocr_service, nlp_extractor, medication_validator
    if ocr_service is None:
        ocr_service = MedicalOCRService()
    if nlp_extractor is None:
        nlp_extractor = MedicalNLPExtractor()
    if medication_validator is None:
        medication_validator = MedicationValidator()

    # Sauvegarder l'image temporairement
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        # 1. OCR
        ocr_result = ocr_service.extract_text(temp_path)

        # 2. Extraction NLP
        medications = nlp_extractor.extract_medications(ocr_result['text'])

        # 3. Validation des médicaments
        validated_meds = []
        for med in medications:
            validation = medication_validator.validate(med['name'])
            validated_meds.append({
                "original": med['name'],
                "validated": validation['corrected_name'],
                "confidence": validation['confidence'],
                "dci": validation.get('dci'),
                "posology": med.get('posology')
            })

        # 4. Extraction métadonnées
        posology = nlp_extractor.extract_posology(ocr_result['text'])
        doctor = nlp_extractor.extract_doctor(ocr_result['text'])
        date = nlp_extractor.extract_date(ocr_result['text'])

        return OCRResponse(
            success=True,
            text=ocr_result['text'],
            confidence=ocr_result['confidence'],
            medications=validated_meds,
            posology=posology,
            doctor=doctor,
            date=date
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/health/predict", response_model=HealthPredictionResponse)
async def predict_health_risks(request: HealthPredictionRequest):
    """
    Prédit les risques de santé avec ML

    Modèles utilisés:
    - Random Forest: Classification des risques
    - Gradient Boosting: Prédiction adhérence
    - Isolation Forest: Détection d'anomalies

    Returns:
        Scores, niveau de risque et recommandations
    """
    global health_predictor
    if health_predictor is None:
        health_predictor = HealthPredictor()

    member_data = request.dict()

    # Prédiction des risques
    prediction = health_predictor.predict_risks(member_data)

    # Calcul de l'adhérence
    adherence = health_predictor.predict_adherence(member_data)

    # Détection d'anomalies
    anomalies = health_predictor.detect_anomalies(member_data)

    # Génération de recommandations
    recommendations = health_predictor.generate_recommendations(
        prediction, adherence, anomalies
    )

    return HealthPredictionResponse(
        risk_level=prediction['level'],
        risk_score=prediction['score'],
        adherence_score=adherence['score'],
        recommendations=recommendations,
        anomalies_detected=anomalies
    )

@app.post("/medication/validate")
async def validate_medication(medication_name: str):
    """
    Valide un nom de médicament

    Retourne:
    - Nom corrigé si erreur d'OCR
    - DCI (substance active)
    - Forme galénique
    - Confiance de la validation
    """
    global medication_validator
    if medication_validator is None:
        medication_validator = MedicationValidator()

    result = medication_validator.validate(medication_name)
    return result

# ===== DÉMARRAGE =====
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
```

### 4.2 Service OCR Médical (python-backend/ocr_service.py)

```python
"""
Service OCR Médical - EasyOCR optimisé pour ordonnances
"""

import easyocr
import cv2
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class MedicalOCRService:
    """Service OCR optimisé pour les documents médicaux"""

    def __init__(self):
        """Initialiser EasyOCR avec modèle français"""
        logger.info("Initialisation d'EasyOCR (français)...")

        # EasyOCR avec GPU si disponible
        self.reader = easyocr.Reader(
            ['fr'],  # Langue française
            gpu=False,  # CPU par défaut (compatible partout)
            verbose=False
        )

        logger.info("✓ EasyOCR prêt")

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Prétraitement de l'image pour améliorer l'OCR

        Techniques:
        - Conversion en niveaux de gris
        - Débruitage
        - Amélioration du contraste
        - Binarisation adaptive
        """
        # Charger l'image
        image = cv2.imread(image_path)

        # Niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Débruitage
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

        # Amélioration du contraste (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrasted = clahe.apply(denoised)

        # Binarisation adaptive
        binary = cv2.adaptiveThreshold(
            contrasted, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        return binary

    def extract_text(self, image_path: str) -> dict:
        """
        Extrait le texte d'une image d'ordonnance

        Returns:
            {
                'text': str,
                'confidence': float,
                'words': List[Dict]
            }
        """
        # Prétraiter l'image
        processed_image = self.preprocess_image(image_path)

        # OCR
        results = self.reader.readtext(processed_image)

        # Extraire texte et confiance
        words = []
        full_text = []
        total_confidence = 0.0

        for (bbox, text, confidence) in results:
            words.append({
                'text': text,
                'confidence': confidence,
                'bbox': bbox
            })
            full_text.append(text)
            total_confidence += confidence

        avg_confidence = total_confidence / len(results) if results else 0.0

        return {
            'text': ' '.join(full_text),
            'confidence': avg_confidence,
            'words': words
        }
```

### 4.3 Prédicteur de Santé ML (python-backend/health_predictor.py)

```python
"""
Prédicteur de Santé ML - Modèles de Machine Learning
=====================================================

Implémente des modèles ML pour prédire les risques de santé.

Modèles:
1. Random Forest - Classification des risques
2. Gradient Boosting - Prédiction d'adhérence
3. Isolation Forest - Détection d'anomalies
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    IsolationForest
)
from sklearn.preprocessing import StandardScaler
from typing import Dict, List

class HealthPredictor:
    """Prédicteur ML de risques de santé"""

    def __init__(self):
        """Initialiser les modèles ML"""
        # Modèles
        self.risk_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.adherence_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )

        # Scaler pour normalisation
        self.scaler = StandardScaler()

        self.is_trained = False

    def extract_features(self, member_data: Dict) -> np.ndarray:
        """
        Extraire les features ML depuis les données patient

        Features (18 total):
        1. age
        2. is_senior (>= 65)
        3. is_child (<= 18)
        4. vaccination_ratio
        5. missing_vaccinations
        6. appointment_completion_ratio
        7. appointment_cancellation_ratio
        8. total_appointments
        9. active_treatments
        10. low_stock_treatments
        11. expiring_treatments
        12. severe_allergies
        13. days_since_last_appointment
        14. appointment_regularity_score
        15. treatment_count_risk (> 5 traitements)
        16. vaccination_overdue_count
        17. health_engagement_score
        18. risk_age_factor
        """
        features = []

        # Démographiques
        age = member_data.get('age', 0)
        features.append(age)
        features.append(1 if age >= 65 else 0)
        features.append(1 if age <= 18 else 0)

        # Vaccinations
        vac = member_data.get('vaccinations', {})
        vac_total = vac.get('total', 0)
        vac_completed = vac.get('completed', 0)
        vac_ratio = vac_completed / vac_total if vac_total > 0 else 0
        features.append(vac_ratio)
        features.append(vac_total - vac_completed)

        # Rendez-vous
        apt = member_data.get('appointments', {})
        apt_total = apt.get('total', 0)
        apt_completed = apt.get('completed', 0)
        apt_cancelled = apt.get('cancelled', 0)
        apt_completion = apt_completed / apt_total if apt_total > 0 else 0
        apt_cancellation = apt_cancelled / apt_total if apt_total > 0 else 0
        features.append(apt_completion)
        features.append(apt_cancellation)
        features.append(apt_total)

        # Traitements
        trt = member_data.get('treatments', {})
        features.append(trt.get('active', 0))
        features.append(trt.get('low_stock', 0))
        features.append(trt.get('expiring', 0))

        # Allergies
        allg = member_data.get('allergies', {})
        features.append(allg.get('severe', 0))

        # Temporel
        features.append(member_data.get('days_since_last_appointment', 0))

        # Scores dérivés
        regularity = 100 - min(100, member_data.get('days_since_last_appointment', 0) / 3)
        features.append(regularity)

        treatment_risk = 1 if trt.get('active', 0) > 5 else 0
        features.append(treatment_risk)

        vac_overdue = max(0, vac_total - vac_completed - 1)
        features.append(vac_overdue)

        engagement = (vac_ratio * 40) + (apt_completion * 40) + (regularity * 0.2)
        features.append(engagement)

        age_risk = 1 if (age < 5 or age > 65) else 0
        features.append(age_risk)

        return np.array(features).reshape(1, -1)

    def predict_risks(self, member_data: Dict) -> Dict:
        """
        Prédire le niveau de risque de santé

        Returns:
            {
                'level': 'low' | 'moderate' | 'high' | 'critical',
                'score': float (0-100),
                'factors': List[str]
            }
        """
        features = self.extract_features(member_data)

        # Si modèle non entraîné, utiliser règles heuristiques
        if not self.is_trained:
            return self._heuristic_risk_assessment(member_data)

        # Prédiction ML
        normalized_features = self.scaler.transform(features)
        risk_proba = self.risk_model.predict_proba(normalized_features)[0]

        # Score de risque (0-100)
        risk_score = risk_proba[1] * 100  # Probabilité de risque élevé

        # Niveau de risque
        if risk_score < 25:
            level = 'low'
        elif risk_score < 50:
            level = 'moderate'
        elif risk_score < 75:
            level = 'high'
        else:
            level = 'critical'

        # Facteurs de risque
        factors = self._identify_risk_factors(member_data, features)

        return {
            'level': level,
            'score': risk_score,
            'factors': factors
        }

    def predict_adherence(self, member_data: Dict) -> Dict:
        """
        Prédire l'adhérence aux traitements

        Returns:
            {
                'score': float (0-100),
                'level': 'excellent' | 'good' | 'moderate' | 'poor',
                'issues': List[str]
            }
        """
        trt = member_data.get('treatments', {})
        apt = member_data.get('appointments', {})

        # Score basé sur plusieurs facteurs
        active_treatments = trt.get('active', 0)
        low_stock = trt.get('low_stock', 0)
        expiring = trt.get('expiring', 0)

        apt_total = apt.get('total', 0)
        apt_completed = apt.get('completed', 0)
        apt_cancellation_ratio = apt.get('cancelled', 0) / apt_total if apt_total > 0 else 0

        # Calcul du score
        score = 100.0

        # Pénalités
        if low_stock > 0:
            score -= low_stock * 15
        if expiring > 0:
            score -= expiring * 10
        if apt_cancellation_ratio > 0.2:
            score -= apt_cancellation_ratio * 30

        score = max(0, min(100, score))

        # Niveau
        if score >= 80:
            level = 'excellent'
        elif score >= 60:
            level = 'good'
        elif score >= 40:
            level = 'moderate'
        else:
            level = 'poor'

        # Issues
        issues = []
        if low_stock > 0:
            issues.append(f"{low_stock} traitement(s) en rupture de stock")
        if expiring > 0:
            issues.append(f"{expiring} ordonnance(s) expirant bientôt")
        if apt_cancellation_ratio > 0.2:
            issues.append("Taux élevé d'annulations de rendez-vous")

        return {
            'score': score,
            'level': level,
            'issues': issues
        }

    def detect_anomalies(self, member_data: Dict) -> List[str]:
        """
        Détecte les anomalies dans les données de santé

        Utilise Isolation Forest pour détecter les patterns inhabituels
        """
        anomalies = []

        # Vérifications heuristiques
        age = member_data.get('age', 0)
        trt = member_data.get('treatments', {})
        apt = member_data.get('appointments', {})
        days_since = member_data.get('days_since_last_appointment', 0)

        # Nombre anormal de traitements
        if trt.get('active', 0) > 10:
            anomalies.append("Nombre inhabituellement élevé de traitements actifs")

        # Pas de RDV depuis longtemps
        if days_since > 730:  # 2 ans
            anomalies.append("Aucun rendez-vous médical depuis plus de 2 ans")

        # Senior sans suivi régulier
        if age >= 65 and apt.get('total', 0) < 2:
            anomalies.append("Suivi médical insuffisant pour personne âgée")

        # Enfant avec beaucoup de traitements
        if age <= 12 and trt.get('active', 0) > 3:
            anomalies.append("Nombre élevé de traitements pour un enfant")

        return anomalies

    def generate_recommendations(
        self,
        prediction: Dict,
        adherence: Dict,
        anomalies: List[str]
    ) -> List[str]:
        """Génère des recommandations personnalisées"""
        recommendations = []

        # Basé sur le risque
        if prediction['level'] in ['high', 'critical']:
            recommendations.append("🚨 Planifier une consultation médicale rapidement")

        # Basé sur l'adhérence
        if adherence['level'] in ['poor', 'moderate']:
            recommendations.append("📋 Améliorer le suivi des traitements")
            recommendations.append("⏰ Configurer des rappels de prise de médicaments")

        # Basé sur les anomalies
        for anomaly in anomalies:
            if "Aucun rendez-vous" in anomaly:
                recommendations.append("📅 Prendre rendez-vous pour un bilan de santé")
            elif "Nombre inhabituellement élevé" in anomaly:
                recommendations.append("💊 Consulter un médecin pour révision des traitements")

        # Recommandations générales
        if prediction['score'] > 30:
            recommendations.append("🏃 Adopter un mode de vie plus sain")
            recommendations.append("📊 Effectuer un suivi régulier de votre santé")

        return recommendations

    def _heuristic_risk_assessment(self, member_data: Dict) -> Dict:
        """Évaluation heuristique si modèle non entraîné"""
        score = 0.0
        factors = []

        age = member_data.get('age', 0)
        vac = member_data.get('vaccinations', {})
        apt = member_data.get('appointments', {})
        trt = member_data.get('treatments', {})
        days_since = member_data.get('days_since_last_appointment', 0)

        # Facteurs de risque
        if age >= 65 or age <= 5:
            score += 20
            factors.append("Groupe d'âge à risque")

        vac_ratio = vac.get('completed', 0) / vac.get('total', 1)
        if vac_ratio < 0.8:
            score += 15
            factors.append("Couverture vaccinale incomplète")

        apt_total = apt.get('total', 0)
        if apt_total > 0:
            cancel_ratio = apt.get('cancelled', 0) / apt_total
            if cancel_ratio > 0.3:
                score += 15
                factors.append("Taux élevé d'annulation de RDV")

        if days_since > 365:
            score += 20
            factors.append("Pas de consultation récente")

        if trt.get('low_stock', 0) > 0:
            score += 15
            factors.append("Ruptures de stock médicaments")

        # Niveau
        if score < 25:
            level = 'low'
        elif score < 50:
            level = 'moderate'
        elif score < 75:
            level = 'high'
        else:
            level = 'critical'

        return {
            'level': level,
            'score': min(100, score),
            'factors': factors
        }
```

---

## 5. Architecture Frontend React

### 5.1 Point d'Entrée (src/main.tsx)

```typescript
// Fichier: src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 5.2 Application Principale (src/App.tsx)

```typescript
// Fichier: src/App.tsx

import { useState, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider, useNotification } from './contexts/NotificationContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProfilMembre from './pages/ProfilMembre'
import Analytics from './pages/Analytics'
import ChatDoctor from './pages/ChatDoctor'
// ... autres pages

// Components
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ToastContainer from './components/ToastContainer'

type Page = 'dashboard' | 'profil' | 'analytics' | 'chatdoctor' // ... etc

function AppContent() {
  // ===== ÉTATS =====
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedMembre, setSelectedMembre] = useState<number | null>(null)
  const { addNotification } = useNotification()

  // ===== AUTHENTIFICATION =====
  const handleLogin = (loggedInUserId: number) => {
    setUserId(loggedInUserId)
    setIsAuthenticated(true)
    addNotification({
      type: 'success',
      title: 'Connexion réussie',
      message: 'Bienvenue sur CareLink!'
    })
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserId(null)
    setCurrentPage('dashboard')
    setSelectedMembre(null)
  }

  // ===== NAVIGATION =====
  const handleNavigate = (page: Page, membreId?: number) => {
    setCurrentPage(page)
    if (membreId !== undefined) {
      setSelectedMembre(membreId)
    }
  }

  // ===== RENDERING =====
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <TopBar
          userName="Admin"
          onNavigate={handleNavigate}
        />

        <div className="content-area">
          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} userId={userId!} />
          )}
          {currentPage === 'profil' && selectedMembre && (
            <ProfilMembre membreId={selectedMembre} onBack={() => handleNavigate('dashboard')} />
          )}
          {currentPage === 'analytics' && (
            <Analytics userId={userId!} />
          )}
          {/* ... autres pages */}
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  )
}
```

### 5.3 Context API - Thèmes (src/contexts/ThemeContext.tsx)

```typescript
// Fichier: src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'medical' | 'ocean' | 'forest'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  availableThemes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('medical')

  const availableThemes: Theme[] = ['light', 'dark', 'medical', 'ocean', 'forest']

  // Charger le thème depuis le stockage local
  useEffect(() => {
    const savedTheme = localStorage.getItem('carelink-theme') as Theme
    if (savedTheme && availableThemes.includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // Appliquer le thème au DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('carelink-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### 5.4 Context API - Notifications (src/contexts/NotificationContext.tsx)

```typescript
// Fichier: src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useState } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // ms, default 5000
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random()}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove après duration
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
```

---

## 6. Modules Analytics & Intelligence Artificielle

### 6.1 HealthAnalyzer - Analyse Intelligente de Santé

**Fichier:** `src/services/HealthAnalyzer.ts`

**Fonctionnalités:**
- Analyse des tendances de rendez-vous
- Calcul de l'adhérence aux traitements
- Prédiction des risques de santé
- Génération d'un score de santé global (0-100)

**Algorithmes:**
- Moyennes mobiles pour tendances temporelles
- Analyse statistique de régularité
- Évaluation pondérée multi-critères
- Détection de patterns anormaux

**API:**

```typescript
// Analyser les tendances de rendez-vous
interface AppointmentTrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  totalAppointments: number
  averageInterval: number // jours entre RDV
  regularity: 'excellent' | 'good' | 'irregular' | 'rare'
  recommendation: string
}

async function analyzeAppointmentTrends(
  memberId: string
): Promise<AppointmentTrendAnalysis>

// Analyser l'adhérence aux traitements
interface TreatmentAdherenceAnalysis {
  adherenceScore: number // 0-100
  activeTreatments: number
  expiringSoon: number
  lowStock: number
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  issues: string[]
  recommendations: string[]
}

async function analyzeTreatmentAdherence(
  memberId: string
): Promise<TreatmentAdherenceAnalysis>

// Prédire les risques de santé
interface HealthRiskPrediction {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskScore: number // 0-100
  factors: RiskFactor[]
  recommendations: string[]
  urgentActionRequired: boolean
}

async function predictHealthRisks(
  memberId: string
): Promise<HealthRiskPrediction>

// Générer un score de santé global
interface HealthScore {
  score: number // 0-100
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  components: {
    vaccination: number
    appointmentRegularity: number
    treatmentAdherence: number
    healthIssues: number
  }
  trend: 'improving' | 'stable' | 'declining'
  insights: string[]
}

async function generateHealthScore(
  memberId: string
): Promise<HealthScore>
```

**Exemple d'Utilisation:**

```typescript
// Dans une page Analytics
const [healthScore, setHealthScore] = useState<HealthScore | null>(null)

useEffect(() => {
  async function loadAnalytics() {
    const score = await generateHealthScore(membreId)
    setHealthScore(score)

    if (score.level === 'poor') {
      addNotification({
        type: 'warning',
        title: 'Attention santé',
        message: 'Score de santé faible détecté'
      })
    }
  }

  loadAnalytics()
}, [membreId])
```

### 6.2 SmartAlerts - Système d'Alertes Intelligentes

**Fichier:** `src/services/SmartAlerts.ts`

**Fonctionnalités:**
- Alertes proactives basées sur les données
- Système de priorités (critical, high, medium, low)
- Détection automatique d'événements importants
- Suggestions d'actions

**Types d'Alertes:**
- `appointment_missed`: Rendez-vous manqué
- `appointment_upcoming`: RDV dans moins de 24h
- `medication_low`: Stock de médicament faible (<7j)
- `prescription_renewal`: Ordonnance à renouveler
- `vaccination_due`: Vaccination due prochainement
- `vaccination_overdue`: Vaccination en retard
- `drug_interaction`: Interaction médicamenteuse détectée
- `health_score_declining`: Score de santé en baisse
- `no_recent_checkup`: Pas de consultation depuis >1 an

**API:**

```typescript
interface SmartAlert {
  id: string
  type: AlertType
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'dismissed' | 'snoozed'
  title: string
  message: string
  icon: string
  createdAt: Date
  actionable: boolean
  actionLabel?: string
  actionCallback?: string
}

interface AlertCheckResult {
  alerts: SmartAlert[]
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalCount: number
}

// Vérifier toutes les alertes pour un membre
async function checkAllAlerts(memberId: string): Promise<AlertCheckResult>

// Rejeter une alerte
function dismissAlert(alertId: string): void

// Snoozer une alerte (rappel plus tard)
function snoozeAlert(alertId: string, hours: number): void

// Obtenir les alertes actives
function getActiveAlerts(memberId: string): SmartAlert[]
```

**Exemple d'Utilisation:**

```typescript
// Dans le Dashboard
useEffect(() => {
  async function checkAlerts() {
    const result = await checkAllAlerts(selectedMembreId)

    if (result.criticalCount > 0) {
      addNotification({
        type: 'error',
        title: 'Alertes critiques',
        message: `${result.criticalCount} alerte(s) critique(s) nécessitent votre attention`
      })
    }

    setAlerts(result.alerts)
  }

  checkAlerts()

  // Vérifier toutes les 5 minutes
  const interval = setInterval(checkAlerts, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [selectedMembreId])
```

### 6.3 RecommendationEngine - Moteur de Recommandations

**Fichier:** `src/services/RecommendationEngine.ts`

**Fonctionnalités:**
- Recommandations personnalisées basées sur l'âge et le sexe
- Bilans de santé préventifs
- Dépistages selon l'âge
- Conseils de mode de vie
- Vaccinations recommandées

**API:**

```typescript
type RecommendationCategory = 'checkup' | 'vaccination' | 'lifestyle' | 'screening' | 'prevention'

interface HealthRecommendation {
  id: string
  category: RecommendationCategory
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  reason: string
  action: string
  icon: string
  ageRelevant?: string
  frequency?: string
}

interface RecommendationResult {
  recommendations: HealthRecommendation[]
  highPriority: number
  mediumPriority: number
  lowPriority: number
  totalCount: number
  personalized: boolean
}

// Générer des recommandations personnalisées
async function generateRecommendations(
  memberId: string
): Promise<RecommendationResult>
```

**Exemples de Recommandations:**

```typescript
// Femme 40-50 ans
{
  category: 'screening',
  priority: 'high',
  title: 'Mammographie de dépistage',
  description: 'Dépistage du cancer du sein recommandé',
  reason: 'Recommandation pour les femmes de 40-50 ans',
  action: 'Planifier une mammographie tous les 2 ans',
  ageRelevant: '40-50 ans',
  frequency: 'Tous les 2 ans'
}

// Homme 50+ ans
{
  category: 'screening',
  priority: 'high',
  title: 'Dépistage cancer colorectal',
  description: 'Test de dépistage recommandé (test Hemoccult ou coloscopie)',
  reason: 'Recommandation pour les hommes de plus de 50 ans',
  action: 'Consulter votre médecin pour un test de dépistage',
  ageRelevant: '50+ ans',
  frequency: 'Tous les 2 ans (test) ou 10 ans (coloscopie)'
}
```

### 6.4 InteractionChecker - Vérification Interactions Médicamenteuses

**Fichier:** `src/services/InteractionChecker.ts`

**Fonctionnalités:**
- Détection d'interactions médicamenteuses
- Contre-indications
- Doublons de substances actives
- Vérification d'allergies

**Base de Données:**
- `src/data/interactions-medicaments.ts`
- 200+ interactions documentées
- Médicaments français courants

**API:**

```typescript
interface InteractionDetectee {
  interaction: InteractionMedicamenteuse
  medicament1: Traitement
  medicament2: Traitement
}

interface ResultatVerificationInteraction {
  hasInteractions: boolean
  interactions: InteractionDetectee[]
  hasContraindications: boolean
  hasPrecautions: boolean
}

// Vérifier un nouveau médicament vs traitements actuels
function verifierInteractions(
  nouveauMedicament: string,
  traitementsActuels: Traitement[]
): ResultatVerificationInteraction

// Vérifier tous les traitements entre eux
function verifierTousLesTraitements(
  traitements: Traitement[]
): ResultatVerificationInteraction

// Vérifier les allergies
function verifierAllergies(
  medicament: string,
  allergies: Allergie[]
): InteractionAllergique | null
```

**Exemple d'Utilisation:**

```typescript
// Avant d'ajouter un traitement
const handleAddTraitement = async (nomMedicament: string) => {
  const traitementsActuels = await loadTraitements(membreId)

  // Vérifier interactions
  const verification = verifierInteractions(nomMedicament, traitementsActuels)

  if (verification.hasContraindications) {
    addNotification({
      type: 'error',
      title: 'Contre-indication détectée',
      message: `${nomMedicament} présente une contre-indication avec un traitement actuel`
    })

    // Afficher modal de confirmation
    setShowInteractionModal(true)
    setInteractionDetails(verification.interactions)
    return
  }

  if (verification.hasPrecautions) {
    addNotification({
      type: 'warning',
      title: 'Précautions nécessaires',
      message: 'Interactions détectées nécessitant une surveillance'
    })
  }

  // Ajouter le traitement
  await addTraitement(nomMedicament)
}
```

---

## 7. API Electron IPC

### 7.1 Handlers Authentification

```typescript
// ===== AUTH:LOGIN =====
ipcMain.handle('auth:login', async (event, username: string, password: string) => {
  const result = db.exec(
    'SELECT * FROM users WHERE username = ?',
    [username]
  )

  if (result.length === 0) {
    return { success: false, error: 'Utilisateur introuvable' }
  }

  const user = result[0].values[0]
  const passwordMatch = await bcrypt.compare(password, user[2]) // password hash

  if (!passwordMatch) {
    return { success: false, error: 'Mot de passe incorrect' }
  }

  return {
    success: true,
    userId: user[0],
    username: user[1],
    isSetupComplete: user[3] === 1
  }
})

// ===== AUTH:REGISTER =====
ipcMain.handle('auth:register', async (event, username: string, password: string) => {
  // Vérifier si l'utilisateur existe
  const existing = db.exec('SELECT id FROM users WHERE username = ?', [username])

  if (existing.length > 0) {
    return { success: false, error: 'Nom d\'utilisateur déjà pris' }
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

  // Créer l'utilisateur
  db.run(
    'INSERT INTO users (username, password, is_setup_complete) VALUES (?, ?, 0)',
    [username, hashedPassword]
  )

  saveDatabase()

  const userId = db.exec('SELECT last_insert_rowid()')[0].values[0][0]

  return { success: true, userId }
})
```

### 7.2 Handlers Base de Données

```typescript
// ===== DB:QUERY (SELECT) =====
ipcMain.handle('db:query', async (event, sql: string, params: any[] = []) => {
  try {
    const result = db.exec(sql, params)

    if (result.length === 0) {
      return []
    }

    // Convertir en objets
    const columns = result[0].columns
    const values = result[0].values

    return values.map((row: any[]) => {
      const obj: any = {}
      columns.forEach((col: string, index: number) => {
        obj[col] = row[index]
      })
      return obj
    })
  } catch (error) {
    console.error('DB Query Error:', error)
    throw error
  }
})

// ===== DB:EXECUTE (INSERT, UPDATE, DELETE) =====
ipcMain.handle('db:execute', async (event, sql: string, params: any[] = []) => {
  try {
    db.run(sql, params)
    saveDatabase()

    // Retourner le dernier ID inséré (si INSERT)
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const lastIdResult = db.exec('SELECT last_insert_rowid()')
      return {
        success: true,
        lastInsertId: lastIdResult[0].values[0][0]
      }
    }

    return { success: true }
  } catch (error) {
    console.error('DB Execute Error:', error)
    throw error
  }
})
```

### 7.3 Handlers Python Backend

```typescript
// ===== PYTHON:OCR =====
ipcMain.handle('python:ocr', async (event, imagePath: string) => {
  try {
    const formData = new FormData()
    const fileBuffer = fs.readFileSync(imagePath)
    formData.append('file', new Blob([fileBuffer]), path.basename(imagePath))

    const response = await axios.post(
      'http://localhost:8000/ocr/extract',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60s (OCR peut être long)
      }
    )

    return response.data
  } catch (error) {
    console.error('Python OCR Error:', error)
    throw error
  }
})

// ===== PYTHON:PREDICT =====
ipcMain.handle('python:predict', async (event, memberData: any) => {
  try {
    const response = await axios.post(
      'http://localhost:8000/health/predict',
      memberData,
      { timeout: 30000 }
    )

    return response.data
  } catch (error) {
    console.error('Python Predict Error:', error)
    throw error
  }
})

// ===== PYTHON:VALIDATE-MEDICATION =====
ipcMain.handle('python:validate-medication', async (event, medicationName: string) => {
  try {
    const response = await axios.post(
      'http://localhost:8000/medication/validate',
      null,
      {
        params: { medication_name: medicationName },
        timeout: 5000
      }
    )

    return response.data
  } catch (error) {
    console.error('Python Validate Error:', error)
    throw error
  }
})
```

### 7.4 Handlers Fichiers

```typescript
// ===== FILE:SELECT =====
ipcMain.handle('file:select', async (event, options?: any) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
      { name: 'Tous les fichiers', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// ===== FILE:SAVE =====
ipcMain.handle('file:save', async (event, data: any, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultPath || 'document.pdf',
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Tous les fichiers', extensions: ['*'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  // Sauvegarder les données
  fs.writeFileSync(result.filePath, data)

  return result.filePath
})
```

### 7.5 Handlers PDF & QRCode

```typescript
// ===== PDF:GENERATE =====
ipcMain.handle('pdf:generate', async (event, data: any) => {
  const PDFDocument = require('pdfkit')
  const doc = new PDFDocument()

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      resolve(pdfBuffer)
    })

    doc.on('error', reject)

    // Générer le PDF
    doc.fontSize(20).text(data.title, 100, 100)
    doc.fontSize(12).text(data.content, 100, 150)
    // ... plus de contenu

    doc.end()
  })
})

// ===== QRCODE:GENERATE =====
ipcMain.handle('qrcode:generate', async (event, data: string) => {
  const QRCode = require('qrcode')

  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('QRCode Generation Error:', error)
    throw error
  }
})
```

---

## 8. API Python FastAPI

### 8.1 Endpoints Disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Health check du serveur |
| POST | `/ocr/extract` | Extraire données d'une ordonnance |
| POST | `/health/predict` | Prédire risques de santé ML |
| POST | `/medication/validate` | Valider un nom de médicament |

### 8.2 Détails des Endpoints

#### GET /health

**Description:** Vérifier l'état du serveur Python

**Réponse:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "ocr": true,
    "nlp": true,
    "validator": true,
    "ml_predictor": true
  }
}
```

#### POST /ocr/extract

**Description:** Extrait les données médicales d'une ordonnance

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (image JPG/PNG)

**Response:**

```json
{
  "success": true,
  "text": "Dr Martin DUPONT\nDOLIPRANE 1000mg\n1 comprimé 3 fois par jour\nPendant 7 jours",
  "confidence": 0.92,
  "medications": [
    {
      "original": "DOLIPRANE",
      "validated": "DOLIPRANE",
      "confidence": 1.0,
      "dci": "paracétamol",
      "posology": "1 comprimé 3 fois par jour pendant 7 jours"
    }
  ],
  "posology": "1 comprimé 3 fois par jour",
  "doctor": "Dr Martin DUPONT",
  "date": "2025-11-01"
}
```

**Codes d'erreur:**
- `400`: Image invalide
- `500`: Erreur interne serveur

#### POST /health/predict

**Description:** Prédit les risques de santé avec Machine Learning

**Request:**

```json
{
  "age": 45,
  "vaccinations": {
    "total": 8,
    "completed": 6
  },
  "appointments": {
    "total": 12,
    "completed": 10,
    "cancelled": 2
  },
  "treatments": {
    "active": 3,
    "low_stock": 1,
    "expiring": 0
  },
  "allergies": {
    "total": 2,
    "severe": 1
  },
  "days_since_last_appointment": 120
}
```

**Response:**

```json
{
  "risk_level": "moderate",
  "risk_score": 42.5,
  "adherence_score": 75.0,
  "recommendations": [
    "📋 Améliorer le suivi des traitements",
    "⏰ Configurer des rappels de prise de médicaments",
    "📅 Planifier un bilan de santé dans les 3 mois"
  ],
  "anomalies_detected": [
    "Couverture vaccinale incomplète"
  ]
}
```

#### POST /medication/validate

**Description:** Valide un nom de médicament

**Request:**

```
?medication_name=DOLIPRANE
```

**Response:**

```json
{
  "original_name": "DOLIPRANE",
  "corrected_name": "DOLIPRANE",
  "is_valid": true,
  "confidence": 1.0,
  "dci": "paracétamol",
  "forme": "comprimé",
  "suggestions": []
}
```

Si nom erroné:

```json
{
  "original_name": "DOLIPRNE",
  "corrected_name": "DOLIPRANE",
  "is_valid": false,
  "confidence": 0.95,
  "suggestions": [
    "DOLIPRANE",
    "DAFALGAN"
  ]
}
```

---

## 9. Services d'Analyse de Santé

### 9.1 Résumé des Services

| Service | Fichier | Fonction Principale |
|---------|---------|---------------------|
| HealthAnalyzer | `services/HealthAnalyzer.ts` | Analyse tendances, risques, scores |
| SmartAlerts | `services/SmartAlerts.ts` | Alertes proactives intelligentes |
| RecommendationEngine | `services/RecommendationEngine.ts` | Recommandations personnalisées |
| InteractionChecker | `services/InteractionChecker.ts` | Vérification interactions médicaments |
| OCRService | `services/OCRService.ts` | OCR local (Tesseract.js) |
| PythonOCRService | `services/PythonOCRService.ts` | OCR avancé (EasyOCR Python) |
| PythonHealthService | `services/PythonHealthService.ts` | ML predictions Python |
| PDFGenerator | `services/PDFGenerator.ts` | Génération PDF (ordonnances, cartes) |
| QRCodeService | `services/QRCodeService.ts` | Génération QR codes urgence |
| ChatService | `services/ChatService.ts` | Assistant santé conversationnel |

### 9.2 Diagramme de Flux Analytics

```
Données Patient (DB SQLite)
        ↓
HealthAnalyzer.analyzeAppointmentTrends()
        ↓
    [Calcul des tendances]
    - Fréquence RDV
    - Intervalles moyens
    - Régularité
        ↓
HealthAnalyzer.analyzeTreatmentAdherence()
        ↓
    [Analyse adhérence]
    - Stock médicaments
    - Ordonnances expirées
    - Taux de renouvellement
        ↓
HealthAnalyzer.predictHealthRisks()
        ↓
    [Prédiction risques]
    - Facteurs de risque
    - Score de risque
        ↓
HealthAnalyzer.generateHealthScore()
        ↓
    [Score global 0-100]
    - Composantes (vaccins, RDV, traitements)
    - Niveau de santé
    - Tendance
        ↓
SmartAlerts.checkAllAlerts()
        ↓
    [Génération alertes]
    - Alertes critiques
    - Alertes haute priorité
    - Alertes informatives
        ↓
RecommendationEngine.generateRecommendations()
        ↓
    [Recommandations]
    - Bilans préventifs
    - Dépistages
    - Conseils personnalisés
        ↓
Affichage UI (Dashboard, Analytics)
```

---

## 10. Base de Données SQLite

### 10.1 Schéma Complet

```sql
-- ===== UTILISATEURS =====
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_setup_complete INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== FAMILLES =====
CREATE TABLE famille (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== MEMBRES =====
CREATE TABLE membres (
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
  notes_medicales TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (famille_id) REFERENCES famille(id)
);

-- ===== VACCINS =====
CREATE TABLE vaccins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_vaccin TEXT NOT NULL,
  date_administration DATE,
  date_rappel DATE,
  lot TEXT,
  professionnel TEXT,
  lieu TEXT,
  statut TEXT DEFAULT 'en_cours',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== TRAITEMENTS =====
CREATE TABLE traitements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_medicament TEXT NOT NULL,
  dosage TEXT,
  frequence TEXT,
  voie_administration TEXT,
  date_debut DATE,
  date_fin DATE,
  medecin_prescripteur TEXT,
  numero_ordonnance TEXT,
  date_ordonnance DATE,
  renouvellements INTEGER DEFAULT 0,
  stock_restant INTEGER,
  alerte_stock INTEGER DEFAULT 7,
  notes TEXT,
  actif INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== RENDEZ-VOUS =====
CREATE TABLE rendez_vous (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type TEXT NOT NULL,
  date_heure DATETIME NOT NULL,
  praticien TEXT,
  lieu TEXT,
  motif TEXT,
  statut TEXT DEFAULT 'planifie',
  rappel_active INTEGER DEFAULT 1,
  rappel_minutes INTEGER DEFAULT 60,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== ALLERGIES =====
CREATE TABLE allergies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type TEXT NOT NULL,
  substance TEXT NOT NULL,
  gravite TEXT,
  symptomes TEXT,
  date_detection DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== ANTÉCÉDENTS MÉDICAUX =====
CREATE TABLE antecedents_medicaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  date_diagnostic DATE,
  statut TEXT DEFAULT 'actif',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== DOCUMENTS MÉDICAUX =====
CREATE TABLE documents_medicaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  chemin_fichier TEXT,
  date_document DATE,
  description TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);

-- ===== INDEX POUR PERFORMANCE =====
CREATE INDEX idx_membres_famille ON membres(famille_id);
CREATE INDEX idx_vaccins_membre ON vaccins(membre_id);
CREATE INDEX idx_traitements_membre ON traitements(membre_id);
CREATE INDEX idx_rdv_membre ON rendez_vous(membre_id);
CREATE INDEX idx_rdv_date ON rendez_vous(date_heure);
CREATE INDEX idx_allergies_membre ON allergies(membre_id);
CREATE INDEX idx_antecedents_membre ON antecedents_medicaux(membre_id);
CREATE INDEX idx_documents_membre ON documents_medicaux(membre_id);
```

### 10.2 Requêtes Complexes Courantes

```sql
-- Obtenir le score de santé d'un membre
WITH
  vac_stats AS (
    SELECT
      membre_id,
      COUNT(*) as total,
      SUM(CASE WHEN statut = 'complet' THEN 1 ELSE 0 END) as completed
    FROM vaccins
    WHERE membre_id = ?
  ),
  apt_stats AS (
    SELECT
      membre_id,
      COUNT(*) as total,
      SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as cancelled,
      MAX(date_heure) as last_appointment
    FROM rendez_vous
    WHERE membre_id = ?
  ),
  trt_stats AS (
    SELECT
      membre_id,
      COUNT(*) as active,
      SUM(CASE WHEN stock_restant < alerte_stock THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN date_fin < DATE('now', '+30 days') THEN 1 ELSE 0 END) as expiring
    FROM traitements
    WHERE membre_id = ? AND actif = 1
  )
SELECT
  v.*,
  a.*,
  t.*
FROM vac_stats v, apt_stats a, trt_stats t;

-- Trouver toutes les interactions médicamenteuses
SELECT
  t1.nom_medicament as med1,
  t2.nom_medicament as med2,
  t1.membre_id
FROM traitements t1
JOIN traitements t2 ON t1.membre_id = t2.membre_id
WHERE t1.actif = 1
  AND t2.actif = 1
  AND t1.id < t2.id  -- Éviter duplicatas
  AND t1.membre_id = ?;

-- Statistiques de santé famille
SELECT
  m.id,
  m.nom,
  m.prenom,
  COUNT(DISTINCT v.id) as total_vaccins,
  COUNT(DISTINCT t.id) as total_traitements,
  COUNT(DISTINCT r.id) as total_rdv,
  MAX(r.date_heure) as dernier_rdv
FROM membres m
LEFT JOIN vaccins v ON m.id = v.membre_id
LEFT JOIN traitements t ON m.id = t.membre_id AND t.actif = 1
LEFT JOIN rendez_vous r ON m.id = r.membre_id AND r.statut = 'termine'
WHERE m.famille_id = ?
GROUP BY m.id;
```

---

## 11. Sécurité & Encryption

### 11.1 Méthodes de Sécurité Implémentées

| Aspect | Technologie | Description |
|--------|-------------|-------------|
| Mots de passe | bcrypt (10 rounds) | Hashing sécurisé avec salt |
| Données sensibles | AES-256-GCM | Chiffrement symétrique |
| Communication IPC | contextBridge | Isolation contexte renderer/main |
| Stockage local | electron-store (chiffré) | Préférences utilisateur |
| Backup | Chiffrement optionnel | Backups peuvent être chiffrés |
| Injection SQL | Requêtes paramétrées | Protection contre SQL injection |

### 11.2 Flux d'Authentification Sécurisé

```
1. User entre username + password
        ↓
2. Frontend → IPC 'auth:login'
        ↓
3. Main Process → Query SQLite
        ↓
4. Récupération hash bcrypt
        ↓
5. bcrypt.compare(password, hash)
        ↓
6. Si match → Session créée
        ↓
7. Return { success: true, userId }
        ↓
8. Frontend stocke userId en mémoire (pas localStorage)
```

### 11.3 Protection des Données Sensibles

```typescript
// Exemple: Chiffrer un numéro de sécurité sociale
const numeroSS = '1 85 03 75 123 456 78'
const userPassword = 'user_master_password'

// Chiffrement avant INSERT
const encrypted = encryptForDB(numeroSS, userPassword)

await window.electronAPI.dbExecute(
  'INSERT INTO membres (nom, numero_securite_sociale) VALUES (?, ?)',
  ['Dupont', encrypted]
)

// Déchiffrement après SELECT
const membres = await window.electronAPI.dbQuery(
  'SELECT * FROM membres WHERE id = ?',
  [membreId]
)

const decrypted = decryptFromDB(
  membres[0].numero_securite_sociale,
  userPassword
)
```

---

## 12. Système de Build & Déploiement

### 12.1 Scripts NPM

```json
{
  "scripts": {
    "compile:electron": "Compiler TypeScript Electron → JS",
    "start:react": "Démarrer serveur dev Vite (React)",
    "start:electron": "Démarrer Electron en mode dev",
    "start": "Démarrer app complète (React + Electron)",
    "build": "Build production (Vite + Electron)",
    "build:electron": "Build + Package app (exe/dmg/AppImage)",
    "clean": "Nettoyer dossier dist",
    "seed": "Seed database avec données test"
  }
}
```

### 12.2 Configuration Electron Builder

```json
{
  "build": {
    "appId": "com.carelink.app",
    "productName": "CareLink",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns",
      "category": "public.app-category.healthcare-fitness"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Utility"
    }
  }
}
```

### 12.3 Processus de Build

```bash
# 1. Compiler Electron TypeScript → JavaScript
npm run compile:electron

# 2. Build React avec Vite (optimized production)
npm run build
# Output: dist/renderer/

# 3. Package l'application avec electron-builder
npm run build:electron
# Output: release/CareLink-2.0.0-win.exe (Windows)
#         release/CareLink-2.0.0.dmg (macOS)
#         release/CareLink-2.0.0.AppImage (Linux)
```

### 12.4 Structure de Sortie

```
release/
├── CareLink-2.0.0-win.exe          # Windows installer
├── CareLink-2.0.0.dmg              # macOS installer
├── CareLink-2.0.0.AppImage         # Linux portable
└── unpacked/                       # Version non packagée
    ├── CareLink.exe
    ├── resources/
    │   ├── app.asar                # Application compressée
    │   └── python-backend/         # Backend Python inclus
    └── locales/
```

---

## 13. Exemples d'Intégration

### 13.1 Exemple Complet: Ajouter un Traitement avec Vérifications

```typescript
// Frontend: src/pages/Traitements.tsx

import { useState } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import { verifierInteractions } from '../services/InteractionChecker'

function Traitements({ membreId }: { membreId: number }) {
  const [nomMedicament, setNomMedicament] = useState('')
  const [dosage, setDosage] = useState('')
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  const handleAddTraitement = async () => {
    setLoading(true)

    try {
      // 1. Récupérer les traitements actuels
      const traitementsActuels = await window.electronAPI.dbQuery(
        'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
        [membreId]
      )

      // 2. Vérifier les interactions
      const verification = verifierInteractions(nomMedicament, traitementsActuels)

      if (verification.hasContraindications) {
        addNotification({
          type: 'error',
          title: 'Contre-indication',
          message: `${nomMedicament} présente une contre-indication grave`
        })

        // Afficher modal de confirmation
        const confirmed = await showConfirmationModal(
          'Contre-indication détectée',
          verification.interactions
        )

        if (!confirmed) {
          setLoading(false)
          return
        }
      }

      // 3. Valider le nom du médicament avec Python backend
      const validation = await window.electronAPI.pythonValidateMedication(nomMedicament)

      if (!validation.is_valid) {
        addNotification({
          type: 'warning',
          title: 'Nom de médicament non reconnu',
          message: `Voulez-vous dire "${validation.corrected_name}" ?`
        })

        // Proposer correction
        setNomMedicament(validation.corrected_name)
      }

      // 4. Insérer dans la DB
      const result = await window.electronAPI.dbExecute(
        `INSERT INTO traitements
        (membre_id, nom_medicament, dosage, date_debut, actif)
        VALUES (?, ?, ?, DATE('now'), 1)`,
        [membreId, validation.corrected_name || nomMedicament, dosage]
      )

      // 5. Notification de succès
      addNotification({
        type: 'success',
        title: 'Traitement ajouté',
        message: `${nomMedicament} a été ajouté avec succès`
      })

      // 6. Reset form
      setNomMedicament('')
      setDosage('')

      // 7. Recharger la liste
      reloadTraitements()

    } catch (error) {
      console.error('Erreur ajout traitement:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le traitement'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="traitements-page">
      <h2>Ajouter un traitement</h2>

      <input
        type="text"
        value={nomMedicament}
        onChange={(e) => setNomMedicament(e.target.value)}
        placeholder="Nom du médicament"
      />

      <input
        type="text"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        placeholder="Dosage"
      />

      <button onClick={handleAddTraitement} disabled={loading}>
        {loading ? 'Ajout en cours...' : 'Ajouter'}
      </button>
    </div>
  )
}
```

### 13.2 Exemple: Scan d'Ordonnance avec OCR Python

```typescript
// Frontend: src/pages/ScannerOrdonnance.tsx

import { useState } from 'react'

function ScannerOrdonnance() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleScanOrdonnance = async () => {
    setScanning(true)

    try {
      // 1. Sélectionner l'image
      const imagePath = await window.electronAPI.selectFile({
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
        ]
      })

      if (!imagePath) {
        setScanning(false)
        return
      }

      // 2. Envoyer au backend Python pour OCR
      const ocrResult = await window.electronAPI.pythonOCR(imagePath)

      if (!ocrResult.success) {
        throw new Error('OCR failed')
      }

      // 3. Afficher les résultats
      setResult(ocrResult)

      // 4. Proposer d'ajouter les médicaments détectés
      for (const med of ocrResult.medications) {
        const confirm = await showMedicationConfirm(med)

        if (confirm) {
          await window.electronAPI.dbExecute(
            `INSERT INTO traitements
            (membre_id, nom_medicament, dosage, date_ordonnance, medecin_prescripteur)
            VALUES (?, ?, ?, ?, ?)`,
            [
              currentMembreId,
              med.validated,
              med.posology,
              ocrResult.date,
              ocrResult.doctor
            ]
          )
        }
      }

      addNotification({
        type: 'success',
        title: 'Scan terminé',
        message: `${ocrResult.medications.length} médicament(s) détecté(s)`
      })

    } catch (error) {
      console.error('Erreur scan:', error)
      addNotification({
        type: 'error',
        title: 'Erreur scan',
        message: 'Impossible de scanner l\'ordonnance'
      })
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="scanner-page">
      <h2>Scanner une ordonnance</h2>

      <button onClick={handleScanOrdonnance} disabled={scanning}>
        {scanning ? 'Scan en cours...' : 'Scanner'}
      </button>

      {result && (
        <div className="scan-results">
          <h3>Résultats du scan</h3>
          <p>Confiance: {(result.confidence * 100).toFixed(1)}%</p>
          <p>Médecin: {result.doctor}</p>
          <p>Date: {result.date}</p>

          <h4>Médicaments détectés:</h4>
          {result.medications.map((med: any, index: number) => (
            <div key={index} className="medication-card">
              <p><strong>{med.validated}</strong></p>
              <p>DCI: {med.dci}</p>
              <p>Posologie: {med.posology}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 13.3 Exemple: Prédiction ML des Risques

```typescript
// Frontend: src/pages/Analytics.tsx

import { useState, useEffect } from 'react'

function Analytics({ membreId }: { membreId: number }) {
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMLPrediction()
  }, [membreId])

  const loadMLPrediction = async () => {
    setLoading(true)

    try {
      // 1. Récupérer les données du membre
      const membre = await window.electronAPI.dbQuery(
        'SELECT * FROM membres WHERE id = ?',
        [membreId]
      )

      // 2. Calculer l'âge
      const birthDate = new Date(membre[0].date_naissance)
      const age = new Date().getFullYear() - birthDate.getFullYear()

      // 3. Récupérer les stats vaccinations
      const vaccins = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total, SUM(CASE WHEN statut = "complet" THEN 1 ELSE 0 END) as completed FROM vaccins WHERE membre_id = ?',
        [membreId]
      )

      // 4. Récupérer les stats rendez-vous
      const rdv = await window.electronAPI.dbQuery(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as cancelled,
          MAX(date_heure) as last_appointment
        FROM rendez_vous
        WHERE membre_id = ?`,
        [membreId]
      )

      // 5. Récupérer les stats traitements
      const traitements = await window.electronAPI.dbQuery(
        `SELECT
          COUNT(*) as active,
          SUM(CASE WHEN stock_restant < alerte_stock THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN date_fin < DATE('now', '+30 days') THEN 1 ELSE 0 END) as expiring
        FROM traitements
        WHERE membre_id = ? AND actif = 1`,
        [membreId]
      )

      // 6. Récupérer les allergies
      const allergies = await window.electronAPI.dbQuery(
        `SELECT COUNT(*) as total, SUM(CASE WHEN gravite = 'severe' THEN 1 ELSE 0 END) as severe
        FROM allergies WHERE membre_id = ?`,
        [membreId]
      )

      // 7. Calculer jours depuis dernier RDV
      const lastApt = rdv[0].last_appointment
      const daysSince = lastApt
        ? Math.floor((Date.now() - new Date(lastApt).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      // 8. Préparer les données pour le ML
      const memberData = {
        age: age,
        vaccinations: {
          total: vaccins[0].total,
          completed: vaccins[0].completed
        },
        appointments: {
          total: rdv[0].total,
          completed: rdv[0].completed,
          cancelled: rdv[0].cancelled
        },
        treatments: {
          active: traitements[0].active,
          low_stock: traitements[0].low_stock,
          expiring: traitements[0].expiring
        },
        allergies: {
          total: allergies[0].total,
          severe: allergies[0].severe
        },
        days_since_last_appointment: daysSince
      }

      // 9. Appeler le backend Python ML
      const mlPrediction = await window.electronAPI.pythonPredict(memberData)

      setPrediction(mlPrediction)

    } catch (error) {
      console.error('Erreur ML prediction:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Analyse en cours...</div>
  }

  return (
    <div className="analytics-page">
      <h2>Analyse Prédictive de Santé</h2>

      <div className="risk-card" data-level={prediction.risk_level}>
        <h3>Niveau de Risque: {prediction.risk_level.toUpperCase()}</h3>
        <p className="risk-score">{prediction.risk_score.toFixed(1)} / 100</p>
      </div>

      <div className="adherence-card">
        <h3>Score d'Adhérence</h3>
        <p className="adherence-score">{prediction.adherence_score.toFixed(1)} / 100</p>
      </div>

      {prediction.anomalies_detected.length > 0 && (
        <div className="anomalies-section">
          <h3>⚠️ Anomalies Détectées</h3>
          <ul>
            {prediction.anomalies_detected.map((anomaly: string, index: number) => (
              <li key={index}>{anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="recommendations-section">
        <h3>📋 Recommandations</h3>
        <ul>
          {prediction.recommendations.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

---

## Conclusion

Ce document présente une architecture complète et moderne pour CareLink:

### Points Forts de l'Architecture

1. **Séparation des Préoccupations**
   - Frontend React découplé
   - Backend Electron pour logique métier
   - Backend Python pour ML/OCR avancé

2. **Sécurité Renforcée**
   - Chiffrement AES-256-GCM
   - Hashing bcrypt
   - Context isolation Electron
   - Requêtes SQL paramétrées

3. **Intelligence Artificielle**
   - OCR médical de pointe (EasyOCR)
   - ML pour prédictions (scikit-learn)
   - Alertes intelligentes proactives
   - Recommandations personnalisées

4. **Performance**
   - Lazy loading des services Python
   - SQLite optimisé avec index
   - Vite pour build ultra-rapide
   - IPC asynchrone non-bloquant

5. **Expérience Utilisateur**
   - Interface moderne et intuitive
   - Notifications toast
   - Thèmes multiples
   - Analytics visuels (recharts)

6. **Scalabilité**
   - Architecture modulaire
   - Services découplés
   - API REST extensible
   - Base de données SQLite (peut migrer vers PostgreSQL)

### Technologies Modernes Utilisées

- **Electron 28**: Desktop cross-platform
- **React 18**: UI reactive
- **TypeScript 5**: Type safety
- **FastAPI**: API Python moderne
- **EasyOCR**: Deep learning OCR
- **scikit-learn**: Machine learning
- **Vite**: Build tool rapide
- **sql.js**: SQLite in-memory

Cette architecture peut servir de référence solide pour moderniser d'autres applications, notamment pour:
- Gestion de données sensibles
- Intégration ML/AI
- Analytics prédictifs
- OCR intelligent
- Applications desktop modernes

---

**Document créé le:** 3 Novembre 2025
**Version:** 1.0.0
**Pour:** Comparaison et inspiration pour modernisation d'applications legacy
