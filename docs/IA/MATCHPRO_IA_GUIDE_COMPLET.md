# 🎯 MATCHPRO IA - GUIDE TECHNIQUE COMPLET

**Version:** 1.0.0  
**Date:** Novembre 2025  
**Auteur:** David VIEY  
**Plateforme:** Electron Desktop + Web + Android

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
3. [Installation & Setup](#3-installation--setup)
4. [Structure Projet Complète](#4-structure-projet-complète)
5. [Configuration Environnement](#5-configuration-environnement)
6. [Database Schema (Prisma)](#6-database-schema-prisma)
7. [Backend API (Node.js + tRPC)](#7-backend-api-nodejs--trpc)
8. [Services Python](#8-services-python)
9. [Modules UI React](#9-modules-ui-react)
10. [Scripts & Automation](#10-scripts--automation)
11. [Guide Développement](#11-guide-développement)
12. [Déploiement](#12-déploiement)

---

## 1. VUE D'ENSEMBLE

### 🎯 Objectif

**MatchPro IA** est une application de recrutement intelligente pour agences d'intérim, cabinets de recrutement et entreprises. Elle utilise l'IA pour automatiser et optimiser le matching candidats/offres.

### 🚀 Fonctionnalités Principales

#### Module Candidats
- ✅ Import masse CVs (PDF, DOCX, Images)
- ✅ Parsing IA automatique (OpenAI/Anthropic/Gemini)
- ✅ Profils enrichis (compétences, expériences, formations)
- ✅ Scores prédictifs (employabilité, stabilité, turnover)
- ✅ Historique interactions

#### Module Entreprises & Offres
- ✅ CRM entreprises complet
- ✅ Génération offres par IA
- ✅ Gestion contacts multiples
- ✅ Workflow statuts offres

#### Module Matching
- ✅ Algorithme hybride (Semantic + Rules + ML)
- ✅ Scoring 0-100% détaillé
- ✅ Explications AI (points forts/faibles)
- ✅ Suggestions amélioration

#### Module Dashboard
- ✅ KPIs temps réel
- ✅ Analytics interactifs
- ✅ Prédictions marché
- ✅ Alertes intelligentes

### 🔑 Différenciateurs

1. **Multi-Provider IA** : Support OpenAI, Anthropic, Gemini, Mistral
2. **Clés API utilisateur** : Pas de frais cachés, utilisez vos quotas
3. **Cross-platform** : Desktop, Web, Mobile avec le même code
4. **Privacy-first** : Données locales, chiffrement AES-256
5. **Offline-capable** : Fonctionne sans connexion

---

## 2. ARCHITECTURE TECHNIQUE

### 🏗️ Stack Complet

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  React 18 + TypeScript + TailwindCSS + shadcn/ui   │
│                                                      │
│  ┌──────────────┬──────────────┬─────────────────┐ │
│  │   Desktop    │     Web      │     Mobile      │ │
│  │   Electron   │   Next.js    │   Capacitor     │ │
│  └──────────────┴──────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              API LAYER (tRPC)                        │
│  Type-safe API • Auto-complete • No codegen         │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Node.js)                       │
│  Express + tRPC Router + Prisma ORM                 │
│                                                      │
│  ┌────────────┬─────────────┬──────────────────┐   │
│  │ IA Gateway │ Cache Redis │ Python Bridge    │   │
│  └────────────┴─────────────┴──────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ▼
┌──────────────┬──────────────┬────────────────────┐
│  SQLite/     │    Redis     │   Python Services  │
│  PostgreSQL  │    Cache     │   (FastAPI)        │
└──────────────┴──────────────┴────────────────────┘
```

### 📦 Technologies

| Couche | Technologies | Rôle |
|--------|-------------|------|
| **Frontend** | React 18, TypeScript, TailwindCSS, shadcn/ui | UI réactive |
| **Desktop** | Electron 32, electron-builder | App cross-platform |
| **API** | tRPC, Express, Zod | API type-safe |
| **Database** | Prisma, SQLite/PostgreSQL | ORM moderne |
| **Cache** | Redis, ioredis | Performance |
| **IA** | OpenAI, Anthropic, Google GenAI | Multi-provider |
| **Python ML** | FastAPI, Sentence-Transformers, XGBoost | Matching & ML |

---

## 3. INSTALLATION & SETUP

### 📋 Prérequis

**Obligatoires:**
- ✅ **Node.js 20+** : https://nodejs.org/
- ✅ **Python 3.9+** : https://www.python.org/downloads/
  - ⚠️ **IMPORTANT** : Cocher "Add Python to PATH" pendant l'installation
- ✅ **Git** : https://git-scm.com/

**Recommandés:**
- ✅ **Redis** : https://redis.io/download (améliore performances)
- ✅ **VS Code** : https://code.visualstudio.com/

### 🚀 Installation Complète

```bash
# Étape 1: Clone du projet
git clone https://github.com/your-repo/matchpro-ia.git
cd matchpro-ia

# Étape 2: Installation des dépendances (Node + Python auto)
npm install

# Cette commande va automatiquement:
# 1. ✅ Vérifier Python installé
# 2. ✅ Créer environnements virtuels Python
# 3. ✅ Installer dépendances Python
# 4. ✅ Générer Prisma client
# 5. ✅ Créer database SQLite
# 6. ✅ Lancer migrations

# Étape 3: Configuration
cp .env.example .env
npm run generate-key  # Génère clé d'encryption

# Étape 4: Seed database (données de test)
npm run db:seed
```

### ✅ Vérification Installation

```bash
# Check Python
python --version
# Doit afficher: Python 3.9.x ou supérieur

# Check Node
node --version
# Doit afficher: v20.x.x ou supérieur

# Check Redis (optionnel)
redis-cli ping
# Doit afficher: PONG
```

### 🎯 Lancement du Projet

```bash
# Lancer TOUTE l'application (une commande)
npm run dev

# Cette commande lance:
# ✅ API Backend (port 3001)
# ✅ Services Python (ports 8001, 8002, 8003)
# ✅ App Desktop Electron (port 5173)

# L'app s'ouvre automatiquement dans Electron
# Première fois: Les services Python prennent 10-20s à démarrer

# Accès:
# - Desktop: S'ouvre automatiquement
# - API: http://localhost:3001
# - Python Docs: http://localhost:8001/docs
```

---

## 4. STRUCTURE PROJET COMPLÈTE

```
matchpro-ia/
│
├── 📄 package.json              # Root - scripts orchestration
├── 📄 .env                      # Configuration
├── 📄 turbo.json                # Turborepo config
│
├── 📁 apps/
│   │
│   ├── 📁 desktop/              # 🖥️ Electron App
│   │   ├── package.json
│   │   ├── electron.vite.config.ts
│   │   ├── 📁 electron/
│   │   │   ├── main.ts         # Main process
│   │   │   └── preload.ts      # Preload script
│   │   └── 📁 src/             # Renderer (React)
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       └── 📁 routes/
│   │           ├── Dashboard.tsx
│   │           ├── Candidats.tsx
│   │           ├── Entreprises.tsx
│   │           ├── Matching.tsx
│   │           └── Settings.tsx
│   │
│   ├── 📁 web/                  # 🌐 Next.js App (si besoin)
│   │   └── src/app/
│   │
│   └── 📁 mobile/               # 📱 Capacitor
│       └── capacitor.config.ts
│
├── 📁 packages/
│   │
│   ├── 📁 ui/                   # 🎨 Composants React Partagés
│   │   ├── package.json
│   │   └── 📁 src/
│   │       ├── 📁 components/
│   │       │   ├── 📁 ui/      # Base components (shadcn)
│   │       │   ├── 📁 dashboard/
│   │       │   │   ├── DashboardStats.tsx
│   │       │   │   ├── DashboardCharts.tsx
│   │       │   │   └── DashboardAlerts.tsx
│   │       │   ├── 📁 candidats/
│   │       │   │   ├── CandidatsList.tsx
│   │       │   │   ├── CandidatDetail.tsx
│   │       │   │   ├── CandidatImportDialog.tsx
│   │       │   │   └── CandidatForm.tsx
│   │       │   ├── 📁 entreprises/
│   │       │   │   ├── EntreprisesList.tsx
│   │       │   │   ├── EntrepriseDetail.tsx
│   │       │   │   └── EntrepriseForm.tsx
│   │       │   ├── 📁 offres/
│   │       │   │   ├── OffresList.tsx
│   │       │   │   ├── OffreDetail.tsx
│   │       │   │   ├── OffreForm.tsx
│   │       │   │   └── OffreGeneratorDialog.tsx
│   │       │   ├── 📁 matching/
│   │       │   │   ├── MatchingResults.tsx
│   │       │   │   ├── MatchingCard.tsx
│   │       │   │   └── MatchingExplanation.tsx
│   │       │   └── 📁 settings/
│   │       │       ├── ApiKeysSettings.tsx
│   │       │       └── GeneralSettings.tsx
│   │       ├── 📁 hooks/
│   │       ├── 📁 lib/
│   │       └── 📁 types/
│   │
│   ├── 📁 database/             # 🗄️ Prisma ORM
│   │   ├── package.json
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma
│   │   │   └── 📁 migrations/
│   │   └── 📁 src/
│   │       └── client.ts
│   │
│   └── 📁 api-client/           # 🔌 tRPC Client
│       ├── package.json
│       └── 📁 src/
│           └── trpc.ts
│
├── 📁 api/                      # 🔧 Backend Node.js
│   ├── package.json
│   ├── 📁 data/
│   │   └── dev.db              # SQLite database
│   └── 📁 src/
│       ├── server.ts           # Express + tRPC server
│       ├── context.ts
│       ├── trpc.ts
│       ├── 📁 routers/
│       │   ├── _app.ts
│       │   ├── candidats.ts
│       │   ├── entreprises.ts
│       │   ├── offres.ts
│       │   ├── matching.ts
│       │   ├── dashboard.ts
│       │   └── settings.ts
│       ├── 📁 services/
│       │   ├── ia-gateway.ts   # IA provider abstraction
│       │   ├── python-client.ts
│       │   ├── redis-cache.ts
│       │   └── encryption.ts
│       └── 📁 utils/
│
├── 📁 services/                 # 🐍 Python Microservices
│   │
│   ├── 📁 ia-parser/           # CV Parsing
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── 📁 venv/
│   │   └── 📁 parsers/
│   │       ├── pdf_parser.py
│   │       ├── docx_parser.py
│   │       └── ocr_parser.py
│   │
│   ├── 📁 ia-matching/         # Matching Algorithm
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── matcher.py
│   │   ├── 📁 venv/
│   │   └── 📁 models/
│   │       └── success_predictor.pkl
│   │
│   └── 📁 ia-predictive/       # ML Predictions
│       ├── main.py
│       ├── requirements.txt
│       ├── 📁 venv/
│       └── 📁 models/
│           ├── salary_model.pkl
│           └── turnover_model.pkl
│
└── 📁 scripts/                  # 🛠️ Setup Scripts
    ├── check-python.js
    ├── setup-python.js
    ├── start-python-services.js
    └── generate-encryption-key.js
```

---

## 5. CONFIGURATION ENVIRONNEMENT

### 📄 .env (root)

```env
# ==========================================
# DATABASE
# ==========================================
# SQLite (dev)
DATABASE_URL="file:./api/data/dev.db"

# PostgreSQL (production - optionnel)
# DATABASE_URL="postgresql://user:password@localhost:5432/matchpro"

# ==========================================
# API
# ==========================================
API_PORT=3001
NODE_ENV=development

# ==========================================
# REDIS (local)
# ==========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Si mot de passe configuré sur Redis, le mettre ici

# ==========================================
# PYTHON SERVICES
# ==========================================
PYTHON_PARSER_PORT=8001
PYTHON_MATCHING_PORT=8002
PYTHON_PREDICTIVE_PORT=8003

# ==========================================
# ENCRYPTION (généré auto)
# ==========================================
ENCRYPTION_KEY=

# ==========================================
# CORS
# ==========================================
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ==========================================
# LOGGING
# ==========================================
LOG_LEVEL=debug
```

### 📄 .env.example

```env
# Copier ce fichier en .env et configurer

# Database
DATABASE_URL="file:./api/data/dev.db"

# API
API_PORT=3001
NODE_ENV=development

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Python Services
PYTHON_PARSER_PORT=8001
PYTHON_MATCHING_PORT=8002
PYTHON_PREDICTIVE_PORT=8003

# Encryption (laisser vide, sera généré)
ENCRYPTION_KEY=

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 📄 package.json (root)

```json
{
  "name": "matchpro-ia",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "api"
  ],
  "scripts": {
    "preinstall": "node scripts/check-python.js",
    "postinstall": "npm run setup:python && npm run db:setup",
    
    "setup:python": "node scripts/setup-python.js",
    "db:setup": "cd packages/database && npx prisma generate && npx prisma migrate dev --name init",
    "generate-key": "node scripts/generate-encryption-key.js",
    
    "dev": "concurrently \"npm:dev:*\" --kill-others",
    "dev:api": "cd api && npm run dev",
    "dev:python": "node scripts/start-python-services.js",
    "dev:desktop": "cd apps/desktop && npm run dev",
    
    "db:migrate": "cd packages/database && npx prisma migrate dev",
    "db:studio": "cd packages/database && npx prisma studio",
    "db:reset": "cd packages/database && npx prisma migrate reset",
    "db:seed": "tsx api/src/seed.ts",
    
    "build": "turbo run build",
    "build:desktop": "cd apps/desktop && npm run build",
    
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "turbo": "^2.0.0",
    "tsx": "^4.7.0",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 6. DATABASE SCHEMA (PRISMA)

### 📄 packages/database/prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // ou "postgresql" pour production
  url      = env("DATABASE_URL")
}

// ========================================
// CONFIGURATION & API KEYS
// ========================================

model ApiKey {
  id        String   @id @default(cuid())
  provider  String   // "openai" | "anthropic" | "gemini" | "mistral"
  key       String   // Encrypted AES-256
  isActive  Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  usage     ApiKeyUsage[]
  
  @@map("api_keys")
}

model ApiKeyUsage {
  id          String   @id @default(cuid())
  apiKeyId    String
  apiKey      ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  
  provider    String
  model       String   // "gpt-4o", "claude-sonnet-4-20250514"
  tokens      Int
  cost        Float    // Coût estimé en €
  endpoint    String   // "parse_cv", "matching", "generate_offer"
  
  createdAt   DateTime @default(now())
  
  @@index([apiKeyId, createdAt])
  @@map("api_key_usage")
}

// ========================================
// ENTREPRISES
// ========================================

model Entreprise {
  id          String   @id @default(cuid())
  
  // Informations générales
  nom         String
  siret       String   @unique
  secteur     String
  taille      String?  // "startup" | "pme" | "grand_groupe"
  siteWeb     String?
  
  // Adresse (JSON stringifié)
  adresse     String   // {rue, ville, codePostal, pays}
  
  // Relations
  contacts    Contact[]
  offres      OffreEmploi[]
  placements  Placement[]
  
  // Préférences IA (JSON stringifié)
  preferences String?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("entreprises")
}

model Contact {
  id            String     @id @default(cuid())
  entrepriseId  String
  entreprise    Entreprise @relation(fields: [entrepriseId], references: [id], onDelete: Cascade)
  
  nom           String
  prenom        String
  email         String
  telephone     String?
  poste         String
  principal     Boolean    @default(false)
  
  createdAt     DateTime   @default(now())
  
  @@map("contacts")
}

// ========================================
// OFFRES D'EMPLOI
// ========================================

model OffreEmploi {
  id            String     @id @default(cuid())
  entrepriseId  String
  entreprise    Entreprise @relation(fields: [entrepriseId], references: [id])
  
  // Détails offre
  titre         String
  description   String     // Texte long
  reference     String?
  type          String     // "CDI" | "CDD" | "Mission" | "Stage" | "Alternance"
  
  // Localisation (JSON stringifié)
  localisation  String     // {ville, departement, region, teletravail}
  
  // Rémunération (JSON stringifié)
  salaire       String     // {min, max, devise, variable, avantages[]}
  
  // Compétences (JSON stringifié)
  // [{nom, niveau_requis: 1-5, obligatoire: bool, poids: float}]
  competences   String
  
  // Expérience
  experienceMin    Int
  experienceIdeale Int
  niveauEtudes     String
  
  // Dates
  datePublication  DateTime @default(now())
  dateExpiration   DateTime?
  urgence          Boolean  @default(false)
  
  // Statut
  statut        String   @default("active")  // "active" | "pourvue" | "suspendue" | "archivee"
  nombrePostes  Int      @default(1)
  
  // Relations
  matchings     Matching[]
  placements    Placement[]
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([entrepriseId, statut])
  @@map("offres_emploi")
}

// ========================================
// CANDIDATS
// ========================================

model Candidat {
  id            String   @id @default(cuid())
  
  // Identité
  nom           String
  prenom        String
  email         String   @unique
  telephone     String
  dateNaissance DateTime?
  nationalite   String?
  
  // Localisation (JSON stringifié)
  adresse       String   // {rue, ville, codePostal, pays}
  mobilite      String   // [ville1, ville2, ...] ou ["remote"]
  permis        Boolean  @default(false)
  vehicule      Boolean  @default(false)
  
  // CV & Documents
  cvUrl         String?
  cvParsed      String?  // Données extraites IA (JSON)
  photo         String?
  
  // Profil (JSON stringifiés)
  experiences   String   // [{poste, entreprise, dateDebut, dateFin, missions[], competences[]}]
  competences   String   // [{nom, categorie, niveau: 1-5, anneesPratique, derniereUtilisation, verified}]
  formations    String   // [{diplome, ecole, annee, niveau, specialite}]
  langues       String?  // [{langue, niveau: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"}]
  
  // Scores IA (JSON stringifié)
  scores        String?  // {employabilite, stabilite, adaptabilite, potentiel}
  
  // Prédictions IA (JSON stringifié)
  predictions   String?  // {salaireSouhaite, prochainPosteIdeal, probaAcceptation}
  
  // Préférences (JSON stringifié)
  preferences   String?  // {typeContrat[], secteurs[], teletravail, fourchetteSalariale}
  
  // Disponibilité
  disponibilite Int?     // En jours
  situationActuelle String? // "en_poste" | "disponible" | "preavis" | "etudiant"
  
  // Relations
  interactions  Interaction[]
  matchings     Matching[]
  placements    Placement[]
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([email])
  @@map("candidats")
}

// ========================================
// MATCHING
// ========================================

model Matching {
  id          String   @id @default(cuid())
  
  // Relations
  candidatId  String
  candidat    Candidat @relation(fields: [candidatId], references: [id], onDelete: Cascade)
  
  offreId     String
  offre       OffreEmploi @relation(fields: [offreId], references: [id], onDelete: Cascade)
  
  // Scores
  scoreTotal     Float   // 0-100
  scoreSemantic  Float   // 0-100
  scoreRules     Float   // 0-100
  scoreML        Float   // 0-100
  
  // Explications (JSON stringifié)
  details        String  // {points_forts[], points_faibles[], risques[], opportunites[]}
  
  // Statut
  statut      String   @default("nouveau")
  // "nouveau" | "vu" | "contacte" | "propose" | "entretien" | "accepte" | "refuse"
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([candidatId, offreId])
  @@index([offreId, scoreTotal])
  @@index([candidatId])
  @@map("matchings")
}

// ========================================
// INTERACTIONS
// ========================================

model Interaction {
  id          String   @id @default(cuid())
  
  candidatId  String
  candidat    Candidat @relation(fields: [candidatId], references: [id], onDelete: Cascade)
  
  type        String   // "email" | "appel" | "sms" | "entretien" | "test" | "note"
  sujet       String
  contenu     String?
  
  sentiment   String?  // "positif" | "neutre" | "negatif" (analysé IA)
  
  createdAt   DateTime @default(now())
  createdBy   String?
  
  @@index([candidatId, createdAt])
  @@map("interactions")
}

// ========================================
// PLACEMENTS
// ========================================

model Placement {
  id            String     @id @default(cuid())
  
  candidatId    String
  candidat      Candidat   @relation(fields: [candidatId], references: [id])
  
  offreId       String
  offre         OffreEmploi @relation(fields: [offreId], references: [id])
  
  entrepriseId  String
  entreprise    Entreprise @relation(fields: [entrepriseId], references: [id])
  
  // Détails
  dateDebut     DateTime
  dateFin       DateTime?
  typeContrat   String
  poste         String
  salaire       Float
  
  // Suivi
  satisfaction  Int?
  estActif      Boolean    @default(true)
  raisonDepart  String?
  dateDepart    DateTime?
  
  // Business
  commission    Float
  commissionPct Float?
  
  notes         String?
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  @@index([entrepriseId, dateDebut])
  @@index([candidatId])
  @@map("placements")
}

// ========================================
// ANALYTICS CACHE
// ========================================

model AnalyticsCache {
  id        String   @id @default(cuid())
  key       String   @unique
  data      String   // JSON stringifié
  expiresAt DateTime
  
  createdAt DateTime @default(now())
  
  @@index([key, expiresAt])
  @@map("analytics_cache")
}
```

### 📄 packages/database/src/client.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### 📄 packages/database/package.json

```json
{
  "name": "@repo/database",
  "version": "1.0.0",
  "main": "./src/client.ts",
  "types": "./src/client.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.11.0"
  },
  "devDependencies": {
    "prisma": "^5.11.0"
  }
}
```

---

## 7. BACKEND API (NODE.JS + TRPC)

### 📄 api/package.json

```json
{
  "name": "@matchpro/api",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@trpc/server": "^10.45.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "openai": "^4.52.0",
    "@google/generative-ai": "^0.15.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.4",
    "ioredis": "^5.3.2",
    "dotenv": "^16.4.5",
    "axios": "^1.6.0",
    "@repo/database": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### 📄 api/src/trpc.ts

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    };
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
```

### 📄 api/src/context.ts

```typescript
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from '@repo/database';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  return {
    db,
    req,
    res
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

### 📄 api/src/server.ts

```typescript
import 'dotenv/config';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import { appRouter } from './routers/_app';
import { createContext } from './context';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// tRPC endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│  🚀 MatchPro IA - API Server Running    │
├─────────────────────────────────────────┤
│  📡 API:    http://localhost:${PORT}     │
│  🔌 tRPC:   http://localhost:${PORT}/trpc │
│  ❤️  Health: http://localhost:${PORT}/health │
└─────────────────────────────────────────┘
  `);
});
```

### 📄 api/src/routers/_app.ts

```typescript
import { router } from '../trpc';
import { candidatsRouter } from './candidats';
import { entreprisesRouter } from './entreprises';
import { offresRouter } from './offres';
import { matchingRouter } from './matching';
import { dashboardRouter } from './dashboard';
import { settingsRouter } from './settings';

export const appRouter = router({
  candidats: candidatsRouter,
  entreprises: entreprisesRouter,
  offres: offresRouter,
  matching: matchingRouter,
  dashboard: dashboardRouter,
  settings: settingsRouter
});

export type AppRouter = typeof appRouter;
```

---

**SUITE DU CODE DANS LA PARTIE 2 CI-DESSOUS...**

Le document est trop long pour un seul fichier. Je vais le découper intelligemment. Continue ? 🚀
