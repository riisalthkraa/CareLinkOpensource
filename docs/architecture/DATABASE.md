# Base de Données CareLink

## Vue d'Ensemble

CareLink utilise SQLite via sql.js pour le stockage local des données.

**Emplacement** : `%APPDATA%/carelink/carelink.db`

## Schéma des Tables

### users
Comptes utilisateurs de l'application.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,          -- Hash bcrypt
  is_setup_complete INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### famille
Représente un foyer familial.

```sql
CREATE TABLE famille (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### membres
Membres de la famille avec informations médicales.

```sql
CREATE TABLE membres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  famille_id INTEGER,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  sexe TEXT,                        -- 'M' ou 'F'
  groupe_sanguin TEXT,              -- 'A', 'B', 'AB', 'O'
  rhesus TEXT,                      -- '+' ou '-'
  poids REAL,                       -- en kg
  taille INTEGER,                   -- en cm
  photo TEXT,                       -- base64 ou chemin
  telephone TEXT,
  email TEXT,
  numero_securite_sociale TEXT,
  medecin_traitant TEXT,
  telephone_medecin TEXT,
  contact_urgence_nom TEXT,
  contact_urgence_telephone TEXT,
  contact_urgence_relation TEXT,
  notes TEXT,                       -- Chiffré AES-256
  FOREIGN KEY (famille_id) REFERENCES famille(id)
);
```

### vaccins
Suivi des vaccinations.

```sql
CREATE TABLE vaccins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_vaccin TEXT NOT NULL,
  date_administration DATE,
  date_rappel DATE,
  statut TEXT DEFAULT 'à_faire',   -- 'à_faire', 'fait', 'rappel', 'expiré'
  lot TEXT,                         -- Numéro de lot
  medecin TEXT,
  notes TEXT,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

### traitements
Médicaments et traitements en cours.

```sql
CREATE TABLE traitements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  nom_medicament TEXT NOT NULL,
  dosage TEXT,                      -- Ex: "500mg"
  frequence TEXT,                   -- Ex: "2x par jour"
  date_debut DATE,
  date_fin DATE,
  actif INTEGER DEFAULT 1,          -- 1=actif, 0=terminé
  type TEXT,                        -- 'quotidien', 'ponctuel', 'si_besoin'
  stock_restant INTEGER,
  medecin_prescripteur TEXT,
  renouvellement_ordonnance DATE,
  effets_secondaires TEXT,
  notes TEXT,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

### rendez_vous
Calendrier des consultations.

```sql
CREATE TABLE rendez_vous (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  date_rdv DATE,
  heure TEXT,                       -- Format HH:MM
  medecin TEXT,
  specialite TEXT,                  -- Ex: 'Cardiologue'
  lieu TEXT,
  telephone_cabinet TEXT,
  motif TEXT,
  statut TEXT DEFAULT 'à_venir',   -- 'à_venir', 'effectué', 'annulé'
  rappel INTEGER,                   -- Jours avant rappel
  duree INTEGER,                    -- Minutes
  notes TEXT,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

### allergies
Allergies connues.

```sql
CREATE TABLE allergies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type_allergie TEXT,               -- 'médicament', 'alimentaire', 'autre'
  nom_allergie TEXT NOT NULL,
  severite TEXT,                    -- 'légère', 'modérée', 'grave'
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

### antecedents_medicaux
Historique médical (maladies, opérations, hospitalisations).

```sql
CREATE TABLE antecedents_medicaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER NOT NULL,
  type_antecedent TEXT NOT NULL,    -- 'maladie', 'operation', 'hospitalisation', etc.
  titre TEXT NOT NULL,
  description TEXT,
  date_debut DATE,
  date_fin DATE,
  actif INTEGER DEFAULT 0,          -- 1 si chronique
  severite TEXT,                    -- 'légère', 'modérée', 'grave'
  medecin TEXT,
  hopital TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);
```

### diagnostics
Pathologies actives diagnostiquées.

```sql
CREATE TABLE diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER NOT NULL,
  pathologie TEXT NOT NULL,
  code_cim10 TEXT,                  -- Code CIM-10 (ex: E11)
  date_diagnostic DATE NOT NULL,
  medecin_diagnostic TEXT,
  specialite TEXT,
  severite TEXT,
  statut TEXT DEFAULT 'actif',     -- 'actif', 'en_remission', 'guéri'
  traitement_lie INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);
```

### bilans_medicaux
Résultats d'examens et analyses.

```sql
CREATE TABLE bilans_medicaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER NOT NULL,
  type_bilan TEXT NOT NULL,         -- 'analyse_sang', 'imagerie', 'electro', etc.
  nom_examen TEXT NOT NULL,
  date_examen DATE NOT NULL,
  medecin_prescripteur TEXT,
  laboratoire TEXT,
  resultat_global TEXT,             -- 'normal', 'anormal', 'pathologique'
  valeurs_principales TEXT,         -- JSON des valeurs clés
  interpretation TEXT,
  fichier_resultat TEXT,            -- Chemin vers PDF/image
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);
```

### consultations_specialisees
Comptes-rendus de consultations spécialisées.

```sql
CREATE TABLE consultations_specialisees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER NOT NULL,
  date_consultation DATE NOT NULL,
  specialite TEXT NOT NULL,
  medecin_nom TEXT NOT NULL,
  hopital_cabinet TEXT,
  motif_consultation TEXT NOT NULL,
  diagnostic_pose TEXT,
  examens_prescrits TEXT,
  traitements_prescrits TEXT,
  suivi_recommande TEXT,
  prochain_rdv DATE,
  compte_rendu TEXT,
  fichier_cr TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);
```

### documents
Documents numérisés (ordonnances, etc.).

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  type_document TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  chemin_fichier TEXT NOT NULL,
  date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_document DATE,
  donnees_extraites TEXT,           -- JSON des données OCR
  notes TEXT,
  FOREIGN KEY (membre_id) REFERENCES membres(id)
);
```

## Diagramme des Relations

```
users (1) ──────< famille (1) ──────< membres (1) ──────< vaccins
                                          │
                                          ├──────< traitements
                                          │
                                          ├──────< rendez_vous
                                          │
                                          ├──────< allergies
                                          │
                                          ├──────< antecedents_medicaux
                                          │
                                          ├──────< diagnostics
                                          │
                                          ├──────< bilans_medicaux
                                          │
                                          ├──────< consultations_specialisees
                                          │
                                          └──────< documents
```

## Requêtes Courantes

### Récupérer tous les membres d'une famille

```sql
SELECT * FROM membres WHERE famille_id = ?
```

### Traitements actifs d'un membre

```sql
SELECT * FROM traitements
WHERE membre_id = ? AND actif = 1
ORDER BY date_debut DESC
```

### Prochains rendez-vous

```sql
SELECT r.*, m.prenom, m.nom
FROM rendez_vous r
JOIN membres m ON r.membre_id = m.id
WHERE r.date_rdv >= date('now') AND r.statut = 'à_venir'
ORDER BY r.date_rdv ASC
```

### Vaccins à faire ou expirés

```sql
SELECT * FROM vaccins
WHERE membre_id = ? AND statut IN ('à_faire', 'expiré')
```

## Sauvegarde et Restauration

La base de données est sauvegardée automatiquement :
- Toutes les 30 secondes (en mémoire → disque)
- Toutes les 24 heures (backup automatique)
- À la fermeture de l'application

Les backups sont stockés dans : `%APPDATA%/carelink/backups/`
