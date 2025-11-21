# 🏥 CareLink - Gestion Connectée de la Santé Familiale

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

Application desktop complète et sécurisée pour centraliser et gérer toutes les informations de santé de votre famille.

## 🚀 Démarrage Rapide (Pour Débutants)

### Étape 1 : Installer Node.js

1. Allez sur [nodejs.org](https://nodejs.org/)
2. Téléchargez la version **LTS** (Long Term Support)
3. Installez Node.js en suivant l'assistant d'installation
4. Redémarrez votre ordinateur

### Étape 2 : Vérifier l'installation

Ouvrez un terminal (Invite de commandes sur Windows) et tapez :

```bash
node --version
npm --version
```

Vous devriez voir les numéros de version s'afficher.

### Étape 3 : Installer les dépendances

Dans le dossier CareLink, ouvrez un terminal et tapez :

```bash
npm install
```

⏳ Cette commande va télécharger tous les outils nécessaires. Cela peut prendre quelques minutes.

### Étape 4 : Lancer l'application

```bash
npm start
```

🎉 **C'est tout !** L'application va se lancer automatiquement.

---

## 📖 Commandes Utiles

### Démarrer l'application en mode développement
```bash
npm start
```
ou
```bash
npm run dev
```

### Compiler l'application pour la production
```bash
npm run build
```

### Créer l'installateur (Windows/Mac/Linux)
```bash
npm run build:electron
```

---

## 🌟 Fonctionnalités Complètes (Version 2.0.0)

### 📋 Gestion Médicale Complète
✅ **Dossiers Médicaux**: Antécédents, diagnostics, bilans et consultations
✅ **Vaccins**: Suivi complet avec rappels automatiques
✅ **Traitements**: Gestion des médicaments et posologies
✅ **Rendez-vous**: Calendrier médical avec notifications
✅ **Allergies**: Documentation des allergies et intolérances

### 🤖 Intelligence Artificielle
✅ **Multi-API Support**: Choisissez votre fournisseur d'IA préféré
  - OpenAI (GPT-4, GPT-3.5 Turbo)
  - Anthropic (Claude 3 Opus, Sonnet, Haiku)
  - Google (Gemini Pro, 1.5 Pro, 1.5 Flash)
  - Local (Ollama - Llama 2, Mistral, Code Llama)
✅ **Assistant Santé (CareAI)**: Analyses et recommandations personnalisées
✅ **ChatDoctor IA**: Conversation médicale intelligente
✅ **Scanner d'Ordonnances**: OCR pour extraire les informations des ordonnances
✅ **Analytics Santé**: Visualisations et statistiques avancées

### 📊 Visualisation et Analyse
✅ **Timeline 3D**: Vue chronologique interactive des données médicales
✅ **Graphiques Dynamiques**: Évolution de la santé en temps réel
✅ **Rapports PDF**: Export de dossiers médicaux complets

### 🆘 Fonctionnalités d'Urgence
✅ **Mode Urgence**: Accès rapide aux informations vitales
✅ **Carte d'Urgence**: QR code avec données médicales essentielles
✅ **Informations de Contact**: Médecins et contacts d'urgence

### 🔒 Sécurité et Confidentialité
✅ **Chiffrement AES-256**: Toutes les données sensibles sont chiffrées
✅ **Base de Données Locale**: Vos données restent sur votre ordinateur
✅ **Backups Automatiques**: Sauvegardes quotidiennes automatiques
✅ **Export/Import**: Sauvegardez et restaurez vos données facilement

### 🎨 Interface Utilisateur
✅ **20 Thèmes**: Personnalisez l'apparence selon vos préférences
✅ **Responsive**: Interface adaptative pour tous les écrans
✅ **Multilingue**: Interface en français (autres langues à venir)
✅ **Accessibilité**: Design inclusif et accessible

### 🧪 Qualité et Robustesse
✅ **Tests Automatisés**: 50+ tests unitaires et d'intégration
✅ **Gestion d'Erreurs**: ErrorBoundary React global
✅ **Logging Centralisé**: Système de logs professionnel
✅ **Retry Automatique**: Gestion intelligente des erreurs DB

---

## 🔧 Structure du Projet

```
CareLink/
├── electron/          # Code Electron (backend)
│   ├── main.ts       # Processus principal Electron
│   ├── preload.ts    # Script preload (communication sécurisée)
│   ├── backup.ts     # Système de backups automatiques
│   └── python-backend-manager.ts  # Gestionnaire backend Python (IA)
├── src/              # Code React (frontend)
│   ├── components/   # Composants réutilisables
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ToastContainer.tsx
│   ├── pages/        # Pages de l'application
│   │   ├── Dashboard.tsx
│   │   ├── ProfilMembre.tsx
│   │   ├── Vaccins.tsx
│   │   ├── Traitements.tsx
│   │   ├── RendezVous.tsx
│   │   ├── DossierMedical.tsx
│   │   ├── AssistantSante.tsx
│   │   ├── ChatDoctor.tsx
│   │   ├── Timeline3D.tsx
│   │   ├── Analytics.tsx
│   │   ├── ModeUrgence.tsx
│   │   ├── CarteUrgence.tsx
│   │   ├── ScannerOrdonnance.tsx
│   │   ├── Backup.tsx
│   │   └── Config.tsx
│   ├── contexts/     # Contexts React
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   ├── utils/        # Utilitaires
│   │   ├── logger.ts      # Système de logging
│   │   ├── dbHelper.ts    # Helper pour requêtes DB
│   │   └── aiProviders.ts # Gestionnaire multi-API IA
│   ├── __tests__/    # Tests unitaires et d'intégration
│   │   ├── logger.test.ts
│   │   ├── dbHelper.test.ts
│   │   ├── Login.test.tsx
│   │   └── crud.integration.test.ts
│   ├── App.tsx       # Composant principal
│   ├── main.tsx      # Point d'entrée React
│   ├── App.css       # Styles principaux
│   ├── themes.css    # 20 thèmes personnalisables
│   └── design-system.css  # Design system global
├── dist/             # Code compilé Electron
├── assets/           # Ressources (icônes, images)
├── package.json      # Configuration npm
├── tsconfig.json     # Configuration TypeScript
├── jest.config.js    # Configuration Jest (tests)
└── vite.config.ts    # Configuration Vite (build)

---

## ➕ Comment Ajouter des Fonctionnalités

### 1. Ajouter une nouvelle page

Créez un fichier dans `src/pages/` :

```typescript
// src/pages/NomPage.tsx
interface NomPageProps {
  onBack: () => void
}

function NomPage({ onBack }: NomPageProps) {
  return (
    <div>
      <button className="btn-back" onClick={onBack}>← Retour</button>
      <h2>Ma Nouvelle Page</h2>
      <div className="card">
        <p>Contenu de ma page</p>
      </div>
    </div>
  )
}

export default NomPage
```

Puis ajoutez-la dans `src/App.tsx` :

```typescript
import NomPage from './pages/NomPage'

// Dans la fonction renderPage()
case 'nom-page':
  return <NomPage onBack={() => setCurrentPage('dashboard')} />
```

### 2. Ajouter un bouton dans le menu

Dans `src/App.tsx`, ajoutez un bouton dans `navbar-menu` :

```typescript
<button
  className={`nav-button ${currentPage === 'nom-page' ? 'active' : ''}`}
  onClick={() => setCurrentPage('nom-page')}
>
  🔵 Ma Page
</button>
```

### 3. Ajouter une table dans la base de données

Modifiez `electron/main.ts`, dans la fonction `initDatabase()` :

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS ma_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

### 4. Interroger la base de données depuis React

```typescript
// Lire des données
const result = await window.electronAPI.dbQuery('SELECT * FROM ma_table')
if (result.success) {
  console.log(result.data)
}

// Ajouter des données
const insertResult = await window.electronAPI.dbRun(
  'INSERT INTO ma_table (nom) VALUES (?)',
  ['Mon nom']
)
```

---

## 💡 Astuces

### Où est stockée la base de données ?

La base de données est automatiquement créée dans le dossier utilisateur :
- **Windows** : `C:\Users\VotreNom\AppData\Roaming\carelink\carelink.db`
- **Mac** : `~/Library/Application Support/carelink/carelink.db`
- **Linux** : `~/.config/carelink/carelink.db`

### Comment voir la console de développement ?

Dans l'application, appuyez sur **F12** ou **Ctrl+Shift+I** (Cmd+Opt+I sur Mac)

### L'application ne démarre pas ?

1. Assurez-vous que Node.js est bien installé : `node --version`
2. Supprimez le dossier `node_modules` et `package-lock.json`
3. Relancez `npm install`
4. Relancez `npm start`

### Installer un nouveau package npm

```bash
npm install nom-du-package
```

Exemple pour installer une librairie de dates :
```bash
npm install date-fns
```

---

## 🎨 Personnaliser l'apparence

Les couleurs principales sont définies dans `src/index.css` :

```css
:root {
  --primary-color: #4A90E2;     /* Bleu principal */
  --secondary-color: #7ED321;   /* Vert */
  --danger-color: #D0021B;      /* Rouge */
  --warning-color: #F5A623;     /* Orange */
}
```

Changez ces valeurs pour personnaliser les couleurs de l'application.

---

## 📚 Ressources pour Apprendre

### TypeScript / JavaScript
- [MDN Web Docs](https://developer.mozilla.org/fr/) - Documentation complète
- [TypeScript en 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### React
- [React Documentation](https://react.dev/) - Documentation officielle
- [React Tutorial](https://react.dev/learn) - Tutoriel interactif

### Electron
- [Electron Documentation](https://www.electronjs.org/docs/latest) - Documentation officielle

### SQLite
- [SQLite Tutorial](https://www.sqlitetutorial.net/) - Tutoriel SQLite

---

## 🐛 Résolution de Problèmes

### Erreur : "Cannot find module"
```bash
npm install
```

### Erreur : "Port 5173 already in use"
Fermez l'autre instance de l'application ou changez le port dans `vite.config.ts`

### L'application se lance mais affiche une page blanche
Ouvrez la console (F12) et vérifiez les erreurs

---

## 📞 Support

Pour toute question, consultez :
- Le plan de développement complet (`CareLink_Plan_Developpement.md.pdf`)
- Les commentaires dans le code
- La documentation des librairies utilisées

---

## 🎯 Roadmap et Prochaines Étapes

### ✅ Phase 1 - MVP (COMPLÉTÉE)
- [x] Module vaccins complet avec calendrier français
- [x] Module traitements avec rappels
- [x] Module RDV avec notifications
- [x] Export PDF du dossier médical
- [x] Système de backup/restore automatique
- [x] Dossiers médicaux complets (antécédents, diagnostics, bilans)
- [x] Mode urgence et carte d'urgence avec QR code
- [x] Scanner d'ordonnances avec OCR
- [x] Assistant santé IA (CareAI)
- [x] ChatDoctor IA conversationnel
- [x] Timeline 3D interactive
- [x] Analytics santé avancés
- [x] 20 thèmes personnalisables
- [x] Chiffrement AES-256
- [x] Tests automatisés (50+ tests)
- [x] ErrorBoundary et logging

### 🚧 Phase 2 - UX/Documentation (EN COURS)
- [x] README complet et à jour
- [ ] Guide développeur
- [ ] Documentation API
- [ ] Guide de déploiement
- [ ] Animations et transitions
- [ ] Optimisations performances
- [ ] CHANGELOG

### 📅 Phase 3 - Distribution (À VENIR)
- [ ] Code signing (Windows/macOS)
- [ ] Installateurs optimisés
- [ ] CI/CD automatisé
- [ ] Auto-update
- [ ] Site web officiel
- [ ] Support multi-langues complet

### 🚀 Version 3.0+ (Future)
- [ ] Synchronisation cloud (optionnelle)
- [ ] Application mobile (iOS/Android)
- [ ] Intégration appareils connectés
- [ ] Export formats professionnels (HL7, FHIR)
- [ ] Téléconsultation intégrée
- [ ] Mode famille étendue

---

## 👨‍💻 Auteur

**VIEY David**
- Développeur & Créateur de CareLink
- Version 2.0.0

## 📄 Licence

MIT - Vous êtes libre d'utiliser, modifier et distribuer ce projet.

---

## ⚠️ Avertissement Médical

**CareLink** est un outil de gestion et d'organisation des données de santé. Il ne remplace **EN AUCUN CAS** l'avis d'un professionnel de santé qualifié.

En cas d'urgence médicale, contactez immédiatement les services d'urgence:
- **France**: 15 (SAMU), 112 (urgences européennes)
- **Belgique**: 112
- **Suisse**: 144
- **Canada**: 911

---

**Fabriqué avec ❤️ par VIEY David | CareLink v2.0.0**
