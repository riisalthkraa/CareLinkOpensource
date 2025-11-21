/**
 * DocumentPreview - Composant de prévisualisation d'ordonnance scannée
 *
 * Affiche:
 * - L'image de l'ordonnance
 * - Les données extraites par OCR
 * - Les médicaments détectés avec leur posologie
 * - Le score de confiance
 * - Options de correction manuelle
 *
 * @module DocumentPreview
 */

import { DonneesOrdonnance, MedicamentExtrait } from '../services/OCRService'

interface DocumentPreviewProps {
  imageUrl: string
  donnees: DonneesOrdonnance
  onEdit?: (medicament: MedicamentExtrait, index: number) => void
  onRemove?: (index: number) => void
  onUpdateDonnees?: (donnees: DonneesOrdonnance) => void
}

function DocumentPreview({
  imageUrl,
  donnees,
  onEdit,
  onRemove,
  onUpdateDonnees
}: DocumentPreviewProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#27ae60'
    if (confidence >= 60) return '#f39c12'
    return '#e74c3c'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Excellente'
    if (confidence >= 60) return 'Bonne'
    if (confidence >= 40) return 'Moyenne'
    return 'Faible'
  }

  return (
    <div className="document-preview">
      <div className="preview-layout">
        {/* Image de l'ordonnance */}
        <div className="preview-image-section">
          <h4>Image de l'ordonnance</h4>
          <div className="image-container">
            <img
              src={imageUrl}
              alt="Ordonnance scannée"
              className="ordonnance-image"
            />
          </div>
        </div>

        {/* Données extraites */}
        <div className="preview-data-section">
          <h4>Données extraites</h4>

          {/* Score de confiance global */}
          <div
            className="confidence-badge"
            style={{ backgroundColor: getConfidenceColor(donnees.confidence) }}
          >
            Confiance: {Math.round(donnees.confidence)}% - {getConfidenceLabel(donnees.confidence)}
          </div>

          {/* Informations générales */}
          <div className="preview-info-box">
            {donnees.dateOrdonnance && (
              <div className="info-row">
                <strong>Date de l'ordonnance:</strong>
                <span>{new Date(donnees.dateOrdonnance).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {donnees.dateValidite && (
              <div className="info-row">
                <strong>Valable jusqu'au:</strong>
                <span>{new Date(donnees.dateValidite).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {donnees.medecin && (
              <div className="info-row">
                <strong>Médecin:</strong>
                <span>{donnees.medecin}</span>
              </div>
            )}
          </div>

          {/* Liste des médicaments */}
          <div className="medicaments-extraits">
            <h5>Médicaments détectés ({donnees.medicaments.length})</h5>

            {donnees.medicaments.length === 0 ? (
              <div className="empty-message">
                Aucun médicament détecté. Vérifiez la qualité de l'image.
              </div>
            ) : (
              donnees.medicaments.map((medicament, index) => (
                <div key={index} className="medicament-card">
                  <div className="medicament-header">
                    <div className="medicament-nom">
                      <strong>{medicament.nom}</strong>
                      {medicament.dosage && (
                        <span className="medicament-dosage"> - {medicament.dosage}</span>
                      )}
                    </div>
                    <div className="medicament-actions">
                      {onEdit && (
                        <button
                          className="btn-icon"
                          onClick={() => onEdit(medicament, index)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                      )}
                      {onRemove && (
                        <button
                          className="btn-icon btn-danger-icon"
                          onClick={() => onRemove(index)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {medicament.posologie && (
                    <div className="medicament-detail">
                      <span className="detail-label">Posologie:</span>
                      <span>{medicament.posologie}</span>
                    </div>
                  )}

                  {medicament.duree && (
                    <div className="medicament-detail">
                      <span className="detail-label">Durée:</span>
                      <span>{medicament.duree}</span>
                    </div>
                  )}

                  <div
                    className="medicament-confidence"
                    style={{ color: getConfidenceColor(medicament.confidence) }}
                  >
                    Confiance: {Math.round(medicament.confidence)}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Texte brut (en mode debug) */}
          {donnees.confidence < 60 && (
            <details className="texte-brut-details">
              <summary>Voir le texte brut extrait</summary>
              <pre className="texte-brut">{donnees.texteComplet}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview
