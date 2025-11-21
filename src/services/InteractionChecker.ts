/**
 * InteractionChecker - Service de vérification des interactions médicamenteuses
 *
 * Ce service permet de:
 * - Vérifier les interactions entre médicaments
 * - Détecter les doublons de substances actives
 * - Vérifier les contre-indications allergiques
 * - Évaluer le niveau de gravité des interactions
 * - Fournir des recommandations personnalisées
 *
 * @module InteractionChecker
 */

import {
  Traitement,
  Allergie,
  InteractionMedicamenteuse,
  ResultatVerificationInteraction,
  InteractionDetectee,
  InteractionAllergique,
  NiveauGravite
} from '../types'
import {
  INTERACTIONS_DATABASE,
  obtenirSubstanceActive,
  normaliserNomMedicament
} from '../data/interactions-medicaments'

/**
 * Vérifie les interactions entre un nouveau médicament et les traitements existants
 *
 * @param nouveauMedicament - Nom du médicament à ajouter
 * @param traitementsActuels - Liste des traitements en cours
 * @returns Résultat de la vérification avec détails des interactions
 */
export function verifierInteractions(
  nouveauMedicament: string,
  traitementsActuels: Traitement[]
): ResultatVerificationInteraction {
  const interactions: InteractionDetectee[] = []
  const substanceNouveau = obtenirSubstanceActive(nouveauMedicament)

  // Parcourir tous les traitements actuels
  for (const traitement of traitementsActuels) {
    const substanceExistant = obtenirSubstanceActive(traitement.nom_medicament)

    // Chercher une interaction dans la base de données
    const interaction = chercherInteraction(substanceNouveau, substanceExistant)

    if (interaction) {
      // Créer un traitement temporaire pour le nouveau médicament
      const nouveauTraitement: Traitement = {
        id: 0,
        membre_id: traitement.membre_id,
        nom_medicament: nouveauMedicament,
        actif: 1
      }

      interactions.push({
        interaction,
        medicament1: nouveauTraitement,
        medicament2: traitement
      })
    }
  }

  // Analyser les résultats
  const hasContraindications = interactions.some(
    i => i.interaction.gravite === 'contre-indication'
  )
  const hasPrecautions = interactions.some(
    i => i.interaction.gravite === 'precaution'
  )

  return {
    hasInteractions: interactions.length > 0,
    interactions,
    hasContraindications,
    hasPrecautions
  }
}

/**
 * Vérifie les interactions entre tous les traitements existants
 * Utile pour un check-up complet de la médication
 *
 * @param traitements - Liste de tous les traitements
 * @returns Résultat de la vérification globale
 */
export function verifierTousLesTraitements(
  traitements: Traitement[]
): ResultatVerificationInteraction {
  const interactions: InteractionDetectee[] = []

  // Vérifier chaque paire de médicaments
  for (let i = 0; i < traitements.length; i++) {
    for (let j = i + 1; j < traitements.length; j++) {
      const med1 = traitements[i]
      const med2 = traitements[j]

      const substance1 = obtenirSubstanceActive(med1.nom_medicament)
      const substance2 = obtenirSubstanceActive(med2.nom_medicament)

      const interaction = chercherInteraction(substance1, substance2)

      if (interaction) {
        interactions.push({
          interaction,
          medicament1: med1,
          medicament2: med2
        })
      }
    }
  }

  const hasContraindications = interactions.some(
    i => i.interaction.gravite === 'contre-indication'
  )
  const hasPrecautions = interactions.some(
    i => i.interaction.gravite === 'precaution'
  )

  return {
    hasInteractions: interactions.length > 0,
    interactions,
    hasContraindications,
    hasPrecautions
  }
}

/**
 * Vérifie les contre-indications allergiques
 *
 * @param medicament - Nom du médicament à vérifier
 * @param allergies - Liste des allergies du patient
 * @returns Liste des interactions allergiques détectées
 */
export function verifierAllergies(
  medicament: string,
  allergies: Allergie[]
): InteractionAllergique[] {
  const interactionsAllergiques: InteractionAllergique[] = []
  const substanceMedicament = obtenirSubstanceActive(medicament)

  for (const allergie of allergies) {
    const nomAllergieNormalise = normaliserNomMedicament(allergie.nom_allergie)

    // Vérifier si le médicament contient l'allergène
    if (
      substanceMedicament.includes(nomAllergieNormalise) ||
      nomAllergieNormalise.includes(substanceMedicament)
    ) {
      // Déterminer la gravité selon la sévérité de l'allergie
      let gravite: NiveauGravite = 'contre-indication'
      if (allergie.severite === 'legere' || allergie.severite === 'légère') {
        gravite = 'precaution'
      }

      interactionsAllergiques.push({
        medicament: medicament,
        allergie: allergie.nom_allergie,
        gravite,
        description: `Le patient est allergique à ${allergie.nom_allergie}. Ce médicament contient ou est apparenté à cette substance.`,
        recommendation: gravite === 'contre-indication'
          ? 'NE PAS ADMINISTRER. Consulter immédiatement un médecin.'
          : 'Prudence requise. Surveillance médicale recommandée.'
      })
    }

    // Vérifications spécifiques pour allergies courantes
    if (nomAllergieNormalise.includes('penicilline') &&
        (substanceMedicament.includes('amoxicilline') || substanceMedicament.includes('ampicilline'))) {
      interactionsAllergiques.push({
        medicament: medicament,
        allergie: allergie.nom_allergie,
        gravite: 'contre-indication',
        description: 'Allergie à la pénicilline. Ce médicament fait partie de la famille des pénicillines.',
        recommendation: 'CONTRE-INDICATION ABSOLUE. Ne pas administrer. Utiliser une alternative (macrolides, fluoroquinolones).'
      })
    }

    if (nomAllergieNormalise.includes('aspirine') &&
        (substanceMedicament.includes('ains') || substanceMedicament.includes('ibuprofene'))) {
      interactionsAllergiques.push({
        medicament: medicament,
        allergie: allergie.nom_allergie,
        gravite: 'contre-indication',
        description: 'Allergie à l\'aspirine. Risque de réaction croisée avec les autres AINS.',
        recommendation: 'Éviter tous les AINS. Préférer le paracétamol.'
      })
    }
  }

  return interactionsAllergiques
}

/**
 * Recherche une interaction entre deux médicaments dans la base de données
 *
 * @param medicament1 - Première substance active
 * @param medicament2 - Deuxième substance active
 * @returns L'interaction trouvée ou undefined
 */
function chercherInteraction(
  medicament1: string,
  medicament2: string
): InteractionMedicamenteuse | undefined {
  const med1Norm = normaliserNomMedicament(medicament1)
  const med2Norm = normaliserNomMedicament(medicament2)

  // Chercher dans les deux sens (A-B et B-A)
  return INTERACTIONS_DATABASE.find(interaction => {
    const int1Norm = normaliserNomMedicament(interaction.medicament1)
    const int2Norm = normaliserNomMedicament(interaction.medicament2)

    return (
      (med1Norm === int1Norm && med2Norm === int2Norm) ||
      (med1Norm === int2Norm && med2Norm === int1Norm) ||
      (med1Norm.includes(int1Norm) && med2Norm.includes(int2Norm)) ||
      (med1Norm.includes(int2Norm) && med2Norm.includes(int1Norm))
    )
  })
}

/**
 * Obtient une couleur CSS selon le niveau de gravité
 *
 * @param gravite - Niveau de gravité
 * @returns Code couleur CSS
 */
export function getCouleurGravite(gravite: NiveauGravite): string {
  switch (gravite) {
    case 'contre-indication':
      return '#e74c3c' // Rouge
    case 'precaution':
      return '#e67e22' // Orange
    case 'surveillance':
      return '#f39c12' // Jaune/Orange
    case 'info':
      return '#3498db' // Bleu
    default:
      return '#95a5a6' // Gris
  }
}

/**
 * Obtient une icône selon le niveau de gravité
 *
 * @param gravite - Niveau de gravité
 * @returns Emoji icône
 */
export function getIconeGravite(gravite: NiveauGravite): string {
  switch (gravite) {
    case 'contre-indication':
      return '🚫'
    case 'precaution':
      return '⚠️'
    case 'surveillance':
      return '👁️'
    case 'info':
      return 'ℹ️'
    default:
      return '📋'
  }
}

/**
 * Obtient un libellé lisible du niveau de gravité
 *
 * @param gravite - Niveau de gravité
 * @returns Libellé en français
 */
export function getLibelleGravite(gravite: NiveauGravite): string {
  switch (gravite) {
    case 'contre-indication':
      return 'Contre-indication'
    case 'precaution':
      return 'Précaution'
    case 'surveillance':
      return 'Surveillance requise'
    case 'info':
      return 'Information'
    default:
      return 'Non classé'
  }
}

/**
 * Génère un message d'alerte personnalisé
 *
 * @param resultat - Résultat de la vérification
 * @returns Message d'alerte formaté
 */
export function genererMessageAlerte(resultat: ResultatVerificationInteraction): string {
  if (!resultat.hasInteractions) {
    return 'Aucune interaction détectée.'
  }

  let message = ''

  if (resultat.hasContraindications) {
    const nbContre = resultat.interactions.filter(
      i => i.interaction.gravite === 'contre-indication'
    ).length
    message += `⛔ ${nbContre} contre-indication(s) détectée(s).\n`
  }

  if (resultat.hasPrecautions) {
    const nbPrecautions = resultat.interactions.filter(
      i => i.interaction.gravite === 'precaution'
    ).length
    message += `⚠️ ${nbPrecautions} précaution(s) à prendre.\n`
  }

  message += '\nConsultez un médecin ou pharmacien avant de prendre ce médicament.'

  return message
}
