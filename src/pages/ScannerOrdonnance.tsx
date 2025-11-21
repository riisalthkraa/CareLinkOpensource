/**
 * ScannerOrdonnance - Page de scan et extraction automatique d'ordonnances
 *
 * Fonctionnalités:
 * - Upload de photo/scan d'ordonnance
 * - Extraction OCR avec Tesseract.js
 * - Reconnaissance automatique des médicaments
 * - Prévisualisation et correction manuelle
 * - Import automatique dans les traitements
 * - Stockage du document original
 *
 * @module ScannerOrdonnance
 */

import { useState, useRef, useEffect } from 'react'
import { Membre } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import {
  extraireTexteOrdonnance,
  pretraiterImage,
  DonneesOrdonnance,
  validerDonneesOrdonnance
} from '../services/OCRService'
import DocumentPreview from '../components/DocumentPreview'

interface ScannerOrdonnanceProps {
  onBack: () => void
  membreId?: number | null
}

function ScannerOrdonnance({ onBack, membreId: membreIdProp }: ScannerOrdonnanceProps) {
  const [membres, setMembres] = useState<Membre[]>([])
  const [membreSelectionne, setMembreSelectionne] = useState<number | null>(membreIdProp || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState('')
  const [donneesExtract, setDonneesExtract] = useState<DonneesOrdonnance | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addNotification } = useNotification()

  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM membres ORDER BY prenom ASC',
        []
      )
      if (result.success) {
        setMembres(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  // Charger les membres au montage
  useEffect(() => {
    loadMembres()
  }, [])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Fichier invalide',
        message: 'Veuillez sélectionner une image (JPG, PNG, etc.)'
      })
      return
    }

    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
    setStep('preview')
  }

  const handleScan = async () => {
    if (!imageFile) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez sélectionner une image'
      })
      return
    }

    if (!membreSelectionne) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez sélectionner un membre'
      })
      return
    }

    setIsScanning(true)
    setScanProgress(0)
    setScanStatus('Prétraitement de l\'image...')

    try {
      // Prétraiter l'image pour améliorer l'OCR
      setScanStatus('Amélioration de l\'image...')
      const imagePretraitee = await pretraiterImage(imageFile)

      // Extraire le texte avec OCR
      setScanStatus('Extraction du texte...')
      const donnees = await extraireTexteOrdonnance(
        imagePretraitee,
        (progress, status) => {
          setScanProgress(progress)
          setScanStatus(`Reconnaissance du texte... ${progress}%`)
        }
      )

      setDonneesExtract(donnees)
      setScanStatus('Analyse terminée')

      // Vérifier la qualité
      if (!validerDonneesOrdonnance(donnees)) {
        addNotification({
          type: 'warning',
          title: 'Qualité moyenne',
          message: 'Les données extraites sont de qualité moyenne. Vérifiez attentivement avant d\'importer.'
        })
      } else {
        addNotification({
          type: 'success',
          title: 'Scan réussi',
          message: `${donnees.medicaments.length} médicament(s) détecté(s)`
        })
      }

      setStep('confirm')
    } catch (error) {
      console.error('Erreur scan:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de scan',
        message: 'Impossible d\'extraire les données. Essayez avec une image de meilleure qualité.'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleImport = async () => {
    if (!donneesExtract || !membreSelectionne) return

    try {
      // Importer chaque médicament comme un traitement
      for (const medicament of donneesExtract.medicaments) {
        await window.electronAPI.dbRun(
          `INSERT INTO traitements (
            membre_id, nom_medicament, dosage, frequence, date_debut,
            actif, type, medecin_prescripteur, notes
          ) VALUES (?, ?, ?, ?, ?, 1, 'quotidien', ?, ?)`,
          [
            membreSelectionne,
            medicament.nom,
            medicament.dosage || null,
            medicament.posologie || null,
            donneesExtract.dateOrdonnance || new Date().toISOString().split('T')[0],
            donneesExtract.medecin || null,
            `Importé depuis ordonnance du ${new Date().toLocaleDateString('fr-FR')}`
          ]
        )
      }

      // Sauvegarder le document (optionnel)
      // TODO: Implémenter la sauvegarde du fichier avec handler IPC

      addNotification({
        type: 'success',
        title: 'Import réussi',
        message: `${donneesExtract.medicaments.length} traitement(s) ajouté(s)`
      })

      // Reset
      handleReset()
    } catch (error) {
      console.error('Erreur import:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'importer les traitements'
      })
    }
  }

  const handleReset = () => {
    setImageFile(null)
    setImageUrl('')
    setDonneesExtract(null)
    setStep('upload')
    setScanProgress(0)
    setScanStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="scanner-ordonnance-page">
      <div className="profil-actions">
        <button className="btn-back" onClick={onBack}>← Retour</button>
      </div>

      <div className="page-header">
        <h2>📸 Scanner d'Ordonnance</h2>
        <p className="subtitle">
          Scannez une ordonnance et importez automatiquement les médicaments
        </p>
      </div>

      {/* Étape 1: Upload */}
      {step === 'upload' && (
        <div className="card">
          <h3>📁 Sélectionner une ordonnance</h3>

          <div className="form-section">
            <div className="form-group">
              <label>Pour quel membre ?</label>
              <select
                value={membreSelectionne || ''}
                onChange={(e) => setMembreSelectionne(Number(e.target.value))}
                className="select-membre"
              >
                <option value="">-- Choisir un membre --</option>
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.prenom} {m.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" className="upload-button">
                <div className="upload-icon">📷</div>
                <div>Prendre une photo ou sélectionner une image</div>
                <div className="upload-hint">JPG, PNG - Max 10 MB</div>
              </label>
            </div>
          </div>

          <div className="info-box">
            <h4>💡 Conseils pour un bon scan:</h4>
            <ul>
              <li>Assurez-vous que l'ordonnance est bien éclairée</li>
              <li>Évitez les ombres et reflets</li>
              <li>Cadrez l'ordonnance entièrement</li>
              <li>Tenez l'appareil stable</li>
              <li>Utilisez un fond uni si possible</li>
            </ul>
          </div>
        </div>
      )}

      {/* Étape 2: Prévisualisation et scan */}
      {step === 'preview' && imageUrl && (
        <div className="card">
          <h3>🔍 Prévisualisation</h3>

          <div className="image-preview">
            <img src={imageUrl} alt="Ordonnance" style={{ maxWidth: '100%', borderRadius: '8px' }} />
          </div>

          <div className="scan-actions">
            <button
              className="btn-primary btn-large"
              onClick={handleScan}
              disabled={isScanning || !membreSelectionne}
            >
              {isScanning ? `⏳ ${scanStatus}` : '🔍 Lancer le scan OCR'}
            </button>
            <button className="btn-secondary" onClick={handleReset} disabled={isScanning}>
              🔄 Changer d'image
            </button>
          </div>

          {isScanning && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="progress-text">{scanStatus}</p>
            </div>
          )}
        </div>
      )}

      {/* Étape 3: Confirmation et import */}
      {step === 'confirm' && donneesExtract && imageUrl && (
        <>
          <DocumentPreview imageUrl={imageUrl} donnees={donneesExtract} />

          <div className="card">
            <h3>✅ Importer dans les traitements</h3>
            <p>
              Les médicaments détectés seront ajoutés automatiquement dans les traitements actifs
              du membre sélectionné.
            </p>

            <div className="import-actions">
              <button className="btn-primary btn-large" onClick={handleImport}>
                ✅ Importer {donneesExtract.medicaments.length} médicament(s)
              </button>
              <button className="btn-secondary" onClick={handleReset}>
                ❌ Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ScannerOrdonnance
