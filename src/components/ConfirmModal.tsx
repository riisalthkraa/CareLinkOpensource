/**
 * ConfirmModal - Modal de confirmation personnalisée
 *
 * Remplace les window.confirm() natifs par une interface cohérente
 * avec le design de l'application.
 *
 * Fonctionnalités:
 * - Fermeture avec touche Escape
 * - Clic en dehors pour annuler
 * - Blocage du scroll pendant l'affichage
 * - Variantes de style (danger, warning, primary)
 *
 * @module ConfirmModal
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Supprimer le membre"
 *   message="Cette action est irréversible."
 *   confirmText="Supprimer"
 *   confirmVariant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */

import { useEffect } from 'react'

/**
 * Props du composant ConfirmModal
 *
 * @interface ConfirmModalProps
 * @property {boolean} isOpen - Contrôle l'affichage du modal
 * @property {string} title - Titre affiché dans l'en-tête
 * @property {string} message - Message de confirmation
 * @property {string} [confirmText='Confirmer'] - Texte du bouton de confirmation
 * @property {string} [cancelText='Annuler'] - Texte du bouton d'annulation
 * @property {'danger'|'warning'|'primary'} [confirmVariant='danger'] - Style du bouton
 * @property {function} onConfirm - Callback appelé lors de la confirmation
 * @property {function} onCancel - Callback appelé lors de l'annulation
 */
interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  // Gérer la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Bloquer le scroll du body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const getConfirmButtonClass = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'btn-danger'
      case 'warning':
        return 'btn-warning'
      case 'primary':
        return 'btn-primary'
      default:
        return 'btn-danger'
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={getConfirmButtonClass()} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
