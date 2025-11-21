/**
 * Définitions des types TypeScript pour CareLink
 *
 * Ce fichier contient toutes les interfaces et types utilisés
 * dans l'application pour assurer la cohérence des données
 *
 * @module types
 */

/**
 * Interface utilisateur - Représente un compte utilisateur CareLink
 */
export interface User {
  id: number
  username: string
  password?: string
  is_setup_complete: number
  created_at: string
}

/**
 * Interface famille - Représente un foyer familial
 */
export interface Famille {
  id: number
  nom: string
  user_id: number
  created_at: string
}

/**
 * Interface membre - Représente un membre de la famille avec toutes ses informations médicales
 */
export interface Membre {
  id: number
  famille_id: number
  nom: string
  prenom: string
  date_naissance: string
  sexe?: string
  groupe_sanguin?: string
  rhesus?: string
  poids?: number
  taille?: number
  photo?: string
  telephone?: string
  email?: string
  numero_securite_sociale?: string
  medecin_traitant?: string
  telephone_medecin?: string
  contact_urgence_nom?: string
  contact_urgence_telephone?: string
  contact_urgence_relation?: string
  notes?: string
}

export interface Vaccin {
  id: number
  membre_id: number
  nom_vaccin: string
  date_administration?: string
  date_rappel?: string
  statut: 'à_faire' | 'fait' | 'rappel' | 'expiré'
  lot?: string
  medecin?: string
  notes?: string
}

// Calendrier vaccinal français recommandé
export interface VaccinRecommande {
  nom: string
  description: string
  age_recommande: string // Ex: "2 mois", "4 mois", "11 mois"
  rappel?: string // Ex: "25 ans", "45 ans", "65 ans"
  obligatoire: boolean
  details?: string
}

export interface Traitement {
  id: number
  membre_id: number
  nom_medicament: string
  dosage?: string // Ex: "500mg"
  frequence?: string // Ex: "2x par jour", "Matin et soir"
  date_debut?: string
  date_fin?: string
  actif: number // 1 = actif, 0 = terminé
  type?: 'quotidien' | 'ponctuel' | 'si_besoin'
  stock_restant?: number // Nombre de comprimés/doses restants
  medecin_prescripteur?: string
  renouvellement_ordonnance?: string // Date de renouvellement
  effets_secondaires?: string
  notes?: string
}

export interface RendezVous {
  id: number
  membre_id: number
  date_rdv: string // Date du rendez-vous (YYYY-MM-DD)
  heure?: string // Heure du RDV (HH:MM)
  medecin?: string // Nom du médecin/praticien
  specialite?: string // Ex: Cardiologue, Dentiste, Généraliste
  lieu?: string // Adresse du cabinet
  telephone_cabinet?: string
  motif?: string // Raison de la consultation
  statut?: 'à_venir' | 'effectué' | 'annulé' // Statut du RDV
  rappel?: number // Nombre de jours avant pour rappel (ex: 1, 3, 7)
  duree?: number // Durée estimée en minutes
  notes?: string
}

export interface Allergie {
  id: number
  membre_id: number
  type_allergie?: string
  nom_allergie: string
  severite?: string
}

// Types pour les interactions médicamenteuses
export type NiveauGravite = 'contre-indication' | 'precaution' | 'surveillance' | 'info'

export interface InteractionMedicamenteuse {
  medicament1: string // Nom du premier médicament (ou substance active)
  medicament2: string // Nom du second médicament (ou substance active)
  gravite: NiveauGravite // Niveau de gravité de l'interaction
  description: string // Description de l'interaction
  recommendation: string // Recommandation pour le patient/médecin
  alternatives?: string[] // Médicaments alternatifs suggérés
}

export interface ResultatVerificationInteraction {
  hasInteractions: boolean // Y a-t-il des interactions détectées ?
  interactions: InteractionDetectee[] // Liste des interactions trouvées
  hasContraindications: boolean // Y a-t-il des contre-indications absolues ?
  hasPrecautions: boolean // Y a-t-il des précautions à prendre ?
}

export interface InteractionDetectee {
  interaction: InteractionMedicamenteuse
  medicament1: Traitement // Premier traitement concerné
  medicament2: Traitement // Second traitement concerné
}

export interface InteractionAllergique {
  medicament: string // Nom du médicament
  allergie: string // Nom de l'allergène
  gravite: NiveauGravite
  description: string
  recommendation: string
}

// Types pour l'Assistant Santé (CareAI)

/**
 * Résultat de l'analyse des tendances de rendez-vous
 */
export interface AppointmentTrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  totalAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  averageInterval: number
  regularity: 'excellent' | 'good' | 'irregular' | 'rare'
  lastAppointmentDate: string | null
  nextAppointmentDate: string | null
  recommendation: string
}

/**
 * Résultat de l'analyse d'adhérence aux traitements
 */
export interface TreatmentAdherenceAnalysis {
  adherenceScore: number
  activetreatments: number
  expiringSoon: number
  lowStock: number
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  issues: string[]
  recommendations: string[]
}

/**
 * Facteur de risque de santé
 */
export interface RiskFactor {
  category: string
  description: string
  severity: 'low' | 'moderate' | 'high'
  impact: number
}

/**
 * Prédiction des risques de santé
 */
export interface HealthRiskPrediction {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskScore: number
  factors: RiskFactor[]
  recommendations: string[]
  nextCheckupSuggested: boolean
  urgentActionRequired: boolean
}

/**
 * Score de santé global
 */
export interface HealthScore {
  score: number
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  components: {
    vaccination: number
    appointmentRegularity: number
    treatmentAdherence: number
    healthIssues: number
  }
  trend: 'improving' | 'stable' | 'declining'
  lastCalculated: string
  insights: string[]
}

/**
 * Type d'alerte intelligente
 */
export type AlertType =
  | 'appointment_missed'
  | 'appointment_upcoming'
  | 'medication_low'
  | 'prescription_renewal'
  | 'vaccination_due'
  | 'vaccination_overdue'
  | 'drug_interaction'
  | 'health_score_declining'
  | 'no_recent_checkup'

/**
 * Niveau de priorité d'une alerte
 */
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'

/**
 * Statut d'une alerte
 */
export type AlertStatus = 'active' | 'dismissed' | 'snoozed'

/**
 * Interface d'une alerte intelligente
 */
export interface SmartAlert {
  id: string
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  title: string
  message: string
  icon: string
  createdAt: Date
  snoozeUntil?: Date
  actionable: boolean
  actionLabel?: string
  actionCallback?: string
  relatedId?: number
}

/**
 * Résultat de la vérification d'alertes
 */
export interface AlertCheckResult {
  alerts: SmartAlert[]
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalCount: number
}

/**
 * Catégorie de recommandation
 */
export type RecommendationCategory =
  | 'checkup'
  | 'vaccination'
  | 'lifestyle'
  | 'screening'
  | 'prevention'
  | 'treatment'

/**
 * Priorité de recommandation
 */
export type RecommendationPriority = 'high' | 'medium' | 'low'

/**
 * Interface d'une recommandation de santé
 */
export interface HealthRecommendation {
  id: string
  category: RecommendationCategory
  priority: RecommendationPriority
  title: string
  description: string
  reason: string
  action: string
  icon: string
  ageRelevant?: string
  frequency?: string
}

/**
 * Résultat de génération de recommandations
 */
export interface RecommendationResult {
  recommendations: HealthRecommendation[]
  highPriority: number
  mediumPriority: number
  lowPriority: number
  totalCount: number
  personalized: boolean
}
