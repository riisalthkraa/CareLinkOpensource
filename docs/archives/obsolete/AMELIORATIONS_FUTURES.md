# 🚀 AMÉLIORATIONS FUTURES - CareLink

> Document de planification des 11 fonctionnalités à implémenter après les 3 priorités initiales
> Date: 29 Octobre 2025
> Version: 1.0

---

## 📋 VUE D'ENSEMBLE

Ce document détaille les 11 fonctionnalités identifiées pour améliorer CareLink après l'implémentation des 3 priorités principales:
1. ✅ Intelligence Interactions Médicamenteuses (EN COURS)
2. ✅ Scanner OCR Ordonnances (EN COURS)
3. ✅ Carte d'Urgence QR Code (EN COURS)

---

## 🎯 NIVEAU 1 - IMPACT MAJEUR

### 1. Calendrier Intelligent avec Prédictions 🔥
**ROI**: ⭐⭐⭐⭐⭐ | **Effort**: Moyen (3-4 jours)

**Description**: Système d'IA qui apprend les patterns médicaux et anticipe les besoins de santé.

**Fonctionnalités**:
- Prédiction automatique des prochains rappels de vaccins basés sur l'âge
- Suggestions de renouvellement d'ordonnances avant rupture de stock
- Détection de rendez-vous manquants (ex: "Pas de contrôle dentaire depuis 18 mois")
- Recommandations de bilans de santé selon âge/genre (HAS)
- Analyse des patterns de consommation de médicaments

#### 📚 Stack Technique Détaillée

**Technologies à utiliser**:
- `date-fns` (déjà installé) - Manipulation avancée des dates
- `node-cron` (déjà installé) - Planification des analyses automatiques
- Base de données SQLite existante - Stockage des règles et prédictions
- Module AI local (pas de cloud) - Algorithmes de prédiction basés sur règles

**Architecture proposée**:
```
src/
├── modules/
│   └── intelligence/
│       ├── PredictionEngine.ts         # Moteur principal de prédictions
│       ├── VaccinPredictor.ts          # Logique vaccins
│       ├── MedicationPredictor.ts      # Logique médicaments
│       ├── AppointmentPredictor.ts     # Logique rendez-vous
│       ├── HealthCheckRecommender.ts   # Recommandations HAS
│       └── types.ts                    # Types TypeScript
├── database/
│   └── schema/
│       ├── predictions.sql             # Tables prédictions
│       └── health_rules.sql            # Règles médicales HAS
└── components/
    └── CalendarIntelligent.tsx         # Composant React
```

**Nouveaux fichiers à créer**:

1. **src/modules/intelligence/PredictionEngine.ts**
```typescript
export interface Prediction {
  id: string;
  type: 'vaccine' | 'medication' | 'appointment' | 'checkup';
  membre_id: number;
  title: string;
  description: string;
  predicted_date: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable: boolean;
  metadata: Record<string, any>;
}

export class PredictionEngine {
  private db: Database;
  private predictors: Predictor[];

  async generatePredictions(membre_id?: number): Promise<Prediction[]>
  async analyzePatterns(membre_id: number): Promise<HealthPattern>
  async updateRules(): Promise<void>
}
```

2. **src/database/schema/predictions.sql**
```sql
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'vaccine', 'medication', 'appointment', 'checkup'
  title TEXT NOT NULL,
  description TEXT,
  predicted_date TEXT NOT NULL,
  confidence INTEGER DEFAULT 50, -- 0-100
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'completed'
  metadata TEXT, -- JSON with additional data
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_type TEXT NOT NULL, -- 'vaccine', 'checkup', 'screening'
  age_min INTEGER,
  age_max INTEGER,
  gender TEXT, -- 'M', 'F', 'all'
  frequency_months INTEGER, -- Fréquence recommandée
  title TEXT NOT NULL,
  description TEXT,
  source TEXT, -- 'HAS', 'WHO', 'INPES'
  active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1
);

CREATE INDEX idx_predictions_membre ON predictions(membre_id);
CREATE INDEX idx_predictions_date ON predictions(predicted_date);
CREATE INDEX idx_health_rules_age ON health_rules(age_min, age_max);
```

3. **src/modules/intelligence/VaccinPredictor.ts**
```typescript
import { differenceInMonths, addMonths } from 'date-fns';

export class VaccinPredictor implements Predictor {
  async predict(membre: Membre): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const age = this.calculateAge(membre.date_naissance);
    const existingVaccins = await this.getVaccins(membre.id);

    // Règles vaccins obligatoires français
    const rules = await this.getVaccinRules(age, membre.sexe);

    for (const rule of rules) {
      const hasVaccin = existingVaccins.find(v => v.nom_vaccin === rule.nom);

      if (!hasVaccin) {
        predictions.push({
          type: 'vaccine',
          priority: rule.obligatoire ? 'high' : 'medium',
          title: `Vaccin ${rule.nom} recommandé`,
          description: rule.description,
          confidence: 95
        });
      } else if (hasVaccin.date_rappel && isPast(hasVaccin.date_rappel)) {
        predictions.push({
          type: 'vaccine',
          priority: 'urgent',
          title: `Rappel ${rule.nom} en retard`,
          confidence: 100
        });
      }
    }

    return predictions;
  }
}
```

**Modifications de fichiers existants**:

1. **electron/preload.ts** - Ajouter IPC handlers
```typescript
// Ajouter dans electronAPI:
getPredictions: (membre_id?: number) => ipcRenderer.invoke('predictions:get', membre_id),
acceptPrediction: (id: string) => ipcRenderer.invoke('predictions:accept', id),
dismissPrediction: (id: string) => ipcRenderer.invoke('predictions:dismiss', id),
runPredictionEngine: () => ipcRenderer.invoke('predictions:run'),
```

2. **electron/main.ts** - Ajouter IPC handlers
```typescript
ipcMain.handle('predictions:get', async (event, membre_id) => {
  const engine = new PredictionEngine(db);
  return await engine.generatePredictions(membre_id);
});

ipcMain.handle('predictions:run', async () => {
  const engine = new PredictionEngine(db);
  await engine.updateRules();
  return { success: true };
});
```

#### 🎯 Spécifications Fonctionnelles

**User Stories détaillées**:

1. **US-CAL-001**: En tant que parent, je veux être alerté automatiquement 2 mois avant la date de rappel d'un vaccin pour mon enfant
   - Critères d'acceptance:
     - Notification système native 60 jours avant
     - Badge sur l'interface avec nombre d'alertes
     - Possibilité de reporter de 7/15/30 jours
     - Intégration dans le module Vaccins

2. **US-CAL-002**: En tant qu'utilisateur, je veux voir les bilans de santé recommandés selon mon âge
   - Critères d'acceptance:
     - Affichage des recommandations HAS (Haute Autorité de Santé)
     - Calcul automatique selon âge/genre
     - Liens vers informations officielles
     - Marquage "fait" avec date

3. **US-CAL-003**: En tant que patient chronique, je veux être prévenu quand mon stock de médicaments sera bientôt épuisé
   - Critères d'acceptance:
     - Calcul basé sur fréquence + stock restant
     - Alerte à J-7, J-3, J-0
     - Suggestion de renouvellement d'ordonnance
     - Historique des renouvellements

**Cas d'usage principaux**:

1. **Prédiction vaccins enfants**:
   ```
   Input: Enfant né le 01/01/2024
   Process:
     - Calcul âge actuel
     - Vérification calendrier vaccinal français
     - Comparaison avec vaccins enregistrés
   Output:
     - DTP à 2 mois (01/03/2024) - À faire
     - ROR à 12 mois (01/01/2025) - Planifié
   ```

2. **Détection rendez-vous manquants**:
   ```
   Input: Membre avec dernier RDV dentiste il y a 24 mois
   Process:
     - Analyse historique rendez-vous
     - Règle: dentiste recommandé tous les 12 mois
     - Calcul retard: 12 mois
   Output:
     - Alerte "Consultation dentaire recommandée (12 mois de retard)"
     - Proposition de prise de RDV
   ```

**Wireframes textuels**:
```
╔════════════════════════════════════════════════════════╗
║  📅 CALENDRIER INTELLIGENT                             ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🔴 URGENT (2)                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 💉 Rappel DTP en retard - Sophie (3 ans)        │ ║
║  │ ⏰ Depuis 15 jours                               │ ║
║  │ [Prendre RDV] [Reporter] [Marquer comme fait]   │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  🟡 À PRÉVOIR (5)                                     ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 💊 Renouvellement ordonnance - Jean             │ ║
║  │ ⏰ Dans 8 jours (stock épuisé le 10/11)          │ ║
║  │ 📊 Confiance: 95%                                │ ║
║  │ [Planifier] [Ignorer]                            │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  🔵 RECOMMANDATIONS SANTÉ (3)                         ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🩺 Bilan sanguin recommandé - Marie (45 ans)    │ ║
║  │ 📋 Recommandation HAS: tous les 5 ans           │ ║
║  │ 🔗 [En savoir plus]                              │ ║
║  │ [Planifier] [Plus tard]                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  [⚙️ Paramètres prédictions] [📊 Historique]         ║
╚════════════════════════════════════════════════════════╝
```

#### 🏗️ Architecture Technique

**Diagramme de flux (format texte)**:
```
[DÉMARRAGE APP]
      |
      v
[Cron Job - Toutes les 6h]
      |
      v
[PredictionEngine.generatePredictions()]
      |
      +---> [VaccinPredictor.predict()]
      |         |
      |         +---> Query DB: vaccins existants
      |         +---> Query: calendrier vaccinal français
      |         +---> Calcul âge membre
      |         +---> Comparaison & génération prédictions
      |
      +---> [MedicationPredictor.predict()]
      |         |
      |         +---> Query DB: traitements actifs
      |         +---> Calcul: (stock_restant / fréquence_quotidienne)
      |         +---> Si < 7 jours: générer alerte
      |
      +---> [AppointmentPredictor.predict()]
      |         |
      |         +---> Query DB: historique RDV par spécialité
      |         +---> Règle: dentiste tous les 12 mois
      |         +---> Règle: ophtalmo tous les 24 mois
      |         +---> Si dépassé: générer recommandation
      |
      +---> [HealthCheckRecommender.predict()]
              |
              +---> Query: âge, sexe, antécédents
              +---> Query: règles HAS (health_rules table)
              +---> Matching & génération recommandations
      |
      v
[INSERT predictions INTO DB]
      |
      v
[Notification système si priority = 'urgent']
      |
      v
[Badge UI mis à jour (nombre prédictions)]
```

**Structure de données**:

Tables SQL ajoutées (voir schema ci-dessus):
- `predictions` - Stockage des prédictions générées
- `health_rules` - Règles médicales officielles (HAS, OMS)

Relations:
```
membres (1) -----> (N) predictions
health_rules (N) -----> (N) membres (via matching age/gender)
```

**API/IPC Handlers nécessaires**:

```typescript
// Côté Renderer (React)
interface PredictionAPI {
  getPredictions(membre_id?: number): Promise<Prediction[]>;
  acceptPrediction(id: string): Promise<void>;
  dismissPrediction(id: string): Promise<void>;
  runPredictionEngine(): Promise<{ success: boolean }>;
  getPredictionStats(): Promise<PredictionStats>;
}

// Côté Main (Electron)
ipcMain.handle('predictions:get', async (event, membre_id) => { ... });
ipcMain.handle('predictions:accept', async (event, id) => { ... });
ipcMain.handle('predictions:dismiss', async (event, id) => { ... });
ipcMain.handle('predictions:run', async () => { ... });
ipcMain.handle('predictions:stats', async () => { ... });
```

**Intégration avec modules existants**:

1. **Module Vaccins** (`src/pages/Vaccins.tsx`):
   - Afficher badge "Prédictions disponibles" (icône cerveau)
   - Bouton "Voir recommandations IA"
   - Auto-remplissage formulaire si prédiction acceptée

2. **Module Traitements** (`src/pages/Traitements.tsx`):
   - Colonne "Stock estimé épuisé dans"
   - Alerte visuelle si < 7 jours
   - Lien vers prédiction détaillée

3. **Module Rendez-vous** (`src/pages/RendezVous.tsx`):
   - Section "RDV suggérés par l'IA"
   - Calendrier avec dates recommandées en surbrillance
   - Création RDV depuis prédiction

4. **Dashboard** (`src/pages/Dashboard.tsx`):
   - Widget "Prédictions intelligentes"
   - Top 3 actions urgentes
   - Score de santé global

#### ⚠️ Défis Techniques

**Points d'attention**:

1. **Performance des calculs**:
   - Prédictions pour toute la famille peuvent être coûteuses
   - Solution: Cache des résultats pendant 6h
   - Calcul asynchrone en background (Cron job)

2. **Précision des prédictions**:
   - Données manquantes (stock médicaments non renseigné)
   - Solution: Confidence score (0-100%) affiché à l'utilisateur
   - Permettre feedback utilisateur pour améliorer règles

3. **Règles médicales à jour**:
   - Calendrier vaccinal français change
   - Solution: Table `health_rules` versionée
   - Script de mise à jour mensuel

**Risques identifiés**:

1. **Faux positifs**:
   - Risque: Alerte pour vaccin déjà fait mais non enregistré
   - Mitigation: Bouton "Marquer comme fait" avec date rétroactive
   - Apprentissage: Si 3x ignoré, baisser priorité

2. **Surcharge d'alertes**:
   - Risque: Trop de notifications découragent l'utilisateur
   - Mitigation: Paramètres de fréquence (quotidien, hebdomadaire)
   - Maximum 3 notifications urgentes par jour

3. **Conformité médicale**:
   - Risque: Recommandations non conformes (responsabilité)
   - Mitigation: Disclaimer clair "Ne remplace pas avis médical"
   - Sources officielles citées (HAS, OMS)

**Solutions proposées**:

1. **Système de feedback**:
```typescript
interface PredictionFeedback {
  prediction_id: string;
  useful: boolean; // true/false
  reason?: string; // "already_done", "not_applicable", "wrong_date"
}
```

2. **Dashboard de configuration**:
```
Paramètres IA:
☑️ Prédictions vaccins
☑️ Alertes médicaments
☐ Recommandations HAS (désactivé par l'utilisateur)
Fréquence notifications: [Quotidien ▼]
```

3. **Version offline des règles**:
- Embarquer données HAS dans SQLite (pas de dépendance réseau)
- Fichier JSON: `src/data/health-rules-2025.json`

#### ✅ Checklist d'Implémentation

**Phase 1: Infrastructure (Jour 1)**
- [ ] Créer schéma SQL (predictions, health_rules)
- [ ] Insérer règles médicales françaises (vaccins, bilans)
- [ ] Créer types TypeScript (Prediction, HealthRule)
- [ ] Setup IPC handlers (preload + main)
- [ ] Tests unitaires schéma DB

**Phase 2: Moteur de prédictions (Jour 2)**
- [ ] Implémenter PredictionEngine.ts
- [ ] Implémenter VaccinPredictor.ts (logique vaccins)
- [ ] Implémenter MedicationPredictor.ts (stock médicaments)
- [ ] Tests unitaires chaque prédictor
- [ ] Intégrer node-cron pour exécution automatique

**Phase 3: Predictors avancés (Jour 3)**
- [ ] Implémenter AppointmentPredictor.ts
- [ ] Implémenter HealthCheckRecommender.ts
- [ ] Algorithme de calcul confidence score
- [ ] Gestion priorités (urgent, high, medium, low)
- [ ] Tests d'intégration

**Phase 4: Interface utilisateur (Jour 4)**
- [ ] Composant CalendarIntelligent.tsx
- [ ] Composant PredictionCard.tsx (affichage prédiction)
- [ ] Intégration dans Dashboard (widget top 3)
- [ ] Badge de notifications (nombre prédictions)
- [ ] Actions: accepter, ignorer, reporter

**Phase 5: Intégrations & Polish (Demi-journée)**
- [ ] Intégrer dans module Vaccins
- [ ] Intégrer dans module Traitements
- [ ] Intégrer dans module Rendez-vous
- [ ] Paramètres utilisateur (activer/désactiver)
- [ ] Tests E2E complets
- [ ] Documentation utilisateur

**Ordre recommandé**:
1. DB Schema → Types → IPC Handlers (fondations)
2. VaccinPredictor (plus simple, règles claires)
3. MedicationPredictor (logique arithmétique)
4. AppointmentPredictor (pattern matching)
5. HealthCheckRecommender (règles HAS)
6. UI Components (parallélisable avec backend)

**Tests à prévoir**:

1. **Tests unitaires**:
```typescript
describe('VaccinPredictor', () => {
  it('should predict DTP vaccine for 2-month-old baby', async () => {
    const membre = { date_naissance: '2024-10-01', id: 1 };
    const predictions = await predictor.predict(membre);
    expect(predictions).toContainEqual(
      expect.objectContaining({
        type: 'vaccine',
        title: expect.stringContaining('DTP')
      })
    );
  });

  it('should NOT predict if vaccine already recorded', async () => {
    // Mock vaccin existant
    const predictions = await predictor.predict(membre);
    expect(predictions).toHaveLength(0);
  });
});
```

2. **Tests d'intégration**:
```typescript
describe('PredictionEngine', () => {
  it('should generate all types of predictions for family', async () => {
    const predictions = await engine.generatePredictions();
    expect(predictions.length).toBeGreaterThan(0);
    const types = [...new Set(predictions.map(p => p.type))];
    expect(types).toContain('vaccine');
    expect(types).toContain('medication');
  });
});
```

3. **Tests E2E**:
- Scénario: Utilisateur accepte prédiction vaccin → Formulaire pré-rempli dans module Vaccins
- Scénario: Stock médicament épuisé → Notification système + Badge UI
- Scénario: RDV dentiste dépassé → Affichage recommandation dans module RDV

---

### 2. Mode Synchronisation Familiale P2P 🔥
**ROI**: ⭐⭐⭐⭐⭐ | **Effort**: Élevé (5-7 jours)

**Description**: Permettre à plusieurs membres de la famille de collaborer sur les données médicales.

**Fonctionnalités**:
- Synchronisation P2P locale (sans cloud) via WiFi/LAN
- Partage sélectif des données (permissions granulaires)
- Historique de modifications avec identification de l'auteur
- Mode "Urgence" avec accès complet temporaire
- Résolution de conflits de synchronisation

#### 📚 Stack Technique Détaillée

**Technologies à utiliser**:
- **WebRTC** (`simple-peer` npm package) - Communication P2P directe
- **Socket.io** ou alternative légère - Signaling server local
- **CRDT** (Conflict-free Replicated Data Types) - Résolution conflits
  - Option 1: `automerge` - CRDT mature et bien documenté
  - Option 2: `yjs` - Plus performant pour données structurées
- **crypto** (Node.js natif) - Chiffrement E2E des données
- **bonjour** / **mdns** - Découverte automatique devices sur LAN
- SQLite existant - Stockage local avec colonnes de versioning

**Architecture proposée**:
```
src/
├── sync/
│   ├── P2PManager.ts              # Gestion connexions P2P
│   ├── SyncEngine.ts              # Moteur de synchronisation
│   ├── ConflictResolver.ts        # Résolution conflits CRDT
│   ├── DeviceDiscovery.ts         # Découverte devices LAN
│   ├── PermissionManager.ts       # Gestion permissions
│   ├── EncryptionService.ts       # Chiffrement E2E
│   └── types.ts                   # Types sync
├── database/
│   └── schema/
│       ├── sync_metadata.sql      # Métadonnées sync
│       └── permissions.sql        # Permissions granulaires
└── components/
    ├── SyncDashboard.tsx          # Interface sync
    └── DeviceList.tsx             # Liste appareils connectés
```

**Nouveaux fichiers à créer**:

1. **src/sync/P2PManager.ts**
```typescript
import SimplePeer from 'simple-peer';

export interface PeerConnection {
  peer_id: string;
  device_name: string;
  peer: SimplePeer.Instance;
  status: 'connecting' | 'connected' | 'disconnected';
  last_sync: string;
}

export class P2PManager {
  private peers: Map<string, PeerConnection>;
  private localPeerId: string;

  async discoverPeers(): Promise<DeviceInfo[]>
  async connectToPeer(peer_id: string): Promise<void>
  async sendData(peer_id: string, data: SyncData): Promise<void>
  async disconnect(peer_id: string): Promise<void>
  onDataReceived(callback: (data: SyncData) => void): void
}
```

2. **src/sync/SyncEngine.ts**
```typescript
import Automerge from 'automerge';

export class SyncEngine {
  private doc: Automerge.Doc<SyncState>;
  private p2pManager: P2PManager;

  async syncMembre(membre_id: number, target_peer: string): Promise<void>
  async syncAllData(target_peer: string): Promise<void>
  async handleIncomingSync(data: SyncData): Promise<void>
  async resolveConflicts(): Promise<ConflictReport>
  async getChangeHistory(membre_id: number): Promise<ChangeLog[]>
}
```

3. **src/database/schema/sync_metadata.sql**
```sql
-- Métadonnées de synchronisation
CREATE TABLE IF NOT EXISTS sync_metadata (
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  last_modified_at TEXT DEFAULT (datetime('now')),
  last_modified_by TEXT, -- device_id de l'auteur
  lamport_timestamp INTEGER DEFAULT 0, -- Pour résolution conflits
  vector_clock TEXT, -- JSON: {device_id: counter}
  is_deleted INTEGER DEFAULT 0,
  PRIMARY KEY (table_name, record_id)
);

-- Historique des modifications
CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_value TEXT, -- JSON snapshot avant
  new_value TEXT, -- JSON snapshot après
  author_device_id TEXT NOT NULL,
  author_device_name TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  sync_session_id TEXT
);

-- Permissions de partage
CREATE TABLE IF NOT EXISTS sync_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  device_name TEXT,
  membre_id INTEGER, -- NULL = accès à tous
  permission_level TEXT NOT NULL, -- 'read', 'write', 'admin'
  granted_at TEXT DEFAULT (datetime('now')),
  granted_by_device TEXT,
  expires_at TEXT, -- NULL = permanent
  is_emergency_access INTEGER DEFAULT 0,
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);

-- Devices connus
CREATE TABLE IF NOT EXISTS known_devices (
  device_id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  public_key TEXT, -- Pour chiffrement E2E
  last_seen TEXT DEFAULT (datetime('now')),
  trust_level TEXT DEFAULT 'pending', -- 'pending', 'trusted', 'blocked'
  added_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_metadata_table ON sync_metadata(table_name);
CREATE INDEX idx_change_log_record ON change_log(table_name, record_id);
CREATE INDEX idx_sync_permissions_device ON sync_permissions(device_id);
```

4. **src/sync/ConflictResolver.ts**
```typescript
export interface Conflict {
  table_name: string;
  record_id: number;
  local_version: any;
  remote_version: any;
  conflict_type: 'update-update' | 'update-delete' | 'insert-insert';
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

export class ConflictResolver {
  // Stratégies de résolution
  async resolveByTimestamp(conflict: Conflict): Promise<any>
  async resolveByLamportClock(conflict: Conflict): Promise<any>
  async resolveByCRDT(conflict: Conflict): Promise<any>
  async requireManualResolution(conflict: Conflict): Promise<void>
}
```

**Modifications de fichiers existants**:

1. **Toutes les tables existantes** - Ajouter colonnes de versioning:
```sql
-- Exemple pour table membres
ALTER TABLE membres ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE membres ADD COLUMN last_modified_by TEXT;
ALTER TABLE membres ADD COLUMN vector_clock TEXT;

-- Même chose pour: vaccins, traitements, rendez_vous, allergies
```

2. **electron/preload.ts** - Ajouter API sync:
```typescript
sync: {
  discoverDevices: () => ipcRenderer.invoke('sync:discover'),
  connectToDevice: (device_id: string) => ipcRenderer.invoke('sync:connect', device_id),
  requestSync: (device_id: string, data_scope: string[]) =>
    ipcRenderer.invoke('sync:request', device_id, data_scope),
  grantPermission: (device_id: string, permission: Permission) =>
    ipcRenderer.invoke('sync:grant-permission', device_id, permission),
  getChangeHistory: (membre_id?: number) =>
    ipcRenderer.invoke('sync:history', membre_id),
  resolveConflict: (conflict_id: string, resolution: string) =>
    ipcRenderer.invoke('sync:resolve-conflict', conflict_id, resolution)
}
```

#### 🎯 Spécifications Fonctionnelles

**User Stories détaillées**:

1. **US-SYNC-001**: En tant que parent, je veux partager les données médicales de mes enfants avec mon conjoint sur son ordinateur
   - Critères d'acceptance:
     - Découverte automatique des devices sur le réseau local
     - Sélection des membres à partager (granulaire)
     - Synchronisation bidirectionnelle en temps réel
     - Chiffrement bout-en-bout des données

2. **US-SYNC-002**: En tant qu'utilisateur, je veux voir qui a modifié quoi et quand
   - Critères d'acceptance:
     - Historique complet avec nom du device auteur
     - Horodatage précis de chaque modification
     - Possibilité de voir les valeurs avant/après
     - Filtrage par membre, par date, par auteur

3. **US-SYNC-003**: En cas d'urgence, je veux donner accès temporaire complet à un proche
   - Critères d'acceptance:
     - Mode "Urgence" avec PIN code
     - Accès lecture/écriture pour 24h/48h/1 semaine
     - Révocation instantanée possible
     - Notification sur tous les devices

**Cas d'usage principaux**:

1. **Configuration initiale P2P**:
   ```
   Input: Utilisateur ouvre panneau "Synchronisation"
   Process:
     - Scan réseau LAN (mDNS/Bonjour)
     - Affichage devices CareLink détectés
     - Génération QR Code pour pairing
     - Échange de clés publiques (E2E)
     - Demande de confiance mutuelle
   Output:
     - Device ajouté à la liste "Appareils de confiance"
     - Prêt pour sync
   ```

2. **Synchronisation sélective**:
   ```
   Input: Parent partage données enfant "Sophie" avec conjoint
   Process:
     - Sélection membre "Sophie"
     - Choix permission: "Lecture + Écriture"
     - Envoi requête au device distant
     - Acceptation requête sur device distant
     - Sync initial (full dump membre)
     - Sync incrémental ensuite (changements uniquement)
   Output:
     - Données Sophie synchronisées sur 2 devices
     - Modifications futures propagées en temps réel
   ```

3. **Résolution de conflit**:
   ```
   Input:
     - Device A modifie poids de Sophie: 15kg → 15.5kg (14h00)
     - Device B modifie poids de Sophie: 15kg → 16kg (14h02)
     - Synchronisation à 14h05
   Process:
     - Détection conflit (même champ, versions différentes)
     - Stratégie CRDT: Last-Write-Wins avec Lamport timestamp
     - Comparaison timestamps logiques
     - Device B timestamp > Device A timestamp
   Output:
     - Valeur finale: 16kg (de Device B)
     - Notification Device A: "Poids mis à jour par Device B"
     - Historique conserve les 2 versions
   ```

**Wireframes textuels**:
```
╔════════════════════════════════════════════════════════╗
║  🔄 SYNCHRONISATION FAMILIALE                          ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  📱 APPAREILS CONNECTÉS (2/5)                         ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🖥️  PC-Marie (Bureau)                    ✅ En ligne│ ║
║  │     Dernier sync: Il y a 5 minutes                │ ║
║  │     Accès: Tous les membres (Admin)              │ ║
║  │     [⚙️ Gérer] [🔌 Déconnecter]                   │ ║
║  └──────────────────────────────────────────────────┘ ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 💻 Laptop-Jean (Portable)             🟡 Hors ligne│ ║
║  │     Dernier sync: Il y a 2 heures                │ ║
║  │     Accès: Sophie + Lucas (Lecture)              │ ║
║  │     [⚙️ Gérer] [🗑️ Révoquer]                      │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  [➕ Ajouter un appareil] [🔍 Scanner réseau]         ║
║                                                        ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                        ║
║  📝 ACTIVITÉ RÉCENTE                                  ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🔵 Il y a 5 min - PC-Marie                       │ ║
║  │    Ajout vaccin ROR pour Sophie                  │ ║
║  └──────────────────────────────────────────────────┘ ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ⚠️  Conflit résolu automatiquement                │ ║
║  │    Poids de Lucas: 16kg (Device B retenu)       │ ║
║  │    [Voir détails]                                │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  [📊 Voir tout l'historique] [⚙️ Paramètres sync]    ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  🆘 MODE URGENCE                                       ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Créer un accès temporaire complet                    ║
║                                                        ║
║  Durée: [24 heures ▼]                                 ║
║  Code PIN: [Générer automatiquement] ou [____]        ║
║                                                        ║
║  ⚠️  Cet accès permettra:                              ║
║   • Lecture de toutes les données                    ║
║   • Modification de toutes les données               ║
║   • Révocation possible à tout moment                ║
║                                                        ║
║  [Créer accès d'urgence] [Annuler]                   ║
╚════════════════════════════════════════════════════════╝
```

#### 🏗️ Architecture Technique

**Diagramme de flux (format texte)**:
```
[DEVICE A - Modification locale]
      |
      v
[Mise à jour DB + Incrémentation version + Vector clock]
      |
      v
[Génération ChangeSet (delta)]
      |
      v
[SyncEngine.propagateChanges()]
      |
      v
[P2PManager.broadcast(changeSet) à tous peers connectés]
      |
      |
      v
[DEVICE B - Réception via WebRTC]
      |
      v
[Validation signature + Vérification permissions]
      |
      v
[ConflictResolver.detectConflict()]
      |
      +---> [Pas de conflit] --> [Apply changes directement]
      |
      +---> [Conflit détecté]
              |
              v
            [Stratégie résolution CRDT]
              |
              +---> [Last-Write-Wins avec Lamport Clock]
              +---> [Merge automatique (ex: listes)]
              +---> [Manuel si irrésoluble]
              |
              v
            [Apply résolution + Notifier utilisateur]
              |
              v
            [Update change_log avec résolution]
```

**Structure de données - Exemple CRDT**:

```typescript
// Vector Clock pour résolution conflits
interface VectorClock {
  [device_id: string]: number;
}

// Exemple de document CRDT
interface CRDTMembre {
  id: number;
  nom: string;
  prenom: string;
  poids: LWWRegister<number>; // Last-Write-Wins Register
  vaccins: GSet<Vaccin>; // Grow-only Set (jamais de suppression réelle)
  _metadata: {
    version: number;
    vector_clock: VectorClock;
    lamport_timestamp: number;
  };
}

// Last-Write-Wins Register
interface LWWRegister<T> {
  value: T;
  timestamp: number;
  device_id: string;
}
```

**API/IPC Handlers nécessaires**:

```typescript
// Côté Renderer
interface SyncAPI {
  discoverDevices(): Promise<DeviceInfo[]>;
  connectToDevice(device_id: string): Promise<void>;
  requestSync(device_id: string, scope: SyncScope): Promise<void>;
  grantPermission(device_id: string, permission: Permission): Promise<void>;
  revokePermission(device_id: string): Promise<void>;
  getChangeHistory(filters?: HistoryFilters): Promise<ChangeLog[]>;
  resolveConflict(conflict_id: string, choice: 'local' | 'remote' | 'merge'): Promise<void>;
  createEmergencyAccess(duration_hours: number): Promise<{ pin: string }>;
  revokeEmergencyAccess(access_id: string): Promise<void>;
}

// Côté Main
ipcMain.handle('sync:discover', async () => { ... });
ipcMain.handle('sync:connect', async (event, device_id) => { ... });
ipcMain.handle('sync:request', async (event, device_id, scope) => { ... });
// ... etc
```

**Intégration avec modules existants**:

1. **Toutes les pages de CRUD** (Vaccins, Traitements, RDV, etc.):
   - Intercepter toutes les opérations INSERT/UPDATE/DELETE
   - Enrichir avec metadata (version, author, timestamp)
   - Déclencher propagation automatique si peers connectés

2. **TopBar.tsx**:
   - Icône sync avec statut (vert = connecté, gris = offline)
   - Badge avec nombre de changements en attente
   - Dropdown avec liste des devices connectés

3. **Dashboard.tsx**:
   - Widget "Activité familiale récente"
   - Affichage qui a fait quoi

#### ⚠️ Défis Techniques

**Points d'attention**:

1. **Performance réseau**:
   - Sync initial peut être lourd (toute la DB)
   - Solution: Compression gzip des payloads
   - Delta encoding (envoyer seulement les changements)

2. **Sécurité**:
   - Données médicales sensibles
   - Solution: Chiffrement E2E obligatoire (AES-256)
   - Authentification mutuelle (clés publiques)

3. **Découverte devices**:
   - mDNS peut être bloqué par certains firewalls
   - Solution: Fallback sur saisie manuelle IP:port
   - QR Code pour simplification pairing

**Risques identifiés**:

1. **Conflits complexes**:
   - Risque: Modifications simultanées sur champs liés
   - Mitigation: CRDT pour résolution automatique
   - UI de résolution manuelle si nécessaire

2. **Split-brain**:
   - Risque: 2 devices offline se synchronisent différemment puis reconvergent
   - Mitigation: Vector clocks + Lamport timestamps
   - Historique complet conservé

3. **NAT Traversal**:
   - Risque: WebRTC P2P peut échouer derrière certains NATs
   - Mitigation: STUN/TURN server optionnel
   - Fallback sur connexion via serveur relay local

**Solutions proposées**:

1. **Mode "Sync prudent"**:
   - Confirmation utilisateur avant merge automatique
   - Affichage preview des changements

2. **Backup avant sync**:
   - Snapshot automatique DB avant première sync
   - Rollback en 1 clic si problème

3. **Tests de compatibilité**:
   - Vérifier versions de CareLink identiques
   - Avertir si schéma DB différent

#### ✅ Checklist d'Implémentation

**Phase 1: Infrastructure DB (Jour 1)**
- [ ] Ajouter colonnes versioning à toutes les tables
- [ ] Créer tables sync_metadata, change_log, permissions
- [ ] Créer triggers SQL pour auto-update version/timestamp
- [ ] Tests migration de schéma

**Phase 2: Découverte & Pairing (Jour 2)**
- [ ] Implémenter DeviceDiscovery avec mDNS
- [ ] Génération/échange clés publiques (crypto)
- [ ] Interface de pairing (QR Code + PIN)
- [ ] Gestion trust level (trusted/blocked)

**Phase 3: P2P Communication (Jour 3)**
- [ ] Setup WebRTC avec simple-peer
- [ ] Signaling server local (Socket.io léger)
- [ ] Chiffrement E2E des messages
- [ ] Heartbeat & reconnexion automatique

**Phase 4: Sync Engine (Jours 4-5)**
- [ ] Implémentation CRDT (automerge ou yjs)
- [ ] Delta encoding (changements uniquement)
- [ ] Propagation automatique changements
- [ ] Gestion permissions granulaires

**Phase 5: Conflict Resolution (Jour 6)**
- [ ] Détection conflits (vector clocks)
- [ ] Résolution automatique (LWW, merge)
- [ ] UI résolution manuelle
- [ ] Tests scénarios complexes

**Phase 6: UI & Intégrations (Jour 7)**
- [ ] Composant SyncDashboard
- [ ] Historique des modifications
- [ ] Mode urgence (accès temporaire)
- [ ] Intégration dans tous les modules CRUD
- [ ] Tests E2E complets

**Tests à prévoir**:

1. **Tests unitaires**:
```typescript
describe('ConflictResolver', () => {
  it('should resolve update-update conflict using LWW', async () => {
    const conflict = {
      local_version: { poids: 15, timestamp: 1000 },
      remote_version: { poids: 16, timestamp: 1100 }
    };
    const result = await resolver.resolveByTimestamp(conflict);
    expect(result.poids).toBe(16); // Remote wins
  });
});
```

2. **Tests d'intégration**:
- Device A et B se synchronisent
- Vérifier données identiques après sync
- Tester déconnexion/reconnexion

3. **Tests E2E**:
- Scénario famille complète (3 devices)
- Modifications concurrentes
- Vérifier convergence finale

---

### 3. Détection Automatique de Problèmes de Santé 🤖
**ROI**: ⭐⭐⭐⭐⭐ | **Effort**: Élevé (5-6 jours)

**Description**: Analyse intelligente des données pour détecter des patterns anormaux.

**Alertes intelligentes**:
- Poids enfant hors courbes normales (percentiles OMS)
- Trop de rendez-vous chez un spécialiste (problème chronique potentiel)
- Traitement actif depuis >6 mois sans consultation
- Vaccins manquants pour destinations de voyage
- Interactions médicament-âge (contre-indications seniors)

#### 📚 Stack Technique Détaillée

**Technologies à utiliser**:
- **Data OMS** - Courbes de croissance (fichiers JSON locaux)
- **date-fns** (déjà installé) - Calculs de durées et périodes
- **Règles médicales** - Base de connaissances embarquée (JSON)
- **Machine Learning léger** (optionnel): `ml.js` pour détection anomalies
- SQLite existant - Stockage des alertes et règles

**Architecture proposée**:
```
src/
├── health-monitoring/
│   ├── HealthAnalyzer.ts           # Moteur principal
│   ├── analyzers/
│   │   ├── GrowthAnalyzer.ts       # Courbes croissance
│   │   ├── TreatmentAnalyzer.ts    # Suivi traitements
│   │   ├── AppointmentAnalyzer.ts  # Patterns RDV
│   │   ├── VaccineAnalyzer.ts      # Vaccins voyage
│   │   └── DrugInteractionAnalyzer.ts # Interactions
│   └── types.ts
├── data/
│   ├── who-growth-curves.json      # Percentiles OMS
│   ├── drug-age-warnings.json      # Contre-indications
│   └── vaccine-travel.json         # Vaccins par destination
├── database/
│   └── schema/
│       └── health_alerts.sql
└── components/
    ├── HealthAlerts.tsx
    └── AlertCard.tsx
```

**Nouveaux fichiers à créer**:

1. **src/health-monitoring/HealthAnalyzer.ts**
```typescript
export interface HealthAlert {
  id: string;
  type: 'growth' | 'treatment' | 'appointment' | 'vaccine' | 'interaction';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  membre_id: number;
  title: string;
  description: string;
  recommendation: string;
  detected_at: string;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata: Record<string, any>;
}

export class HealthAnalyzer {
  async analyzeAllMembers(): Promise<HealthAlert[]>
  async analyzeMember(membre_id: number): Promise<HealthAlert[]>
  async acknowledgeAlert(alert_id: string): Promise<void>
  async resolveAlert(alert_id: string): Promise<void>
}
```

2. **src/health-monitoring/analyzers/GrowthAnalyzer.ts**
```typescript
import { differenceInMonths } from 'date-fns';

interface WHOPercentile {
  age_months: number;
  gender: 'M' | 'F';
  p3: number;   // 3ème percentile
  p15: number;  // 15ème percentile
  p50: number;  // Médiane
  p85: number;  // 85ème percentile
  p97: number;  // 97ème percentile
}

export class GrowthAnalyzer {
  private whoData: WHOPercentile[];

  async checkWeightForAge(membre: Membre): Promise<HealthAlert | null> {
    if (!membre.poids || !membre.date_naissance) return null;

    const ageMonths = this.calculateAgeInMonths(membre.date_naissance);
    const percentile = this.getPercentileForAge(ageMonths, membre.sexe);

    if (membre.poids < percentile.p3) {
      return {
        type: 'growth',
        severity: 'danger',
        title: `Poids en dessous du 3ème percentile`,
        description: `${membre.prenom} a un poids de ${membre.poids}kg, en dessous de la norme (P3: ${percentile.p3}kg)`,
        recommendation: 'Consulter un pédiatre pour évaluation'
      };
    }

    if (membre.poids > percentile.p97) {
      return {
        type: 'growth',
        severity: 'warning',
        title: `Poids au-dessus du 97ème percentile`,
        description: `Poids: ${membre.poids}kg (P97: ${percentile.p97}kg)`,
        recommendation: 'Surveillance de l\'IMC recommandée'
      };
    }

    return null;
  }

  async checkGrowthTrend(membre_id: number): Promise<HealthAlert | null> {
    // Analyse historique du poids (si stocké dans change_log)
    // Détection chute/hausse brutale (> 2 percentiles en 1 mois)
  }
}
```

3. **src/data/who-growth-curves.json**
```json
{
  "weight_for_age": {
    "boys": [
      { "age_months": 0, "p3": 2.5, "p15": 2.9, "p50": 3.3, "p85": 3.9, "p97": 4.4 },
      { "age_months": 1, "p3": 3.4, "p15": 3.9, "p50": 4.5, "p85": 5.1, "p97": 5.8 },
      { "age_months": 2, "p3": 4.3, "p15": 4.9, "p50": 5.6, "p85": 6.3, "p97": 7.1 }
      // ... jusqu'à 60 mois
    ],
    "girls": [
      { "age_months": 0, "p3": 2.4, "p15": 2.8, "p50": 3.2, "p85": 3.7, "p97": 4.2 }
      // ...
    ]
  }
}
```

4. **src/health-monitoring/analyzers/TreatmentAnalyzer.ts**
```typescript
export class TreatmentAnalyzer {
  async checkLongTermTreatments(): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [];

    // Query traitements actifs depuis > 6 mois
    const query = `
      SELECT t.*, m.prenom, m.nom,
             CAST((julianday('now') - julianday(t.date_debut)) / 30 AS INTEGER) as months_active
      FROM traitements t
      JOIN membres m ON t.membre_id = m.id
      WHERE t.actif = 1
        AND date_debut IS NOT NULL
        AND (julianday('now') - julianday(t.date_debut)) > 180
    `;

    const treatments = await db.query(query);

    for (const treatment of treatments) {
      // Vérifier s'il y a eu consultation récente
      const recentAppointment = await this.hasRecentAppointment(
        treatment.membre_id,
        90 // 3 mois
      );

      if (!recentAppointment) {
        alerts.push({
          type: 'treatment',
          severity: 'warning',
          title: `Traitement long sans suivi`,
          description: `${treatment.nom_medicament} actif depuis ${treatment.months_active} mois sans consultation`,
          recommendation: 'Planifier RDV de suivi avec médecin prescripteur'
        });
      }
    }

    return alerts;
  }

  async checkStockShortage(): Promise<HealthAlert[]> {
    // Déjà couvert par PredictionEngine, mais peut générer alerte différente
  }
}
```

5. **src/database/schema/health_alerts.sql**
```sql
CREATE TABLE IF NOT EXISTS health_alerts (
  id TEXT PRIMARY KEY, -- UUID
  type TEXT NOT NULL, -- 'growth', 'treatment', 'appointment', 'vaccine', 'interaction'
  severity TEXT NOT NULL, -- 'info', 'warning', 'danger', 'critical'
  membre_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  recommendation TEXT,
  detected_at TEXT DEFAULT (datetime('now')),
  acknowledged_at TEXT,
  resolved_at TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  metadata TEXT, -- JSON
  FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE
);

CREATE INDEX idx_health_alerts_membre ON health_alerts(membre_id);
CREATE INDEX idx_health_alerts_status ON health_alerts(status);
CREATE INDEX idx_health_alerts_severity ON health_alerts(severity);
```

#### 🎯 Spécifications Fonctionnelles

**User Stories détaillées**:

1. **US-HEALTH-001**: En tant que parent, je veux être alerté si le poids de mon enfant sort des courbes normales OMS
   - Critères d'acceptance:
     - Vérification automatique à chaque mise à jour du poids
     - Alerte si < P3 ou > P97
     - Comparaison avec courbes OMS officielles
     - Recommandation d'action claire

2. **US-HEALTH-002**: En tant qu'utilisateur, je veux savoir si un traitement dure anormalement longtemps sans suivi
   - Critères d'acceptance:
     - Détection automatique si traitement actif > 6 mois
     - Vérification absence de RDV médical récent (3 mois)
     - Suggestion de prise de RDV
     - Notification mensuelle si non résolu

3. **US-HEALTH-003**: En tant que voyageur, je veux savoir quels vaccins manquent pour ma destination
   - Critères d'acceptance:
     - Saisie destination de voyage
     - Comparaison avec vaccins recommandés (OMS/Institut Pasteur)
     - Affichage vaccins manquants
     - Délais requis avant départ

**Cas d'usage principaux**:

1. **Détection poids anormal**:
   ```
   Input: Mise à jour poids enfant Sophie (18 mois): 8.5kg
   Process:
     - Calcul âge exact: 18 mois
     - Récupération percentiles OMS (fille, 18 mois)
     - P3 = 9.0kg, P50 = 10.5kg, P97 = 12.5kg
     - 8.5kg < P3 → Alerte
   Output:
     - Alerte severity='danger'
     - Notification système
     - Badge sur profil Sophie
     - Recommandation: Consulter pédiatre
   ```

2. **Détection sur-consultation**:
   ```
   Input: Analyse historique RDV membre Jean
   Process:
     - Query: RDV cardiologue pour Jean
     - Résultat: 6 RDV en 3 mois
     - Seuil normal: 1-2 RDV / 6 mois
     - 6 RDV > seuil → Pattern anormal
   Output:
     - Alerte severity='info'
     - "Suivi rapproché cardiologue détecté"
     - Proposition: Vérifier si problème chronique à documenter
   ```

**Wireframes textuels**:
```
╔════════════════════════════════════════════════════════╗
║  🚨 ALERTES SANTÉ                                      ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🔴 CRITIQUE (1)                                      ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ⚠️  Poids en dessous du 3ème percentile          │ ║
║  │ 👶 Sophie (18 mois) - 8.5kg                      │ ║
║  │ 📊 Norme OMS: P3 = 9.0kg, P50 = 10.5kg           │ ║
║  │ 💡 Recommandation: Consulter pédiatre            │ ║
║  │ [Prendre RDV] [J'ai compris] [Faux positif]     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  🟡 AVERTISSEMENT (2)                                 ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 💊 Traitement long sans suivi                    │ ║
║  │ 👨 Jean - Doliprane 500mg actif depuis 8 mois   │ ║
║  │ 📅 Dernier RDV: Il y a 5 mois                    │ ║
║  │ 💡 Planifier consultation de suivi              │ ║
║  │ [Planifier RDV] [Ignorer] [Déjà fait]           │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  🔵 INFORMATION (1)                                   ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🌍 Vaccins recommandés pour voyage               │ ║
║  │ Destination: Thaïlande                           │ ║
║  │ Manquants: Hépatite A, Fièvre jaune              │ ║
║  │ ⏰ Délai requis: 4 semaines avant départ         │ ║
║  │ [Planifier vaccins] [Fermer]                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  [Voir tout l'historique] [⚙️ Paramètres alertes]    ║
╚════════════════════════════════════════════════════════╝
```

#### 🏗️ Architecture Technique

**Diagramme de flux**:
```
[DÉMARRAGE APP / Cron Job 2x par jour]
      |
      v
[HealthAnalyzer.analyzeAllMembers()]
      |
      +---> [GrowthAnalyzer.checkWeightForAge()] pour chaque enfant
      |         |
      |         +---> Récupère percentiles OMS depuis JSON
      |         +---> Compare poids actuel
      |         +---> Génère alerte si hors normes
      |
      +---> [TreatmentAnalyzer.checkLongTermTreatments()]
      |         |
      |         +---> Query traitements actifs > 6 mois
      |         +---> Vérifie RDV récents
      |         +---> Génère alerte si pas de suivi
      |
      +---> [AppointmentAnalyzer.checkFrequency()]
      |         |
      |         +---> Analyse patterns par spécialité
      |         +---> Détecte sur-consultation
      |         +---> Génère alerte info
      |
      +---> [VaccineAnalyzer.checkTravelVaccines()] (si voyage planifié)
      |         |
      |         +---> Compare vaccins existants avec requis
      |         +---> Calcule délais
      |
      +---> [DrugInteractionAnalyzer.checkAgeWarnings()]
              |
              +---> Vérifie contre-indications seniors (> 65 ans)
      |
      v
[INSERT health_alerts INTO DB]
      |
      v
[Notification si severity = 'critical' ou 'danger']
      |
      v
[Badge UI mis à jour]
```

**API/IPC Handlers nécessaires**:
```typescript
interface HealthMonitoringAPI {
  getActiveAlerts(membre_id?: number): Promise<HealthAlert[]>;
  acknowledgeAlert(alert_id: string): Promise<void>;
  resolveAlert(alert_id: string, resolution_note?: string): Promise<void>;
  runHealthAnalysis(membre_id?: number): Promise<HealthAlert[]>;
  checkTravelVaccines(destination: string, membre_ids: number[]): Promise<HealthAlert[]>;
}
```

**Intégration avec modules existants**:

1. **ProfilMembre.tsx**:
   - Badge avec nombre d'alertes actives
   - Section "Alertes santé" dédiée
   - Graphique courbe de croissance avec zones normales

2. **Dashboard.tsx**:
   - Widget "Alertes santé familiales"
   - Top 3 alertes critiques/danger
   - Bouton "Analyser maintenant"

3. **Traitements.tsx**:
   - Indicateur visuel si traitement long sans suivi
   - Lien vers alerte correspondante

#### ⚠️ Défis Techniques

**Points d'attention**:
1. **Faux positifs**:
   - Courbes OMS sont des moyennes
   - Solution: Seuils configurables par utilisateur
   - Feedback "Faux positif" pour améliorer règles

2. **Données manquantes**:
   - Poids/taille non renseignés
   - Solution: Encourager saisie complète
   - Alertes seulement si données suffisantes

**Risques identifiés**:
1. **Responsabilité médicale**:
   - Ne remplace pas diagnostic médical
   - Mitigation: Disclaimers clairs
   - Formulation prudente ("peut indiquer", "recommandé de vérifier")

#### ✅ Checklist d'Implémentation

**Phase 1: Infrastructure (Jour 1)**
- [ ] Créer schéma health_alerts
- [ ] Importer données OMS (JSON)
- [ ] Importer contre-indications médicamenteuses
- [ ] Setup types TypeScript

**Phase 2: Analyzers de base (Jours 2-3)**
- [ ] GrowthAnalyzer (courbes OMS)
- [ ] TreatmentAnalyzer (traitements longs)
- [ ] Tests unitaires avec données de test

**Phase 3: Analyzers avancés (Jours 4-5)**
- [ ] AppointmentAnalyzer (patterns RDV)
- [ ] VaccineAnalyzer (voyage)
- [ ] DrugInteractionAnalyzer
- [ ] Tests d'intégration

**Phase 4: UI & Intégrations (Jour 6)**
- [ ] Composants HealthAlerts
- [ ] Intégration Dashboard/Profils
- [ ] Notifications système
- [ ] Tests E2E

**Tests à prévoir**:
```typescript
describe('GrowthAnalyzer', () => {
  it('should alert if weight below P3', async () => {
    const membre = {
      date_naissance: '2023-04-01',
      sexe: 'F',
      poids: 8.5
    };
    const alert = await analyzer.checkWeightForAge(membre);
    expect(alert).toBeDefined();
    expect(alert.severity).toBe('danger');
  });
});
```

---

## 🎨 NIVEAU 2 - INNOVATIONS UNIQUES

### 4. Graphiques de Suivi Santé Interactifs 📊
**ROI**: ⭐⭐⭐⭐ | **Effort**: Moyen (2-3 jours)

**Description**: Visualisation des tendances de santé avec graphiques interactifs.

**Graphiques proposés**:
- Courbes de croissance enfants avec percentiles OMS
- Évolution IMC dans le temps
- Fréquence des rendez-vous par spécialité
- Compliance des traitements (% de prises)
- Timeline vaccins (passés et futurs)

#### 📚 Stack Technique Détaillée

**Technologies à utiliser**:
- **Recharts** (déjà installé) - Bibliothèque de graphiques React
- **D3.js** (via Recharts) - Manipulation données visuelles
- **date-fns** (déjà installé) - Formatage dates sur axes
- SQLite + requêtes d'agrégation - Calculs statistiques

**Architecture proposée**:
```
src/
├── components/
│   └── charts/
│       ├── GrowthCurveChart.tsx      # Courbe croissance
│       ├── IMCEvolutionChart.tsx     # IMC dans le temps
│       ├── AppointmentHeatmap.tsx    # Fréquence RDV
│       ├── TreatmentComplianceChart.tsx # Compliance
│       ├── VaccineTimeline.tsx       # Timeline vaccins
│       └── ChartContainer.tsx        # Wrapper réutilisable
├── utils/
│   └── chartDataProcessors.ts        # Transformation données
└── pages/
    └── HealthCharts.tsx              # Page dédiée graphiques
```

**Nouveaux fichiers à créer**:

1. **src/components/charts/GrowthCurveChart.tsx**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface GrowthData {
  age_months: number;
  poids_actual: number;
  p3: number;
  p50: number;
  p97: number;
}

export function GrowthCurveChart({ membre_id }: { membre_id: number }) {
  const [data, setData] = useState<GrowthData[]>([]);

  useEffect(() => {
    // Charger historique poids + percentiles OMS
    loadGrowthData();
  }, [membre_id]);

  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="age_months" label={{ value: 'Âge (mois)', position: 'bottom' }} />
      <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'left' }} />
      <Tooltip />
      <Legend />

      {/* Zones percentiles OMS */}
      <Line type="monotone" dataKey="p3" stroke="#ff0000" strokeDasharray="5 5" name="P3 (OMS)" />
      <Line type="monotone" dataKey="p50" stroke="#00aa00" strokeDasharray="5 5" name="P50 (OMS)" />
      <Line type="monotone" dataKey="p97" stroke="#ff0000" strokeDasharray="5 5" name="P97 (OMS)" />

      {/* Courbe réelle enfant */}
      <Line type="monotone" dataKey="poids_actual" stroke="#0066cc" strokeWidth={3} name="Poids réel" />
    </LineChart>
  );
}
```

2. **src/utils/chartDataProcessors.ts**
```typescript
export function processGrowthData(membre: Membre, weightHistory: any[], whoData: any[]): GrowthData[] {
  const birthDate = new Date(membre.date_naissance);

  return weightHistory.map(entry => {
    const ageMonths = differenceInMonths(new Date(entry.date), birthDate);
    const percentiles = whoData.find(p => p.age_months === ageMonths && p.gender === membre.sexe);

    return {
      age_months: ageMonths,
      poids_actual: entry.poids,
      p3: percentiles?.p3 || 0,
      p50: percentiles?.p50 || 0,
      p97: percentiles?.p97 || 0
    };
  });
}

export function calculateIMC(poids: number, taille: number): number {
  // IMC = poids(kg) / (taille(m))^2
  return poids / Math.pow(taille / 100, 2);
}

export function processAppointmentHeatmap(appointments: RendezVous[]) {
  // Groupe par jour de semaine et heure
  const heatmap = {};
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  appointments.forEach(apt => {
    if (!apt.heure) return;
    const day = format(new Date(apt.date_rdv), 'EEEE');
    const hour = parseInt(apt.heure.split(':')[0]);

    const key = `${day}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  return heatmap;
}
```

#### 🎯 Spécifications Fonctionnelles

**User Stories**:

1. **US-CHARTS-001**: En tant que parent, je veux visualiser la courbe de croissance de mon enfant avec les percentiles OMS
   - Affichage courbe poids/âge
   - Zones P3, P50, P97 en overlay
   - Détection automatique si hors normes

2. **US-CHARTS-002**: En tant qu'utilisateur, je veux voir l'évolution de mon IMC dans le temps
   - Graphique IMC avec historique
   - Zones normales (18.5-25) colorées
   - Tendance (hausse/baisse)

**Cas d'usage**:
```
Input: Consultation page Graphiques pour Sophie
Process:
  - Récupération historique poids (change_log ou table dédiée)
  - Chargement percentiles OMS pour fille
  - Génération points de données
  - Rendu graphique Recharts
Output:
  - Courbe interactive
  - Tooltip au survol
  - Export PNG possible
```

**Wireframe**:
```
╔══════════════════════════════════════════════════╗
║  📊 GRAPHIQUES SANTÉ - Sophie                    ║
╠══════════════════════════════════════════════════╣
║  [Croissance] [IMC] [Rendez-vous] [Vaccins]     ║
║                                                  ║
║  Courbe de croissance (0-60 mois)               ║
║  ┌────────────────────────────────────────────┐ ║
║  │ 15kg ┤                              ●●●●   │ ║
║  │ 12kg ┤              ┄┄┄┄┄┄P97┄┄┄┄┄/       │ ║
║  │ 10kg ┤      ●●●●●●●●───P50───────/         │ ║
║  │  8kg ┤  ●●●●  ┄┄┄┄┄P3┄┄┄┄┄                 │ ║
║  │      └────┬────┬────┬────┬────┬────>       │ ║
║  │          0   12   24   36   48  60 mois    │ ║
║  └────────────────────────────────────────────┘ ║
║                                                  ║
║  📈 Tendance: Croissance normale (P50-P85)      ║
║  [Exporter PNG] [Imprimer]                      ║
╚══════════════════════════════════════════════════╝
```

#### ✅ Checklist d'Implémentation

**Phase 1 (Jour 1)**:
- [ ] Setup composants Recharts
- [ ] GrowthCurveChart avec données OMS
- [ ] IMCEvolutionChart
- [ ] Tests rendering

**Phase 2 (Jour 2)**:
- [ ] AppointmentHeatmap (fréquence RDV)
- [ ] VaccineTimeline
- [ ] TreatmentComplianceChart
- [ ] Data processors

**Phase 3 (Jour 3)**:
- [ ] Page HealthCharts.tsx
- [ ] Export PNG/PDF
- [ ] Responsive design
- [ ] Tests E2E

---

### 5. Assistant Vocal pour Rappels 🎤
**ROI**: ⭐⭐⭐⭐ | **Effort**: Moyen (2-3 jours)

**Description**: Notifications vocales automatiques pour accessibilité.

**Fonctionnalités**:
- Rappels vocaux de prise de médicaments
- Annonces de rendez-vous la veille
- Synthèse vocale quotidienne
- Support multi-langues
- Activation/désactivation par membre

#### 📚 Stack Technique Détaillée

**Technologies à utiliser**:
- **Web Speech API** (natif navigateur) - Synthèse vocale gratuite
  - `speechSynthesis.speak()` - Lecture texte
  - `SpeechSynthesisUtterance` - Configuration voix
- **node-cron** (déjà installé) - Planification rappels
- **node-notifier** (déjà installé) - Notifications système
- SQLite existant - Préférences vocales par membre

**Architecture**:
```
src/
├── voice/
│   ├── VoiceAssistant.ts        # Gestionnaire principal
│   ├── VoiceScheduler.ts        # Planification rappels
│   ├── VoiceTemplates.ts        # Templates messages
│   └── types.ts
└── components/
    └── VoiceSettings.tsx        # Configuration UI
```

**Nouveaux fichiers**:

1. **src/voice/VoiceAssistant.ts**
```typescript
export class VoiceAssistant {
  private synth: SpeechSynthesis;

  speak(text: string, lang = 'fr-FR', rate = 1.0): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // Vitesse (0.1 à 10)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }

  announceAppointment(rdv: RendezVous, membre: Membre): void {
    const message = `Rappel pour ${membre.prenom}: rendez-vous ${rdv.specialite} demain à ${rdv.heure}.`;
    this.speak(message);
  }

  announceMedicationReminder(traitement: Traitement, membre: Membre): void {
    const message = `Il est temps de prendre ${traitement.nom_medicament}, ${traitement.dosage}.`;
    this.speak(message);
  }

  dailySummary(membre_id?: number): void {
    // "Bonjour, vous avez 2 rendez-vous aujourd'hui et 3 médicaments à prendre."
  }
}
```

2. **src/voice/VoiceScheduler.ts**
```typescript
import cron from 'node-cron';

export class VoiceScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  scheduleMedicationReminders(traitement: Traitement): void {
    // Ex: "2x par jour" → 08:00 et 20:00
    const times = this.parseFrequency(traitement.frequence);

    times.forEach((time, index) => {
      const jobId = `med-${traitement.id}-${index}`;
      const cronExpression = `0 ${time.minute} ${time.hour} * * *`;

      const job = cron.schedule(cronExpression, () => {
        VoiceAssistant.announceMedicationReminder(traitement, membre);
      });

      this.jobs.set(jobId, job);
    });
  }

  scheduleAppointmentReminders(): void {
    // Cron quotidien 18h: annonce RDV de demain
    cron.schedule('0 18 * * *', async () => {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-DD');
      const appointments = await db.query('SELECT * FROM rendez_vous WHERE date_rdv = ?', [tomorrow]);

      appointments.forEach(rdv => {
        VoiceAssistant.announceAppointment(rdv, membre);
      });
    });
  }
}
```

#### 🎯 Spécifications Fonctionnelles

**User Stories**:

1. **US-VOICE-001**: En tant que senior, je veux des rappels vocaux pour mes médicaments
   - Synthèse vocale claire et lente (rate=0.8)
   - Volume configurable
   - Répétition possible

2. **US-VOICE-002**: Je veux une synthèse vocale quotidienne de mes tâches santé
   - Trigger manuel ou automatique (8h du matin)
   - Liste RDV du jour + médicaments
   - Durée < 1 minute

**Cas d'usage**:
```
Input: 08:00 - Traitement "Doliprane 2x/jour" actif
Process:
  - VoiceScheduler détecte heure
  - Récupère données traitement + membre
  - VoiceAssistant.announceMedicationReminder()
  - Web Speech API synthétise texte
Output:
  - Audio: "Il est temps de prendre Doliprane, 500 milligrammes"
  - Notification système en parallèle
```

**Wireframe**:
```
╔══════════════════════════════════════════════╗
║  🎤 ASSISTANT VOCAL                          ║
╠══════════════════════════════════════════════╣
║  Configuration                                ║
║                                              ║
║  Activer assistant vocal: [☑️ Oui]          ║
║  Voix: [Français (France) ▼]                ║
║  Vitesse: [─────●───] 1.0x                  ║
║  Volume: [─────────●] 80%                   ║
║                                              ║
║  Rappels médicaments: [☑️ Actif]            ║
║  Rappels rendez-vous: [☑️ Actif] (veille 18h)║
║  Synthèse quotidienne: [☐ Désactivé]        ║
║    Heure: [08:00 ▼]                         ║
║                                              ║
║  [🔊 Tester la voix] [Sauvegarder]          ║
╚══════════════════════════════════════════════╝
```

#### ✅ Checklist

**Phase 1**: VoiceAssistant + Web Speech API
**Phase 2**: VoiceScheduler + cron jobs
**Phase 3**: UI Configuration + préférences
**Phase 4**: Tests accessibilité

---

## ⚡ NIVEAU 3 - QUICK WINS

### 6. Recherche Globale Ultra-Rapide 🔍
**ROI**: ⭐⭐⭐⭐ | **Effort**: Faible (1-2 jours)

**Description**: Recherche instantanée dans tous les modules.

**Fonctionnalités**:
- Recherche full-text dans toutes les tables
- Raccourci clavier (Ctrl+K / Cmd+K)
- Résultats groupés par catégorie
- Historique de recherches
- Suggestions intelligentes

#### 📚 Stack Technique Détaillée

**Technologies**:
- **SQLite FTS5** (Full-Text Search) - Extension SQLite
- **React hooks** - Debouncing pour optimisation
- **Keyboard shortcuts** - Détection Ctrl+K / Cmd+K

**Architecture**:
```
src/
├── search/
│   ├── GlobalSearch.tsx        # Composant recherche
│   ├── SearchModal.tsx         # Modal résultats
│   ├── SearchEngine.ts         # Logique recherche
│   └── types.ts
└── database/
    └── schema/
        └── fts_tables.sql      # Tables FTS5
```

**Nouveaux fichiers**:

1. **src/database/schema/fts_tables.sql**
```sql
-- Table FTS5 virtuelle pour recherche full-text
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  entity_type,    -- 'membre', 'vaccin', 'traitement', 'rdv'
  entity_id,
  searchable_text,
  metadata        -- JSON avec données affichage
);

-- Triggers pour auto-update index
CREATE TRIGGER membres_ai AFTER INSERT ON membres BEGIN
  INSERT INTO search_index (entity_type, entity_id, searchable_text, metadata)
  VALUES (
    'membre',
    NEW.id,
    NEW.nom || ' ' || NEW.prenom || ' ' || COALESCE(NEW.email, ''),
    json_object('nom', NEW.nom, 'prenom', NEW.prenom)
  );
END;

CREATE TRIGGER traitements_ai AFTER INSERT ON traitements BEGIN
  INSERT INTO search_index (entity_type, entity_id, searchable_text, metadata)
  VALUES (
    'traitement',
    NEW.id,
    NEW.nom_medicament || ' ' || COALESCE(NEW.notes, ''),
    json_object('nom', NEW.nom_medicament, 'dosage', NEW.dosage)
  );
END;

-- Mêmes triggers pour: vaccins, rendez_vous, allergies
```

2. **src/search/SearchEngine.ts**
```typescript
export interface SearchResult {
  type: 'membre' | 'vaccin' | 'traitement' | 'rdv' | 'allergie';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  relevance: number;
}

export class SearchEngine {
  async search(query: string, limit = 50): Promise<SearchResult[]> {
    if (query.length < 2) return [];

    const sql = `
      SELECT entity_type, entity_id, metadata, rank
      FROM search_index
      WHERE search_index MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    const results = await db.query(sql, [query + '*', limit]);

    return results.map(r => this.formatResult(r));
  }

  private formatResult(raw: any): SearchResult {
    const meta = JSON.parse(raw.metadata);

    switch (raw.entity_type) {
      case 'membre':
        return {
          type: 'membre',
          id: raw.entity_id,
          title: `${meta.prenom} ${meta.nom}`,
          subtitle: 'Membre de la famille',
          icon: '👤'
        };
      case 'traitement':
        return {
          type: 'traitement',
          id: raw.entity_id,
          title: meta.nom,
          subtitle: `Traitement ${meta.dosage}`,
          icon: '💊'
        };
      // ... autres types
    }
  }

  async saveSearchHistory(query: string): Promise<void> {
    // Stockage historique pour suggestions
  }

  async getSearchSuggestions(): Promise<string[]> {
    // Top 10 recherches récentes
  }
}
```

3. **src/search/GlobalSearch.tsx**
```typescript
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebouncedCallback } from 'use-debounce';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Raccourci Ctrl+K / Cmd+K
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  // Debounce search (300ms)
  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const engine = new SearchEngine();
    const res = await engine.search(q);
    setResults(res);
  }, 300);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <input
        type="text"
        placeholder="Rechercher... (Ctrl+K)"
        value={query}
        onChange={handleQueryChange}
        autoFocus
      />

      <div className="results">
        {results.map(result => (
          <SearchResultCard
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={() => navigateTo(result)}
          />
        ))}
      </div>
    </Modal>
  );
}
```

**Wireframe**:
```
╔══════════════════════════════════════════════╗
║  🔍 Recherche globale                        ║
╠══════════════════════════════════════════════╣
║  [sophie                              ] 🔎  ║
║  ──────────────────────────────────────────  ║
║                                              ║
║  MEMBRES (2)                                 ║
║  👤 Sophie Dupont                           ║
║     Membre de la famille · 8 ans            ║
║  👤 Sophie Martin (contact urgence)         ║
║                                              ║
║  VACCINS (1)                                 ║
║  💉 ROR - Sophie Dupont                     ║
║     Administré le 15/03/2024                ║
║                                              ║
║  TRAITEMENTS (0)                             ║
║                                              ║
║  [Voir plus...] · Ctrl+K pour rechercher    ║
╚══════════════════════════════════════════════╝
```

#### ✅ Checklist

**Phase 1 (Demi-journée)**:
- [ ] Setup FTS5 + triggers SQL
- [ ] SearchEngine.ts (logique recherche)
- [ ] Tests unitaires recherche

**Phase 2 (Demi-journée)**:
- [ ] Composant GlobalSearch.tsx
- [ ] Modal résultats
- [ ] Hotkeys Ctrl+K / Cmd+K
- [ ] Tests E2E

---

### 7. Export Médical Professionnel 📄
**ROI**: ⭐⭐⭐⭐ | **Effort**: Moyen (2-3 jours)

**Description**: Génération de PDF formatés pour médecins et DMP.

**Fonctionnalités**:
- PDF avec logo et en-têtes professionnels
- Export chronologique par membre
- Dossier complet famille
- Compatible DMP (Dossier Médical Partagé)
- Export sélectif (seulement vaccins, etc.)

#### 📚 Stack Technique Détaillée

**Technologies**:
- **PDFKit** (déjà installé) - Génération PDF
- **Electron dialog** - Sélection répertoire sauvegarde
- **date-fns** - Formatage dates françaises

**Architecture**:
```
src/
├── export/
│   ├── PDFExporter.ts           # Logique export
│   ├── templates/
│   │   ├── MedicalRecordTemplate.ts
│   │   ├── VaccineCardTemplate.ts
│   │   └── TreatmentListTemplate.ts
│   └── types.ts
└── components/
    └── ExportDialog.tsx
```

**Code principal**:

1. **src/export/PDFExporter.ts**
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

export class PDFExporter {
  async exportMemberRecord(membre_id: number, outputPath: string): Promise<void> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // En-tête
    this.addHeader(doc);

    // Section membre
    const membre = await this.getMember(membre_id);
    doc.fontSize(20).text(`Dossier Médical - ${membre.prenom} ${membre.nom}`, { align: 'center' });
    doc.moveDown();

    // Informations générales
    doc.fontSize(14).text('Informations générales', { underline: true });
    doc.fontSize(10).text(`Date de naissance: ${format(new Date(membre.date_naissance), 'dd/MM/yyyy')}`);
    doc.text(`Sexe: ${membre.sexe === 'M' ? 'Masculin' : 'Féminin'}`);
    if (membre.groupe_sanguin) doc.text(`Groupe sanguin: ${membre.groupe_sanguin}${membre.rhesus}`);
    doc.moveDown();

    // Vaccins
    doc.fontSize(14).text('Vaccins', { underline: true });
    const vaccins = await this.getVaccins(membre_id);
    vaccins.forEach(v => {
      doc.fontSize(10).text(`• ${v.nom_vaccin} - ${format(new Date(v.date_administration), 'dd/MM/yyyy')}`);
    });
    doc.moveDown();

    // Traitements
    doc.fontSize(14).text('Traitements en cours', { underline: true });
    const traitements = await this.getActiveTraitements(membre_id);
    traitements.forEach(t => {
      doc.fontSize(10).text(`• ${t.nom_medicament} (${t.dosage}) - ${t.frequence}`);
    });
    doc.moveDown();

    // Allergies
    doc.fontSize(14).text('Allergies connues', { underline: true });
    const allergies = await this.getAllergies(membre_id);
    if (allergies.length === 0) {
      doc.fontSize(10).text('Aucune allergie connue');
    } else {
      allergies.forEach(a => {
        doc.fontSize(10).text(`• ${a.nom_allergie} (${a.severite})`);
      });
    }

    // Footer
    doc.fontSize(8).text(
      `Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} par CareLink`,
      50, doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  private addHeader(doc: PDFDocument): void {
    doc.fontSize(12).text('DOSSIER MÉDICAL PERSONNEL', { align: 'center' });
    doc.fontSize(8).text('Ne remplace pas l\'avis d\'un professionnel de santé', { align: 'center' });
    doc.moveDown(2);
  }

  async exportFamilyRecord(outputPath: string): Promise<void> {
    // Export de tous les membres de la famille
  }

  async exportVaccineCard(membre_id: number, outputPath: string): Promise<void> {
    // Format carnet de vaccination
  }
}
```

2. **src/components/ExportDialog.tsx**
```typescript
export function ExportDialog({ membre_id }: { membre_id?: number }) {
  const [exportType, setExportType] = useState<'complete' | 'vaccines' | 'treatments'>('complete');

  const handleExport = async () => {
    // Electron dialog pour choisir répertoire
    const result = await window.electronAPI.showSaveDialog({
      title: 'Exporter le dossier médical',
      defaultPath: `dossier_medical_${membre?.prenom}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (result.filePath) {
      const exporter = new PDFExporter();

      switch (exportType) {
        case 'complete':
          await exporter.exportMemberRecord(membre_id, result.filePath);
          break;
        case 'vaccines':
          await exporter.exportVaccineCard(membre_id, result.filePath);
          break;
        case 'treatments':
          await exporter.exportTreatmentList(membre_id, result.filePath);
          break;
      }

      showToast('Export réussi!', 'success');
    }
  };

  return (
    <div>
      <h2>Exporter le dossier médical</h2>

      <label>
        <input type="radio" value="complete" checked={exportType === 'complete'} onChange={(e) => setExportType(e.target.value)} />
        Dossier complet (tous les modules)
      </label>

      <label>
        <input type="radio" value="vaccines" checked={exportType === 'vaccines'} onChange={(e) => setExportType(e.target.value)} />
        Carnet de vaccination uniquement
      </label>

      <label>
        <input type="radio" value="treatments" checked={exportType === 'treatments'} onChange={(e) => setExportType(e.target.value)} />
        Liste des traitements
      </label>

      <button onClick={handleExport}>Générer le PDF</button>
    </div>
  );
}
```

**User Stories**:

US-EXPORT-001: En tant qu'utilisateur, je veux exporter le dossier médical complet de mon enfant en PDF pour le médecin
- Format professionnel lisible
- Toutes les informations essentielles
- Disclaimer médical en en-tête

**Wireframe**:
```
┌─────────────────────────────────────────┐
│  DOSSIER MÉDICAL PERSONNEL               │
│  Ne remplace pas l'avis d'un             │
│  professionnel de santé                  │
│                                          │
│  Dossier Médical - Sophie Dupont        │
│  ════════════════════════════════════    │
│                                          │
│  Informations générales                  │
│  ────────────────────────                │
│  Date de naissance: 15/04/2016          │
│  Sexe: Féminin                           │
│  Groupe sanguin: A+                      │
│                                          │
│  Vaccins                                 │
│  ────────                                │
│  • DTP - 15/06/2016                     │
│  • ROR - 15/04/2017                     │
│                                          │
│  Traitements en cours                    │
│  ─────────────────────                   │
│  • Doliprane (500mg) - 2x/jour          │
│                                          │
│  Allergies connues                       │
│  ──────────────────                      │
│  • Arachides (Sévère)                   │
│                                          │
│  ────────────────────────────────────    │
│  Document généré le 29/10/2025 à 14:30  │
│  par CareLink                            │
└─────────────────────────────────────────┘
```

#### ✅ Checklist

- [ ] PDFExporter classe principale
- [ ] Templates PDF (dossier complet, vaccins, traitements)
- [ ] Intégration Electron dialog
- [ ] Export famille complète
- [ ] Tests génération PDF

---

### 8. Mode Sombre Automatique 🌙
**ROI**: ⭐⭐⭐ | **Effort**: Très faible (0.5 jour)

**Description**: Basculement automatique du thème selon l'heure.

#### 📚 Stack Technique

**Technologies**: ThemeContext existant + Electron nativeTheme + cron

**Code**:
```typescript
// src/utils/AutoThemeSwitcher.ts
import cron from 'node-cron';

export class AutoThemeSwitcher {
  private preferences = {
    mode: 'auto', // 'auto', 'system', 'manual'
    darkStart: '20:00',
    lightStart: '07:00'
  };

  start(): void {
    if (this.preferences.mode === 'auto') {
      // Check every hour
      cron.schedule('0 * * * *', () => this.checkAndSwitch());
    } else if (this.preferences.mode === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      });
    }
  }

  private checkAndSwitch(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const darkHour = parseInt(this.preferences.darkStart.split(':')[0]);
    const lightHour = parseInt(this.preferences.lightStart.split(':')[0]);

    if (currentHour >= darkHour || currentHour < lightHour) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }
}
```

**Checklist**:
- [ ] AutoThemeSwitcher avec cron
- [ ] Détection préférences système (matchMedia)
- [ ] UI paramètres (heures personnalisables)
- [ ] Animation transition CSS (0.3s ease)

---

### 9. Statistiques et Tableaux de Bord 📈
**ROI**: ⭐⭐⭐⭐ | **Effort**: Moyen (2-3 jours)

**Description**: Visualisation avancée des données de santé.

#### 📚 Stack Technique

**Technologies**: Recharts + requêtes SQL agrégées

**Composants**:
```typescript
// src/components/stats/StatsCard.tsx
export function StatsCard({ title, value, trend }: StatsCardProps) {
  return (
    <div className="stats-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {trend && <div className={`trend ${trend > 0 ? 'up' : 'down'}`}>{trend}%</div>}
    </div>
  );
}

// Statistiques à afficher
const stats = {
  totalAppointments: await db.query('SELECT COUNT(*) FROM rendez_vous WHERE date_rdv >= date("now", "-1 year")'),
  activeMembers: await db.query('SELECT COUNT(*) FROM membres'),
  vaccinationCoverage: calculateVaccinationCoverage(),
  avgAppointmentsPerMonth: calculateAverage()
};
```

**Graphiques**:
- Bar chart: RDV par mois (12 derniers mois)
- Pie chart: Répartition RDV par spécialité
- Heatmap: Meilleurs créneaux RDV (jour/heure)

**Checklist**:
- [ ] StatsCard composant
- [ ] Dashboard page avec KPIs
- [ ] Graphiques Recharts (bar, pie, heatmap)
- [ ] Export stats en CSV

---

### 10. Notifications Système Natives 🔔
**ROI**: ⭐⭐⭐⭐ | **Effort**: Faible (1 jour)

**Description**: Intégration des notifications système natives.

#### 📚 Stack Technique

**Technologies**: node-notifier (déjà installé) + Electron BrowserWindow

**Code**:
```typescript
// electron/main.ts
import notifier from 'node-notifier';
import path from 'path';

export class NotificationManager {
  send(title: string, message: string, icon?: string): void {
    notifier.notify({
      title,
      message,
      icon: icon || path.join(__dirname, 'assets/icon.png'),
      sound: true,
      wait: true
    });

    notifier.on('click', () => {
      // Focus window on click
      mainWindow?.focus();
    });
  }

  scheduleAppointmentReminder(rdv: RendezVous): void {
    const reminderTime = new Date(rdv.date_rdv);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1h avant

    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.send(
          'Rendez-vous dans 1h',
          `${rdv.specialite} à ${rdv.heure}\n${rdv.lieu}`,
          '📅'
        );
      }, delay);
    }
  }
}
```

**Intégration**:
```typescript
// src/pages/RendezVous.tsx
const handleCreateRDV = async (rdv: RendezVous) => {
  await window.electronAPI.dbRun('INSERT INTO rendez_vous ...', [rdv]);

  // Planifier notification
  await window.electronAPI.scheduleNotification(rdv);

  showToast('RDV créé et notification planifiée', 'success');
};
```

**Checklist**:
- [ ] NotificationManager classe
- [ ] Planification notifications (setTimeout)
- [ ] Badge app icon (nombre alertes)
- [ ] Paramètres sons personnalisables
- [ ] Tests E2E notifications

---

### 11. Import/Export Données 💾
**ROI**: ⭐⭐⭐⭐ | **Effort**: Faible (1-2 jours)

**Description**: Système complet de sauvegarde et migration.

#### 📚 Stack Technique

**Technologies**: fs (Node.js), CSV/JSON, SQLite backup

**Architecture**:
```
src/
├── backup/
│   ├── BackupManager.ts       # Gestion backups
│   ├── CSVExporter.ts         # Export CSV
│   ├── DataImporter.ts        # Import données
│   └── types.ts
└── components/
    └── BackupSettings.tsx
```

**Code principal**:

1. **src/backup/BackupManager.ts**
```typescript
import fs from 'fs';
import path from 'path';

export class BackupManager {
  private backupDir: string;

  async createBackup(): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backupPath = path.join(this.backupDir, `carelink_backup_${timestamp}.db`);

    // Copie fichier SQLite
    await fs.promises.copyFile(dbPath, backupPath);

    // Créer backup JSON également (pour lisibilité)
    const jsonBackup = await this.exportToJSON();
    await fs.promises.writeFile(
      backupPath.replace('.db', '.json'),
      JSON.stringify(jsonBackup, null, 2)
    );

    return backupPath;
  }

  async restoreBackup(backupPath: string): Promise<void> {
    // Créer backup de sécurité avant restore
    await this.createBackup();

    // Restore
    await fs.promises.copyFile(backupPath, dbPath);

    // Redémarrer app
    app.relaunch();
    app.exit(0);
  }

  async scheduleAutoBackup(frequency: 'daily' | 'weekly'): void {
    const cronExpression = frequency === 'daily' ? '0 2 * * *' : '0 2 * * 0'; // 2h du matin

    cron.schedule(cronExpression, async () => {
      await this.createBackup();
      this.cleanOldBackups(30); // Garder 30 derniers jours
    });
  }

  private async exportToJSON(): Promise<any> {
    const data = {
      members: await db.query('SELECT * FROM membres'),
      vaccins: await db.query('SELECT * FROM vaccins'),
      traitements: await db.query('SELECT * FROM traitements'),
      rendez_vous: await db.query('SELECT * FROM rendez_vous'),
      allergies: await db.query('SELECT * FROM allergies')
    };

    return data;
  }

  async exportToCSV(table: string, outputPath: string): Promise<void> {
    const rows = await db.query(`SELECT * FROM ${table}`);

    const csv = [
      Object.keys(rows[0]).join(','), // Header
      ...rows.map(row => Object.values(row).join(','))
    ].join('\n');

    await fs.promises.writeFile(outputPath, csv, 'utf-8');
  }
}
```

2. **src/components/BackupSettings.tsx**
```typescript
export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);

  const handleCreateBackup = async () => {
    const path = await backupManager.createBackup();
    showToast(`Backup créé: ${path}`, 'success');
    loadBackups();
  };

  const handleRestore = async (backupPath: string) => {
    if (confirm('Êtes-vous sûr ? Cela remplacera toutes les données actuelles.')) {
      await backupManager.restoreBackup(backupPath);
    }
  };

  return (
    <div>
      <h2>Sauvegardes</h2>

      <button onClick={handleCreateBackup}>Créer un backup maintenant</button>

      <h3>Backups automatiques</h3>
      <label>
        <input type="checkbox" /> Activer backups automatiques
        <select>
          <option value="daily">Quotidien (2h du matin)</option>
          <option value="weekly">Hebdomadaire (dimanche 2h)</option>
        </select>
      </label>

      <h3>Historique des backups</h3>
      <ul>
        {backups.map(backup => (
          <li key={backup.path}>
            {backup.name} - {format(new Date(backup.date), 'dd/MM/yyyy HH:mm')}
            <button onClick={() => handleRestore(backup.path)}>Restaurer</button>
          </li>
        ))}
      </ul>

      <h3>Export CSV</h3>
      <button onClick={() => exportToCSV('membres')}>Exporter membres</button>
      <button onClick={() => exportToCSV('vaccins')}>Exporter vaccins</button>
      <button onClick={() => exportToCSV('traitements')}>Exporter traitements</button>
    </div>
  );
}
```

**User Stories**:

US-BACKUP-001: En tant qu'utilisateur, je veux créer des backups automatiques hebdomadaires
- Sauvegarde complète DB
- Format DB + JSON
- Nettoyage automatique (> 30 jours)

US-BACKUP-002: Je veux restaurer facilement un backup en cas de problème
- Liste backups disponibles
- Aperçu date/taille
- Confirmation avant restore
- Backup de sécurité automatique avant restore

**Wireframe**:
```
╔══════════════════════════════════════════════╗
║  💾 SAUVEGARDES                              ║
╠══════════════════════════════════════════════╣
║  [Créer un backup maintenant]                ║
║                                              ║
║  Backups automatiques                        ║
║  ☑️ Activer [Hebdomadaire ▼] (dimanche 2h)  ║
║                                              ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                              ║
║  Historique (15 backups disponibles)        ║
║  ┌──────────────────────────────────────┐   ║
║  │ 29/10/2025 14:30 - 2.5 MB            │   ║
║  │ [Restaurer] [Exporter] [Supprimer]   │   ║
║  └──────────────────────────────────────┘   ║
║  ┌──────────────────────────────────────┐   ║
║  │ 22/10/2025 02:00 - 2.3 MB (auto)     │   ║
║  │ [Restaurer] [Exporter] [Supprimer]   │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  Export CSV                                  ║
║  [Membres] [Vaccins] [Traitements] [RDV]    ║
╚══════════════════════════════════════════════╝
```

**Checklist**:
- [ ] BackupManager classe (create, restore)
- [ ] Auto-backup cron (quotidien/hebdomadaire)
- [ ] Export JSON + CSV
- [ ] UI BackupSettings
- [ ] Nettoyage backups anciens
- [ ] Tests restauration

---

## 📊 MATRICE EFFORT/IMPACT

### Impact Élevé, Effort Faible (QUICK WINS - À faire en premier)
- ✅ Notifications système natives (1j)
- ✅ Mode sombre automatique (0.5j)
- ✅ Recherche globale (1-2j)
- ✅ Import/Export (1-2j)

### Impact Élevé, Effort Moyen (HIGH VALUE)
- 🔥 Graphiques santé (2-3j)
- 🔥 Export médical professionnel (2-3j)
- 🔥 Assistant vocal (2-3j)
- 🔥 Statistiques tableaux de bord (2-3j)
- 🔥 Calendrier intelligent (3-4j)

### Impact Élevé, Effort Élevé (STRATEGIC)
- ⭐ Synchronisation familiale P2P (5-7j)
- ⭐ IA détection problèmes santé (5-6j)

---

## 🗓️ PLANNING PROPOSÉ

### Sprint 1 (Semaine 1)
- Notifications système natives
- Mode sombre automatique
- Recherche globale

### Sprint 2 (Semaine 2)
- Import/Export données
- Graphiques santé interactifs

### Sprint 3 (Semaine 3)
- Export médical professionnel
- Statistiques tableaux de bord

### Sprint 4 (Semaine 4)
- Assistant vocal
- Calendrier intelligent (début)

### Sprint 5 (Semaine 5)
- Calendrier intelligent (fin)
- IA détection problèmes santé (début)

### Sprint 6 (Semaine 6)
- IA détection problèmes santé (fin)
- Synchronisation familiale P2P (début)

### Sprint 7 (Semaine 7)
- Synchronisation familiale P2P (fin)
- Tests et polissage

---

## 📝 NOTES

- Document complété avec spécifications techniques détaillées pour les 11 fonctionnalités
- Chaque fonctionnalité inclut: Stack technique, Architecture, Code exemples, User Stories, Wireframes, Défis, Checklist
- Les estimations d'effort peuvent varier selon la complexité découverte
- Priorisation flexible selon les retours utilisateurs
- Code examples fournis en TypeScript/React compatible avec le stack CareLink existant
- Toutes les technologies proposées réutilisent les dépendances déjà installées quand possible

---

**Dernière mise à jour**: 29 Octobre 2025
**Statut**: ✅ Spécifications techniques complètes (2761 lignes)
**Prochaine action**: Priorisation et implémentation par sprints
