/**
 * Python Health Service - Interface avec le backend ML
 * =====================================================
 *
 * Service pour appeler les endpoints de prédiction de santé
 * du backend Python avec Machine Learning.
 *
 * Fonctionnalités:
 * - Prédiction de risques de santé
 * - Détection d'anomalies
 * - Recommandations personnalisées basées sur ML
 *
 * @module PythonHealthService
 */

import { Membre, Vaccin, Traitement, RendezVous, Allergie } from '../types'

/**
 * Configuration du backend Python
 * ⭐ NOUVEAU : Port 8003 pour le service IA Health ML
 */
const PYTHON_BACKEND_URL = 'http://127.0.0.1:8003'

/**
 * Données de santé d'un membre pour le ML
 */
export interface MemberHealthData {
  age: number
  vaccinations: {
    total: number
    completed: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
  }
  treatments: {
    active: number
    low_stock: number
    expiring: number
  }
  allergies: {
    total: number
    severe: number
  }
  days_since_last_appointment: number
}

/**
 * Facteur de risque
 */
export interface RiskFactor {
  factor: string
  description: string
  importance: number // 0-1
  severity: 'low' | 'moderate' | 'high'
}

/**
 * Prédiction de risque de santé
 */
export interface HealthRiskPrediction {
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
  risk_score: number // 0-100
  confidence: number // 0-100
  risk_factors: RiskFactor[]
  recommendations: string[]
  method: 'ml' | 'rule_based'
}

/**
 * Résultat de détection d'anomalies
 */
export interface AnomalyDetectionResult {
  is_anomaly: boolean
  anomaly_score: number // -1 à 1
  anomaly_details: string[]
}

/**
 * Vérifier si le backend Python ML est accessible
 */
export async function checkPythonMLBackend(): Promise<{
  available: boolean
  ml_trained: boolean
}> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`)

    if (!response.ok) {
      return { available: false, ml_trained: false }
    }

    const data = await response.json()

    return {
      available: data.status === 'healthy',
      ml_trained: data.services?.ml_trained || false
    }
  } catch (error) {
    console.error('Backend Python ML non accessible:', error)
    return { available: false, ml_trained: false }
  }
}

/**
 * Collecter les données de santé d'un membre depuis la DB
 *
 * @param membreId - ID du membre
 * @returns Données formatées pour le ML
 */
export async function collectMemberHealthData(
  membreId: number | string
): Promise<MemberHealthData> {
  try {
    // Récupérer les informations du membre
    const membreResult = await window.electronAPI.dbQuery(
      'SELECT * FROM membres WHERE id = ?',
      [membreId]
    )

    if (!membreResult.success || membreResult.data.length === 0) {
      throw new Error('Membre non trouvé')
    }

    const membre: Membre = membreResult.data[0]

    // Calculer l'âge
    const age = membre.date_naissance
      ? new Date().getFullYear() - new Date(membre.date_naissance).getFullYear()
      : 0

    // Récupérer les vaccinations
    const vaccinsResult = await window.electronAPI.dbQuery(
      'SELECT * FROM vaccins WHERE membre_id = ?',
      [membreId]
    )
    const vaccins: Vaccin[] = vaccinsResult.success ? vaccinsResult.data : []
    const vac_total = vaccins.length
    const vac_completed = vaccins.filter(v => v.statut === 'fait').length

    // Récupérer les rendez-vous
    const rdvResult = await window.electronAPI.dbQuery(
      'SELECT * FROM rendez_vous WHERE membre_id = ?',
      [membreId]
    )
    const rdvs: RendezVous[] = rdvResult.success ? rdvResult.data : []
    const apt_total = rdvs.length
    const apt_completed = rdvs.filter(r => r.statut === 'effectué').length
    const apt_cancelled = rdvs.filter(r => r.statut === 'annulé').length

    // Calculer jours depuis dernier RDV
    let days_since_last = 365 // Par défaut 1 an
    if (rdvs.length > 0) {
      const sortedRdvs = rdvs
        .filter(r => r.statut === 'effectué')
        .sort((a, b) => new Date(b.date_rdv).getTime() - new Date(a.date_rdv).getTime())

      if (sortedRdvs.length > 0) {
        const lastRdvDate = new Date(sortedRdvs[0].date_rdv)
        const now = new Date()
        days_since_last = Math.floor(
          (now.getTime() - lastRdvDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }

    // Récupérer les traitements
    const traitResult = await window.electronAPI.dbQuery(
      'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
      [membreId]
    )
    const treatments: Traitement[] = traitResult.success ? traitResult.data : []
    const trt_active = treatments.length
    const trt_low_stock = treatments.filter(
      t => t.stock_restant && t.stock_restant < 7
    ).length

    // Ordonnances expirant bientôt
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const trt_expiring = treatments.filter(t => {
      if (!t.renouvellement_ordonnance) return false
      const renewalDate = new Date(t.renouvellement_ordonnance)
      return renewalDate >= now && renewalDate <= thirtyDaysLater
    }).length

    // Récupérer les allergies
    const allergiesResult = await window.electronAPI.dbQuery(
      'SELECT * FROM allergies WHERE membre_id = ?',
      [membreId]
    )
    const allergies: Allergie[] = allergiesResult.success ? allergiesResult.data : []
    const alg_total = allergies.length
    const alg_severe = allergies.filter(
      a => a.severite === 'grave' || a.severite === 'sévère'
    ).length

    // Construire les données
    const healthData: MemberHealthData = {
      age,
      vaccinations: {
        total: vac_total,
        completed: vac_completed
      },
      appointments: {
        total: apt_total,
        completed: apt_completed,
        cancelled: apt_cancelled
      },
      treatments: {
        active: trt_active,
        low_stock: trt_low_stock,
        expiring: trt_expiring
      },
      allergies: {
        total: alg_total,
        severe: alg_severe
      },
      days_since_last_appointment: days_since_last
    }

    return healthData

  } catch (error) {
    console.error('Erreur collecte données santé:', error)
    throw error
  }
}

/**
 * Prédire les risques de santé avec ML
 *
 * @param membreId - ID du membre
 * @returns Prédiction de risque avec recommandations
 */
export async function predictHealthRisk(
  membreId: number | string
): Promise<HealthRiskPrediction> {
  try {
    // Collecter les données
    const healthData = await collectMemberHealthData(membreId)

    // Appeler l'API Python
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict-health-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(healthData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Erreur HTTP ${response.status}`)
    }

    const prediction: HealthRiskPrediction = await response.json()
    return prediction

  } catch (error) {
    console.error('Erreur prédiction risque:', error)
    throw error
  }
}

/**
 * Détecter des anomalies dans les données de santé
 *
 * @param membreId - ID du membre
 * @returns Résultat de détection d'anomalies
 */
export async function detectHealthAnomalies(
  membreId: number | string
): Promise<AnomalyDetectionResult> {
  try {
    // Collecter les données
    const healthData = await collectMemberHealthData(membreId)

    // Appeler l'API Python
    const response = await fetch(`${PYTHON_BACKEND_URL}/detect-anomalies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(healthData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Erreur HTTP ${response.status}`)
    }

    const result: AnomalyDetectionResult = await response.json()
    return result

  } catch (error) {
    console.error('Erreur détection anomalies:', error)
    throw error
  }
}

/**
 * Obtenir la couleur du badge de risque
 *
 * @param riskLevel - Niveau de risque
 * @returns Classe CSS
 */
export function getRiskBadgeClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'badge-success'
    case 'moderate':
      return 'badge-warning'
    case 'high':
      return 'badge-error'
    case 'critical':
      return 'badge-critical'
    default:
      return 'badge-neutral'
  }
}

/**
 * Obtenir l'icône du risque
 *
 * @param riskLevel - Niveau de risque
 * @returns Emoji
 */
export function getRiskIcon(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return '✅'
    case 'moderate':
      return '⚠️'
    case 'high':
      return '🔴'
    case 'critical':
      return '🚨'
    default:
      return 'ℹ️'
  }
}

/**
 * Obtenir le libellé français du risque
 *
 * @param riskLevel - Niveau de risque
 * @returns Libellé
 */
export function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Faible'
    case 'moderate':
      return 'Modéré'
    case 'high':
      return 'Élevé'
    case 'critical':
      return 'Critique'
    default:
      return 'Inconnu'
  }
}
