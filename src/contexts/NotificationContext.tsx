/**
 * NotificationContext - Système de notifications toast global
 *
 * Ce module fournit un système de notifications (toasts) accessible
 * depuis n'importe quel composant de l'application.
 *
 * FONCTIONNALITÉS:
 * - Affichage de notifications success/error/warning/info
 * - Gestion automatique de la durée d'affichage
 * - Suppression manuelle ou automatique
 * - File d'attente de notifications
 * - ID unique généré automatiquement
 *
 * UTILISATION:
 * const { addNotification } = useNotification()
 * addNotification({
 *   type: 'success',
 *   title: 'Succès',
 *   message: 'Opération réussie',
 *   duration: 3000
 * })
 *
 * @module NotificationContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * Interface d'une notification
 *
 * @interface Notification
 * @property {string} id - ID unique généré automatiquement
 * @property {'success' | 'error' | 'warning' | 'info'} type - Type de notification (détermine la couleur)
 * @property {string} title - Titre principal de la notification
 * @property {string} [message] - Message optionnel détaillé
 * @property {number} [duration] - Durée d'affichage en ms (5000 par défaut)
 */
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

/**
 * Type du contexte de notification
 *
 * @interface NotificationContextType
 * @property {Notification[]} notifications - Liste des notifications actives
 * @property {function} addNotification - Ajoute une nouvelle notification
 * @property {function} removeNotification - Supprime une notification par ID
 * @property {function} clearAll - Supprime toutes les notifications
 */
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

// Création du contexte React pour les notifications
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * NotificationProvider - Composant fournisseur de notifications
 *
 * Gère l'état global de toutes les notifications et fournit
 * les fonctions pour les manipuler.
 *
 * @component
 * @param {Object} props
 * @param {ReactNode} props.children - Composants enfants qui auront accès aux notifications
 *
 * @example
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  // État contenant toutes les notifications actives
  const [notifications, setNotifications] = useState<Notification[]>([])

  /**
   * Ajoute une nouvelle notification au système
   *
   * Processus:
   * 1. Génère un ID unique aléatoire
   * 2. Ajoute la notification avec durée par défaut (5000ms)
   * 3. Programme la suppression automatique après la durée spécifiée
   *
   * @function addNotification
   * @param {Omit<Notification, 'id'>} notification - Les données de la notification (sans ID)
   *
   * @example
   * addNotification({
   *   type: 'success',
   *   title: 'Sauvegarde réussie',
   *   message: 'Vos modifications ont été enregistrées',
   *   duration: 3000
   * })
   */
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    // Générer un ID unique (random base36 string)
    const id = Math.random().toString(36).substring(2, 9)

    const newNotification: Notification = {
      id,
      duration: 5000, // Durée par défaut: 5 secondes
      ...notification
    }

    // Ajouter la notification à la liste
    setNotifications(prev => [...prev, newNotification])

    // Programmer la suppression automatique
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  /**
   * Supprime une notification par son ID
   *
   * Utilisé pour:
   * - Suppression automatique après expiration
   * - Fermeture manuelle par l'utilisateur (clic sur X)
   *
   * @function removeNotification
   * @param {string} id - L'ID de la notification à supprimer
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  /**
   * Supprime toutes les notifications actives
   *
   * Utile pour:
   * - Nettoyer l'écran après beaucoup de notifications
   * - Réinitialisation lors d'un changement de page
   *
   * @function clearAll
   */
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * Hook personnalisé pour accéder au système de notifications
 *
 * Permet aux composants d'afficher et gérer les notifications
 *
 * @returns {NotificationContextType} L'objet contenant notifications et fonctions de gestion
 * @throws {Error} Si utilisé en dehors d'un NotificationProvider
 *
 * @example
 * function MyComponent() {
 *   const { addNotification } = useNotification()
 *
 *   const handleSave = () => {
 *     // Sauvegarder...
 *     addNotification({
 *       type: 'success',
 *       title: 'Sauvegarde réussie'
 *     })
 *   }
 * }
 */
export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
