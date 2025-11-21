/**
 * ToastContainer - Conteneur des notifications toast
 *
 * Affiche les notifications temporaires dans le coin de l'écran
 * Gère l'affichage, le style et la fermeture des notifications
 *
 * @module ToastContainer
 */

import { useNotification } from '../contexts/NotificationContext'

/**
 * ToastContainer - Composant conteneur pour les notifications toast
 *
 * Fonctionnalités:
 * - Affiche une pile de notifications toast
 * - Icônes différentes selon le type (success, error, warning, info)
 * - Fermeture au clic ou via le bouton X
 * - Animation d'entrée/sortie gérée par CSS
 *
 * @component
 * @returns {JSX.Element} Le conteneur de toasts
 */
function ToastContainer() {
  const { notifications, removeNotification } = useNotification()

  /**
   * Retourne l'icône appropriée selon le type de notification
   * @param {string} type - Le type de notification (success, error, warning, info)
   * @returns {string} L'emoji correspondant au type
   */
  const getIcon = (type: string): string => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="toast-icon">{getIcon(notification.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{notification.title}</div>
            {notification.message && (
              <div className="toast-message">{notification.message}</div>
            )}
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation()
              removeNotification(notification.id)
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
