/**
 * OCRService - Service d'extraction de texte depuis des images d'ordonnances
 *
 * Utilise Tesseract.js pour:
 * - Extraire le texte des ordonnances scannées/photographiées
 * - Identifier les médicaments, dosages et posologies
 * - Détecter les dates de validité
 * - Reconnaître le format français des ordonnances CPAM
 *
 * @module OCRService
 */

import Tesseract from 'tesseract.js'

/**
 * Interface des données extraites d'une ordonnance
 */
export interface DonneesOrdonnance {
  texteComplet: string
  medicaments: MedicamentExtrait[]
  dateOrdonnance?: string
  dateValidite?: string
  medecin?: string
  patient?: string
  confidence: number // Score de confiance global (0-100)
}

/**
 * Interface d'un médicament extrait
 */
export interface MedicamentExtrait {
  nom: string
  dosage?: string
  posologie?: string
  duree?: string
  confidence: number
}

/**
 * Callback de progression de l'OCR
 */
export type OCRProgressCallback = (progress: number, status: string) => void

/**
 * Extrait le texte d'une image d'ordonnance
 *
 * @param imageFile - Fichier image (File ou Blob)
 * @param onProgress - Callback de progression (optionnel)
 * @returns Promise avec les données extraites
 */
export async function extraireTexteOrdonnance(
  imageFile: File | Blob,
  onProgress?: OCRProgressCallback
): Promise<DonneesOrdonnance> {
  try {
    // Créer une URL temporaire pour l'image
    const imageUrl = URL.createObjectURL(imageFile)

    // Effectuer l'OCR avec Tesseract
    const result = await Tesseract.recognize(
      imageUrl,
      'fra', // Langue française
      {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            onProgress(progress, m.status)
          }
        }
      }
    )

    // Nettoyer l'URL temporaire
    URL.revokeObjectURL(imageUrl)

    // Extraire les informations structurées
    const donnees = analyserTexteOrdonnance(result.data.text, result.data.confidence)

    return donnees
  } catch (error) {
    console.error('Erreur OCR:', error)
    throw new Error('Impossible d\'extraire le texte de l\'image')
  }
}

/**
 * Analyse le texte extrait pour identifier les éléments structurés
 *
 * @param texte - Texte brut extrait par l'OCR
 * @param confidence - Score de confiance de l'OCR
 * @returns Données structurées de l'ordonnance
 */
function analyserTexteOrdonnance(texte: string, confidence: number): DonneesOrdonnance {
  const lignes = texte.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const donnees: DonneesOrdonnance = {
    texteComplet: texte,
    medicaments: [],
    confidence: confidence
  }

  // Extraire la date de l'ordonnance
  donnees.dateOrdonnance = extraireDate(texte)

  // Extraire les informations du médecin
  donnees.medecin = extraireMedecin(texte)

  // Extraire les médicaments
  donnees.medicaments = extraireMedicaments(lignes)

  // Calculer la date de validité (ordonnance valable 3 mois en France)
  if (donnees.dateOrdonnance) {
    const date = new Date(donnees.dateOrdonnance)
    date.setMonth(date.getMonth() + 3)
    donnees.dateValidite = date.toISOString().split('T')[0]
  }

  return donnees
}

/**
 * Extrait la date de l'ordonnance
 */
function extraireDate(texte: string): string | undefined {
  // Formats de date français: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const regexDate = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/
  const match = texte.match(regexDate)

  if (match) {
    const jour = match[1].padStart(2, '0')
    const mois = match[2].padStart(2, '0')
    const annee = match[3]
    return `${annee}-${mois}-${jour}` // Format ISO
  }

  return undefined
}

/**
 * Extrait le nom du médecin
 */
function extraireMedecin(texte: string): string | undefined {
  // Chercher "Dr" ou "Docteur"
  const regexMedecin = /(?:Dr|Docteur|Dr\.)[\s\.]+([\w\s\-]+)/i
  const match = texte.match(regexMedecin)

  if (match) {
    return match[1].trim()
  }

  return undefined
}

/**
 * Extrait les médicaments du texte
 */
function extraireMedicaments(lignes: string[]): MedicamentExtrait[] {
  const medicaments: MedicamentExtrait[] = []

  // Mots-clés indiquant une posologie
  const motsClesPosologie = [
    'comprimé', 'comprimés', 'gélule', 'gélules',
    'fois', 'par jour', 'matin', 'soir', 'midi',
    'sachet', 'cuillère', 'goutte', 'gouttes',
    'mg', 'g', 'ml'
  ]

  let medicamentCourant: Partial<MedicamentExtrait> | null = null

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i]

    // Ignorer les lignes trop courtes ou qui sont clairement pas des médicaments
    if (ligne.length < 3) continue

    // Détecter un nom de médicament (généralement en majuscules ou commence par une majuscule)
    const estNomMedicament = /^[A-Z][A-Za-z\s\-]+/.test(ligne) &&
                             !ligne.toLowerCase().includes('docteur') &&
                             !ligne.toLowerCase().includes('patient')

    if (estNomMedicament) {
      // Si on avait un médicament en cours, le sauvegarder
      if (medicamentCourant && medicamentCourant.nom) {
        medicaments.push({
          nom: medicamentCourant.nom,
          dosage: medicamentCourant.dosage,
          posologie: medicamentCourant.posologie,
          duree: medicamentCourant.duree,
          confidence: 75 // Score arbitraire
        })
      }

      // Commencer un nouveau médicament
      medicamentCourant = {
        nom: ligne.trim()
      }

      // Essayer d'extraire le dosage directement du nom
      const regexDosage = /(\d+\s*(?:mg|g|ml|%|UI))/i
      const matchDosage = ligne.match(regexDosage)
      if (matchDosage) {
        medicamentCourant.dosage = matchDosage[1]
      }
    } else if (medicamentCourant) {
      // Cette ligne peut contenir des infos complémentaires sur le médicament

      // Chercher une posologie
      const contientPosologie = motsClesPosologie.some(mot =>
        ligne.toLowerCase().includes(mot)
      )

      if (contientPosologie) {
        if (!medicamentCourant.posologie) {
          medicamentCourant.posologie = ligne
        } else {
          medicamentCourant.posologie += ' ' + ligne
        }
      }

      // Chercher une durée de traitement
      const regexDuree = /(\d+)\s*(?:jours?|semaines?|mois)/i
      const matchDuree = ligne.match(regexDuree)
      if (matchDuree) {
        medicamentCourant.duree = matchDuree[0]
      }
    }
  }

  // Ajouter le dernier médicament
  if (medicamentCourant && medicamentCourant.nom) {
    medicaments.push({
      nom: medicamentCourant.nom,
      dosage: medicamentCourant.dosage,
      posologie: medicamentCourant.posologie,
      duree: medicamentCourant.duree,
      confidence: 75
    })
  }

  return medicaments
}

/**
 * Prétraite une image pour améliorer la qualité de l'OCR
 *
 * @param imageFile - Fichier image original
 * @returns Promise avec l'image prétraitée
 */
export async function pretraiterImage(imageFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas non supporté'))
      return
    }

    img.onload = () => {
      // Redimensionner si trop grande (max 2000px)
      let width = img.width
      let height = img.height
      const maxSize = 2000

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Dessiner l'image
      ctx.drawImage(img, 0, 0, width, height)

      // Augmenter le contraste
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Convertir en niveaux de gris
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

        // Augmenter le contraste
        const contrast = 1.5
        let adjusted = ((gray - 128) * contrast) + 128

        // Seuillage pour binariser
        adjusted = adjusted > 127 ? 255 : 0

        data[i] = adjusted
        data[i + 1] = adjusted
        data[i + 2] = adjusted
      }

      ctx.putImageData(imageData, 0, 0)

      // Convertir en Blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Échec de conversion en Blob'))
        }
      }, 'image/png')
    }

    img.onerror = () => {
      reject(new Error('Échec de chargement de l\'image'))
    }

    img.src = URL.createObjectURL(imageFile)
  })
}

/**
 * Valide les données extraites
 *
 * @param donnees - Données extraites à valider
 * @returns true si les données semblent valides
 */
export function validerDonneesOrdonnance(donnees: DonneesOrdonnance): boolean {
  // Vérifier qu'il y a au moins un médicament
  if (donnees.medicaments.length === 0) {
    return false
  }

  // Vérifier que le score de confiance est acceptable
  if (donnees.confidence < 50) {
    return false
  }

  // Vérifier qu'au moins un médicament a un nom valide
  const hasValidMedicament = donnees.medicaments.some(
    m => m.nom && m.nom.length > 2
  )

  return hasValidMedicament
}
