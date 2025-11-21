/**
 * SmartAlerts - Système d'alertes intelligentes de santé
 *
 * Ce service génère des alertes proactives basées sur:
 * - Rendez-vous manqués ou à venir
 * - Médicaments en stock faible
 * - Vaccinations dues prochainement
 * - Interactions médicamenteuses détectées
 * - Score de santé en baisse
 *
 * SYSTÈME DE PRIORITÉ:
 * - critical: Action urgente requise (rouge)
 * - high: Important, à traiter rapidement (orange)
 * - medium: Attention nécessaire (jaune)
 * - low: Information utile (bleu)
 *
 * @module SmartAlerts
 */

import { Vaccin, Traitement, RendezVous } from '../types'
import { verifierTousLesTraitements } from './InteractionChecker'
import { generateHealthScore } from './HealthAnalyzer'

/**
 * Type d'alerte
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
  actionCallback?: string // Nom de la page ou action à effectuer
  relatedId?: number // ID du membre, traitement, RDV concerné
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

// Stockage local des alertes (en mémoire pour cette version)
const alertsStorage = new Map<string, SmartAlert>()

/**
 * Vérifie toutes les alertes pour un membre
 *
 * Analyse:
 * - Rendez-vous passés et à venir
 * - Stocks de médicaments
 * - Renouvellements d'ordonnances
 * - Vaccinations dues
 * - Interactions médicamenteuses
 * - Score de santé
 *
 * @param memberId - ID du membre à analyser
 * @returns Résultat avec toutes les alertes actives
 */
export async function checkAllAlerts(memberId: string): Promise<AlertCheckResult> {
  const alerts: SmartAlert[] = []

  try {
    // Vérifier les rendez-vous
    const rdvAlerts = await checkAppointmentAlerts(memberId)
    alerts.push(...rdvAlerts)

    // Vérifier les médicaments
    const medAlerts = await checkMedicationAlerts(memberId)
    alerts.push(...medAlerts)

    // Vérifier les vaccinations
    const vaccinAlerts = await checkVaccinationAlerts(memberId)
    alerts.push(...vaccinAlerts)

    // Vérifier les interactions médicamenteuses
    const interactionAlerts = await checkDrugInteractions(memberId)
    alerts.push(...interactionAlerts)

    // Vérifier le score de santé
    const healthAlerts = await checkHealthScore(memberId)
    alerts.push(...healthAlerts)

    // Filtrer les alertes actives (non dismissées, non snoozées)
    const activeAlerts = alerts.filter(alert => {
      if (alert.status === 'dismissed') return false
      if (alert.status === 'snoozed' && alert.snoozeUntil) {
        return new Date() >= alert.snoozeUntil
      }
      return true
    })

    // Compter par priorité
    const criticalCount = activeAlerts.filter(a => a.priority === 'critical').length
    const highCount = activeAlerts.filter(a => a.priority === 'high').length
    const mediumCount = activeAlerts.filter(a => a.priority === 'medium').length
    const lowCount = activeAlerts.filter(a => a.priority === 'low').length

    // Stocker les alertes
    activeAlerts.forEach(alert => alertsStorage.set(alert.id, alert))

    return {
      alerts: activeAlerts.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)),
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalCount: activeAlerts.length
    }
  } catch (error) {
    console.error('Erreur vérification alertes:', error)
    return {
      alerts: [],
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalCount: 0
    }
  }
}

/**
 * Vérifie les alertes liées aux rendez-vous
 */
async function checkAppointmentAlerts(memberId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = []

  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM rendez_vous WHERE membre_id = ? ORDER BY date_rdv ASC',
      [memberId]
    )

    if (!result.success) return alerts

    const appointments: RendezVous[] = result.data
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Rendez-vous à venir dans les 3 jours (priorité haute)
    const upcomingSoon = appointments.filter(apt => {
      const aptDate = new Date(apt.date_rdv)
      return apt.statut === 'à_venir' && aptDate >= now && aptDate <= threeDaysLater
    })

    upcomingSoon.forEach(apt => {
      const daysUntil = Math.ceil(
        (new Date(apt.date_rdv).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      alerts.push({
        id: `apt_upcoming_${apt.id}`,
        type: 'appointment_upcoming',
        priority: daysUntil <= 1 ? 'high' : 'medium',
        status: 'active',
        title: 'Rendez-vous imminent',
        message: `RDV ${apt.specialite || 'médical'} dans ${daysUntil} jour(s) - ${apt.medecin || 'Médecin'}`,
        icon: '📅',
        createdAt: now,
        actionable: true,
        actionLabel: 'Voir détails',
        actionCallback: 'rendez-vous',
        relatedId: apt.id
      })
    })

    // Rendez-vous à venir dans 7 jours (priorité moyenne - rappel)
    const upcomingWeek = appointments.filter(apt => {
      const aptDate = new Date(apt.date_rdv)
      return (
        apt.statut === 'à_venir' &&
        aptDate > threeDaysLater &&
        aptDate <= sevenDaysLater &&
        apt.rappel
      )
    })

    upcomingWeek.forEach(apt => {
      alerts.push({
        id: `apt_reminder_${apt.id}`,
        type: 'appointment_upcoming',
        priority: 'low',
        status: 'active',
        title: 'Rappel de rendez-vous',
        message: `RDV prévu dans une semaine - ${apt.medecin || 'Médecin'}`,
        icon: '🔔',
        createdAt: now,
        actionable: true,
        actionLabel: 'Confirmer',
        actionCallback: 'rendez-vous',
        relatedId: apt.id
      })
    })

    // Vérifier s'il n'y a pas eu de RDV depuis 12 mois
    const lastAppointment = appointments
      .filter(a => a.statut === 'effectué')
      .sort((a, b) => new Date(b.date_rdv).getTime() - new Date(a.date_rdv).getTime())[0]

    if (lastAppointment) {
      const lastDate = new Date(lastAppointment.date_rdv)
      const monthsSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

      if (monthsSince >= 12) {
        alerts.push({
          id: `no_checkup_${memberId}`,
          type: 'no_recent_checkup',
          priority: monthsSince >= 24 ? 'high' : 'medium',
          status: 'active',
          title: 'Bilan de santé recommandé',
          message: `Aucun rendez-vous depuis ${monthsSince} mois. Un bilan est recommandé.`,
          icon: '🩺',
          createdAt: now,
          actionable: true,
          actionLabel: 'Planifier RDV',
          actionCallback: 'rendez-vous'
        })
      }
    } else if (appointments.length === 0) {
      alerts.push({
        id: `no_appointments_${memberId}`,
        type: 'no_recent_checkup',
        priority: 'medium',
        status: 'active',
        title: 'Aucun suivi médical',
        message: 'Aucun rendez-vous enregistré. Planifiez un bilan de santé.',
        icon: '🩺',
        createdAt: now,
        actionable: true,
        actionLabel: 'Ajouter RDV',
        actionCallback: 'rendez-vous'
      })
    }
  } catch (error) {
    console.error('Erreur alertes RDV:', error)
  }

  return alerts
}

/**
 * Vérifie les alertes liées aux médicaments
 */
async function checkMedicationAlerts(memberId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = []

  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
      [memberId]
    )

    if (!result.success) return alerts

    const treatments: Traitement[] = result.data
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Médicaments avec stock faible (< 7 jours)
    const lowStock = treatments.filter(t => t.stock_restant && t.stock_restant < 7)

    lowStock.forEach(med => {
      alerts.push({
        id: `med_low_${med.id}`,
        type: 'medication_low',
        priority: med.stock_restant! <= 3 ? 'critical' : 'high',
        status: 'active',
        title: 'Stock de médicament faible',
        message: `${med.nom_medicament} - Plus que ${med.stock_restant} jour(s) de traitement`,
        icon: '💊',
        createdAt: now,
        actionable: true,
        actionLabel: 'Renouveler',
        actionCallback: 'traitements',
        relatedId: med.id
      })
    })

    // Ordonnances à renouveler (< 30 jours)
    const renewalNeeded = treatments.filter(t => {
      if (!t.renouvellement_ordonnance) return false
      const renewalDate = new Date(t.renouvellement_ordonnance)
      return renewalDate >= now && renewalDate <= thirtyDaysLater
    })

    renewalNeeded.forEach(med => {
      const daysUntil = Math.ceil(
        (new Date(med.renouvellement_ordonnance!).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      alerts.push({
        id: `prescription_${med.id}`,
        type: 'prescription_renewal',
        priority: daysUntil <= 7 ? 'high' : 'medium',
        status: 'active',
        title: 'Renouvellement ordonnance',
        message: `${med.nom_medicament} - Ordonnance à renouveler dans ${daysUntil} jour(s)`,
        icon: '📋',
        createdAt: now,
        actionable: true,
        actionLabel: 'Prendre RDV',
        actionCallback: 'rendez-vous',
        relatedId: med.id
      })
    })
  } catch (error) {
    console.error('Erreur alertes médicaments:', error)
  }

  return alerts
}

/**
 * Vérifie les alertes liées aux vaccinations
 */
async function checkVaccinationAlerts(memberId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = []

  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM vaccins WHERE membre_id = ?',
      [memberId]
    )

    if (!result.success) return alerts

    const vaccins: Vaccin[] = result.data
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Vaccins en retard
    const overdue = vaccins.filter(v => v.statut === 'expiré')

    overdue.forEach(vaccin => {
      alerts.push({
        id: `vaccin_overdue_${vaccin.id}`,
        type: 'vaccination_overdue',
        priority: 'critical',
        status: 'active',
        title: 'Vaccination en retard',
        message: `${vaccin.nom_vaccin} - Rappel dépassé, mise à jour urgente`,
        icon: '💉',
        createdAt: now,
        actionable: true,
        actionLabel: 'Planifier',
        actionCallback: 'vaccins',
        relatedId: vaccin.id
      })
    })

    // Vaccins à faire prochainement (rappel < 30 jours)
    const dueSoon = vaccins.filter(v => {
      if (!v.date_rappel || v.statut !== 'rappel') return false
      const rappelDate = new Date(v.date_rappel)
      return rappelDate >= now && rappelDate <= thirtyDaysLater
    })

    dueSoon.forEach(vaccin => {
      const daysUntil = Math.ceil(
        (new Date(vaccin.date_rappel!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      alerts.push({
        id: `vaccin_due_${vaccin.id}`,
        type: 'vaccination_due',
        priority: daysUntil <= 7 ? 'high' : 'medium',
        status: 'active',
        title: 'Rappel de vaccination',
        message: `${vaccin.nom_vaccin} - Rappel dans ${daysUntil} jour(s)`,
        icon: '💉',
        createdAt: now,
        actionable: true,
        actionLabel: 'Planifier',
        actionCallback: 'vaccins',
        relatedId: vaccin.id
      })
    })

    // Vaccins à faire (jamais fait)
    const todo = vaccins.filter(v => v.statut === 'à_faire')

    if (todo.length > 0) {
      alerts.push({
        id: `vaccins_todo_${memberId}`,
        type: 'vaccination_due',
        priority: 'medium',
        status: 'active',
        title: 'Vaccinations à effectuer',
        message: `${todo.length} vaccination(s) à planifier`,
        icon: '💉',
        createdAt: now,
        actionable: true,
        actionLabel: 'Voir liste',
        actionCallback: 'vaccins'
      })
    }
  } catch (error) {
    console.error('Erreur alertes vaccinations:', error)
  }

  return alerts
}

/**
 * Vérifie les interactions médicamenteuses
 */
async function checkDrugInteractions(memberId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = []

  try {
    const result = await window.electronAPI.dbQuery(
      'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
      [memberId]
    )

    if (!result.success || result.data.length < 2) return alerts

    const treatments: Traitement[] = result.data

    // Vérifier toutes les interactions
    const interactionResult = verifierTousLesTraitements(treatments)

    if (interactionResult.hasContraindications) {
      alerts.push({
        id: `interaction_critical_${memberId}`,
        type: 'drug_interaction',
        priority: 'critical',
        status: 'active',
        title: 'Interaction médicamenteuse détectée',
        message: `${interactionResult.interactions.length} interaction(s) grave(s) entre vos médicaments`,
        icon: '⚠️',
        createdAt: new Date(),
        actionable: true,
        actionLabel: 'Voir détails',
        actionCallback: 'traitements'
      })
    } else if (interactionResult.hasPrecautions) {
      alerts.push({
        id: `interaction_warning_${memberId}`,
        type: 'drug_interaction',
        priority: 'high',
        status: 'active',
        title: 'Précautions médicamenteuses',
        message: `${interactionResult.interactions.length} interaction(s) nécessitant une surveillance`,
        icon: '👁️',
        createdAt: new Date(),
        actionable: true,
        actionLabel: 'Consulter',
        actionCallback: 'traitements'
      })
    }
  } catch (error) {
    console.error('Erreur alertes interactions:', error)
  }

  return alerts
}

/**
 * Vérifie le score de santé
 */
async function checkHealthScore(memberId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = []

  try {
    const healthScore = await generateHealthScore(memberId)

    // Alerte si score faible
    if (healthScore.score < 50) {
      alerts.push({
        id: `health_score_low_${memberId}`,
        type: 'health_score_declining',
        priority: healthScore.score < 30 ? 'critical' : 'high',
        status: 'active',
        title: 'Score de santé faible',
        message: `Votre score de santé est de ${healthScore.score}/100. Plusieurs aspects nécessitent attention.`,
        icon: '📊',
        createdAt: new Date(),
        actionable: true,
        actionLabel: 'Voir détails',
        actionCallback: 'assistant-sante'
      })
    }

    // Alerte si tendance décroissante (pour future implémentation)
    if (healthScore.trend === 'declining') {
      alerts.push({
        id: `health_declining_${memberId}`,
        type: 'health_score_declining',
        priority: 'medium',
        status: 'active',
        title: 'Santé en baisse',
        message: 'Votre score de santé diminue. Consultez les recommandations.',
        icon: '📉',
        createdAt: new Date(),
        actionable: true,
        actionLabel: 'Analyser',
        actionCallback: 'assistant-sante'
      })
    }
  } catch (error) {
    console.error('Erreur alerte score santé:', error)
  }

  return alerts
}

/**
 * Obtient le poids numérique d'une priorité (pour tri)
 */
function getPriorityWeight(priority: AlertPriority): number {
  switch (priority) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

/**
 * Obtient la priorité d'une alerte
 */
export function getAlertPriority(alert: SmartAlert): AlertPriority {
  return alert.priority
}

/**
 * Marque une alerte comme vue/dismissée
 */
export function dismissAlert(alertId: string): boolean {
  const alert = alertsStorage.get(alertId)
  if (!alert) return false

  alert.status = 'dismissed'
  alertsStorage.set(alertId, alert)
  return true
}

/**
 * Reporte une alerte (snooze)
 */
export function snoozeAlert(alertId: string, hours: number): boolean {
  const alert = alertsStorage.get(alertId)
  if (!alert) return false

  alert.status = 'snoozed'
  alert.snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000)
  alertsStorage.set(alertId, alert)
  return true
}

/**
 * Obtient la couleur CSS selon la priorité
 */
export function getAlertColor(priority: AlertPriority): string {
  switch (priority) {
    case 'critical':
      return '#e74c3c' // Rouge
    case 'high':
      return '#e67e22' // Orange
    case 'medium':
      return '#f39c12' // Jaune
    case 'low':
      return '#3498db' // Bleu
    default:
      return '#95a5a6' // Gris
  }
}

/**
 * Obtient le libellé de priorité
 */
export function getAlertPriorityLabel(priority: AlertPriority): string {
  switch (priority) {
    case 'critical':
      return 'Critique'
    case 'high':
      return 'Élevée'
    case 'medium':
      return 'Moyenne'
    case 'low':
      return 'Faible'
    default:
      return 'Inconnue'
  }
}
