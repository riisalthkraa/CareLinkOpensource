/**
 * Calendrier vaccinal français 2024
 *
 * Basé sur le calendrier officiel de la HAS (Haute Autorité de Santé)
 * et du Ministère de la Santé français.
 *
 * @module vaccins-calendrier
 */

import { VaccinRecommande } from '../types'

/**
 * Liste des vaccins obligatoires et recommandés en France
 * organisés par âge d'administration
 */
export const calendrierVaccinal: VaccinRecommande[] = [
  // === NOURRISSONS (0-2 ans) ===
  {
    nom: 'Diphtérie, Tétanos, Poliomyélite (DTP)',
    description: 'Première dose du vaccin hexavalent',
    age_recommande: '2 mois',
    rappel: '11 mois, 6 ans, 11-13 ans, 25 ans, 45 ans, 65 ans, puis tous les 10 ans',
    obligatoire: true,
    details: 'Protège contre la diphtérie, le tétanos et la poliomyélite'
  },
  {
    nom: 'Coqueluche',
    description: 'Inclus dans le vaccin hexavalent',
    age_recommande: '2 mois',
    rappel: '11 mois, 6 ans, 11-13 ans, 25 ans',
    obligatoire: true,
    details: 'Protège contre la coqueluche acellulaire'
  },
  {
    nom: 'Haemophilus influenzae b (Hib)',
    description: 'Inclus dans le vaccin hexavalent',
    age_recommande: '2 mois',
    rappel: '11 mois',
    obligatoire: true,
    details: 'Prévient les méningites et septicémies à Hib'
  },
  {
    nom: 'Hépatite B',
    description: 'Inclus dans le vaccin hexavalent',
    age_recommande: '2 mois',
    rappel: '11 mois',
    obligatoire: true,
    details: 'Protection contre l\'hépatite B'
  },
  {
    nom: 'Pneumocoque',
    description: 'Vaccin conjugué 13-valent',
    age_recommande: '2 mois',
    rappel: '11 mois',
    obligatoire: true,
    details: 'Prévient les infections invasives à pneumocoque'
  },
  {
    nom: 'Méningocoque C',
    description: 'Vaccin conjugué',
    age_recommande: '5 mois',
    rappel: '12 mois',
    obligatoire: true,
    details: 'Protection contre les méningites à méningocoque C'
  },
  {
    nom: 'Rougeole, Oreillons, Rubéole (ROR)',
    description: 'Première dose',
    age_recommande: '12 mois',
    rappel: '16-18 mois',
    obligatoire: true,
    details: 'Triple protection virale'
  },

  // === ENFANTS (2-11 ans) ===
  {
    nom: 'DTP - Rappel 6 ans',
    description: 'Rappel Diphtérie, Tétanos, Poliomyélite',
    age_recommande: '6 ans',
    rappel: '11-13 ans, 25 ans, 45 ans, 65 ans, puis tous les 10 ans',
    obligatoire: false,
    details: 'Renforcement de l\'immunité'
  },
  {
    nom: 'Coqueluche - Rappel 6 ans',
    description: 'Rappel coqueluche acellulaire',
    age_recommande: '6 ans',
    rappel: '11-13 ans, 25 ans',
    obligatoire: false,
    details: 'Maintien de la protection'
  },

  // === ADOLESCENTS (11-18 ans) ===
  {
    nom: 'DTP - Rappel adolescent',
    description: 'Rappel Diphtérie, Tétanos, Poliomyélite',
    age_recommande: '11-13 ans',
    rappel: '25 ans, 45 ans, 65 ans, puis tous les 10 ans',
    obligatoire: false,
    details: 'Renforcement avant l\'âge adulte'
  },
  {
    nom: 'Papillomavirus humain (HPV)',
    description: 'Gardasil 9 (2 ou 3 doses)',
    age_recommande: '11-14 ans',
    rappel: undefined,
    obligatoire: false,
    details: 'Prévention des cancers liés au HPV (pour tous, filles et garçons)'
  },
  {
    nom: 'Méningocoque ACWY',
    description: 'Vaccin conjugué tétravalent',
    age_recommande: '11-14 ans',
    rappel: undefined,
    obligatoire: false,
    details: 'Recommandé pour les adolescents et jeunes adultes'
  },
  {
    nom: 'Méningocoque B',
    description: 'Vaccin Bexsero',
    age_recommande: '11-14 ans',
    rappel: undefined,
    obligatoire: false,
    details: 'Recommandé pour les adolescents'
  },

  // === ADULTES ===
  {
    nom: 'DTP - Rappel 25 ans',
    description: 'Rappel Diphtérie, Tétanos, Poliomyélite, Coqueluche',
    age_recommande: '25 ans',
    rappel: '45 ans, 65 ans, puis tous les 10 ans',
    obligatoire: false,
    details: 'Maintien de l\'immunité à l\'âge adulte'
  },
  {
    nom: 'DTP - Rappel 45 ans',
    description: 'Rappel Diphtérie, Tétanos, Poliomyélite',
    age_recommande: '45 ans',
    rappel: '65 ans, puis tous les 10 ans',
    obligatoire: false,
    details: 'Poursuite de la protection'
  },
  {
    nom: 'DTP - Rappel 65 ans',
    description: 'Rappel Diphtérie, Tétanos, Poliomyélite',
    age_recommande: '65 ans',
    rappel: 'Puis tous les 10 ans',
    obligatoire: false,
    details: 'Protection des seniors'
  },
  {
    nom: 'Grippe saisonnière',
    description: 'Vaccin annuel',
    age_recommande: '65 ans et plus',
    rappel: 'Annuel',
    obligatoire: false,
    details: 'Recommandé chaque automne pour les personnes à risque'
  },
  {
    nom: 'Zona',
    description: 'Zostavax ou Shingrix',
    age_recommande: '65-74 ans',
    rappel: undefined,
    obligatoire: false,
    details: 'Prévention du zona et de ses complications'
  },
  {
    nom: 'Pneumocoque - Adulte',
    description: 'Vaccin polysaccharidique',
    age_recommande: '65 ans et plus',
    rappel: undefined,
    obligatoire: false,
    details: 'Recommandé pour les personnes à risque et les seniors'
  },

  // === VACCINS SPÉCIFIQUES ===
  {
    nom: 'COVID-19',
    description: 'Vaccin à ARN messager ou vecteur viral',
    age_recommande: '6 mois et plus',
    rappel: 'Selon les recommandations en vigueur',
    obligatoire: false,
    details: 'Protection contre le SARS-CoV-2 et ses variants'
  },
  {
    nom: 'BCG (Tuberculose)',
    description: 'Vaccin vivant atténué',
    age_recommande: 'Enfants à risque',
    rappel: undefined,
    obligatoire: false,
    details: 'Recommandé pour les enfants à risque élevé de tuberculose'
  },
  {
    nom: 'Varicelle',
    description: 'Vaccin vivant atténué',
    age_recommande: '12-18 mois (si non immunisé)',
    rappel: undefined,
    obligatoire: false,
    details: 'Recommandé pour les enfants et adultes non immunisés'
  },
  {
    nom: 'Hépatite A',
    description: 'Vaccin inactivé',
    age_recommande: 'Selon exposition',
    rappel: '6-12 mois après la 1ère dose',
    obligatoire: false,
    details: 'Recommandé pour les voyageurs et personnes à risque'
  },
  {
    nom: 'Fièvre jaune',
    description: 'Vaccin vivant atténué',
    age_recommande: 'Voyageurs en zone endémique',
    rappel: undefined,
    obligatoire: false,
    details: 'Obligatoire pour certaines destinations'
  }
]

/**
 * Retourne les vaccins recommandés pour un âge donné
 *
 * @param ageEnMois L'âge en mois
 * @returns Liste des vaccins recommandés pour cet âge
 */
export function getVaccinsParAge(ageEnMois: number): VaccinRecommande[] {
  // Logique simplifiée - à améliorer selon besoin
  const ageEnAnnees = Math.floor(ageEnMois / 12)

  return calendrierVaccinal.filter(vaccin => {
    // Cette fonction pourrait être améliorée pour mieux parser les âges
    return true // Pour l'instant, retourner tous
  })
}

/**
 * Retourne seulement les vaccins obligatoires
 */
export function getVaccinsObligatoires(): VaccinRecommande[] {
  return calendrierVaccinal.filter(v => v.obligatoire)
}

/**
 * Retourne seulement les vaccins recommandés (non obligatoires)
 */
export function getVaccinsRecommandes(): VaccinRecommande[] {
  return calendrierVaccinal.filter(v => !v.obligatoire)
}
