# 🚨 À LIRE EN PREMIER - CareLink v2.0.0

**Document de référence obligatoire à consulter au début de chaque session de développement**

---

## 📁 Structure du Dossier du Projet

### Vue d'ensemble

```
CareLink v2.0.0/
│
├── A_LIRE_EN_PREMIER.md          ← CE FICHIER - À lire à chaque session
│
├── 🎯 FICHIERS PRINCIPAUX (NE PAS DÉPLACER)
│   ├── index.html                ← Point d'entrée HTML
│   ├── package.json              ← Dépendances et scripts NPM
│   ├── vite.config.ts            ← Configuration Vite
│   ├── tsconfig.json             ← Configuration TypeScript
│   └── tsconfig.node.json        ← Configuration TypeScript pour Node
│
├── 📝 DOCUMENTATION (TOUJOURS À JOUR)
│   ├── README.md                 ← Présentation générale du projet
│   ├── CHANGELOG.md              ← Historique des modifications
│   └── docs/                     ← Documentation détaillée
│       ├── api/                  ← Documentation API
│       │   └── API_COMPLETE_DOCUMENTATION.md
│       ├── guides/               ← Guides utilisateur et développeur
│       │   ├── QUICK_START.md
│       │   ├── DEVELOPER_GUIDE.md
│       │   ├── DEPLOYMENT.md
│       │   ├── SECURITY_GUIDE.md
│       │   ├── UI_DESIGN_GUIDE.md
│       │   ├── ML_INTEGRATION_GUIDE.md
│       │   ├── FEATURES_ROADMAP.md
│       │   ├── EXEMPLES_CODE.md
│       │   ├── GUIDE_DEMARRAGE.md
│       │   ├── INSTALLATION_RAPIDE.txt
│       │   └── README-SCRIPTS-SQL.md
│       ├── archives/             ← Anciennes versions de doc
│       ├── assets/               ← Images et fichiers de doc
│       ├── DOCUMENTATION_INDEX.md
│       ├── PROJECT_STATUS.md
│       ├── AUDIT_SUMMARY_2025-11-05.md
│       ├── CODE_AUDIT_REPORT.md
│       ├── SECURITY_FIXES_2025-11-05.md
│       ├── REORGANIZATION_COMPLETE.md
│       └── CareLink_Plan_Developpement.md.pdf
│
├── 💻 CODE SOURCE
│   ├── src/                      ← Code source React/TypeScript
│   └── electron/                 ← Code Electron (TypeScript)
│       ├── main.ts               ← Processus principal Electron
│       ├── preload.ts            ← Script de preload sécurisé
│       ├── backup.ts             ← Gestion des backups
│       ├── encryption.ts         ← Chiffrement des données sensibles
│       ├── seed-data.ts          ← Initialisation des données
│       └── python-backend-manager.ts ← Gestion du backend Python
│
├── 🐍 BACKEND PYTHON (ML & Analytics)
│   └── python-backend/           ← Serveur Python pour ML
│
├── 🧪 TESTS
│   └── tests/                    ← Tests unitaires et d'intégration
│
├── 🎨 RESSOURCES
│   └── assets/                   ← Images, fonts, styles
│
├── 🔧 SCRIPTS (ORGANISÉS PAR FONCTION)
│   └── scripts/
│       ├── backup/               ← Scripts de backup
│       │   ├── backup-script.js
│       │   ├── check-all-backups.js
│       │   └── check-backup-medical.js
│       ├── database/             ← Scripts et SQL de base de données
│       │   ├── reset-database.js
│       │   ├── reset-database-clean.sql
│       │   ├── seed-dossiers-medicaux.sql
│       │   └── seed-simple.sql
│       ├── medical/              ← Scripts de données médicales
│       │   ├── check-medical-data.js
│       │   ├── create-medical-data.js
│       │   └── decrypt-all-data.js
│       ├── utils/                ← Utilitaires divers
│       │   └── check-db.js
│       ├── add-long-term-rdv.js
│       ├── diagnostic-db.js
│       ├── fix-dates.js
│       ├── fix-orphans.js
│       ├── insert-medical-data.js
│       ├── seed-database.js
│       └── setup-python-backend.js
│
├── 🏗️ BUILD & DÉPLOIEMENT
│   └── build/
│       ├── DEMARRER.bat          ← Démarrage rapide de l'application
│       └── INSTALLATION_RAPIDE.bat ← Installation des dépendances
│
├── ⚙️ CONFIGURATION
│   └── config/
│       └── jest.config.js        ← Configuration Jest pour tests
│
└── 📦 BUILD OUTPUT
    └── dist/                     ← Fichiers compilés (TypeScript → JS)
```

---

## 🎯 Règles de Rangement à Respecter

### ⚠️ NE JAMAIS FAIRE

1. **Ne JAMAIS mélanger** :
   - Code source (`/src`, `/electron`) avec scripts (`/scripts`)
   - Documentation (`/docs`) avec code
   - Fichiers temporaires avec fichiers de production
   - Données médicales sensibles avec code

2. **Ne JAMAIS laisser à la racine** :
   - Scripts .bat (→ `/build`)
   - Fichiers de config .js (→ `/config`)
   - Fichiers SQL (→ `/scripts/database`)
   - Scripts utilitaires (→ `/scripts/[backup|database|medical|utils]`)
   - Documentation (→ `/docs`)

3. **Ne JAMAIS commiter** :
   - Fichiers `.env` (données sensibles)
   - Fichiers de backup avec données réelles
   - `node_modules/`
   - `/dist` (généré automatiquement)
   - Données médicales réelles
   - Fichiers de log

### ✅ TOUJOURS FAIRE

1. **Avant chaque modification** :
   - Créer un backup des données sensibles
   - Compiler TypeScript avant de tester : `npm run compile:electron`

2. **Nouveaux scripts** :
   - Backup → `/scripts/backup`
   - Database/SQL → `/scripts/database`
   - Données médicales → `/scripts/medical`
   - Utilitaires → `/scripts/utils`
   - Build → `/build`

3. **Fichiers TypeScript** :
   - Code Electron → `/electron`
   - Code React → `/src`
   - Toujours compiler avant test

4. **Fichiers temporaires de développement** :
   - Créer `/tmp` à la racine (ignoré par git)
   - Y placer tous les fichiers de test/expérimentation

---

## 📚 Création et Maintenance de la Documentation

### Documentation Utilisateur

**Emplacement** : `/docs/guides/`

**Fichiers existants à maintenir** :
- `QUICK_START.md` - Démarrage rapide
- `GUIDE_DEMARRAGE.md` - Guide détaillé
- `INSTALLATION_RAPIDE.txt` - Installation

**Format** :
```markdown
# Titre de la fonctionnalité

## Vue d'ensemble
[Description courte et claire]

## Prérequis
- Élément 1
- Élément 2

## Étapes
1. Première étape avec capture d'écran
2. Deuxième étape...

## Exemples
[Code ou captures d'écran]

## Résolution de problèmes
[Solutions aux erreurs courantes]
```

---

### Documentation API

**Emplacement** : `/docs/api/API_COMPLETE_DOCUMENTATION.md`

**À MAINTENIR à jour** lors de toute modification d'API

**Structure** :
- Endpoints disponibles
- Paramètres requis/optionnels
- Format de réponse
- Codes d'erreur
- Exemples d'utilisation

---

### Documentation Technique

**Emplacement** : `/docs/guides/`

**Fichiers à maintenir** :
- `DEVELOPER_GUIDE.md` - Guide développeur
- `DEPLOYMENT.md` - Déploiement
- `SECURITY_GUIDE.md` - Sécurité
- `UI_DESIGN_GUIDE.md` - Design UI
- `ML_INTEGRATION_GUIDE.md` - Intégration ML
- `FEATURES_ROADMAP.md` - Roadmap
- `EXEMPLES_CODE.md` - Exemples de code

---

## 🔄 Processus de Développement par Session

### 📋 Checklist de Début de Session

```markdown
[ ] 1. Lire ce fichier (A_LIRE_EN_PREMIER.md)
[ ] 2. Vérifier l'état du projet : git status
[ ] 3. Mettre à jour depuis le dépôt : git pull
[ ] 4. Lire le CHANGELOG.md pour connaître les dernières modifications
[ ] 5. Compiler TypeScript : npm run compile:electron
[ ] 6. Vérifier que Vite fonctionne : npm run start:react
[ ] 7. Vérifier que le backend Python est prêt (si nécessaire)
[ ] 8. Créer un backup des données médicales si modification prévue
[ ] 9. Créer une branche de travail : git checkout -b feature/nom
```

### 🔨 Pendant le Développement

```markdown
[ ] 1. Coder par petites itérations testables
[ ] 2. Commenter le code complexe (POURQUOI, pas QUOI)
[ ] 3. Compiler TypeScript après chaque modification : npm run compile:electron
[ ] 4. Tester chaque modification localement
[ ] 5. Commiter régulièrement (commits atomiques)
[ ] 6. Respecter la structure des dossiers
[ ] 7. Ne pas laisser de console.log() ou code de debug
[ ] 8. Protéger les données médicales sensibles (chiffrement)
```

### ✅ Checklist de Fin de Session

```markdown
[ ] 1. Tous les tests passent (npm test)
[ ] 2. TypeScript compile sans erreur (npm run compile:electron)
[ ] 3. Build Vite fonctionne (npm run build)
[ ] 4. Pas de fichiers sensibles à commiter
[ ] 5. Documentation mise à jour :
    [ ] README.md (si nécessaire)
    [ ] CHANGELOG.md (OBLIGATOIRE)
    [ ] Documentation API (si modification d'API)
    [ ] Documentation utilisateur (si nouvelle fonctionnalité)
    [ ] Commentaires dans le code
[ ] 6. Message de commit explicite et descriptif
[ ] 7. Push de la branche
[ ] 8. Vérifier que la structure est propre (pas de fichiers mal placés)
[ ] 9. Backup des données médicales effectué si nécessaire
```

---

## 📝 Mise à Jour du CHANGELOG

**À FAIRE SYSTÉMATIQUEMENT** après chaque modification

**Format** :
```markdown
## [Version] - YYYY-MM-DD

### Added (Ajouts)
- Nouvelle fonctionnalité X
- Nouveau composant React Y

### Changed (Modifications)
- Amélioration de la performance de Z
- Mise à jour de la documentation

### Fixed (Corrections)
- Correction du bug dans la fonction A
- Résolution du problème d'affichage B

### Security (Sécurité)
- Correction de la vulnérabilité dans le chiffrement
- Amélioration de la protection des données médicales
```

---

## 🔒 Sécurité - CRITIQUE pour CareLink

### Données Médicales Sensibles

**⚠️ RÈGLES ABSOLUES** :

1. **TOUJOURS chiffrer** les données médicales sensibles
2. **JAMAIS commiter** de données médicales réelles
3. **TOUJOURS utiliser** `.env` pour les secrets
4. **JAMAIS exposer** les clés de chiffrement

### Fichiers Sensibles

**Emplacement** : Utiliser `.env` (ignoré par git)

**Fichiers concernés** :
- Clés de chiffrement
- Identifiants de base de données
- Tokens d'authentification
- Clés API

**Vérification** :
```bash
# Vérifier que .env est dans .gitignore
cat .gitignore | grep .env

# NE JAMAIS faire :
git add .env
```

### Chiffrement

- Module dédié : `electron/encryption.ts`
- Utiliser systématiquement pour :
  - Dossiers médicaux
  - Données personnelles
  - Antécédents médicaux
  - Rendez-vous médicaux

### Protection des Données

1. **Backup chiffré** : Utiliser `electron/backup.ts`
2. **Transmission sécurisée** : HTTPS uniquement
3. **Stockage sécurisé** : SQLite avec chiffrement
4. **Logs sanitisés** : Pas de données sensibles dans les logs

---

## 🧪 Tests

### Avant Chaque Commit

```bash
# Compiler TypeScript
npm run compile:electron

# Exécuter les tests
npm test

# Build Vite
npm run build

# Vérifier l'application complète
npm run start
```

### Types de Tests Requis

1. **Tests unitaires** : Chaque fonction importante
2. **Tests d'intégration** : Interactions entre modules
3. **Tests de sécurité** : Chiffrement, validation des entrées
4. **Tests UI** : Composants React

---

## 🚀 Build et Déploiement

### Scripts Disponibles

```bash
# Développement
npm run dev                    # Lance React + Electron
npm run start:react           # Lance uniquement Vite
npm run start:electron        # Lance uniquement Electron
npm run compile:electron      # Compile TypeScript

# Build
npm run build                 # Build Vite
npm run build:electron        # Build application Electron complète

# Tests
npm test                      # Tests Jest
npm run test:watch           # Tests en mode watch
npm run test:coverage        # Couverture des tests

# Base de données
npm run seed                  # Initialiser la DB avec données

# Utilitaires
npm run clean                 # Nettoie /dist
npm run kill-ports           # Libère les ports utilisés
```

### Avant une Release

```bash
# 1. Compiler TypeScript
npm run compile:electron

# 2. Exécuter tous les tests
npm test

# 3. Vérifier la couverture
npm run test:coverage

# 4. Build complet
npm run build

# 5. Build Electron
npm run build:electron

# 6. Mettre à jour la version dans package.json
npm version [major|minor|patch]

# 7. Mettre à jour CHANGELOG.md

# 8. Créer un tag git
git tag -a vX.X.X -m "Version X.X.X"
git push origin vX.X.X
```

---

## 📊 Maintenance Continue du Rangement

### Audit Mensuel de Structure

**Checklist mensuelle** :

```markdown
[ ] Racine propre (seulement fichiers principaux et configs)
[ ] Aucun fichier .backup ou .old à la racine
[ ] Aucun fichier temporaire (.tmp, .log)
[ ] /scripts organisé en sous-dossiers (backup, database, medical, utils)
[ ] /docs à jour et organisé
[ ] /electron contient uniquement fichiers .ts
[ ] /dist peut être supprimé et régénéré
[ ] .gitignore à jour
[ ] Aucun fichier sensible dans le dépôt
[ ] Aucune donnée médicale réelle dans le dépôt
```

### Nettoyage Périodique

**Tous les mois** :
1. Nettoyer `/dist` : `npm run clean`
2. Nettoyer `/node_modules` : `npm ci`
3. Mettre à jour les dépendances : `npm update`
4. Audit de sécurité : `npm audit fix`
5. Vérifier les backups de données médicales
6. Archiver les anciens logs

---

## 🎯 Bonnes Pratiques Spécifiques CareLink

### 1. TypeScript

- **Toujours typer** les variables et fonctions
- **Compiler avant de tester** : `npm run compile:electron`
- Fichiers sources : `.ts` dans `/electron` et `/src`
- Fichiers compilés : `.js` dans `/dist`

### 2. Electron + React + Vite

- **main.ts** : Processus principal Electron
- **preload.ts** : Bridge sécurisé (contextBridge)
- **src/** : Code React avec Vite
- **Hot reload** : Vite gère automatiquement

### 3. Python Backend

- Environnement virtuel recommandé
- Scripts ML : `/python-backend`
- Gestion : `electron/python-backend-manager.ts`
- Installation : `build/INSTALLATION_RAPIDE.bat`

### 4. Base de Données SQLite

- Scripts SQL : `/scripts/database`
- Initialisation : `npm run seed`
- Reset : `node scripts/database/reset-database.js`
- Backup : `electron/backup.ts`

### 5. Données Médicales

- **TOUJOURS chiffrer** : `electron/encryption.ts`
- Scripts dédiés : `/scripts/medical`
- Pas de données réelles en dev
- Utiliser données de test : `scripts/database/seed-dossiers-medicaux.sql`

---

## ⚠️ Règles d'Or CareLink

1. **TOUJOURS chiffrer les données médicales**
2. **TOUJOURS compiler TypeScript avant de tester**
3. **JAMAIS commiter de données médicales réelles**
4. **JAMAIS commiter de fichiers .env**
5. **TOUJOURS tester après modification du preload**
6. **TOUJOURS mettre à jour le CHANGELOG.md**
7. **TOUJOURS respecter la structure des dossiers**
8. **TOUJOURS documenter les nouvelles fonctionnalités**
9. **JAMAIS laisser de code debug en production**
10. **TOUJOURS vérifier la sécurité des données sensibles**

---

## 📞 En Cas de Problème

### TypeScript ne compile pas

1. Vérifier `tsconfig.json`
2. Vérifier les imports (chemins relatifs)
3. Nettoyer `/dist` : `npm run clean`
4. Recompiler : `npm run compile:electron`

### Electron ne démarre pas

1. Vérifier que `/dist/main.js` existe
2. Compiler : `npm run compile:electron`
3. Vérifier les ports : `npm run kill-ports`
4. Relancer : `npm run start`

### Vite ne démarre pas

1. Vérifier le port 5173 : `npm run kill-ports`
2. Vérifier `vite.config.ts`
3. Nettoyer et réinstaller : `rm -rf node_modules && npm ci`

### Base de données corrompue

1. Backup actuel si possible
2. Reset : `node scripts/database/reset-database.js`
3. Réinitialiser : `npm run seed`

### Documentation obsolète

1. Identifier les sections obsolètes
2. Mettre à jour avec l'état actuel
3. Ajouter note de mise à jour dans CHANGELOG.md
4. Vérifier tous les liens internes

---

## 📅 Historique de ce Document

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2025-11-11 | Création initiale après réorganisation du projet |

---

## 🔗 Liens Utiles

- [BONNES_PRATIQUES_DEV.md](C:\Users\RK\Desktop\BONNES_PRATIQUES_DEV.md) - Document général
- [README.md](./README.md) - Présentation du projet
- [CHANGELOG.md](./CHANGELOG.md) - Historique des modifications
- [docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) - Index complet
- [docs/api/API_COMPLETE_DOCUMENTATION.md](./docs/api/API_COMPLETE_DOCUMENTATION.md) - Documentation API
- [docs/guides/DEVELOPER_GUIDE.md](./docs/guides/DEVELOPER_GUIDE.md) - Guide développeur
- [docs/guides/SECURITY_GUIDE.md](./docs/guides/SECURITY_GUIDE.md) - Guide sécurité

---

**🎯 RAPPEL FINAL** :

> Ce document est votre référence pour CHAQUE session de développement.
> Prenez 5 minutes au début de chaque session pour le relire.
> CareLink gère des données médicales SENSIBLES : la sécurité est PRIORITAIRE.

**Date de dernière révision** : 2025-11-11
**Version du projet** : 2.0.0
**À réviser** : À chaque version majeure ou changement de structure

---

**✅ Vous avez lu ce document ? Vous êtes prêt à développer CareLink en toute sécurité !**