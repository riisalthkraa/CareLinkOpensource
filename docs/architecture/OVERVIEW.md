# Architecture CareLink

## Vue d'Ensemble

CareLink est une application desktop de gestion de santé familiale construite avec Electron, React et TypeScript.

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    REACT FRONTEND                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Dashboard │ │ Vaccins  │ │Traitements│ │ RDV      │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │Analytics │ │ChatDoctor│ │ Scanner  │ │ Backup   │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                         IPC Bridge                               │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ELECTRON MAIN                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Database │ │  Auth    │ │ Backup   │ │Encryption│   │    │
│  │  │ SQLite   │ │ bcrypt   │ │ Manager  │ │ AES-256  │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                         HTTP REST                                │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   PYTHON BACKEND                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │Symptom AI│ │Drug Check│ │Risk Pred │  Port: 8003   │    │
│  │  └──────────┘ └──────────┘ └──────────┘               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Structure des Fichiers

```
CareLink/
├── src/                          # Code React/TypeScript
│   ├── App.tsx                   # Point d'entrée React
│   ├── main.tsx                  # Bootstrap React
│   ├── pages/                    # Pages de l'application
│   │   ├── Dashboard.tsx         # Tableau de bord
│   │   ├── ProfilMembre.tsx      # Profil membre
│   │   ├── Vaccins.tsx           # Gestion vaccins
│   │   ├── Traitements.tsx       # Gestion traitements
│   │   ├── RendezVous.tsx        # Calendrier RDV
│   │   ├── Analytics.tsx         # Analyses santé
│   │   ├── ChatDoctor.tsx        # Assistant IA
│   │   ├── ScannerOrdonnance.tsx # OCR ordonnances
│   │   ├── DossierMedical.tsx    # Dossier médical
│   │   ├── Backup.tsx            # Gestion sauvegardes
│   │   └── Config.tsx            # Configuration
│   ├── components/               # Composants réutilisables
│   │   ├── Sidebar.tsx           # Menu latéral
│   │   ├── TopBar.tsx            # Barre supérieure
│   │   ├── ToastContainer.tsx    # Notifications
│   │   └── ...
│   ├── services/                 # Services métier
│   │   ├── InteractionChecker.ts # Interactions médicamenteuses
│   │   ├── HealthAnalyzer.ts     # Analyse santé
│   │   ├── OCRService.ts         # OCR local
│   │   ├── ChatService.ts        # Service chat IA
│   │   └── ...
│   ├── contexts/                 # Contextes React
│   │   ├── ThemeContext.tsx      # Gestion thèmes
│   │   └── NotificationContext.tsx
│   ├── types/                    # Définitions TypeScript
│   │   └── index.ts
│   └── data/                     # Données statiques
│       ├── vaccins-calendrier.ts
│       └── interactions-medicaments.ts
│
├── electron/                     # Code Electron
│   ├── main.ts                   # Process principal
│   ├── preload.ts                # Bridge sécurisé
│   ├── backup.ts                 # Gestionnaire backups
│   ├── encryption.ts             # Chiffrement
│   └── seed-data.ts              # Données initiales
│
├── services/                     # Backend Python
│   └── ia-health/
│       ├── main.py               # API FastAPI
│       └── requirements.txt
│
├── scripts/                      # Scripts utilitaires
│   ├── seed-database.js
│   ├── fix-dates.js
│   └── ...
│
└── docs/                         # Documentation
```

## Flux de Données

### 1. Authentification

```
Login.tsx → IPC:auth:login → main.ts → bcrypt.compare() → SQLite
```

### 2. Requête Base de Données

```
Component → window.electronAPI.dbQuery() → preload.ts → IPC → main.ts → SQLite
```

### 3. Analyse IA

```
ChatDoctor.tsx → ChatService.ts → HTTP → Python Backend (8003) → Sentence-BERT
```

### 4. Sauvegarde

```
Backup.tsx → IPC:backup:create → backup.ts → archiver → ZIP → AppData/backups/
```

## Providers React

L'application utilise une structure de providers imbriqués :

```tsx
<ErrorBoundary>
  <ThemeProvider>        {/* Gestion des 20+ thèmes */}
    <NotificationProvider> {/* Système de toast */}
      <AppContent />       {/* Application principale */}
    </NotificationProvider>
  </ThemeProvider>
</ErrorBoundary>
```

## Communication IPC

Le bridge sécurisé entre React et Electron utilise `contextBridge` :

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
  // ... autres méthodes
})
```

## Sécurité

1. **Context Isolation** : Activé par défaut
2. **Node Integration** : Désactivé
3. **Chiffrement** : AES-256 pour données sensibles
4. **Mots de passe** : bcrypt avec 10 salt rounds
5. **API Keys** : safeStorage Electron (chiffrement OS)

## Build et Distribution

```bash
npm run build        # Build complet
npm run build:full   # Avec backend Python
```

Plateformes supportées :
- Windows (NSIS installer)
- macOS (DMG)
- Linux (AppImage, DEB)
