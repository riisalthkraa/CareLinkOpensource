# 📚 Guide Développeur CareLink

Guide complet pour les développeurs souhaitant contribuer à CareLink ou comprendre son architecture.

---

## 📋 Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Stack Technique](#stack-technique)
3. [Structure du Projet](#structure-du-projet)
4. [Conventions de Code](#conventions-de-code)
5. [Base de Données](#base-de-données)
6. [Système de Sécurité](#système-de-sécurité)
7. [Gestion d'Erreurs](#gestion-derreurs)
8. [Tests](#tests)
9. [Contribution](#contribution)
10. [Debugging](#debugging)

---

## 🏗️ Architecture Globale

CareLink suit une architecture **Electron** classique avec séparation claire entre processus principal et processus de rendu.

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Processus Principal                   │
│                    (electron/main.ts)                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  SQLite DB   │  │   Backups    │  │  Python      │ │
│  │  (sql.js)    │  │  (backup.ts) │  │  Backend     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│                    ↕ IPC (preload.ts)                   │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Processus de Rendu                    │
│                         (React)                          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Components  │  │    Pages     │  │   Contexts   │ │
│  │   (UI)       │  │  (Screens)   │  │   (State)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Utils      │  │    Tests     │                   │
│  │  (Helpers)   │  │   (Jest)     │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Flux de Données

1. **User Action** → Composant React
2. **Composant** → `window.electronAPI` (via preload.ts)
3. **IPC Handler** (main.ts) → Base de données SQLite
4. **SQLite** → Retourne les données
5. **IPC** → Retourne au composant
6. **Composant** → Met à jour l'UI

---

## 🛠️ Stack Technique

### Frontend (Processus de Rendu)

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 18.2.0 | Framework UI |
| **TypeScript** | 5.3.3 | Langage principal |
| **Vite** | 5.0.8 | Build tool & HMR |
| **Recharts** | 2.10.3 | Graphiques |
| **date-fns** | 3.0.6 | Manipulation de dates |
| **React Hook Form** | 7.49.2 | Formulaires |

### Backend (Processus Principal)

| Technologie | Version | Usage |
|------------|---------|-------|
| **Electron** | 28.0.0 | Framework desktop |
| **sql.js** | 1.10.3 | SQLite en mémoire |
| **bcrypt** | 6.0.0 | Hashing mots de passe |
| **archiver** | 7.0.1 | Création backups ZIP |
| **unzipper** | 0.12.3 | Extraction backups |
| **PDFKit** | 0.14.0 | Génération PDF |
| **QRCode** | 1.5.4 | Génération QR codes |
| **Tesseract.js** | 6.0.1 | OCR ordonnances |

### Tests

| Technologie | Version | Usage |
|------------|---------|-------|
| **Jest** | 30.2.0 | Framework de tests |
| **ts-jest** | 29.4.5 | Support TypeScript |
| **@testing-library/react** | 16.3.0 | Tests composants |
| **@testing-library/jest-dom** | 6.9.1 | Matchers DOM |

---

## 📁 Structure du Projet Détaillée

```
CareLink/
├── electron/                    # Backend Electron
│   ├── main.ts                 # Point d'entrée principal
│   │   ├── initDatabase()      # Initialisation DB
│   │   ├── IPC Handlers        # Gestionnaires d'événements
│   │   └── Window Management   # Gestion fenêtre
│   ├── preload.ts              # Script preload (contexte isolé)
│   │   └── electronAPI         # API exposée à React
│   ├── backup.ts               # Système de backups
│   │   ├── BackupManager       # Classe principale
│   │   ├── createBackup()      # Création backup
│   │   ├── restoreBackup()     # Restauration
│   │   └── Auto backups        # Backups automatiques
│   └── python-backend-manager.ts  # Gestionnaire backend Python
│
├── src/                        # Frontend React
│   ├── components/             # Composants réutilisables
│   │   ├── Sidebar.tsx         # Menu latéral (14 items)
│   │   ├── TopBar.tsx          # Barre supérieure
│   │   ├── ErrorBoundary.tsx   # Capture erreurs React
│   │   └── ToastContainer.tsx  # Notifications
│   │
│   ├── pages/                  # Pages de l'application
│   │   ├── Login.tsx           # Authentification
│   │   ├── Dashboard.tsx       # Tableau de bord
│   │   ├── ProfilMembre.tsx    # Profil détaillé
│   │   ├── Vaccins.tsx         # Gestion vaccins
│   │   ├── Traitements.tsx     # Gestion traitements
│   │   ├── RendezVous.tsx      # Calendrier RDV
│   │   ├── DossierMedical.tsx  # Dossier complet
│   │   ├── AssistantSante.tsx  # CareAI
│   │   ├── ChatDoctor.tsx      # Chat IA
│   │   ├── Timeline3D.tsx      # Chronologie
│   │   ├── Analytics.tsx       # Statistiques
│   │   ├── ModeUrgence.tsx     # Mode urgence
│   │   ├── CarteUrgence.tsx    # Carte avec QR
│   │   ├── ScannerOrdonnance.tsx  # OCR
│   │   ├── Backup.tsx          # Interface backups
│   │   └── Config.tsx          # Configuration
│   │
│   ├── contexts/               # Contexts React
│   │   ├── ThemeContext.tsx    # Gestion des 20 thèmes
│   │   └── NotificationContext.tsx  # Système de toasts
│   │
│   ├── utils/                  # Utilitaires
│   │   ├── logger.ts           # Logging centralisé
│   │   │   ├── LogLevel enum   # DEBUG, INFO, WARN, ERROR
│   │   │   ├── Logger class    # Classe principale
│   │   │   └── log object      # API simplifiée
│   │   └── dbHelper.ts         # Wrapper DB
│   │       ├── query()         # Requête générique
│   │       ├── select()        # SELECT
│   │       ├── insert()        # INSERT
│   │       ├── update()        # UPDATE
│   │       ├── delete()        # DELETE
│   │       └── transaction()   # Transactions
│   │
│   ├── __tests__/              # Tests
│   │   ├── logger.test.ts      # Tests logger
│   │   ├── dbHelper.test.ts    # Tests DB helper
│   │   ├── Login.test.tsx      # Tests login
│   │   └── crud.integration.test.ts  # Tests CRUD
│   │
│   ├── App.tsx                 # Composant racine
│   ├── App.css                 # Styles principaux
│   ├── themes.css              # 20 thèmes
│   ├── design-system.css       # Variables CSS
│   └── setupTests.ts           # Configuration Jest
│
├── dist/                       # Code compilé
├── assets/                     # Ressources statiques
├── package.json                # Configuration npm
├── tsconfig.json               # Configuration TypeScript
├── jest.config.js              # Configuration Jest
├── vite.config.ts              # Configuration Vite
├── README.md                   # Documentation utilisateur
├── CHANGELOG.md                # Historique des versions
├── DEVELOPER_GUIDE.md          # Ce fichier
└── DEPLOYMENT.md               # Guide de déploiement
```

---

## 📝 Conventions de Code

### TypeScript

#### 1. **Interfaces et Types**

```typescript
// ✅ Bon - PascalCase pour interfaces
interface MemberData {
  id: number;
  nom: string;
  prenom: string;
}

// ✅ Bon - Props avec suffixe "Props"
interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// ✅ Bon - Type unions pour valeurs fixes
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
```

#### 2. **Fonctions et Variables**

```typescript
// ✅ Bon - camelCase
const userData = fetchUserData();
function handleLogin(userId: number) { }

// ✅ Bon - Fonctions async explicites
async function loadData(): Promise<Data> {
  const result = await db.query('SELECT * FROM table');
  return result.data;
}

// ✅ Bon - Arrow functions pour callbacks
const onClick = () => setPage('dashboard');
```

#### 3. **Composants React**

```typescript
// ✅ Bon - Fonction nommée exportée par défaut
function Dashboard({ onNavigate }: DashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  return <div>...</div>;
}

export default Dashboard;
```

### Commentaires JSDoc

```typescript
/**
 * Crée un nouveau backup de la base de données
 *
 * @param type - Type de backup ('manual', 'auto', 'close')
 * @returns Nom du fichier de backup créé
 * @throws {Error} Si la création échoue
 *
 * @example
 * const filename = await createBackup('manual');
 * console.log('Backup créé:', filename);
 */
async function createBackup(type: BackupType): Promise<string> {
  // ...
}
```

### Gestion d'Erreurs

```typescript
// ✅ Bon - Try/catch avec logging
try {
  const result = await db.query('SELECT * FROM table');
  log.info('Module', 'Query successful', { count: result.data.length });
} catch (error: any) {
  log.error('Module', 'Query failed', { error: error.message });
  throw error;
}

// ✅ Bon - Retry avec dbHelper
const result = await db.query('SELECT * FROM table', [], {
  module: 'MyModule',
  retries: 3,
  retryDelay: 100
});
```

---

## 🗄️ Base de Données

### Schéma Complet

CareLink utilise SQLite avec 13 tables principales:

#### 1. **users** - Utilisateurs
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                    -- bcrypt hash
  is_setup_complete INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **famille** - Familles
```sql
CREATE TABLE famille (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. **membres** - Membres de la famille
```sql
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
  notes TEXT,                               -- CHIFFRÉ AES-256
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (famille_id) REFERENCES famille(id)
);
```

#### 4. **vaccins** - Vaccinations
```sql
CREATE TABLE vaccins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_vaccin TEXT NOT NULL,                 -- ATTENTION: pas "nom"
  date_administration DATE,                 -- ATTENTION: pas "date_vaccination"
  date_rappel DATE,
  statut TEXT DEFAULT 'à_faire',
  lot TEXT,
  medecin TEXT,
  notes TEXT,                               -- CHIFFRÉ
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

#### 5. **traitements** - Médicaments
```sql
CREATE TABLE traitements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_medicament TEXT NOT NULL,             -- ATTENTION: pas "nom"
  dosage TEXT,
  frequence TEXT,
  date_debut DATE,
  date_fin DATE,
  medecin_prescripteur TEXT,
  notes TEXT,                               -- CHIFFRÉ
  actif INTEGER DEFAULT 1,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

#### 6. **allergies** - Allergies
```sql
CREATE TABLE allergies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type_allergie TEXT,                       -- ATTENTION: pas "type"
  nom_allergie TEXT NOT NULL,               -- ATTENTION: pas "nom"
  severite TEXT,
  date_detection DATE,
  description TEXT,                         -- CHIFFRÉ
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

#### 7. **rendez_vous** - Rendez-vous médicaux
```sql
CREATE TABLE rendez_vous (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  date_rdv DATETIME NOT NULL,
  type_rdv TEXT,
  medecin TEXT,
  lieu TEXT,
  notes TEXT,                               -- CHIFFRÉ
  statut TEXT DEFAULT 'prévu',
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

#### 8-13. **Dossier Médical**
- `antecedents_medicaux`: Antécédents
- `diagnostics`: Diagnostics
- `bilans_sante`: Bilans médicaux
- `consultations`: Consultations
- `documents_medicaux`: Documents scannés
- `constantes`: Constantes vitales

### Conventions de Nommage DB

⚠️ **TRÈS IMPORTANT** - Respecter ces noms exacts:

| ✅ Correct | ❌ Incorrect |
|-----------|-------------|
| `nom_vaccin` | ~~nom~~ |
| `nom_medicament` | ~~nom~~ |
| `type_allergie` | ~~type~~ |
| `nom_allergie` | ~~nom~~ |
| `date_administration` | ~~date_vaccination~~ |
| `date_diagnostic` | ✅ correct |

### Requêtes via DBHelper

```typescript
import { db } from './utils/dbHelper';

// SELECT
const members = await db.select('membres', '*', 'famille_id = ?', [familleId]);

// INSERT
await db.insert('vaccins', {
  membre_id: 1,
  nom_vaccin: 'COVID-19',
  date_administration: '2023-01-15',
  statut: 'fait'
});

// UPDATE
await db.update('traitements',
  { actif: 0, date_fin: '2023-12-31' },
  'id = ?',
  [traitementId]
);

// DELETE
await db.delete('rendez_vous', 'id = ?', [rdvId]);
```

---

## 🔒 Système de Sécurité

### 1. **Chiffrement AES-256**

```typescript
import crypto from 'crypto';

// Configuration
const ENCRYPTION_KEY = crypto.randomBytes(32);  // 256 bits
const IV_LENGTH = 16;  // AES block size

// Chiffrer
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Déchiffrer
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Données Chiffrées:**
- Notes des membres
- Notes des vaccins
- Notes des traitements
- Descriptions des allergies
- Notes des rendez-vous
- Tous les documents sensibles

### 2. **Hashing Mots de Passe**

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hasher
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Vérifier
const isValid = await bcrypt.compare(password, hash);
```

### 3. **Context Bridge (Preload)**

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql: string, params: any[]) =>
    ipcRenderer.invoke('db-query', sql, params),
  // Autres méthodes sécurisées...
});
```

---

## 🐛 Gestion d'Erreurs

### 1. **ErrorBoundary React**

Capture toutes les erreurs React et affiche une UI de repli:

```tsx
<ErrorBoundary fallbackMessage="Une erreur est survenue">
  <App />
</ErrorBoundary>
```

### 2. **Logger Centralisé**

```typescript
import { log } from './utils/logger';

// 4 niveaux
log.debug('Module', 'Message de debug', { data: 'value' });
log.info('Module', 'Opération réussie');
log.warn('Module', 'Attention', { warning: 'details' });
log.error('Module', 'Erreur critique', { error: errorObj });

// Stats
const stats = logger.getStats();
console.log('Total logs:', stats.total);
console.log('Par niveau:', stats.byLevel);

// Export
const json = logger.exportLogsAsJSON();
const text = logger.exportLogsAsText();
```

### 3. **DBHelper avec Retry**

```typescript
// Retry automatique en cas d'échec
const result = await db.query('SELECT * FROM table', [], {
  module: 'MyModule',
  retries: 3,          // 3 tentatives
  retryDelay: 100,     // 100ms entre chaque
  showNotification: true
});
```

---

## 🧪 Tests

### Lancer les Tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Coverage
npm run test:coverage

# Verbose
npm run test:verbose
```

### Structure d'un Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../pages/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('should handle button click', async () => {
    const mockFn = jest.fn();
    render(<MyComponent onClick={mockFn} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking

```typescript
// Mock window.electronAPI
global.window.electronAPI = {
  dbQuery: jest.fn().mockResolvedValue({
    success: true,
    data: [{ id: 1, name: 'Test' }]
  })
};
```

---

## 🤝 Contribution

### Workflow

1. **Fork** le projet
2. **Clone** votre fork
```bash
git clone https://github.com/votre-username/carelink.git
cd carelink
```

3. **Créer une branche**
```bash
git checkout -b feature/ma-fonctionnalite
```

4. **Développer**
- Suivre les conventions de code
- Ajouter des tests
- Documenter avec JSDoc

5. **Tester**
```bash
npm test
npm run build
```

6. **Commit**
```bash
git add .
git commit -m "feat: ajout de ma fonctionnalité"
```

7. **Push**
```bash
git push origin feature/ma-fonctionnalite
```

8. **Pull Request**
- Décrire les changements
- Référencer les issues
- Attendre la review

### Conventions de Commit

Format: `type(scope): description`

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

**Exemples:**
```bash
feat(vaccins): ajout du calendrier français
fix(login): correction validation email
docs(readme): mise à jour installation
```

---

## 🔍 Debugging

### Chrome DevTools

- **F12** ou **Ctrl+Shift+I** (Cmd+Opt+I sur Mac)
- Console, Network, Sources disponibles

### VSCode Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["dist/main.js"],
      "outputCapture": "std"
    }
  ]
}
```

### Logs

```typescript
// En développement
console.log('Debug:', data);

// En production
log.debug('Module', 'Debug info', { data });
```

---

## 📚 Ressources

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)

---

**Mainteneur**: VIEY David
**License**: MIT
**Version**: 2.0.0

**Bon développement! 🚀**
