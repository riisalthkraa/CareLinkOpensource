/**
 * Python OCR Service - Interface avec le backend Python
 * ======================================================
 *
 * Remplace Tesseract.js par un appel au backend Python FastAPI
 * pour une extraction OCR améliorée des ordonnances.
 *
 * Avantages:
 * - Meilleure précision (EasyOCR vs Tesseract)
 * - Validation des médicaments
 * - Extraction NLP avancée
 * - Scores de confiance réels
 *
 * @module PythonOCRService
 */

/**
 * Configuration du backend Python
 */
const PYTHON_BACKEND_URL = 'http://127.0.0.1:8000'

/**
 * Interface des données extraites d'une ordonnance (version améliorée)
 */
export interface DonneesOrdonnanceV2 {
  texteComplet: string
  medicaments: MedicamentExtraitV2[]
  dateOrdonnance?: string
  dateValidite?: string
  medecin?: string
  patient?: string
  confidenceGlobale: number // Score de confiance global (0-100)
  qualite: 'excellente' | 'bonne' | 'moyenne' | 'faible'
  warnings: string[] // Avertissements
}

/**
 * Interface d'un médicament extrait (version améliorée)
 */
export interface MedicamentExtraitV2 {
  nom: string
  nomNormalise?: string // Nom corrigé depuis la base
  dosage?: string
  posologie?: string
  duree?: string
  confidence: number
  isValidated: boolean // Trouvé dans la base de médicaments
}

/**
 * Callback de progression de l'OCR
 */
export type OCRProgressCallback = (progress: number, status: string) => void

/**
 * Vérifier si le backend Python est accessible
 *
 * @returns Promise<boolean> - true si le backend répond
 */
export async function checkPythonBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.status === 'healthy'
  } catch (error) {
    console.error('Backend Python non accessible:', error)
    return false
  }
}

/**
 * Extraire le texte d'une image d'ordonnance avec le backend Python
 *
 * @param imageFile - Fichier image (File ou Blob)
 * @param onProgress - Callback de progression (optionnel)
 * @returns Promise avec les données extraites
 */
export async function extraireTexteOrdonnanceV2(
  imageFile: File | Blob,
  onProgress?: OCRProgressCallback
): Promise<DonneesOrdonnanceV2> {
  try {
    // Vérifier que le backend est disponible
    if (onProgress) {
      onProgress(5, 'Connexion au backend Python...')
    }

    const isBackendUp = await checkPythonBackend()
    if (!isBackendUp) {
      throw new Error(
        'Backend Python non accessible. Veuillez démarrer le serveur Python:\n' +
        'cd python-backend && python main.py'
      )
    }

    // Préparer le FormData
    if (onProgress) {
      onProgress(10, 'Préparation de l\'image...')
    }

    const formData = new FormData()
    formData.append('file', imageFile, 'ordonnance.jpg')

    // Envoyer la requête au backend Python
    if (onProgress) {
      onProgress(20, 'Envoi au serveur OCR...')
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}/ocr/extract`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || `Erreur HTTP ${response.status}`
      throw new Error(errorMessage)
    }

    if (onProgress) {
      onProgress(90, 'Traitement des résultats...')
    }

    // Parser la réponse
    const data = await response.json()

    if (onProgress) {
      onProgress(100, 'Extraction terminée')
    }

    // Convertir au format frontend
    const donnees: DonneesOrdonnanceV2 = {
      texteComplet: data.texte_complet,
      medicaments: data.medicaments.map((med: any) => ({
        nom: med.nom,
        nomNormalise: med.nom_normalise,
        dosage: med.dosage,
        posologie: med.posologie,
        duree: med.duree,
        confidence: med.confidence,
        isValidated: med.is_validated
      })),
      dateOrdonnance: data.date_ordonnance,
      dateValidite: data.date_validite,
      medecin: data.medecin,
      patient: data.patient,
      confidenceGlobale: data.confidence_globale,
      qualite: data.qualite,
      warnings: data.warnings || []
    }

    return donnees
  } catch (error) {
    console.error('Erreur extraction OCR Python:', error)
    throw error
  }
}

/**
 * Valider un nom de médicament avec le backend Python
 *
 * @param nomMedicament - Nom du médicament à valider
 * @returns Résultat de la validation
 */
export async function validerMedicament(nomMedicament: string): Promise<{
  isValid: boolean
  nomCorrige?: string
  suggestions: string[]
  dci?: string
}> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/validate-medication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nom: nomMedicament })
    })

    if (!response.ok) {
      throw new Error(`Erreur validation: ${response.status}`)
    }

    const data = await response.json()

    return {
      isValid: data.is_valid,
      nomCorrige: data.nom_corrige,
      suggestions: data.suggestions || [],
      dci: data.dci
    }
  } catch (error) {
    console.error('Erreur validation médicament:', error)
    return {
      isValid: false,
      suggestions: []
    }
  }
}

/**
 * Valider les données extraites (version améliorée)
 *
 * @param donnees - Données extraites à valider
 * @returns true si les données semblent valides
 */
export function validerDonneesOrdonnanceV2(donnees: DonneesOrdonnanceV2): boolean {
  // Vérifier qu'il y a au moins un médicament
  if (donnees.medicaments.length === 0) {
    return false
  }

  // Vérifier que le score de confiance est acceptable
  if (donnees.confidenceGlobale < 40) {
    return false
  }

  // Vérifier qu'au moins un médicament a un nom valide
  const hasValidMedicament = donnees.medicaments.some(
    m => m.nom && m.nom.length > 2
  )

  return hasValidMedicament
}

/**
 * Obtenir la couleur du badge de qualité
 *
 * @param qualite - Qualité de l'extraction
 * @returns Classe CSS pour le badge
 */
export function getQualiteBadgeClass(qualite: string): string {
  switch (qualite) {
    case 'excellente':
      return 'badge-success'
    case 'bonne':
      return 'badge-info'
    case 'moyenne':
      return 'badge-warning'
    case 'faible':
      return 'badge-error'
    default:
      return 'badge-neutral'
  }
}

/**
 * Formater un message d'erreur convivial
 *
 * @param error - Erreur
 * @returns Message formaté
 */
export function formatOCRError(error: any): string {
  const message = error?.message || String(error)

  // Erreur backend non accessible
  if (message.includes('Backend Python non accessible')) {
    return '⚠️ Backend Python non démarré.\n\n' +
           'Pour activer l\'OCR amélioré:\n' +
           '1. Ouvrez un terminal\n' +
           '2. cd python-backend\n' +
           '3. python main.py\n\n' +
           'Alternative: Utiliser l\'ancien OCR (Tesseract.js)'
  }

  // Erreur qualité image
  if (message.includes('qualité')) {
    return '❌ Image de mauvaise qualité.\n\n' +
           'Conseils:\n' +
           '• Éclairage uniforme\n' +
           '• Pas d\'ombres\n' +
           '• Cadrage complet\n' +
           '• Mise au point nette'
  }

  // Erreur générique
  return `❌ Erreur OCR: ${message}`
}
