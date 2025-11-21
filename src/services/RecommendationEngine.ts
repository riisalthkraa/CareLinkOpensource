/**
 * RecommendationEngine - Moteur de recommandations personnalisées de santé
 *
 * Ce service génère des recommandations intelligentes basées sur:
 * - L'âge et le sexe du patient
 * - L'historique médical
 * - Les traitements en cours
 * - Le calendrier vaccinal
 * - Les meilleures pratiques médicales
 *
 * TYPES DE RECOMMANDATIONS:
 * - Bilans de santé préventifs
 * - Vaccinations recommandées
 * - Conseils de mode de vie
 * - Dépistages selon l'âge
 * - Prévention personnalisée
 *
 * @module RecommendationEngine
 */

import { Membre, Vaccin, Traitement } from '../types'

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
 * Interface d'une recommandation
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

/**
 * Calcule l'âge d'une personne à partir de sa date de naissance
 */
function calculateAge(dateNaissance: string): number {
  const birthDate = new Date(dateNaissance)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Génère des recommandations personnalisées pour un membre
 *
 * @param memberId - ID du membre
 * @returns Recommandations personnalisées avec priorités
 */
export async function generateRecommendations(
  memberId: string
): Promise<RecommendationResult> {
  const recommendations: HealthRecommendation[] = []

  try {
    // Récupérer les informations du membre
    const membreResult = await window.electronAPI.dbQuery(
      'SELECT * FROM membres WHERE id = ?',
      [memberId]
    )

    if (!membreResult.success || membreResult.data.length === 0) {
      throw new Error('Membre non trouvé')
    }

    const membre: Membre = membreResult.data[0]
    const age = membre.date_naissance ? calculateAge(membre.date_naissance) : null

    // Générer recommandations par catégorie
    const checkupRecs = await generateCheckupRecommendations(membre, age)
    const vaccinRecs = await generateVaccinationRecommendations(membre, age, memberId)
    const screeningRecs = await generateScreeningRecommendations(membre, age)
    const lifestyleRecs = await generateLifestyleRecommendations(membre, age, memberId)
    const preventionRecs = await generatePreventionRecommendations(membre, age)

    recommendations.push(
      ...checkupRecs,
      ...vaccinRecs,
      ...screeningRecs,
      ...lifestyleRecs,
      ...preventionRecs
    )

    // Compter par priorité
    const highPriority = recommendations.filter(r => r.priority === 'high').length
    const mediumPriority = recommendations.filter(r => r.priority === 'medium').length
    const lowPriority = recommendations.filter(r => r.priority === 'low').length

    // Trier par priorité (haute en premier)
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return {
      recommendations,
      highPriority,
      mediumPriority,
      lowPriority,
      totalCount: recommendations.length,
      personalized: age !== null
    }
  } catch (error) {
    console.error('Erreur génération recommandations:', error)
    return {
      recommendations: [],
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      totalCount: 0,
      personalized: false
    }
  }
}

/**
 * Recommandations de bilans de santé
 */
async function generateCheckupRecommendations(
  membre: Membre,
  age: number | null
): Promise<HealthRecommendation[]> {
  const recs: HealthRecommendation[] = []

  if (!age) return recs

  // Bilan annuel recommandé pour tous
  recs.push({
    id: 'checkup_annual',
    category: 'checkup',
    priority: 'medium',
    title: 'Bilan de santé annuel',
    description:
      'Un examen médical complet une fois par an permet de détecter précocement d\'éventuels problèmes de santé.',
    reason: 'Prévention et détection précoce',
    action: 'Prendre rendez-vous avec votre médecin traitant',
    icon: '🩺',
    frequency: 'Annuel'
  })

  // Bilans spécifiques selon l'âge
  if (age >= 40) {
    recs.push({
      id: 'checkup_cardio',
      category: 'checkup',
      priority: 'high',
      title: 'Bilan cardiovasculaire',
      description:
        'À partir de 40 ans, un bilan cardiovasculaire (tension, cholestérol, glycémie) est recommandé.',
      reason: 'Prévention des maladies cardiovasculaires',
      action: 'Consulter pour un bilan sanguin complet',
      icon: '❤️',
      ageRelevant: '40+ ans',
      frequency: 'Tous les 3-5 ans'
    })
  }

  if (age >= 50 && membre.sexe === 'F') {
    recs.push({
      id: 'checkup_osteo',
      category: 'checkup',
      priority: 'medium',
      title: 'Densitométrie osseuse',
      description:
        'Après la ménopause, un dépistage de l\'ostéoporose est recommandé pour les femmes.',
      reason: 'Prévention de l\'ostéoporose',
      action: 'Discuter avec votre médecin d\'une densitométrie',
      icon: '🦴',
      ageRelevant: 'Femmes 50+ ans',
      frequency: 'Tous les 2-3 ans'
    })
  }

  if (age >= 60) {
    recs.push({
      id: 'checkup_senior',
      category: 'checkup',
      priority: 'high',
      title: 'Bilan gériatrique',
      description:
        'Un bilan complet incluant mémoire, équilibre, vision, audition et nutrition est recommandé.',
      reason: 'Maintien de l\'autonomie et qualité de vie',
      action: 'Consulter pour un bilan gériatrique',
      icon: '👴',
      ageRelevant: '60+ ans',
      frequency: 'Annuel'
    })
  }

  return recs
}

/**
 * Recommandations de vaccinations
 */
async function generateVaccinationRecommendations(
  membre: Membre,
  age: number | null,
  memberId: string
): Promise<HealthRecommendation[]> {
  const recs: HealthRecommendation[] = []

  if (!age) return recs

  // Récupérer les vaccins du membre
  const vaccinsResult = await window.electronAPI.dbQuery(
    'SELECT * FROM vaccins WHERE membre_id = ?',
    [memberId]
  )

  let existingVaccins: Vaccin[] = []
  if (vaccinsResult.success) {
    existingVaccins = vaccinsResult.data
  }

  // Vérifier si un vaccin existe et est à jour
  const hasVaccin = (nom: string): boolean => {
    return existingVaccins.some(
      v =>
        v.nom_vaccin.toLowerCase().includes(nom.toLowerCase()) &&
        (v.statut === 'fait' || v.statut === 'rappel')
    )
  }

  // DTP (Diphtérie-Tétanos-Polio) - recommandé tous les 10 ans
  if (age >= 25 && !hasVaccin('dtp')) {
    recs.push({
      id: 'vaccin_dtp',
      category: 'vaccination',
      priority: 'high',
      title: 'Rappel DTP (Diphtérie-Tétanos-Polio)',
      description: 'Le rappel DTP est recommandé tous les 10 ans pour maintenir l\'immunité.',
      reason: 'Protection contre trois maladies graves',
      action: 'Vérifier la date de votre dernier rappel et planifier si nécessaire',
      icon: '💉',
      frequency: 'Tous les 10 ans'
    })
  }

  // Grippe pour personnes à risque
  if (age >= 65 || membre.notes?.toLowerCase().includes('chronique')) {
    recs.push({
      id: 'vaccin_grippe',
      category: 'vaccination',
      priority: 'high',
      title: 'Vaccination antigrippale',
      description:
        'La vaccination annuelle contre la grippe est fortement recommandée pour les personnes de 65 ans et plus.',
      reason: 'Protection contre les complications de la grippe',
      action: 'Se faire vacciner chaque automne (octobre-novembre)',
      icon: '💉',
      ageRelevant: '65+ ans ou personnes à risque',
      frequency: 'Annuel'
    })
  }

  // COVID-19
  if (age >= 18) {
    recs.push({
      id: 'vaccin_covid',
      category: 'vaccination',
      priority: 'medium',
      title: 'Rappel COVID-19',
      description: 'Un rappel annuel contre la COVID-19 est recommandé pour tous les adultes.',
      reason: 'Maintien de l\'immunité',
      action: 'Vérifier votre statut vaccinal COVID-19',
      icon: '💉',
      frequency: 'Annuel'
    })
  }

  // Zona pour seniors
  if (age >= 65 && !hasVaccin('zona')) {
    recs.push({
      id: 'vaccin_zona',
      category: 'vaccination',
      priority: 'medium',
      title: 'Vaccination contre le zona',
      description:
        'Le vaccin contre le zona est recommandé à partir de 65 ans pour prévenir cette maladie douloureuse.',
      reason: 'Prévention du zona et de ses complications',
      action: 'Consulter votre médecin pour une prescription',
      icon: '💉',
      ageRelevant: '65+ ans',
      frequency: 'Une fois'
    })
  }

  // Pneumocoque pour seniors
  if (age >= 65 && !hasVaccin('pneumocoque')) {
    recs.push({
      id: 'vaccin_pneumo',
      category: 'vaccination',
      priority: 'medium',
      title: 'Vaccination antipneumococcique',
      description: 'Protège contre les infections à pneumocoque (pneumonie, méningite).',
      reason: 'Protection renforcée pour les seniors',
      action: 'Discuter de ce vaccin avec votre médecin',
      icon: '💉',
      ageRelevant: '65+ ans',
      frequency: 'Tous les 5 ans'
    })
  }

  return recs
}

/**
 * Recommandations de dépistages
 */
async function generateScreeningRecommendations(
  membre: Membre,
  age: number | null
): Promise<HealthRecommendation[]> {
  const recs: HealthRecommendation[] = []

  if (!age) return recs

  // Dépistage cancer colorectal (50-74 ans)
  if (age >= 50 && age <= 74) {
    recs.push({
      id: 'screening_colorectal',
      category: 'screening',
      priority: 'high',
      title: 'Dépistage du cancer colorectal',
      description:
        'Test immunologique fécal (FIT) tous les 2 ans pour détecter précocement le cancer colorectal.',
      reason: 'Deuxième cancer le plus meurtrier en France',
      action: 'Demander un kit de dépistage à votre médecin',
      icon: '🔬',
      ageRelevant: '50-74 ans',
      frequency: 'Tous les 2 ans'
    })
  }

  // Dépistage cancer du sein (femmes 50-74 ans)
  if (membre.sexe === 'F' && age >= 50 && age <= 74) {
    recs.push({
      id: 'screening_breast',
      category: 'screening',
      priority: 'high',
      title: 'Dépistage du cancer du sein',
      description:
        'Mammographie tous les 2 ans pour le dépistage organisé du cancer du sein.',
      reason: 'Cancer le plus fréquent chez les femmes',
      action: 'Prendre rendez-vous pour une mammographie',
      icon: '🎗️',
      ageRelevant: 'Femmes 50-74 ans',
      frequency: 'Tous les 2 ans'
    })
  }

  // Dépistage cancer du col de l'utérus (femmes 25-65 ans)
  if (membre.sexe === 'F' && age >= 25 && age <= 65) {
    recs.push({
      id: 'screening_cervical',
      category: 'screening',
      priority: 'medium',
      title: 'Dépistage du cancer du col de l\'utérus',
      description: 'Frottis cervical ou test HPV selon l\'âge pour prévenir le cancer du col.',
      reason: 'Prévention du cancer du col de l\'utérus',
      action: 'Consulter votre gynécologue pour un dépistage',
      icon: '🔬',
      ageRelevant: 'Femmes 25-65 ans',
      frequency: 'Tous les 3-5 ans'
    })
  }

  // Dépistage diabète (45+ ans ou à risque)
  if (age >= 45) {
    recs.push({
      id: 'screening_diabetes',
      category: 'screening',
      priority: 'medium',
      title: 'Dépistage du diabète',
      description: 'Glycémie à jeun pour détecter un diabète de type 2.',
      reason: 'Le diabète peut être asymptomatique',
      action: 'Faire un dosage de la glycémie lors d\'un bilan sanguin',
      icon: '🩸',
      ageRelevant: '45+ ans',
      frequency: 'Tous les 3 ans'
    })
  }

  // Dépistage vision (seniors)
  if (age >= 60) {
    recs.push({
      id: 'screening_vision',
      category: 'screening',
      priority: 'medium',
      title: 'Contrôle de la vision',
      description:
        'Examen ophtalmologique complet incluant dépistage du glaucome et de la DMLA.',
      reason: 'Prévention des problèmes visuels liés à l\'âge',
      action: 'Consulter un ophtalmologiste',
      icon: '👁️',
      ageRelevant: '60+ ans',
      frequency: 'Tous les 2 ans'
    })
  }

  return recs
}

/**
 * Recommandations de mode de vie
 */
async function generateLifestyleRecommendations(
  membre: Membre,
  age: number | null,
  memberId: string
): Promise<HealthRecommendation[]> {
  const recs: HealthRecommendation[] = []

  if (!age) return recs

  // Activité physique
  recs.push({
    id: 'lifestyle_exercise',
    category: 'lifestyle',
    priority: 'medium',
    title: 'Activité physique régulière',
    description:
      'Au moins 30 minutes d\'activité modérée par jour, 5 jours par semaine pour maintenir une bonne santé.',
    reason: 'Prévention cardiovasculaire et maintien de la forme',
    action: 'Intégrer la marche, le vélo ou la natation à votre routine',
    icon: '🏃',
    frequency: 'Quotidien'
  })

  // Alimentation équilibrée
  recs.push({
    id: 'lifestyle_nutrition',
    category: 'lifestyle',
    priority: 'medium',
    title: 'Alimentation équilibrée',
    description:
      '5 fruits et légumes par jour, réduire le sel, le sucre et les graisses saturées.',
    reason: 'Base d\'une bonne santé générale',
    action: 'Privilégier les aliments frais et variés',
    icon: '🥗',
    frequency: 'Quotidien'
  })

  // Hydratation
  recs.push({
    id: 'lifestyle_hydration',
    category: 'lifestyle',
    priority: 'low',
    title: 'Hydratation suffisante',
    description: 'Boire 1.5 à 2 litres d\'eau par jour pour une bonne hydratation.',
    reason: 'Essentiel au bon fonctionnement du corps',
    action: 'Avoir toujours une bouteille d\'eau à portée',
    icon: '💧',
    frequency: 'Quotidien'
  })

  // Sommeil pour tous
  recs.push({
    id: 'lifestyle_sleep',
    category: 'lifestyle',
    priority: 'medium',
    title: 'Sommeil de qualité',
    description: '7 à 9 heures de sommeil par nuit pour les adultes.',
    reason: 'Récupération physique et mentale',
    action: 'Établir une routine de coucher régulière',
    icon: '😴',
    frequency: 'Quotidien'
  })

  // Gestion du stress
  if (age >= 25) {
    recs.push({
      id: 'lifestyle_stress',
      category: 'lifestyle',
      priority: 'low',
      title: 'Gestion du stress',
      description:
        'Pratiquer des techniques de relaxation (méditation, yoga, respiration profonde).',
      reason: 'Le stress chronique affecte la santé globale',
      action: 'Consacrer 10 minutes par jour à la relaxation',
      icon: '🧘',
      frequency: 'Quotidien'
    })
  }

  return recs
}

/**
 * Recommandations de prévention générale
 */
async function generatePreventionRecommendations(
  membre: Membre,
  age: number | null
): Promise<HealthRecommendation[]> {
  const recs: HealthRecommendation[] = []

  if (!age) return recs

  // Hygiène bucco-dentaire
  recs.push({
    id: 'prevention_dental',
    category: 'prevention',
    priority: 'low',
    title: 'Santé bucco-dentaire',
    description: 'Visite chez le dentiste au moins une fois par an pour un détartrage.',
    reason: 'Prévention des caries et maladies parodontales',
    action: 'Prendre rendez-vous pour un contrôle dentaire',
    icon: '🦷',
    frequency: 'Annuel'
  })

  // Protection solaire
  recs.push({
    id: 'prevention_sun',
    category: 'prevention',
    priority: 'low',
    title: 'Protection solaire',
    description:
      'Utiliser une crème solaire SPF 30+ et éviter l\'exposition entre 12h et 16h.',
    reason: 'Prévention du cancer de la peau et du vieillissement cutané',
    action: 'Appliquer une protection solaire quotidienne',
    icon: '☀️',
    frequency: 'Quotidien (été)'
  })

  // Santé mentale
  if (age >= 18) {
    recs.push({
      id: 'prevention_mental',
      category: 'prevention',
      priority: 'medium',
      title: 'Santé mentale',
      description:
        'N\'hésitez pas à consulter un psychologue si vous ressentez anxiété, tristesse ou stress.',
      reason: 'La santé mentale est aussi importante que la santé physique',
      action: 'Parler de vos préoccupations à un professionnel',
      icon: '🧠',
      frequency: 'Si besoin'
    })
  }

  return recs
}

/**
 * Obtient la couleur CSS selon la catégorie
 */
export function getRecommendationColor(category: RecommendationCategory): string {
  switch (category) {
    case 'checkup':
      return '#3498db' // Bleu
    case 'vaccination':
      return '#9b59b6' // Violet
    case 'lifestyle':
      return '#2ecc71' // Vert
    case 'screening':
      return '#e74c3c' // Rouge
    case 'prevention':
      return '#f39c12' // Orange
    case 'treatment':
      return '#1abc9c' // Turquoise
    default:
      return '#95a5a6' // Gris
  }
}

/**
 * Obtient le libellé de catégorie
 */
export function getRecommendationCategoryLabel(category: RecommendationCategory): string {
  switch (category) {
    case 'checkup':
      return 'Bilan de santé'
    case 'vaccination':
      return 'Vaccination'
    case 'lifestyle':
      return 'Mode de vie'
    case 'screening':
      return 'Dépistage'
    case 'prevention':
      return 'Prévention'
    case 'treatment':
      return 'Traitement'
    default:
      return 'Autre'
  }
}

/**
 * Obtient le libellé de priorité
 */
export function getRecommendationPriorityLabel(priority: RecommendationPriority): string {
  switch (priority) {
    case 'high':
      return 'Priorité élevée'
    case 'medium':
      return 'Priorité moyenne'
    case 'low':
      return 'Priorité faible'
    default:
      return 'Inconnue'
  }
}
