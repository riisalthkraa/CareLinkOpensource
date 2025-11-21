/**
 * QRCodeService - Service de génération de QR codes pour cartes d'urgence
 *
 * Ce service permet de:
 * - Générer des QR codes contenant les informations médicales critiques
 * - Encoder les données en format JSON compact
 * - Créer des QR codes au format base64 pour affichage/impression
 *
 * Format des données encodées:
 * - Nom et prénom du membre
 * - Groupe sanguin et rhésus
 * - Allergies critiques
 * - Traitements en cours
 * - Contact d'urgence
 *
 * @module QRCodeService
 */

import QRCode from 'qrcode'
import { Membre, Allergie, Traitement } from '../types'

/**
 * Interface des données d'urgence à encoder dans le QR code
 */
export interface DonneesUrgence {
  nom: string
  prenom: string
  age: number
  groupeSanguin?: string
  rhesus?: string
  allergies: string[]
  traitements: string[]
  contactUrgence?: {
    nom: string
    telephone: string
    relation?: string
  }
  numeroSecuriteSociale?: string
  dateGeneration: string
}

/**
 * Génère un QR code au format base64 contenant les informations d'urgence
 *
 * @param membre - Le membre de la famille
 * @param allergies - Liste des allergies du membre
 * @param traitements - Liste des traitements actifs du membre
 * @returns Promise<string> - Le QR code en base64
 */
export async function genererQRCodeUrgence(
  membre: Membre,
  allergies: Allergie[],
  traitements: Traitement[]
): Promise<string> {
  // Calculer l'âge
  const age = calculerAge(membre.date_naissance)

  // Préparer les données d'urgence
  const donneesUrgence: DonneesUrgence = {
    nom: membre.nom,
    prenom: membre.prenom,
    age: age,
    dateGeneration: new Date().toISOString()
  }

  // Ajouter le groupe sanguin si disponible
  if (membre.groupe_sanguin) {
    donneesUrgence.groupeSanguin = membre.groupe_sanguin
    donneesUrgence.rhesus = membre.rhesus || undefined
  }

  // Ajouter les allergies
  donneesUrgence.allergies = allergies.map(a =>
    `${a.nom_allergie}${a.severite ? ' (' + a.severite + ')' : ''}`
  )

  // Ajouter les traitements actifs
  donneesUrgence.traitements = traitements
    .filter(t => t.actif === 1)
    .map(t => `${t.nom_medicament}${t.dosage ? ' ' + t.dosage : ''}`)

  // Ajouter le contact d'urgence si disponible
  if (membre.contact_urgence_nom || membre.contact_urgence_telephone) {
    donneesUrgence.contactUrgence = {
      nom: membre.contact_urgence_nom || 'Non renseigné',
      telephone: membre.contact_urgence_telephone || 'Non renseigné',
      relation: membre.contact_urgence_relation || undefined
    }
  }

  // Ajouter le numéro de sécurité sociale (4 derniers chiffres seulement pour sécurité)
  if (membre.numero_securite_sociale) {
    const numSecu = membre.numero_securite_sociale.replace(/\s/g, '')
    donneesUrgence.numeroSecuriteSociale = '***' + numSecu.slice(-4)
  }

  // Encoder en JSON
  const jsonData = JSON.stringify(donneesUrgence, null, 0)

  // Générer le QR code au format base64
  try {
    const qrCodeBase64 = await QRCode.toDataURL(jsonData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrCodeBase64
  } catch (error) {
    console.error('Erreur génération QR code:', error)
    throw new Error('Impossible de générer le QR code')
  }
}

/**
 * Génère un QR code simplifié pour affichage rapide
 *
 * @param membre - Le membre de la famille
 * @returns Promise<string> - Le QR code en base64
 */
export async function genererQRCodeSimple(membre: Membre): Promise<string> {
  const data = {
    nom: `${membre.prenom} ${membre.nom}`,
    age: calculerAge(membre.date_naissance),
    groupe: membre.groupe_sanguin && membre.rhesus
      ? `${membre.groupe_sanguin}${membre.rhesus}`
      : 'Non renseigné',
    urgence: membre.contact_urgence_telephone || 'Non renseigné'
  }

  const texte = `URGENCE MÉDICALE
Nom: ${data.nom}
Âge: ${data.age} ans
Groupe sanguin: ${data.groupe}
Contact: ${data.urgence}`

  try {
    return await QRCode.toDataURL(texte, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 1
    })
  } catch (error) {
    console.error('Erreur génération QR code simple:', error)
    throw new Error('Impossible de générer le QR code')
  }
}

/**
 * Décode un QR code pour récupérer les données d'urgence
 *
 * @param jsonData - Les données JSON extraites du QR code
 * @returns DonneesUrgence - Les données d'urgence décodées
 */
export function decoderQRCodeUrgence(jsonData: string): DonneesUrgence {
  try {
    const donnees: DonneesUrgence = JSON.parse(jsonData)
    return donnees
  } catch (error) {
    console.error('Erreur décodage QR code:', error)
    throw new Error('Format de QR code invalide')
  }
}

/**
 * Calcule l'âge à partir d'une date de naissance
 *
 * @param dateNaissance - Date de naissance au format YYYY-MM-DD
 * @returns number - L'âge en années
 */
function calculerAge(dateNaissance: string): number {
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Télécharge le QR code dans le dossier Téléchargements
 *
 * @param qrCodeBase64 - Le QR code en base64
 * @param nomFichier - Nom du fichier à télécharger
 */
export async function telechargerQRCode(
  qrCodeBase64: string,
  nomFichier: string = 'qrcode-urgence.png'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const result = await window.electronAPI.saveToDownloads(nomFichier, qrCodeBase64, 'base64')
    return result
  } catch (error: any) {
    console.error('Erreur téléchargement QR code:', error)
    return { success: false, error: error.message }
  }
}
