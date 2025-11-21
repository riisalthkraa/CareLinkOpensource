/**
 * TopBar - Barre supérieure de navigation
 *
 * Composant affichant la barre horizontale en haut de l'application avec:
 * - Titre de la page active
 * - Barre de recherche
 * - Centre de notifications avec dropdown
 * - Badge de compteur de notifications non lues
 *
 * @module TopBar
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface Notification {
  id: number
  type: 'warning' | 'info' | 'success'
  message: string
  time: string
}

/**
 * Props du composant TopBar
 *
 * @interface TopBarProps
 * @property {string} [userName] - Nom de l'utilisateur connecté (non utilisé actuellement)
 * @property {string} currentPage - ID de la page actuellement active
 * @property {function} [onToggleSidebar] - Callback pour toggle la sidebar sur mobile
 */
interface TopBarProps {
  userName?: string
  currentPage: string
  onToggleSidebar?: () => void
}

/**
 * TopBar - Composant de barre supérieure
 *
 * Affiche l'en-tête de chaque page avec:
 * - Titre dynamique basé sur la page active
 * - Barre de recherche (placeholder pour recherche future)
 * - Centre de notifications avec dropdown
 * - Badge indicateur de notifications non lues
 *
 * @component
 * @param {TopBarProps} props - Les propriétés du composant
 * @returns {JSX.Element} La barre supérieure de navigation
 */
function TopBar({ userName = 'Admin', currentPage, onToggleSidebar }: TopBarProps) {
  // État pour afficher/masquer le dropdown de notifications
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { isDarkMode, toggleDarkMode, themeMode } = useTheme()

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications()
    // Recharger toutes les 60 secondes
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Retourne le titre français correspondant à l'ID de page
   *
   * @function getPageTitle
   * @param {string} page - L'ID de la page
   * @returns {string} Le titre localisé de la page
   */
  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Tableau de bord'
      case 'profil': return 'Profil membre'
      case 'vaccins': return 'Gestion des vaccins'
      case 'traitements': return 'Gestion des traitements'
      case 'rendez-vous': return 'Rendez-vous médicaux'
      case 'config': return 'Configuration'
      default: return 'CareLink'
    }
  }

  /**
   * Calcule le nombre de jours entre deux dates
   */
  const getDaysUntil = (dateStr: string): number => {
    const targetDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Charge les notifications dynamiques depuis la base de données
   */
  const loadNotifications = async () => {
    const notifs: Notification[] = []
    let idCounter = 1

    try {
      // 1. Vaccins expirant dans les 30 prochains jours
      const vaccinsResult = await window.electronAPI.dbQuery(`
        SELECT v.*, m.prenom, m.nom
        FROM vaccins v
        JOIN membres m ON v.membre_id = m.id
        WHERE v.date_rappel IS NOT NULL
          AND v.date_rappel >= date('now')
          AND v.date_rappel <= date('now', '+30 days')
          AND v.statut = 'fait'
        ORDER BY v.date_rappel ASC
        LIMIT 3
      `)

      if (vaccinsResult.success && vaccinsResult.data.length > 0) {
        vaccinsResult.data.forEach((vaccin: any) => {
          const daysUntil = getDaysUntil(vaccin.date_rappel)
          notifs.push({
            id: idCounter++,
            type: daysUntil <= 7 ? 'warning' : 'info',
            message: `Rappel vaccin ${vaccin.nom_vaccin} pour ${vaccin.prenom} dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
            time: daysUntil <= 7 ? 'urgent' : `${daysUntil}j`
          })
        })
      }

      // 2. Traitements avec stock faible (< 10)
      const stockResult = await window.electronAPI.dbQuery(`
        SELECT t.*, m.prenom, m.nom
        FROM traitements t
        JOIN membres m ON t.membre_id = m.id
        WHERE t.actif = 1 AND t.stock_restant IS NOT NULL AND t.stock_restant < 10
        ORDER BY t.stock_restant ASC
        LIMIT 3
      `)

      if (stockResult.success && stockResult.data.length > 0) {
        stockResult.data.forEach((trait: any) => {
          notifs.push({
            id: idCounter++,
            type: trait.stock_restant <= 5 ? 'warning' : 'info',
            message: `Stock faible: ${trait.nom_medicament} (${trait.prenom}) - ${trait.stock_restant} restant${trait.stock_restant > 1 ? 's' : ''}`,
            time: trait.stock_restant <= 5 ? 'urgent' : 'info'
          })
        })
      }

      // 3. Rendez-vous dans les 3 prochains jours
      const rdvResult = await window.electronAPI.dbQuery(`
        SELECT r.*, m.prenom, m.nom
        FROM rendez_vous r
        JOIN membres m ON r.membre_id = m.id
        WHERE r.statut = 'à_venir'
          AND r.date_rdv >= date('now')
          AND r.date_rdv <= date('now', '+3 days')
        ORDER BY r.date_rdv ASC, r.heure ASC
        LIMIT 3
      `)

      if (rdvResult.success && rdvResult.data.length > 0) {
        rdvResult.data.forEach((rdv: any) => {
          const daysUntil = getDaysUntil(rdv.date_rdv)
          const dayText = daysUntil === 0 ? "aujourd'hui" : daysUntil === 1 ? 'demain' : `dans ${daysUntil} jours`
          notifs.push({
            id: idCounter++,
            type: daysUntil === 0 ? 'warning' : 'info',
            message: `RDV ${rdv.specialite} ${rdv.prenom} ${dayText} ${rdv.heure}`,
            time: dayText
          })
        })
      }

      // 4. Renouvellements d'ordonnance urgents (< 7 jours)
      const renouResult = await window.electronAPI.dbQuery(`
        SELECT t.*, m.prenom, m.nom
        FROM traitements t
        JOIN membres m ON t.membre_id = m.id
        WHERE t.actif = 1
          AND t.renouvellement_ordonnance IS NOT NULL
          AND t.renouvellement_ordonnance >= date('now')
          AND t.renouvellement_ordonnance <= date('now', '+7 days')
        ORDER BY t.renouvellement_ordonnance ASC
        LIMIT 2
      `)

      if (renouResult.success && renouResult.data.length > 0) {
        renouResult.data.forEach((trait: any) => {
          const daysUntil = getDaysUntil(trait.renouvellement_ordonnance)
          notifs.push({
            id: idCounter++,
            type: 'warning',
            message: `Renouvellement ordonnance ${trait.nom_medicament} (${trait.prenom}) dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
            time: `${daysUntil}j`
          })
        })
      }

      setNotifications(notifs)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    }
  }

  // Nombre de notifications non lues
  const unreadCount = notifications.length

  return (
    <header className="topbar">
      {/* Partie gauche: Burger menu + Titre de la page */}
      <div className="topbar-left">
        {/* Bouton burger (visible uniquement sur mobile) */}
        {onToggleSidebar && (
          <button
            className="burger-menu"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            title="Ouvrir le menu"
          >
            ☰
          </button>
        )}
        <h2 className="page-title">{getPageTitle(currentPage)}</h2>
      </div>

      {/* Partie droite: Recherche, theme toggle et notifications */}
      <div className="topbar-right">
        {/* Barre de recherche */}
        <div className="topbar-search">
          <input type="text" placeholder="Rechercher..." />
          <span className="search-icon">🔍</span>
        </div>

        {/* Bouton toggle theme (seulement si mode manuel) */}
        {themeMode === 'manual' && (
          <button
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        )}

        {/* Centre de notifications */}
        <div className="notification-center">
          {/* Bouton cloche avec badge */}
          <button
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="notification-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {/* Dropdown des notifications (conditionnel) */}
          {showNotifications && (
            <div className="notification-dropdown">
              {/* En-tête du dropdown */}
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="mark-read">Tout marquer lu</button>
              </div>

              {/* Liste des notifications */}
              <div className="notification-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.type}`}>
                    <div className="notification-content">
                      <p>{notif.message}</p>
                      <span className="notification-time">Il y a {notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer du dropdown */}
              <div className="notification-footer">
                <button>Voir tout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
