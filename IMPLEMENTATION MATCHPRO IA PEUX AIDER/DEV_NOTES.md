# 📝 Notes de Développement - MatchPro IA

**Version:** 1.0.0
**Dernière mise à jour:** 19 Novembre 2025
**Auteur:** VIEY DAVID

> Ce fichier contient les notes techniques de développement, problèmes résolus, et conseils pour continuer le projet.
> Pour une vue d'ensemble complète, voir **README.md**
> Pour réutiliser les modules, voir **IMPLEMENTATION_GUIDE.md**

---

## 📍 État Actuel du Projet

### ✅ Fonctionnalités complètes et opérationnelles

#### 🎯 Système de Matching
- **Algorithme de matching bi-directionnel** :
  - Mode 1 : Offre → Candidats (trouver les meilleurs candidats pour une offre)
  - Mode 2 : Candidat → Offres (trouver les meilleures offres pour un candidat)
- **Algorithme de scoring amélioré** (fallback si service Python indisponible) :
  - 35% Score de compétences (matching flexible : exact, partiel, mots-clés)
  - 25% Score d'expérience (avec pénalités légères)
  - 40% Score sémantique (matching titre de poste, mots-clés description)
  - Résultats : scores entre 80-95% pour les bons matchs
- **Filtrage et tri avancés** :
  - Filtrer par score minimum (50%, 70%, 85%, 90%)
  - Trier par : Score Total, Score Sémantique, Score Règles
  - Affichage du nombre de résultats filtrés vs total
- **Export CSV** :
  - Export des résultats de matching (candidats ou offres)
  - Données exportées : nom, email/poste, scores détaillés
  - Nom de fichier avec timestamp

#### 📊 Base de données réaliste
**21 entreprises** organisées par secteur :
- **5 Agences d'intérim** : Manpower, Adecco, Randstad, Synergie, Start People
  - Proposent plusieurs types de postes variés (cariste, agent sécurité, préparateur)
- **5 Entreprises BTP** : Bouygues, Eiffage, Vinci, Artisan Bâtisseur Pro, Maisons Durables
  - Postes cohérents : Maçon, Charpentier, Couvreur, Chef de chantier
- **4 Entreprises Logistique** : DHL, Geodis, XPO, FM Logistic
  - Responsable entrepôt, Chauffeur poids lourd
- **4 Entreprises Tech** : Capgemini, Sopra Steria, Atos, Accenture
  - Développeur Full Stack, DevOps Engineer
- **3 Entreprises Sécurité** : Securitas, Ares, Protectas
  - Agent sécurité incendie SSIAP

**54 offres d'emploi** avec :
- Compétences spécifiques réalistes (CACES, SSIAP, permis CE, etc.)
- Descriptions détaillées par métier
- Salaires cohérents par secteur
- Mix CDI/Intérim selon le type d'entreprise

**204 candidats** :
- 3 à 5 candidats par offre
- 70-100% de matching sur les compétences
- Expériences professionnelles cohérentes
- Diplômes adaptés au métier
- 100 CV PDF générés

#### 💼 Gestion des entités

**Candidats** :
- Liste avec recherche et pagination
- Création avec formulaire complet
- Upload/download de CV (PDF)
- Détail complet avec expériences, formations, compétences
- Suppression avec confirmation
- Navigation vers matching

**Offres d'emploi** :
- Liste avec filtres
- Création avec toutes les infos (compétences, salaire, localisation)
- Détail avec candidats matchés
- Suppression avec confirmation
- Lancement du matching

**Entreprises** :
- Liste avec recherche
- Création avec adresse complète
- Détail avec toutes les offres associées
- Suppression avec confirmation
- Statistiques (nombre d'offres, contacts)

#### ⚙️ Configuration
- **Gestion des clés API** pour LLM :
  - OpenAI, Anthropic (Claude), Google Gemini, Mistral AI
  - **Ollama (local)** : configuration sans clé API, juste URL (localhost:11434)
  - Validation de format des clés
  - Encryption des clés stockées
  - Activation/désactivation des clés

#### 🎨 Interface utilisateur
- Dashboard avec statistiques et graphiques
- Navigation fluide avec React Router
- Design moderne avec Tailwind CSS
- Composants réutilisables (Card, Icons)
- Cartes cliquables pour navigation
- Affichage des scores avec code couleur
- Hot Module Replacement (HMR) actif

---

## 📁 Structure du projet

```
MATCHPRO IA DEV/
├── api/                          # Backend tRPC + Prisma
│   ├── data/
│   │   └── dev.db               # Base SQLite
│   ├── scripts/
│   │   ├── create-realistic-data.ts  # ⭐ Script données réalistes
│   │   ├── add-matching-candidates.ts
│   │   ├── generate-cvs.ts
│   │   └── seed-data.ts
│   ├── src/
│   │   ├── routers/
│   │   │   ├── candidats.ts
│   │   │   ├── offres.ts
│   │   │   ├── entreprises.ts
│   │   │   ├── matching.ts      # ⭐ Algorithme matching amélioré
│   │   │   ├── settings.ts      # ⭐ Avec support Ollama
│   │   │   └── stats.ts
│   │   ├── services/
│   │   │   ├── cv-generator.ts  # Génération PDF CVs
│   │   │   ├── python-client.ts
│   │   │   └── encryption.ts
│   │   └── trpc.ts
│   └── prisma/
│       └── schema.prisma
│
├── apps/desktop/                # Frontend Electron + React
│   ├── src/
│   │   ├── routes/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Candidats.tsx    # ⭐ Avec delete
│   │   │   ├── CandidatDetail.tsx
│   │   │   ├── Offres.tsx       # ⭐ Avec delete
│   │   │   ├── OffreDetail.tsx
│   │   │   ├── Entreprises.tsx  # ⭐ Avec delete
│   │   │   ├── EntrepriseDetail.tsx  # ⭐ Fix crash salaire
│   │   │   ├── Matching.tsx     # ⭐ Filtres, tri, export CSV
│   │   │   └── Settings.tsx     # ⭐ Support Ollama
│   │   ├── components/
│   │   │   ├── Card.tsx
│   │   │   └── Icons.tsx
│   │   └── App.tsx
│   └── electron/
│       └── main.ts
│
└── DEV_NOTES.md                 # Ce fichier
```

---

## 🔧 Scripts disponibles

### Données
```bash
# Créer des données réalistes (⭐ RECOMMANDÉ)
cd api
set DATABASE_URL=file:./data/dev.db
npx tsx scripts/create-realistic-data.ts

# Générer les CV PDF
npx tsx scripts/generate-cvs.ts

# Données de test basiques (ancien)
npx tsx scripts/seed-data.ts
```

### Développement
```bash
# Terminal 1 : Backend API
cd api
npm run dev
# → http://localhost:3002

# Terminal 2 : Frontend Desktop
cd apps/desktop
npm run dev
# → http://localhost:5173 (puis Electron)
```

---

## 🐛 Problèmes résolus

### 1. ✅ Service de matching 500 Internal Server Error
- **Cause** : Service Python sur port 8002 non disponible
- **Solution** : Algorithme de fallback `simpleRuleBasedMatching()` dans `api/src/routers/matching.ts`
- **Résultat** : Matching fonctionnel sans dépendance Python

### 2. ✅ Scores de matching trop bas (max 70%)
- **Cause** : Algorithme trop strict, pénalités sévères
- **Solution** :
  - Nouvelles pondérations : 35% compétences, 25% expérience, 40% sémantique
  - Matching flexible des compétences (exact, partiel, mots-clés)
  - Matching sur titre de poste (20 points si match exact)
  - Valeurs par défaut (3 ans d'expérience si non spécifié)
- **Résultat** : Scores 80-95% pour bons matchs

### 3. ✅ EntrepriseDetail crash ligne 119
- **Cause** : `offre.salaire` était une string JSON, pas un objet
- **Solution** : Parsing conditionnel `typeof offre.salaire === 'string' ? JSON.parse() : offre.salaire`
- **Fichier** : `apps/desktop/src/routes/EntrepriseDetail.tsx`

### 4. ✅ Candidats ne montrent pas leur métier
- **Cause** : Affichage de l'email au lieu du poste
- **Solution** : Afficher `candidat.experiences[0].poste` dans Matching.tsx
- **Résultat** : Meilleure lisibilité des résultats

### 5. ✅ Profils non cliquables dans matching
- **Cause** : Pas de onClick ni navigation
- **Solution** : Ajout `onClick={() => navigate(\`/candidats/${id}\`)}` + cursor-pointer
- **Résultat** : Navigation fluide vers détails

### 6. ✅ Données incohérentes
- **Cause** : Entreprises tech avec postes BTP
- **Solution** : Script `create-realistic-data.ts` avec données sectorielles cohérentes
- **Résultat** : Agences intérim multi-postes, entreprises BTP avec charpentiers/maçons, etc.

---

## 🚀 Prochaines étapes suggérées

### ✅ Récemment terminé (19 nov 2025)
1. **✅ Service Python ML matching**
   - Port 8002 ✅ OPÉRATIONNEL
   - Endpoints : `/match` avec Sentence-BERT
   - Scoring avancé : 40% sémantique + 40% règles + 20% ML
   - Cache embeddings pour performances x10
   - Insights détaillés (points forts/faibles/risques/opportunités)
   - Fichier : `services/ia-matching/main.py` (v2.0.0)

2. **✅ Dashboard amélioré avec analytics**
   - Router stats.ts avec 7 endpoints analytiques
   - Timeline 30 jours (graphiques barres)
   - Distribution scores matching
   - Top 10 compétences demandées
   - Statistiques par secteur
   - Activité récente temps réel
   - Fichiers : `api/src/routers/stats.ts`, `apps/desktop/src/routes/Dashboard.tsx`

3. **✅ Filtres de recherche avancés**
   - Composants OffresFilters et CandidatsFilters
   - Recherche multi-critères (texte, secteur, ville, salaire, compétences, expérience)
   - Design moderne avec sliders et dropdowns
   - Badge compteur filtres actifs
   - Fichiers : `apps/desktop/src/components/{Offres,Candidats}Filters.tsx`

4. **✅ Optimisations de performance**
   - QueryOptimizer service : cache intelligent, batch loading
   - Cache middleware tRPC : auto-caching queries
   - Performance monitoring : logs queries lentes
   - Invalidation automatique cache après mutations
   - Fichiers : `api/src/services/query-optimizer.ts`, `api/src/middleware/cache-middleware.ts`

**📄 Voir le fichier `DEVELOPPEMENTS_REALISES.md` pour les détails complets**

### Priorité haute

2. **Amélioration des filtres de recherche**
   - Recherche par compétences dans liste offres
   - Filtres par secteur/ville dans entreprises
   - Recherche multi-critères candidats

3. **Statistiques avancées**
   - Graphiques d'évolution des matchings
   - Taux de réussite par secteur
   - Analyse des compétences les plus demandées

### Priorité moyenne
4. **Gestion des candidatures**
   - Statut de candidature (En cours, Accepté, Refusé)
   - Historique des candidatures
   - Workflow de recrutement

5. **Notifications**
   - Alertes nouveaux matchings
   - Rappels entretiens
   - Notifications desktop

6. **Import/Export de données**
   - Import CSV candidats
   - Export Excel rapports
   - Synchronisation calendrier

### Améliorations UX
7. **Responsive design** pour version web
8. **Mode sombre** (dark mode)
9. **Internationalisation** (i18n)
10. **Accessibilité** (ARIA labels)

---

## 📝 Notes techniques importantes

### Base de données
- **SQLite** : `api/data/dev.db`
- **ORM** : Prisma
- **Migrations** : `npx prisma db push` après changement schema

### Champs JSON dans Prisma
Plusieurs champs sont stockés en JSON string :
- `competences`, `experiences`, `formations` (Candidat)
- `localisation`, `salaire`, `competences` (OffreEmploi)
- `adresse` (Entreprise, Candidat)

**⚠️ Important** : Toujours parser avec `JSON.parse()` et vérifier le type :
```typescript
const salaire = typeof offre.salaire === 'string'
  ? JSON.parse(offre.salaire)
  : offre.salaire;
```

### Architecture tRPC
- Tous les endpoints dans `api/src/routers/`
- Client auto-typé dans `apps/desktop/`
- Hooks React Query : `trpc.*.useQuery()`, `trpc.*.useMutation()`

### CV PDF
- Générateur : `api/src/services/cv-generator.ts`
- Stockage : `api/data/cvs/`
- Limite actuelle : 100 CVs par exécution (modifiable ligne 7)

### Matching
- Fichier principal : `api/src/routers/matching.ts`
- Fonction : `simpleRuleBasedMatching()` (lignes 6-106)
- Sauvegarde en DB : table `Matching` avec scores détaillés

---

## 🔑 Variables d'environnement

`.env` dans `api/` :
```env
DATABASE_URL="file:./data/dev.db"
ENCRYPTION_KEY="votre_clé_de_chiffrement_32_caractères_minimum"
```

---

## 🎯 État des serveurs

### Backend (API)
- **Port** : 3002
- **URL** : http://localhost:3002
- **Status** : ✅ Running
- **Commande** : `cd api && npm run dev`

### Frontend (Desktop)
- **Port** : 5173
- **URL** : http://localhost:5173
- **Status** : ✅ Running avec HMR
- **Commande** : `cd apps/desktop && npm run dev`

### Service Python ML (optionnel)
- **Port** : 8002
- **Status** : ❌ Non implémenté (fallback actif)
- **Impact** : Aucun - le matching fonctionne avec l'algorithme de règles

---

## 📊 Statistiques actuelles

- **Entreprises** : 21
- **Offres d'emploi** : 54
- **Candidats** : 204
- **CV générés** : 100
- **Matchings** : 0 (à lancer dans l'interface)

---

## 💡 Conseils pour continuer

1. **Lancer les serveurs** :
   ```bash
   # Terminal 1
   cd api && npm run dev

   # Terminal 2
   cd apps/desktop && npm run dev
   ```

2. **Tester le matching** :
   - Aller dans "Matching"
   - Sélectionner une offre ou un candidat
   - Cliquer "Lancer le matching"
   - Utiliser les filtres et l'export CSV

3. **Créer de nouvelles données** :
   ```bash
   cd api
   set DATABASE_URL=file:./data/dev.db
   npx tsx scripts/create-realistic-data.ts
   npx tsx scripts/generate-cvs.ts
   ```

4. **Vérifier la base de données** :
   ```bash
   cd api
   npx prisma studio
   # → Interface web sur http://localhost:5555
   ```

---

## 🐞 Debug

### Logs backend
- Console du terminal `api`
- Erreurs tRPC visibles côté client

### Logs frontend
- DevTools Electron (Ctrl+Shift+I)
- Console navigateur (F12)
- Tab Network pour les requêtes tRPC

### Prisma
```bash
cd api
npx prisma studio  # Interface graphique DB
npx prisma format  # Formater schema
npx prisma db push # Appliquer changements schema
```

---

**Bon développement ! 🚀**
