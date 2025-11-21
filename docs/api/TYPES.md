# Types TypeScript

## Vue d'Ensemble

Toutes les interfaces sont définies dans `src/types/index.ts`.

## Entités Principales

### User

```typescript
interface User {
  id: number;
  username: string;
  password?: string;         // Hash bcrypt (jamais exposé côté client)
  is_setup_complete: number;
  created_at: string;
}
```

### Famille

```typescript
interface Famille {
  id: number;
  nom: string;
  user_id: number;
  created_at: string;
}
```

### Membre

```typescript
interface Membre {
  id: number;
  famille_id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe?: string;              // 'M' | 'F'
  groupe_sanguin?: string;    // 'A' | 'B' | 'AB' | 'O'
  rhesus?: string;            // '+' | '-'
  poids?: number;             // kg
  taille?: number;            // cm
  photo?: string;
  telephone?: string;
  email?: string;
  numero_securite_sociale?: string;
  medecin_traitant?: string;
  telephone_medecin?: string;
  contact_urgence_nom?: string;
  contact_urgence_telephone?: string;
  contact_urgence_relation?: string;
  notes?: string;             // Chiffré
}
```

### Vaccin

```typescript
interface Vaccin {
  id: number;
  membre_id: number;
  nom_vaccin: string;
  date_administration?: string;
  date_rappel?: string;
  statut: 'à_faire' | 'fait' | 'rappel' | 'expiré';
  lot?: string;
  medecin?: string;
  notes?: string;
}
```

### Traitement

```typescript
interface Traitement {
  id: number;
  membre_id: number;
  nom_medicament: string;
  dosage?: string;
  frequence?: string;
  date_debut?: string;
  date_fin?: string;
  actif: number;              // 1=actif, 0=terminé
  type?: 'quotidien' | 'ponctuel' | 'si_besoin';
  stock_restant?: number;
  medecin_prescripteur?: string;
  renouvellement_ordonnance?: string;
  effets_secondaires?: string;
  notes?: string;
}
```

### RendezVous

```typescript
interface RendezVous {
  id: number;
  membre_id: number;
  date_rdv: string;
  heure?: string;
  medecin?: string;
  specialite?: string;
  lieu?: string;
  telephone_cabinet?: string;
  motif?: string;
  statut?: 'à_venir' | 'effectué' | 'annulé';
  rappel?: number;           // Jours avant
  duree?: number;            // Minutes
  notes?: string;
}
```

### Allergie

```typescript
interface Allergie {
  id: number;
  membre_id: number;
  type_allergie?: string;
  nom_allergie: string;
  severite?: string;
}
```

---

## Types Interactions Médicamenteuses

### NiveauGravite

```typescript
type NiveauGravite = 'contre-indication' | 'precaution' | 'surveillance' | 'info';
```

### InteractionMedicamenteuse

```typescript
interface InteractionMedicamenteuse {
  medicament1: string;
  medicament2: string;
  gravite: NiveauGravite;
  description: string;
  recommendation: string;
  alternatives?: string[];
}
```

### ResultatVerificationInteraction

```typescript
interface ResultatVerificationInteraction {
  hasInteractions: boolean;
  interactions: InteractionDetectee[];
  hasContraindications: boolean;
  hasPrecautions: boolean;
}
```

---

## Types Analyse Santé

### HealthScore

```typescript
interface HealthScore {
  score: number;             // 0-100
  level: 'excellent' | 'good' | 'moderate' | 'poor';
  components: {
    vaccination: number;
    appointmentRegularity: number;
    treatmentAdherence: number;
    healthIssues: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
  insights: string[];
}
```

### HealthRiskPrediction

```typescript
interface HealthRiskPrediction {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  nextCheckupSuggested: boolean;
  urgentActionRequired: boolean;
}
```

---

## Types Alertes

### AlertType

```typescript
type AlertType =
  | 'appointment_missed'
  | 'appointment_upcoming'
  | 'medication_low'
  | 'prescription_renewal'
  | 'vaccination_due'
  | 'vaccination_overdue'
  | 'drug_interaction'
  | 'health_score_declining'
  | 'no_recent_checkup';
```

### SmartAlert

```typescript
interface SmartAlert {
  id: string;
  type: AlertType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'dismissed' | 'snoozed';
  title: string;
  message: string;
  icon: string;
  createdAt: Date;
  snoozeUntil?: Date;
  actionable: boolean;
  actionLabel?: string;
  relatedId?: number;
}
```

---

## Types Recommandations

### HealthRecommendation

```typescript
interface HealthRecommendation {
  id: string;
  category: 'checkup' | 'vaccination' | 'lifestyle' | 'screening' | 'prevention' | 'treatment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  action: string;
  icon: string;
  ageRelevant?: string;
  frequency?: string;
}
```
