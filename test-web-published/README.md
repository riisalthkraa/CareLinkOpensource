# CareLink v2.0.0 - Tests & Documentation

Application de Gestion Connectée de la Santé Familiale.

---

## Structure du dossier

```
test-web-published/
├── home.html           # Page d'accueil principale
├── index.html          # Rapport de tests Jest (HTML)
├── docs/               # Documentation API TypeDoc
│   ├── index.html
│   ├── modules/
│   └── ...
└── README.md           # Ce fichier
```

---

## Tests Jest

### Fichiers de tests

| Fichier | Description |
|---------|-------------|
| `logger.test.ts` | Tests du système de logging |
| `dbHelper.test.ts` | Tests des helpers de base de données |
| `Login.test.tsx` | Tests du composant de connexion |
| `crud.integration.test.ts` | Tests d'intégration CRUD |

### Commandes

```bash
# Exécuter tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

### Rapport HTML

Ouvrez `index.html` dans votre navigateur pour voir :
- Tests réussis/échoués
- Couverture de code
- Temps d'exécution
- Logs console

---

## Documentation

### Documentation TypeDoc

```bash
npm run docs        # Génère dans docs/
npm run docs:serve  # Sert localement
```

### Documentation Markdown (docs/)

| Fichier | Contenu |
|---------|---------|
| `docs/README.md` | Index de la documentation |
| `docs/architecture/OVERVIEW.md` | Architecture globale |
| `docs/architecture/DATABASE.md` | Schéma base de données |
| `docs/architecture/SECURITY.md` | Sécurité et chiffrement |
| `docs/api/ELECTRON_IPC.md` | API IPC Electron |
| `docs/api/SERVICES.md` | Services TypeScript |
| `docs/api/PYTHON_BACKEND.md` | Backend Python IA |
| `docs/api/TYPES.md` | Définitions TypeScript |
| `docs/components/COMPONENTS.md` | Composants React |
| `docs/pages/PAGES.md` | Pages de l'application |
| `docs/scripts/SCRIPTS.md` | Scripts utilitaires |
| `docs/guides/GUIDE_DEMARRAGE.md` | Guide débutants |
| `docs/guides/EXEMPLES_CODE.md` | Exemples de code |

---

## Statistiques

### Code Source

- **76** fichiers TypeScript/TSX
- **330+** blocs de commentaires JSDoc
- **16** pages
- **12** composants réutilisables
- **15** services métier
- **20+** thèmes visuels

### Technologies

| Catégorie | Stack |
|-----------|-------|
| Frontend | React 18, TypeScript 5.3, Vite 5 |
| Desktop | Electron 28 |
| Base de données | SQLite (sql.js) |
| IA/ML | Python FastAPI, Sentence-BERT |
| Tests | Jest 30, Testing Library |
| Documentation | TypeDoc, JSDoc |

---

## Publication Web

### GitHub Pages

1. Poussez le dossier sur GitHub
2. Settings → Pages → Sélectionnez la branche
3. Accédez à `https://username.github.io/carelink/`

### Netlify / Vercel

Glissez-déposez le dossier pour obtenir une URL publique.

### Local

```bash
npm install -g serve
serve test-web-published
# Ouvrir http://localhost:3000
```

---

## Liens

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeDoc Documentation](https://typedoc.org/guides/overview/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Version** : 2.0.0
**Auteur** : VIEY David
**Dernière mise à jour** : 2025-11-21
