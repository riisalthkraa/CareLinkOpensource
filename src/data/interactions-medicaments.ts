/**
 * Base de données locale des interactions médicamenteuses courantes
 *
 * Cette base contient les interactions les plus fréquentes et importantes
 * à surveiller en médecine générale française.
 *
 * Sources:
 * - ANSM (Agence Nationale de Sécurité du Médicament)
 * - Thériaque (base de données du CNHIM)
 * - Vidal (interactions principales)
 *
 * AVERTISSEMENT: Cette base n'est pas exhaustive et ne remplace pas
 * l'avis d'un professionnel de santé. Elle est fournie à titre informatif.
 *
 * @module interactions-medicaments
 */

import { InteractionMedicamenteuse } from '../types'

/**
 * Base de données des interactions médicamenteuses
 *
 * Format des noms:
 * - Noms commerciaux en minuscules (ex: "doliprane", "aspegic")
 * - Substances actives en minuscules (ex: "paracetamol", "ibuprofene")
 * - Les deux formats sont supportés pour flexibilité
 */
export const INTERACTIONS_DATABASE: InteractionMedicamenteuse[] = [
  // ========== ANTI-INFLAMMATOIRES (AINS) ==========
  {
    medicament1: 'ibuprofene',
    medicament2: 'aspirine',
    gravite: 'contre-indication',
    description: 'Association de deux AINS augmente significativement le risque d\'ulcères gastro-intestinaux et de saignements.',
    recommendation: 'Ne jamais associer deux AINS. Consulter un médecin immédiatement.',
    alternatives: ['paracetamol']
  },
  {
    medicament1: 'ibuprofene',
    medicament2: 'advil',
    gravite: 'contre-indication',
    description: 'Doublon: Advil contient de l\'ibuprofène. Risque de surdosage.',
    recommendation: 'Ne prendre qu\'un seul médicament contenant de l\'ibuprofène.',
    alternatives: ['paracetamol']
  },
  {
    medicament1: 'ibuprofene',
    medicament2: 'naproxene',
    gravite: 'contre-indication',
    description: 'Association de deux AINS. Risque élevé de complications gastro-intestinales.',
    recommendation: 'Éviter cette association. Consulter un médecin.',
    alternatives: ['paracetamol']
  },
  {
    medicament1: 'ibuprofene',
    medicament2: 'anticoagulant',
    gravite: 'precaution',
    description: 'Les AINS augmentent le risque de saignement chez les patients sous anticoagulants.',
    recommendation: 'Surveillance médicale renforcée. Préférer le paracétamol.',
    alternatives: ['paracetamol']
  },
  {
    medicament1: 'ibuprofene',
    medicament2: 'cortisone',
    gravite: 'precaution',
    description: 'Augmentation du risque d\'ulcères et de saignements digestifs.',
    recommendation: 'Association possible mais nécessite surveillance médicale et protection gastrique.',
    alternatives: []
  },

  // ========== ANTIDOULEURS ==========
  {
    medicament1: 'paracetamol',
    medicament2: 'doliprane',
    gravite: 'contre-indication',
    description: 'Doublon: Doliprane contient du paracétamol. Risque de surdosage hépatique grave.',
    recommendation: 'Ne jamais dépasser 4g de paracétamol par jour tous médicaments confondus.',
    alternatives: []
  },
  {
    medicament1: 'paracetamol',
    medicament2: 'dafalgan',
    gravite: 'contre-indication',
    description: 'Doublon: Dafalgan contient du paracétamol. Risque de toxicité hépatique.',
    recommendation: 'Vérifier la dose totale de paracétamol. Maximum 4g/jour.',
    alternatives: []
  },
  {
    medicament1: 'paracetamol',
    medicament2: 'efferalgan',
    gravite: 'contre-indication',
    description: 'Doublon: Efferalgan contient du paracétamol.',
    recommendation: 'Un seul médicament à base de paracétamol à la fois.',
    alternatives: []
  },
  {
    medicament1: 'tramadol',
    medicament2: 'codeine',
    gravite: 'contre-indication',
    description: 'Association de deux opioïdes. Risque de dépression respiratoire et de dépendance.',
    recommendation: 'Ne jamais associer deux opioïdes sans avis médical.',
    alternatives: []
  },

  // ========== ANTIBIOTIQUES ==========
  {
    medicament1: 'amoxicilline',
    medicament2: 'methotrexate',
    gravite: 'precaution',
    description: 'Augmentation de la toxicité du méthotrexate.',
    recommendation: 'Surveillance biologique renforcée. Adaptation des doses possible.',
    alternatives: []
  },
  {
    medicament1: 'ciprofloxacine',
    medicament2: 'theophylline',
    gravite: 'precaution',
    description: 'Augmentation des concentrations de théophylline avec risque de surdosage.',
    recommendation: 'Surveillance des taux de théophylline et adaptation posologique.',
    alternatives: []
  },
  {
    medicament1: 'clarithromycine',
    medicament2: 'statine',
    gravite: 'precaution',
    description: 'Augmentation du risque de rhabdomyolyse (destruction musculaire).',
    recommendation: 'Surveillance clinique étroite. Arrêt temporaire de la statine possible.',
    alternatives: ['azithromycine']
  },

  // ========== CARDIOVASCULAIRES ==========
  {
    medicament1: 'aspirine',
    medicament2: 'anticoagulant',
    gravite: 'precaution',
    description: 'Augmentation importante du risque hémorragique.',
    recommendation: 'Association parfois nécessaire mais nécessite surveillance médicale stricte.',
    alternatives: []
  },
  {
    medicament1: 'betabloquant',
    medicament2: 'verapamil',
    gravite: 'contre-indication',
    description: 'Risque de bradycardie sévère et de troubles de la conduction cardiaque.',
    recommendation: 'Association déconseillée. Choisir une autre classe thérapeutique.',
    alternatives: []
  },
  {
    medicament1: 'diuretique',
    medicament2: 'lithium',
    gravite: 'precaution',
    description: 'Augmentation des taux de lithium avec risque de toxicité.',
    recommendation: 'Surveillance régulière de la lithémie et adaptation des doses.',
    alternatives: []
  },

  // ========== PSYCHOTROPES ==========
  {
    medicament1: 'antidepresseur',
    medicament2: 'tramadol',
    gravite: 'precaution',
    description: 'Risque de syndrome sérotoninergique (rare mais grave).',
    recommendation: 'Surveillance clinique. Préférer un autre antalgique si possible.',
    alternatives: ['paracetamol', 'ibuprofene']
  },
  {
    medicament1: 'benzodiazepine',
    medicament2: 'alcool',
    gravite: 'contre-indication',
    description: 'Majoration de la sédation et des troubles de la vigilance. Risque d\'accidents.',
    recommendation: 'Éviter toute consommation d\'alcool sous benzodiazépines.',
    alternatives: []
  },
  {
    medicament1: 'antidepresseur',
    medicament2: 'imao',
    gravite: 'contre-indication',
    description: 'Risque de syndrome sérotoninergique potentiellement mortel.',
    recommendation: 'Délai de 2 semaines minimum entre les deux traitements.',
    alternatives: []
  },

  // ========== ANTIHISTAMINIQUES ==========
  {
    medicament1: 'antihistaminique',
    medicament2: 'alcool',
    gravite: 'precaution',
    description: 'Augmentation de la somnolence et baisse de vigilance.',
    recommendation: 'Éviter l\'alcool. Ne pas conduire si somnolence.',
    alternatives: []
  },
  {
    medicament1: 'cetirizine',
    medicament2: 'loratadine',
    gravite: 'info',
    description: 'Doublon: deux antihistaminiques de même génération.',
    recommendation: 'Un seul antihistaminique suffit généralement.',
    alternatives: []
  },

  // ========== DIABÈTE ==========
  {
    medicament1: 'metformine',
    medicament2: 'alcool',
    gravite: 'precaution',
    description: 'Risque d\'acidose lactique, particulièrement en cas de consommation excessive.',
    recommendation: 'Limiter la consommation d\'alcool. Éviter les excès.',
    alternatives: []
  },
  {
    medicament1: 'insuline',
    medicament2: 'betabloquant',
    gravite: 'surveillance',
    description: 'Les bêta-bloquants peuvent masquer les symptômes d\'hypoglycémie.',
    recommendation: 'Surveillance glycémique renforcée. Éducation du patient.',
    alternatives: []
  },

  // ========== GASTRO-INTESTINAUX ==========
  {
    medicament1: 'omeprazole',
    medicament2: 'clopidogrel',
    gravite: 'precaution',
    description: 'Diminution de l\'efficacité du clopidogrel (protection cardiaque).',
    recommendation: 'Préférer un autre inhibiteur de la pompe à protons (pantoprazole).',
    alternatives: ['pantoprazole']
  },

  // ========== INTERACTIONS AVEC ALIMENTS ==========
  {
    medicament1: 'anticoagulant',
    medicament2: 'vitamine k',
    gravite: 'surveillance',
    description: 'Les aliments riches en vitamine K réduisent l\'efficacité des AVK.',
    recommendation: 'Maintenir une alimentation équilibrée et régulière. Surveillance INR.',
    alternatives: []
  },
  {
    medicament1: 'levothyrox',
    medicament2: 'calcium',
    gravite: 'surveillance',
    description: 'Le calcium diminue l\'absorption de la lévothyroxine.',
    recommendation: 'Prendre la lévothyroxine à jeun, 2h avant le calcium.',
    alternatives: []
  }
]

/**
 * Liste des substances actives communes avec leurs noms commerciaux
 * Permet de faire correspondre les noms de médicaments
 */
export const MEDICAMENTS_EQUIVALENCES: { [key: string]: string[] } = {
  'paracetamol': ['doliprane', 'dafalgan', 'efferalgan', 'paracetamol'],
  'ibuprofene': ['advil', 'nurofen', 'ibuprofene', 'antarene'],
  'aspirine': ['aspegic', 'kardegic', 'aspirine'],
  'amoxicilline': ['clamoxyl', 'amoxicilline'],
  'omeprazole': ['mopral', 'omeprazole'],
  'metformine': ['glucophage', 'stagid', 'metformine'],
  'levothyrox': ['levothyrox', 'l-thyroxine'],
  'tramadol': ['contramal', 'topalgic', 'tramadol'],
  'codeine': ['codeine', 'dafalgan codeine'],
  'cetirizine': ['zyrtec', 'cetirizine'],
  'loratadine': ['clarityne', 'loratadine']
}

/**
 * Normalise un nom de médicament pour la recherche
 * Convertit en minuscules et supprime les espaces
 */
export function normaliserNomMedicament(nom: string): string {
  return nom.toLowerCase().trim()
}

/**
 * Obtient la substance active à partir d'un nom commercial
 */
export function obtenirSubstanceActive(nomMedicament: string): string {
  const nomNormalise = normaliserNomMedicament(nomMedicament)

  for (const [substanceActive, noms] of Object.entries(MEDICAMENTS_EQUIVALENCES)) {
    if (noms.includes(nomNormalise)) {
      return substanceActive
    }
  }

  return nomNormalise
}
