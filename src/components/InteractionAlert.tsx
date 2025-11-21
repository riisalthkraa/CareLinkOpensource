/**
 * InteractionAlert - Composant d'alerte pour les interactions médicamenteuses
 *
 * Affiche une alerte visuelle avec:
 * - Niveau de gravité (couleur + icône)
 * - Description de l'interaction
 * - Recommandations
 * - Médicaments concernés
 * - Alternatives possibles
 *
 * Utilisé dans la page Traitements lors de l'ajout d'un nouveau médicament
 *
 * @module InteractionAlert
 */

import {
  ResultatVerificationInteraction,
  InteractionDetectee,
  InteractionAllergique
} from '../types'
import {
  getCouleurGravite,
  getIconeGravite,
  getLibelleGravite
} from '../services/InteractionChecker'

/**
 * Props du composant InteractionAlert
 */
interface InteractionAlertProps {
  resultat: ResultatVerificationInteraction
  interactionsAllergiques?: InteractionAllergique[]
  onClose?: () => void
  onConfirm?: () => void
  onCancel?: () => void
}

/**
 * Composant d'alerte d'interactions médicamenteuses
 */
function InteractionAlert({
  resultat,
  interactionsAllergiques = [],
  onClose,
  onConfirm,
  onCancel
}: InteractionAlertProps) {
  // Si pas d'interactions, ne rien afficher
  if (!resultat.hasInteractions && interactionsAllergiques.length === 0) {
    return null
  }

  const hasAllergie = interactionsAllergiques.length > 0
  const hasContraindication = resultat.hasContraindications || hasAllergie

  return (
    <div className="interaction-alert-overlay">
      <div className="interaction-alert-modal">
        {/* En-tête */}
        <div
          className="alert-header"
          style={{
            backgroundColor: hasContraindication
              ? getCouleurGravite('contre-indication')
              : getCouleurGravite('precaution')
          }}
        >
          <span className="alert-header-icon">
            {hasContraindication ? '🚫' : '⚠️'}
          </span>
          <h3>
            {hasContraindication
              ? 'ATTENTION : Interaction dangereuse détectée'
              : 'Précautions à prendre'}
          </h3>
          {onClose && (
            <button className="alert-close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {/* Corps */}
        <div className="alert-body">
          {/* Résumé */}
          <div className="alert-summary">
            {hasAllergie && (
              <div className="alert-summary-item alert-danger">
                <span className="summary-icon">🔴</span>
                <div>
                  <strong>Allergie détectée</strong>
                  <p>{interactionsAllergiques.length} contre-indication(s) allergique(s)</p>
                </div>
              </div>
            )}
            {resultat.hasContraindications && (
              <div className="alert-summary-item alert-danger">
                <span className="summary-icon">⛔</span>
                <div>
                  <strong>Contre-indication</strong>
                  <p>
                    {resultat.interactions.filter(i => i.interaction.gravite === 'contre-indication').length}
                    {' '}interaction(s) grave(s)
                  </p>
                </div>
              </div>
            )}
            {resultat.hasPrecautions && (
              <div className="alert-summary-item alert-warning">
                <span className="summary-icon">⚠️</span>
                <div>
                  <strong>Précaution requise</strong>
                  <p>
                    {resultat.interactions.filter(i => i.interaction.gravite === 'precaution').length}
                    {' '}interaction(s) à surveiller
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Détails des allergies */}
          {hasAllergie && (
            <div className="alert-section">
              <h4 className="alert-section-title">
                🔴 Contre-indications allergiques
              </h4>
              {interactionsAllergiques.map((allergie, index) => (
                <div
                  key={index}
                  className="interaction-detail"
                  style={{ borderLeftColor: getCouleurGravite(allergie.gravite) }}
                >
                  <div className="interaction-header">
                    <span className="interaction-gravite">
                      {getIconeGravite(allergie.gravite)} {getLibelleGravite(allergie.gravite)}
                    </span>
                  </div>
                  <div className="interaction-medicaments">
                    <strong>{allergie.medicament}</strong> ⚡ Allergie: {allergie.allergie}
                  </div>
                  <p className="interaction-description">{allergie.description}</p>
                  <div className="interaction-recommendation">
                    <strong>Recommandation:</strong> {allergie.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Détails des interactions médicamenteuses */}
          {resultat.hasInteractions && (
            <div className="alert-section">
              <h4 className="alert-section-title">
                💊 Interactions médicamenteuses
              </h4>
              {resultat.interactions.map((interaction, index) => (
                <InteractionDetailCard key={index} interaction={interaction} />
              ))}
            </div>
          )}

          {/* Avertissement */}
          <div className="alert-warning-box">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Important:</strong>
              <p>
                Cette vérification est basée sur une base de données locale et n'est pas exhaustive.
                Consultez toujours un médecin ou un pharmacien avant de prendre un nouveau médicament.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(onConfirm || onCancel) && (
          <div className="alert-footer">
            {hasContraindication ? (
              <>
                <button className="btn-secondary btn-large" onClick={onCancel}>
                  ✅ Ne pas ajouter ce médicament
                </button>
                <button
                  className="btn-danger btn-large"
                  onClick={onConfirm}
                  title="Ajouter malgré les contre-indications (non recommandé)"
                >
                  ⚠️ Ajouter quand même (risqué)
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={onCancel}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={onConfirm}>
                  ✅ J'ai compris, ajouter
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Composant de détail d'une interaction
 */
function InteractionDetailCard({ interaction }: { interaction: InteractionDetectee }) {
  const { interaction: inter, medicament1, medicament2 } = interaction

  return (
    <div
      className="interaction-detail"
      style={{ borderLeftColor: getCouleurGravite(inter.gravite) }}
    >
      <div className="interaction-header">
        <span className="interaction-gravite">
          {getIconeGravite(inter.gravite)} {getLibelleGravite(inter.gravite)}
        </span>
      </div>

      <div className="interaction-medicaments">
        <strong>{medicament1.nom_medicament}</strong>
        {medicament1.dosage && <span className="dosage"> ({medicament1.dosage})</span>}
        <span className="interaction-arrow"> ⚡ </span>
        <strong>{medicament2.nom_medicament}</strong>
        {medicament2.dosage && <span className="dosage"> ({medicament2.dosage})</span>}
      </div>

      <p className="interaction-description">{inter.description}</p>

      <div className="interaction-recommendation">
        <strong>Recommandation:</strong> {inter.recommendation}
      </div>

      {inter.alternatives && inter.alternatives.length > 0 && (
        <div className="interaction-alternatives">
          <strong>Alternatives possibles:</strong>
          <div className="alternatives-list">
            {inter.alternatives.map((alt, idx) => (
              <span key={idx} className="alternative-chip">
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractionAlert
