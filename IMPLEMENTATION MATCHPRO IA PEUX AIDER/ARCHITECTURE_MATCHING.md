# Architecture du Système de Matching MatchPro IA

## 🎯 Cas d'Usage

### 1. France Travail (Pôle Emploi)
- **Base**: Tous les demandeurs d'emploi inscrits
- **Matching**: Tous les candidats VS toutes les offres disponibles
- **Objectif**: Maximiser les placements, taux de retour à l'emploi

### 2. Agences d'Intérim
- **Base**: Vivier de candidats (leur base de données)
- **Matching**: Leurs candidats VS demandes spécifiques de clients
- **Objectif**: Proposer rapidement les meilleurs profils

### 3. Entreprises Directes
- **Base**: CV reçus pour leurs offres
- **Matching**: Candidatures reçues VS leurs offres publiées
- **Objectif**: Identifier les meilleurs candidats pour leurs postes

### 4. Candidats Individuels
- **Base**: Leur profil personnel
- **Matching**: Leur profil VS toutes les offres disponibles
- **Objectif**: Trouver les opportunités les plus adaptées

## 📁 Flux de Données

### Upload de CV
1. Candidat uploade son CV (PDF)
2. Parsing automatique du CV (IA Parser)
3. Extraction des informations (nom, compétences, expérience, etc.)
4. Stockage du fichier + données structurées
5. Proposition de compléter/corriger les données

### Réception de Candidatures
1. Entreprise publie une offre
2. Candidats postulent avec leur CV
3. CV stockés et liés à l'offre
4. Matching automatique au fil de l'eau
5. Liste des candidatures triées par score

### Export/Partage
- Export CV en PDF (téléchargement)
- Export liste de candidats matchés en Excel/PDF
- Export d'offres pour publication externe

## 🔄 Modes de Matching

### Mode 1: Candidat → Offres
```
Input: 1 Candidat
Output: Liste des offres classées par score
```

### Mode 2: Offre → Candidats
```
Input: 1 Offre
Output: Liste des candidats classées par score
```

### Mode 3: Batch Complet
```
Input: Tous les candidats + Toutes les offres
Output: Matrice de matching complète
```

### Mode 4: Entreprise Spécifique
```
Input: Offres d'une entreprise + CV reçus
Output: Matching par offre
```

## 💾 Structure de Données

### Candidat
- Informations personnelles
- CV (fichier PDF)
- Compétences extraites
- Expériences
- Préférences (type contrat, localisation, salaire)
- Statut (actif, placé, inactif)

### Offre
- Informations entreprise
- Description du poste
- Compétences requises
- Conditions (salaire, type contrat)
- Statut (active, pourvue, fermée)

### Candidature
- Lien Candidat ↔ Offre
- CV uploadé spécifiquement pour cette offre
- Date de candidature
- Statut (nouveau, vu, présélectionné, refusé, accepté)
- Score de matching

### Matching Result
- Candidat
- Offre
- Score global
- Scores détaillés (sémantique, règles, ML)
- Raisons du match
- Points forts / Points faibles

## 🚀 Implémentation

### Phase 1: Upload & Storage ✅
- Upload de CV (Multer)
- Stockage sécurisé des fichiers
- Parsing basique du PDF

### Phase 2: Parsing Intelligent
- Extraction IA des données du CV
- Auto-complétion du profil candidat
- Validation et correction

### Phase 3: Candidatures
- Système de candidature
- Liste des candidatures par offre
- Statuts et workflow

### Phase 4: Matching Multi-Mode
- Interface de sélection du mode
- Matching adapté selon le cas d'usage
- Visualisation des résultats

### Phase 5: Export & Reporting
- Export CV individuels
- Export listes de résultats
- Statistiques et analytics
