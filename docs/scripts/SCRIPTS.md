# Scripts Utilitaires

## Vue d'Ensemble

Scripts de maintenance et utilitaires dans `scripts/`.

## Structure

```
scripts/
├── seed-database.js          # Seed données initiales
├── fix-dates.js              # Correction format dates
├── fix-orphans.js            # Nettoyage données orphelines
├── diagnostic-db.js          # Diagnostic base de données
├── add-long-term-rdv.js      # Ajout RDV long terme
├── insert-medical-data.js    # Insertion données médicales
├── setup-python-backend.js   # Installation backend Python
├── database/
│   ├── seed-simple.sql       # SQL seed basique
│   ├── seed-dossiers-medicaux.sql
│   └── reset-database.js     # Reset complet
├── backup/
│   ├── backup-script.js      # Script backup manuel
│   ├── check-backup-medical.js
│   └── check-all-backups.js
├── medical/
│   ├── decrypt-all-data.js   # Déchiffrement données
│   ├── check-medical-data.js # Vérification données
│   └── create-medical-data.js
└── utils/
    └── check-db.js           # Vérification DB
```

---

## seed-database.js

Initialise la base avec des données de démonstration.

**Utilisation** :
```bash
npm run seed
# ou
node scripts/seed-database.js
```

**Données créées** :
- Utilisateur admin
- Famille exemple
- 4-5 membres
- Vaccins
- Traitements
- Rendez-vous

---

## fix-dates.js

Corrige les formats de dates incorrects.

**Utilisation** :
```bash
node scripts/fix-dates.js
```

**Actions** :
- Convertit dates invalides
- Normalise format YYYY-MM-DD
- Log des corrections

---

## fix-orphans.js

Nettoie les enregistrements orphelins.

**Utilisation** :
```bash
node scripts/fix-orphans.js
```

**Actions** :
- Supprime vaccins sans membre
- Supprime traitements sans membre
- Supprime RDV sans membre
- Log des suppressions

---

## diagnostic-db.js

Diagnostic complet de la base de données.

**Utilisation** :
```bash
node scripts/diagnostic-db.js
```

**Vérifications** :
- Intégrité des tables
- Références étrangères
- Doublons
- Données incohérentes

---

## database/reset-database.js

Reset complet de la base de données.

**Utilisation** :
```bash
node scripts/database/reset-database.js
```

**ATTENTION** : Supprime toutes les données!

**Actions** :
1. Supprime le fichier DB
2. Recrée les tables
3. Optionnel: seed données

---

## setup-python-backend.js

Configure l'environnement Python.

**Utilisation** :
```bash
node scripts/setup-python-backend.js
```

**Actions** :
1. Vérifie Python installé
2. Crée venv
3. Installe requirements.txt
4. Test du service

---

## backup/backup-script.js

Crée un backup manuel depuis la ligne de commande.

**Utilisation** :
```bash
node scripts/backup/backup-script.js
```

---

## medical/decrypt-all-data.js

Déchiffre les données sensibles pour export.

**Utilisation** :
```bash
node scripts/medical/decrypt-all-data.js
```

**ATTENTION** : À utiliser avec précaution!

---

## Scripts NPM

Commandes disponibles dans `package.json` :

```json
{
  "scripts": {
    "start": "concurrently \"vite\" \"npm run electron:dev\"",
    "build": "vite build && npm run build:electron",
    "build:full": "npm run build && npm run build:python",
    "build:electron": "tsc -p tsconfig.electron.json",
    "dev": "npm start",
    "clean": "rimraf dist",
    "seed": "node scripts/seed-database.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "docs": "typedoc --out docs/api src",
    "docs:serve": "npx serve docs/api"
  }
}
```

---

## Création d'un Nouveau Script

Template pour un nouveau script :

```javascript
/**
 * Description du script
 *
 * Usage: node scripts/mon-script.js
 */

const path = require('path');
const fs = require('fs');

// Chemin vers la DB
const userDataPath = process.env.APPDATA ||
  (process.platform === 'darwin'
    ? path.join(process.env.HOME, 'Library/Application Support')
    : path.join(process.env.HOME, '.config'));
const dbPath = path.join(userDataPath, 'carelink', 'carelink.db');

async function main() {
  console.log('='.repeat(50));
  console.log('Mon Script');
  console.log('='.repeat(50));

  // Vérifier que la DB existe
  if (!fs.existsSync(dbPath)) {
    console.error('Base de données non trouvée:', dbPath);
    process.exit(1);
  }

  // Charger sql.js
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  try {
    // Votre logique ici
    const result = db.exec('SELECT COUNT(*) FROM membres');
    console.log('Membres:', result[0].values[0][0]);

    // Sauvegarder si modifications
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    console.log('Base sauvegardée');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    db.close();
  }

  console.log('='.repeat(50));
  console.log('Terminé!');
}

main().catch(console.error);
```

---

## Build Scripts (Windows)

### INSTALLATION_RAPIDE.bat

Installation rapide pour nouveaux utilisateurs.

```batch
@echo off
echo Installation de CareLink...
npm install
echo Installation terminée!
pause
```

### DEMARRER.bat

Lance l'application.

```batch
@echo off
npm start
```
