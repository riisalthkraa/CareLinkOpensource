/**
 * Alert - Composant de notification inline
 *
 * Affiche des messages d'information, succès, avertissement ou erreur
 * dans le contenu de la page (différent des toasts qui sont en overlay)
 *
 * UTILISATION:
 * <Alert type="info" title="Information" dismissible onDismiss={() => {}}>
 *   Votre message ici
 * </Alert>
 *
 * @module Alert
 */

import { useState } from 'react'

/**
 * Type d'alert
 */
type AlertType = 'info' | 'success' | 'warning' | 'error'

/**
 * Props du composant Alert
 */
interface AlertProps {
  /** Type d'alert (info, success, warning, error) */
  type: AlertType
  /** Titre de l'alert (optionnel) */
  title?: string
  /** Contenu de l'alert */
  children: React.ReactNode
  /** Si true, affiche un bouton de fermeture */
  dismissible?: boolean
  /** Callback appelé lors de la fermeture */
  onDismiss?: () => void
  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Configuration des icônes par type
 */
const ALERT_ICONS: Record<AlertType, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌'
}

/**
 * Alert - Composant de notification inline
 *
 * @component
 */
function Alert({
  type,
  title,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  /**
   * Gère la fermeture de l'alert
   */
  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  // Si fermée, ne rien afficher
  if (!isVisible) {
    return null
  }

  return (
    <div className={`alert alert-${type} ${dismissible ? 'alert-dismissible' : ''} ${className}`}>
      {/* Icône */}
      <span className="alert-icon" aria-hidden="true">
        {ALERT_ICONS[type]}
      </span>

      {/* Contenu */}
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>

      {/* Bouton de fermeture */}
      {dismissible && (
        <button
          className="alert-close"
          onClick={handleDismiss}
          aria-label="Fermer l'alerte"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default Alert
