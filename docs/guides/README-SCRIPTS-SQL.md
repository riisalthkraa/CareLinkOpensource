# Scripts SQL - Documentation

Ce dossier contient des scripts SQL pour gérer les données de démonstration et la distribution de l'application CareLink.

## 📁 Fichiers disponibles

### 1. `seed-dossiers-medicaux.sql`
**Script de données de démonstration complètes**

#### 🎯 Objectif
Créer des dossiers médicaux cohérents et exploitables pour tous les membres de démonstration, expliquant POURQUOI chaque membre prend ses traitements.

#### 📊 Contenu
Le script crée des données pour 4 membres:

1. **Jean Dupont (53 ans)**
   - Diagnostics: Hypertension artérielle, Diabète type 2
   - Traitements: Amlodipine 5mg, Metformine 850mg
   - 3 antécédents, 2 diagnostics, 3 bilans, 2 consultations spécialisées

2. **Marie Dupont (50 ans)**
   - Diagnostics: Hypothyroïdie (Hashimoto), Hypercholestérolémie
   - Traitements: Levothyrox 75µg
   - 3 antécédents, 2 diagnostics, 3 bilans, 1 consultation

3. **Emma Dupont (6 ans)**
   - Diagnostic: Allergie grave aux arachides → **Explique pourquoi elle prend de l'épinéphrine**
   - Traitements: EpiPen Jr (épinéphrine auto-injectable)
   - 2 antécédents, 1 diagnostic, 2 bilans, 2 consultations

4. **Lucas Dupont (10 ans)**
   - Diagnostics: Asthme allergique persistant modéré
   - Traitements: Symbicort, Ventoline
   - 3 antécédents, 2 diagnostics, 3 bilans, 2 consultations

#### ⚙️ Utilisation

**Option A: Via l'application (recommandé)**
```sql
-- Ouvrir l'application Electron
-- Dans le DevTools Console:
await window.electronAPI.dbRun(`
  [Copier-coller le contenu du fichier seed-dossiers-medicaux.sql]
`)
```

**Option B: Via ligne de commande SQLite**
```bash
cd electron
sqlite3 carelink.db < seed-dossiers-medicaux.sql
```

**Option C: Programmatiquement dans main.ts**
```typescript
// Ajouter dans electron/main.ts après l'initialisation de la base
import * as fs from 'fs'
import * as path from 'path'

function seedDemoData() {
  const sqlScript = fs.readFileSync(
    path.join(__dirname, 'seed-dossiers-medicaux.sql'),
    'utf8'
  )
  db.exec(sqlScript)
  console.log('✅ Données médicales de démonstration chargées')
}

// Appeler après initDatabase()
seedDemoData()
```

---

### 2. `reset-database-clean.sql`
**Script de réinitialisation pour distribution**

#### 🎯 Objectif
Préparer une base de données vide pour la distribution de l'application aux utilisateurs finaux.

#### 🧹 Actions effectuées
- ✅ Supprime toutes les données de démonstration
- ✅ Vide toutes les tables médicales
- ✅ Conserve l'utilisateur admin (id=1)
- ✅ Réinitialise les compteurs d'auto-incrémentation
- ✅ Inclut des requêtes de vérification

#### ⚙️ Utilisation

**⚠️ ATTENTION: Ce script supprime TOUTES les données !**

**Option A: Avant de créer l'installeur**
```bash
cd electron
sqlite3 carelink.db < reset-database-clean.sql
```

**Option B: Dans le script de build**
Ajouter dans `package.json`:
```json
{
  "scripts": {
    "clean-db": "sqlite3 electron/carelink.db < electron/reset-database-clean.sql",
    "build:dist": "npm run clean-db && electron-builder"
  }
}
```

**Option C: Manuellement avec flag**
Ajouter un flag dans `main.ts`:
```typescript
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

if (IS_PRODUCTION_BUILD) {
  // Charger et exécuter reset-database-clean.sql
  const resetScript = fs.readFileSync(
    path.join(__dirname, 'reset-database-clean.sql'),
    'utf8'
  )
  db.exec(resetScript)
  console.log('✅ Base de données réinitialisée pour production')
}
```

---

## 🔄 Workflow recommandé

### Mode Développement / Démonstration
1. Développer l'application normalement
2. Exécuter `seed-dossiers-medicaux.sql` pour avoir des données exploitables
3. Tester toutes les fonctionnalités avec ces données cohérentes
4. Montrer l'application avec des cas d'usage réels

### Mode Distribution
1. S'assurer que tous les tests passent
2. Exécuter `reset-database-clean.sql` pour vider la base
3. Vérifier que la base est vide (requêtes SELECT à la fin du script)
4. Builder l'application avec `npm run build`
5. Créer l'installeur avec Electron Builder
6. Distribuer l'application avec une base vide

---

## 📋 Checklist avant distribution

- [ ] Toutes les fonctionnalités testées avec données de démo
- [ ] Script `seed-dossiers-medicaux.sql` testé et fonctionnel
- [ ] Script `reset-database-clean.sql` exécuté
- [ ] Base de données vérifiée vide (sauf user admin)
- [ ] Application testée avec base vide (création de nouveau compte)
- [ ] Build production créé
- [ ] Installeur testé sur machine propre

---

## 🛠️ Maintenance

### Ajouter de nouveaux membres de démo
Éditer `seed-dossiers-medicaux.sql` et ajouter:
1. Antécédents médicaux
2. Diagnostics actifs
3. Bilans médicaux
4. Consultations spécialisées

### Modifier les données existantes
1. Éditer le script SQL
2. Supprimer l'ancienne base: `rm electron/carelink.db`
3. Relancer l'application (créera une nouvelle base)
4. Exécuter le script mis à jour

---

## ❓ FAQ

**Q: Les données de démo sont-elles chiffrées ?**
R: Certaines données sensibles (notes, descriptions d'allergies) peuvent être chiffrées. L'application déchiffre automatiquement à l'affichage.

**Q: Peut-on garder un utilisateur de démo en production ?**
R: Oui, mais modifier le script `reset-database-clean.sql` pour ne pas supprimer cet utilisateur.

**Q: Comment ajouter des données de test automatiquement au démarrage ?**
R: Ajouter un flag `--seed-demo` au lancement et exécuter le script SQL si le flag est présent.

**Q: Les scripts sont-ils compatibles avec toutes les versions de SQLite ?**
R: Oui, ces scripts utilisent uniquement des fonctionnalités SQLite standard (version 3.x).

---

## 📞 Support

Pour toute question sur ces scripts, contacter:
- **Auteur**: VIEY David
- **Version**: 2.0.0
- **Date**: 2024
