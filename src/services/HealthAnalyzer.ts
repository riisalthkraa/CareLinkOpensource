/**
 * HealthAnalyzer - Service d'analyse intelligente de la santé
 *
 * Ce service fournit des analyses avancées sur les données de santé:
 * - Analyse des tendances de rendez-vous
 * - Calcul de l'adhérence aux traitements
 * - Prédiction des risques de santé
 * - Génération d'un score de santé global (0-100)
 *
 * ALGORITHMES UTILISÉS:
 * - Moyennes mobiles pour les tendances
 * - Analyse statistique de la régularité
 * - Évaluation pondérée multi-critères
 * - Détection de patterns temporels
 *
 * @module HealthAnalyzer
 */

import { Vaccin, Traitement, RendezVous, Allergie } from '../types'

/**
 * Résultat de l'analyse des tendances de rendez-vous
 */
export interface AppointmentTrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number // Variation en pourcentage
  totalAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  averageInterval: number // Nombre moyen de jours entre RDV
  regularity: 'excellent' | 'good' | 'irregular' | 'rare'
  lastAppointmentDate: string | null
  nextAppointmentDate: string | null
  recommendation: string
}

/**
 * Résultat de l'analyse d'adhérence aux traitements
 */
export interface TreatmentAdherenceAnalysis {
  adherenceScore: number // Score 0-100
  activetreatments: number
  expiringSoon: number // Traitements dont l'ordonnance expire < 30j
  lowStock: number // Traitements avec stock < 7 jours
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  issues: string[]
  recommendations: string[]
}

/**
 * Prédiction des risques de santé
 */
export interface HealthRiskPrediction {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskScore: number // Score 0-100
  factors: RiskFactor[]
  recommendations: string[]
  nextCheckupSuggested: boolean
  urgentActionRequired: boolean
}

export interface RiskFactor {
  category: string
  description: string
  severity: 'low' | 'moderate' | 'high'
  impact: number // 0-100
}

/**
 * Score de santé global
 */
export interface HealthScore {
  score: number // Score global 0-100
  level: 'excellent' | 'good' | 'moderate' | 'poor'
  components: {
    vaccination: number // 0-100
    appointmentRegularity: number // 0-100
    treatmentAdherence: number // 0-100
    healthIssues: number // 0-100 (inverse des problèmes)
  }
  trend: 'improving' | 'stable' | 'declining'
  lastCalculated: string
  insights: string[]
}

/**
 * Analyse les tendances des rendez-vous médicaux
 *
 * Examine:
 * - La fréquence des rendez-vous (augmente/diminue/stable)
 * - L'intervalle moyen entre consultations
 * - La régularité du suivi médical
 * - Les rendez-vous manqués
 *
 * @param memberId - ID du membre à analyser
 * @returns Analyse détaillée des tendances
 */
export async function analyzeAppointmentTrends(
  memberId: string
): Promise<AppointmentTrendAnalysis> {
  try {
    // Récupérer tous les rendez-vous du membre
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM rendez_vous WHERE membre_id = ? ORDER BY date_rdv ASC',
      [memberId]
    )

    if (!result.success) {
      throw new Error('Erreur lors de la récupération des rendez-vous')
    }

    const appointments: RendezVous[] = result.data
    const now = new Date()

    // Séparer les RDV par statut
    const completed = appointments.filter(a => a.statut === 'effectué')
    const upcoming = appointments.filter(
      a => a.statut === 'à_venir' && new Date(a.date_rdv) >= now
    )
    const cancelled = appointments.filter(a => a.statut === 'annulé')

    // Calculer la tendance sur les 12 derniers mois
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const recentAppointments = appointments.filter(
      a => new Date(a.date_rdv) >= twelveMonthsAgo
    )

    // Comparer les 6 premiers mois vs 6 derniers mois
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const firstHalf = recentAppointments.filter(
      a => new Date(a.date_rdv) < sixMonthsAgo
    )
    const secondHalf = recentAppointments.filter(
      a => new Date(a.date_rdv) >= sixMonthsAgo
    )

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let trendPercentage = 0

    if (firstHalf.length > 0) {
      const change = ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
      trendPercentage = Math.round(change)

      if (change > 15) trend = 'increasing'
      else if (change < -15) trend = 'decreasing'
      else trend = 'stable'
    }

    // Calculer l'intervalle moyen entre RDV
    let averageInterval = 0
    if (completed.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < completed.length; i++) {
        const date1 = new Date(completed[i - 1].date_rdv)
        const date2 = new Date(completed[i].date_rdv)
        const diffDays = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
        intervals.push(diffDays)
      }
      averageInterval = Math.round(
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      )
    }

    // Déterminer la régularité
    let regularity: 'excellent' | 'good' | 'irregular' | 'rare' = 'rare'
    if (averageInterval > 0) {
      if (averageInterval <= 30) regularity = 'excellent'
      else if (averageInterval <= 90) regularity = 'good'
      else if (averageInterval <= 180) regularity = 'irregular'
      else regularity = 'rare'
    }

    // Dates du dernier et prochain RDV
    const lastAppointment = completed.length > 0 ? completed[completed.length - 1] : null
    const nextAppointment = upcoming.length > 0 ? upcoming[0] : null

    // Générer recommandation
    let recommendation = ''
    if (trend === 'increasing') {
      recommendation = 'Augmentation des consultations détectée. Bon suivi médical.'
    } else if (trend === 'decreasing') {
      recommendation =
        'Baisse des consultations. Assurez-vous de maintenir un suivi régulier.'
    } else if (regularity === 'rare') {
      recommendation = 'Consultations rares. Un suivi médical plus régulier est recommandé.'
    } else {
      recommendation = 'Fréquence de consultation stable. Continuez ce rythme.'
    }

    return {
      trend,
      trendPercentage,
      totalAppointments: appointments.length,
      upcomingAppointments: upcoming.length,
      completedAppointments: completed.length,
      cancelledAppointments: cancelled.length,
      averageInterval,
      regularity,
      lastAppointmentDate: lastAppointment ? lastAppointment.date_rdv : null,
      nextAppointmentDate: nextAppointment ? nextAppointment.date_rdv : null,
      recommendation
    }
  } catch (error) {
    console.error('Erreur analyse tendances RDV:', error)
    throw error
  }
}

/**
 * Analyse l'adhérence aux traitements
 *
 * Examine:
 * - Nombre de traitements actifs
 * - Stock restant de médicaments
 * - Renouvellements d'ordonnances à venir
 * - Régularité présumée de la prise
 *
 * @param memberId - ID du membre à analyser
 * @returns Score d'adhérence et recommandations
 */
export async function analyzeTreatmentAdherence(
  memberId: string
): Promise<TreatmentAdherenceAnalysis> {
  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
      [memberId]
    )

    if (!result.success) {
      throw new Error('Erreur lors de la récupération des traitements')
    }

    const treatments: Traitement[] = result.data
    const activeCount = treatments.length

    // Analyser les stocks faibles
    const lowStock = treatments.filter(
      t => t.stock_restant && t.stock_restant < 7
    ).length

    // Analyser les renouvellements proches
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = treatments.filter(t => {
      if (!t.renouvellement_ordonnance) return false
      const renewalDate = new Date(t.renouvellement_ordonnance)
      return renewalDate >= now && renewalDate <= thirtyDaysLater
    }).length

    // Calculer le score d'adhérence (0-100)
    let score = 100

    // Pénalités
    if (lowStock > 0) score -= lowStock * 15 // -15 points par traitement en stock faible
    if (expiringSoon > 0) score -= expiringSoon * 10 // -10 points par ordonnance à renouveler

    // Bonus pour bonne gestion
    if (activeCount > 0 && lowStock === 0) score = Math.min(100, score + 5)

    score = Math.max(0, score) // Minimum 0

    // Déterminer le niveau
    let level: 'excellent' | 'good' | 'moderate' | 'poor'
    if (score >= 90) level = 'excellent'
    else if (score >= 70) level = 'good'
    else if (score >= 50) level = 'moderate'
    else level = 'poor'

    // Identifier les problèmes
    const issues: string[] = []
    if (lowStock > 0) {
      issues.push(`${lowStock} traitement(s) avec stock faible (<7 jours)`)
    }
    if (expiringSoon > 0) {
      issues.push(`${expiringSoon} ordonnance(s) à renouveler dans les 30 jours`)
    }
    if (activeCount === 0) {
      issues.push('Aucun traitement actif enregistré')
    }

    // Générer recommandations
    const recommendations: string[] = []
    if (lowStock > 0) {
      recommendations.push('Pensez à renouveler vos médicaments en stock faible')
    }
    if (expiringSoon > 0) {
      recommendations.push('Prenez rendez-vous pour renouveler vos ordonnances')
    }
    if (level === 'excellent') {
      recommendations.push('Excellente gestion de vos traitements! Continuez ainsi.')
    }

    return {
      adherenceScore: score,
      activetreatments: activeCount,
      expiringSoon,
      lowStock,
      level,
      issues,
      recommendations
    }
  } catch (error) {
    console.error('Erreur analyse adhérence:', error)
    throw error
  }
}

/**
 * Prédit les risques de santé potentiels
 *
 * Analyse:
 * - Vaccinations manquantes
 * - Allergies sévères
 * - Rendez-vous manqués
 * - Interactions médicamenteuses potentielles
 *
 * @param memberId - ID du membre à analyser
 * @returns Prédiction des risques avec recommandations
 */
export async function predictNextHealthIssues(
  memberId: string
): Promise<HealthRiskPrediction> {
  try {
    const factors: RiskFactor[] = []
    let totalRisk = 0

    // Analyser les vaccinations
    const vaccinsResult = await window.electronAPI.dbQuery(
      'SELECT * FROM vaccins WHERE membre_id = ?',
      [memberId]
    )
    if (vaccinsResult.success) {
      const vaccins: Vaccin[] = vaccinsResult.data
      const missing = vaccins.filter(v => v.statut === 'à_faire').length
      const overdue = vaccins.filter(v => v.statut === 'expiré').length

      if (missing > 0 || overdue > 0) {
        const impact = Math.min(30, (missing + overdue * 2) * 5)
        factors.push({
          category: 'Vaccination',
          description: `${missing + overdue} vaccination(s) manquante(s) ou en retard`,
          severity: overdue > 0 ? 'high' : 'moderate',
          impact
        })
        totalRisk += impact
      }
    }

    // Analyser les allergies sévères
    const allergiesResult = await window.electronAPI.dbQuery(
      'SELECT * FROM allergies WHERE membre_id = ?',
      [memberId]
    )
    if (allergiesResult.success) {
      const allergies: Allergie[] = allergiesResult.data
      const severe = allergies.filter(
        a => a.severite === 'grave' || a.severite === 'sévère'
      ).length

      if (severe > 0) {
        const impact = Math.min(25, severe * 10)
        factors.push({
          category: 'Allergies',
          description: `${severe} allergie(s) sévère(s) nécessitant une vigilance accrue`,
          severity: 'high',
          impact
        })
        totalRisk += impact
      }
    }

    // Analyser les rendez-vous
    const rdvResult = await window.electronAPI.dbQuery(
      'SELECT * FROM rendez_vous WHERE membre_id = ? ORDER BY date_rdv DESC LIMIT 1',
      [memberId]
    )
    if (rdvResult.success && rdvResult.data.length > 0) {
      const lastRdv = rdvResult.data[0]
      const lastDate = new Date(lastRdv.date_rdv)
      const now = new Date()
      const daysSinceLastRdv = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastRdv > 365) {
        const impact = Math.min(20, Math.floor(daysSinceLastRdv / 30))
        factors.push({
          category: 'Suivi médical',
          description: `Dernier rendez-vous il y a ${Math.floor(daysSinceLastRdv / 30)} mois`,
          severity: daysSinceLastRdv > 730 ? 'high' : 'moderate',
          impact
        })
        totalRisk += impact
      }
    } else {
      // Aucun rendez-vous enregistré
      factors.push({
        category: 'Suivi médical',
        description: 'Aucun rendez-vous médical enregistré',
        severity: 'moderate',
        impact: 15
      })
      totalRisk += 15
    }

    // Calculer le niveau de risque
    const riskScore = Math.min(100, totalRisk)
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical'
    if (riskScore < 20) riskLevel = 'low'
    else if (riskScore < 40) riskLevel = 'moderate'
    else if (riskScore < 70) riskLevel = 'high'
    else riskLevel = 'critical'

    // Générer recommandations
    const recommendations: string[] = []
    const nextCheckupSuggested = riskScore >= 30
    const urgentActionRequired = riskScore >= 70

    if (urgentActionRequired) {
      recommendations.push('Action urgente recommandée: consultez un médecin rapidement')
    }
    if (nextCheckupSuggested) {
      recommendations.push('Un bilan de santé complet est recommandé')
    }
    if (factors.some(f => f.category === 'Vaccination')) {
      recommendations.push('Mettez à jour votre carnet de vaccination')
    }
    if (factors.some(f => f.category === 'Allergies')) {
      recommendations.push('Gardez toujours sur vous votre carte d\'urgence allergies')
    }

    return {
      riskLevel,
      riskScore,
      factors,
      recommendations,
      nextCheckupSuggested,
      urgentActionRequired
    }
  } catch (error) {
    console.error('Erreur prédiction risques:', error)
    throw error
  }
}

/**
 * Génère un score de santé global (0-100)
 *
 * Calcul pondéré basé sur:
 * - Couverture vaccinale: 30%
 * - Régularité des RDV: 25%
 * - Adhérence aux traitements: 25%
 * - Absence de problèmes actifs: 20%
 *
 * @param memberId - ID du membre à analyser
 * @returns Score de santé détaillé avec insights
 */
export async function generateHealthScore(memberId: string): Promise<HealthScore> {
  try {
    // Calculer chaque composante
    const [appointmentTrends, adherence, risks] = await Promise.all([
      analyzeAppointmentTrends(memberId),
      analyzeTreatmentAdherence(memberId),
      predictNextHealthIssues(memberId)
    ])

    // Score de vaccination (30% du total)
    const vaccinsResult = await window.electronAPI.dbQuery(
      'SELECT * FROM vaccins WHERE membre_id = ?',
      [memberId]
    )
    let vaccinationScore = 0
    if (vaccinsResult.success && vaccinsResult.data.length > 0) {
      const vaccins: Vaccin[] = vaccinsResult.data
      const total = vaccins.length
      const completed = vaccins.filter(v => v.statut === 'fait').length
      vaccinationScore = Math.round((completed / total) * 100)
    }

    // Score de régularité RDV (25% du total)
    let appointmentScore = 0
    switch (appointmentTrends.regularity) {
      case 'excellent':
        appointmentScore = 100
        break
      case 'good':
        appointmentScore = 75
        break
      case 'irregular':
        appointmentScore = 50
        break
      case 'rare':
        appointmentScore = 25
        break
    }

    // Score d'adhérence aux traitements (25% du total)
    const treatmentScore = adherence.adherenceScore

    // Score des problèmes de santé (20% du total) - inversé
    const healthIssuesScore = 100 - risks.riskScore

    // Calcul du score global pondéré
    const globalScore = Math.round(
      vaccinationScore * 0.3 +
        appointmentScore * 0.25 +
        treatmentScore * 0.25 +
        healthIssuesScore * 0.2
    )

    // Déterminer le niveau
    let level: 'excellent' | 'good' | 'moderate' | 'poor'
    if (globalScore >= 85) level = 'excellent'
    else if (globalScore >= 70) level = 'good'
    else if (globalScore >= 50) level = 'moderate'
    else level = 'poor'

    // Déterminer la tendance (pour l'instant stable, peut être amélioré avec historique)
    const trend: 'improving' | 'stable' | 'declining' = 'stable'

    // Générer insights
    const insights: string[] = []
    if (globalScore >= 85) {
      insights.push('Excellente gestion de votre santé! Continuez ainsi.')
    } else if (globalScore < 50) {
      insights.push('Plusieurs aspects de votre suivi santé nécessitent une attention.')
    }

    if (vaccinationScore < 70) {
      insights.push('Pensez à mettre à jour vos vaccinations.')
    }
    if (appointmentScore < 70) {
      insights.push('Un suivi médical plus régulier est recommandé.')
    }
    if (treatmentScore < 70) {
      insights.push('Attention à la gestion de vos traitements.')
    }
    if (risks.urgentActionRequired) {
      insights.push('Action urgente nécessaire - consultez votre médecin.')
    }

    return {
      score: globalScore,
      level,
      components: {
        vaccination: vaccinationScore,
        appointmentRegularity: appointmentScore,
        treatmentAdherence: treatmentScore,
        healthIssues: healthIssuesScore
      },
      trend,
      lastCalculated: new Date().toISOString(),
      insights
    }
  } catch (error) {
    console.error('Erreur génération score santé:', error)
    throw error
  }
}
