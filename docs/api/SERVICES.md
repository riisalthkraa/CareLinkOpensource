# Services TypeScript

## Vue d'Ensemble

Les services encapsulent la logique métier de l'application.

## InteractionChecker

**Fichier** : `src/services/InteractionChecker.ts`

Service de vérification des interactions médicamenteuses.

### verifierInteractions()

Vérifie les interactions entre un nouveau médicament et les traitements existants.

```typescript
function verifierInteractions(
  nouveauMedicament: string,
  traitementsActuels: Traitement[]
): ResultatVerificationInteraction

// Retour
{
  hasInteractions: boolean,
  interactions: InteractionDetectee[],
  hasContraindications: boolean,
  hasPrecautions: boolean
}
```

**Exemple** :
```typescript
import { verifierInteractions } from './services/InteractionChecker';

const result = verifierInteractions('Aspirine', traitementsActifs);
if (result.hasContraindications) {
  alert('ATTENTION: Contre-indication détectée!');
}
```

### verifierTousLesTraitements()

Vérifie les interactions entre tous les traitements d'un patient.

```typescript
function verifierTousLesTraitements(
  traitements: Traitement[]
): ResultatVerificationInteraction
```

### verifierAllergies()

Vérifie les contre-indications allergiques.

```typescript
function verifierAllergies(
  medicament: string,
  allergies: Allergie[]
): InteractionAllergique[]
```

### Fonctions Utilitaires

```typescript
// Couleur CSS selon la gravité
getCouleurGravite(gravite: NiveauGravite): string
// '#e74c3c' (contre-indication), '#e67e22' (précaution), etc.

// Icône emoji selon la gravité
getIconeGravite(gravite: NiveauGravite): string
// '🚫', '⚠️', '👁️', 'ℹ️'

// Libellé en français
getLibelleGravite(gravite: NiveauGravite): string
// 'Contre-indication', 'Précaution', etc.

// Message d'alerte formaté
genererMessageAlerte(resultat: ResultatVerificationInteraction): string
```

---

## HealthAnalyzer

**Fichier** : `src/services/HealthAnalyzer.ts`

Service d'analyse intelligente de la santé.

### analyzeAppointmentTrends()

Analyse les tendances des rendez-vous médicaux.

```typescript
async function analyzeAppointmentTrends(
  memberId: string
): Promise<AppointmentTrendAnalysis>

// Retour
{
  trend: 'increasing' | 'decreasing' | 'stable',
  trendPercentage: number,
  totalAppointments: number,
  upcomingAppointments: number,
  completedAppointments: number,
  cancelledAppointments: number,
  averageInterval: number,      // Jours entre RDV
  regularity: 'excellent' | 'good' | 'irregular' | 'rare',
  lastAppointmentDate: string | null,
  nextAppointmentDate: string | null,
  recommendation: string
}
```

### analyzeTreatmentAdherence()

Analyse l'adhérence aux traitements.

```typescript
async function analyzeTreatmentAdherence(
  memberId: string
): Promise<TreatmentAdherenceAnalysis>

// Retour
{
  adherenceScore: number,       // 0-100
  activetreatments: number,
  expiringSoon: number,         // Ordonnances < 30j
  lowStock: number,             // Stock < 7 jours
  level: 'excellent' | 'good' | 'moderate' | 'poor',
  issues: string[],
  recommendations: string[]
}
```

### predictNextHealthIssues()

Prédit les risques de santé potentiels.

```typescript
async function predictNextHealthIssues(
  memberId: string
): Promise<HealthRiskPrediction>

// Retour
{
  riskLevel: 'low' | 'moderate' | 'high' | 'critical',
  riskScore: number,            // 0-100
  factors: RiskFactor[],
  recommendations: string[],
  nextCheckupSuggested: boolean,
  urgentActionRequired: boolean
}
```

### generateHealthScore()

Génère un score de santé global (0-100).

```typescript
async function generateHealthScore(
  memberId: string
): Promise<HealthScore>

// Retour
{
  score: number,                // 0-100
  level: 'excellent' | 'good' | 'moderate' | 'poor',
  components: {
    vaccination: number,        // 30% du score
    appointmentRegularity: number, // 25%
    treatmentAdherence: number,    // 25%
    healthIssues: number           // 20%
  },
  trend: 'improving' | 'stable' | 'declining',
  lastCalculated: string,
  insights: string[]
}
```

---

## OCRService

**Fichier** : `src/services/OCRService.ts`

Service OCR local utilisant Tesseract.js.

### Fonctionnalités

- Reconnaissance de texte sur images
- Extraction de données d'ordonnances
- Support multi-langues (fr, en)

---

## PDFGenerator

**Fichier** : `src/services/PDFGenerator.ts`

Génération de documents PDF.

### Fonctionnalités

- Cartes d'urgence
- Rapports de santé
- Export de données médicales

---

## QRCodeService

**Fichier** : `src/services/QRCodeService.ts`

Génération de QR codes.

### Fonctionnalités

- QR codes pour cartes d'urgence
- Encodage des informations médicales
- Format optimisé pour scan mobile

---

## ChatService

**Fichier** : `src/services/ChatService.ts`

Service de communication avec l'IA.

### Fonctionnalités

- Interface avec Claude API
- Interface avec Ollama (local)
- Gestion du contexte médical
- Historique des conversations

---

## SmartAlerts

**Fichier** : `src/services/SmartAlerts.ts`

Système d'alertes intelligentes.

### Types d'Alertes

| Type | Description | Priorité |
|------|-------------|----------|
| `appointment_missed` | RDV manqué | high |
| `appointment_upcoming` | RDV imminent | medium |
| `medication_low` | Stock faible | high |
| `prescription_renewal` | Renouvellement | medium |
| `vaccination_due` | Vaccin à faire | medium |
| `vaccination_overdue` | Vaccin en retard | high |
| `drug_interaction` | Interaction | critical |
| `health_score_declining` | Score en baisse | medium |
| `no_recent_checkup` | Pas de visite récente | low |

---

## RecommendationEngine

**Fichier** : `src/services/RecommendationEngine.ts`

Moteur de recommandations personnalisées.

### Catégories de Recommandations

- `checkup` : Bilans de santé
- `vaccination` : Vaccinations
- `lifestyle` : Mode de vie
- `screening` : Dépistages
- `prevention` : Prévention
- `treatment` : Traitements

---

## RealtimeStats

**Fichier** : `src/services/RealtimeStats.ts`

Statistiques en temps réel.

### Fonctionnalités

- Métriques dashboard
- Compteurs en direct
- Rafraîchissement automatique
