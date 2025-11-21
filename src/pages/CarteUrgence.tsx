/**
 * CarteUrgence - Page de génération de cartes d'urgence médicale
 *
 * Fonctionnalités:
 * - Sélection du membre de la famille
 * - Génération de QR code avec données critiques
 * - Prévisualisation de la carte format CB
 * - Impression directe
 * - Téléchargement en HTML
 * - Options de personnalisation (couleur, format)
 *
 * La carte générée contient:
 * - Nom, âge, groupe sanguin
 * - Allergies importantes
 * - Traitements en cours
 * - Contact d'urgence
 * - QR code scannable
 *
 * @module CarteUrgence
 */

import { useState, useEffect } from 'react'
import { Membre, Allergie, Traitement } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import {
  genererQRCodeUrgence,
  telechargerQRCode
} from '../services/QRCodeService'
import {
  genererHTMLCarteUrgence,
  imprimerCarteUrgence,
  telechargerCarteHTML
} from '../services/PDFGenerator'

interface CarteUrgenceProps {
  onBack: () => void
  membreId?: number | null
}

function CarteUrgence({ onBack, membreId: membreIdProp }: CarteUrgenceProps) {
  const [membres, setMembres] = useState<Membre[]>([])
  const [membreSelectionne, setMembreSelectionne] = useState<number | null>(membreIdProp || null)
  const [membre, setMembre] = useState<Membre | null>(null)
  const [allergies, setAllergies] = useState<Allergie[]>([])
  const [traitements, setTraitements] = useState<Traitement[]>([])
  const [qrCode, setQRCode] = useState<string>('')
  const [carteHTML, setCarteHTML] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [couleurTheme, setCouleurTheme] = useState('#e74c3c')
  const { addNotification } = useNotification()

  // Charger la liste des membres
  useEffect(() => {
    loadMembres()
  }, [])

  // Charger les données du membre sélectionné
  useEffect(() => {
    if (membreSelectionne) {
      loadMembreData()
    }
  }, [membreSelectionne])

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

  /**
   * Déchiffre un texte s'il est chiffré
   */
  const decryptText = async (text: string | null): Promise<string> => {
    if (!text) return ''
    if (text.startsWith('{') && text.includes('"encrypted"')) {
      try {
        const result = await window.electronAPI.decryptText(text)
        return result.success ? result.data || '' : text
      } catch (error) {
        console.error('Erreur déchiffrement:', error)
        return text
      }
    }
    return text
  }

  const loadMembreData = async () => {
    try {
      // Charger membre
      const membreResult = await window.electronAPI.dbQuery(
        'SELECT * FROM membres WHERE id = ?',
        [membreSelectionne]
      )
      if (membreResult.success && membreResult.data.length > 0) {
        setMembre(membreResult.data[0])
      }

      // Charger allergies
      const allergiesResult = await window.electronAPI.dbQuery(
        'SELECT * FROM allergies WHERE membre_id = ?',
        [membreSelectionne]
      )
      if (allergiesResult.success) {
        // Déchiffrer les allergies si nécessaire
        const decryptedAllergies = await Promise.all(
          allergiesResult.data.map(async (allergie: any) => ({
            ...allergie,
            nom_allergie: await decryptText(allergie.nom_allergie),
            description: await decryptText(allergie.description)
          }))
        )
        setAllergies(decryptedAllergies)
      }

      // Charger traitements actifs
      const traitementsResult = await window.electronAPI.dbQuery(
        'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
        [membreSelectionne]
      )
      if (traitementsResult.success) {
        setTraitements(traitementsResult.data)
      }
    } catch (error) {
      console.error('Erreur chargement données membre:', error)
    }
  }

  const handleGenererCarte = async () => {
    if (!membre) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez sélectionner un membre'
      })
      return
    }

    setIsGenerating(true)

    try {
      // Générer le QR code
      const qrCodeBase64 = await genererQRCodeUrgence(membre, allergies, traitements)
      setQRCode(qrCodeBase64)

      // Générer le HTML de la carte
      const html = genererHTMLCarteUrgence(
        membre,
        allergies,
        traitements,
        qrCodeBase64,
        { couleurTheme }
      )
      setCarteHTML(html)

      addNotification({
        type: 'success',
        title: 'Carte générée',
        message: 'La carte d\'urgence a été générée avec succès'
      })
    } catch (error) {
      console.error('Erreur génération carte:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer la carte d\'urgence'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImprimer = () => {
    if (!carteHTML) {
      addNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Veuillez d\'abord générer la carte'
      })
      return
    }

    try {
      imprimerCarteUrgence(carteHTML)
      addNotification({
        type: 'info',
        title: 'Impression',
        message: 'Fenêtre d\'impression ouverte'
      })
    } catch (error) {
      console.error('Erreur impression:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ouvrir la fenêtre d\'impression'
      })
    }
  }

  const handleTelecharger = async () => {
    if (!carteHTML || !membre) {
      addNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Veuillez d\'abord générer la carte'
      })
      return
    }

    try {
      const nomFichier = `carte-urgence-${membre.prenom}-${membre.nom}.html`
      const result = await telechargerCarteHTML(carteHTML, nomFichier)

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Téléchargement réussi',
          message: `Carte sauvegardée dans Téléchargements`
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de télécharger la carte'
        })
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger la carte'
      })
    }
  }

  const handleTelechargerQRCode = async () => {
    if (!qrCode || !membre) {
      addNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Veuillez d\'abord générer la carte'
      })
      return
    }

    try {
      const nomFichier = `qrcode-urgence-${membre.prenom}-${membre.nom}.png`
      const result = await telechargerQRCode(qrCode, nomFichier)

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'QR Code téléchargé',
          message: 'QR Code sauvegardé dans Téléchargements'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de télécharger le QR code'
        })
      }
    } catch (error) {
      console.error('Erreur téléchargement QR code:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger le QR code'
      })
    }
  }

  const couleurs = [
    { nom: 'Rouge', valeur: '#e74c3c' },
    { nom: 'Bleu', valeur: '#3498db' },
    { nom: 'Vert', valeur: '#27ae60' },
    { nom: 'Orange', valeur: '#e67e22' },
    { nom: 'Violet', valeur: '#9b59b6' },
    { nom: 'Turquoise', valeur: '#1abc9c' }
  ]

  return (
    <div className="carte-urgence-page">
      <div className="profil-actions">
        <button className="btn-back" onClick={onBack}>← Retour</button>
      </div>

      <div className="page-header">
        <h2>🚨 Génération de Carte d'Urgence</h2>
        <p className="subtitle">
          Créez une carte d'urgence imprimable au format carte de crédit avec QR code
        </p>
      </div>

      {/* Configuration */}
      <div className="card">
        <h3>⚙️ Configuration</h3>

        <div className="form-section">
          <div className="form-group">
            <label>Sélectionner un membre *</label>
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

          <div className="form-group">
            <label>Couleur de la carte</label>
            <div className="couleurs-grid">
              {couleurs.map((c) => (
                <button
                  key={c.valeur}
                  className={`couleur-btn ${couleurTheme === c.valeur ? 'active' : ''}`}
                  style={{ backgroundColor: c.valeur }}
                  onClick={() => setCouleurTheme(c.valeur)}
                  title={c.nom}
                >
                  {couleurTheme === c.valeur && '✓'}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary btn-large"
            onClick={handleGenererCarte}
            disabled={!membreSelectionne || isGenerating}
          >
            {isGenerating ? '⏳ Génération en cours...' : '🎨 Générer la carte'}
          </button>
        </div>
      </div>

      {/* Informations du membre */}
      {membre && (
        <div className="card">
          <h3>📋 Informations incluses dans la carte</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Nom complet</span>
              <span className="value">{membre.prenom} {membre.nom}</span>
            </div>
            <div className="info-item">
              <span className="label">Groupe sanguin</span>
              <span className="value">
                {membre.groupe_sanguin && membre.rhesus
                  ? `${membre.groupe_sanguin}${membre.rhesus}`
                  : 'Non renseigné'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Allergies</span>
              <span className="value">
                {allergies.length > 0
                  ? allergies.map(a => a.nom_allergie).join(', ')
                  : 'Aucune'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Traitements actifs</span>
              <span className="value">
                {traitements.length > 0
                  ? traitements.map(t => t.nom_medicament).join(', ')
                  : 'Aucun'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Contact d'urgence</span>
              <span className="value">
                {membre.contact_urgence_nom || 'Non renseigné'}
                {membre.contact_urgence_telephone && ` - ${membre.contact_urgence_telephone}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Prévisualisation */}
      {carteHTML && (
        <div className="card">
          <h3>👁️ Prévisualisation</h3>
          <div className="carte-preview">
            <iframe
              srcDoc={carteHTML}
              style={{
                width: '85.6mm',
                height: '53.98mm',
                border: '1px solid #ddd',
                borderRadius: '8px',
                transform: 'scale(1.5)',
                transformOrigin: 'top left',
                marginBottom: '80px'
              }}
              title="Prévisualisation carte"
            />
          </div>

          <div className="carte-actions">
            <button className="btn-primary" onClick={handleImprimer}>
              🖨️ Imprimer la carte
            </button>
            <button className="btn-secondary" onClick={handleTelecharger}>
              💾 Télécharger HTML
            </button>
            <button className="btn-secondary" onClick={handleTelechargerQRCode}>
              📱 Télécharger QR Code
            </button>
          </div>

          <div className="carte-info-box">
            <p><strong>💡 Conseils d'impression :</strong></p>
            <ul>
              <li>Utilisez du papier épais (200-300g) pour plus de durabilité</li>
              <li>Imprimez en haute qualité (300 DPI minimum)</li>
              <li>Plastifiez la carte pour la protéger</li>
              <li>Conservez-la dans votre portefeuille</li>
              <li>Le QR code peut être scanné par n'importe quel smartphone</li>
            </ul>
          </div>
        </div>
      )}

      {/* Aide */}
      <div className="card card-help">
        <h3>❓ Comment utiliser la carte d'urgence ?</h3>
        <div className="help-content">
          <div className="help-item">
            <span className="help-number">1</span>
            <div>
              <strong>Sélectionnez un membre</strong>
              <p>Choisissez la personne pour laquelle générer la carte</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-number">2</span>
            <div>
              <strong>Personnalisez</strong>
              <p>Choisissez la couleur de la carte selon vos préférences</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-number">3</span>
            <div>
              <strong>Générez</strong>
              <p>Cliquez sur "Générer la carte" pour créer le QR code</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-number">4</span>
            <div>
              <strong>Imprimez ou téléchargez</strong>
              <p>Imprimez directement ou téléchargez pour imprimer plus tard</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-number">5</span>
            <div>
              <strong>Plastifiez</strong>
              <p>Pour une durabilité maximale, plastifiez la carte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarteUrgence
