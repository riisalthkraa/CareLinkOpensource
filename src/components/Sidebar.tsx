/**
 * Sidebar - Menu de navigation latéral
 *
 * Composant de navigation principal de l'application affichant:
 * - Logo et titre de l'application
 * - Informations de l'utilisateur connecté
 * - Menu de navigation avec icônes et badges
 * - Badge d'état de l'IA (Actif/Partiel/Démo)
 * - Bouton de déconnexion
 *
 * Le style de la sidebar s'adapte automatiquement au thème sélectionné
 * via les variables CSS --sidebar-gradient-start et --sidebar-gradient-end.
 *
 * @module Sidebar
 */

import { AIStatusBadge } from './AIStatusBadge';

/**
 * Props du composant Sidebar
 *
 * @interface SidebarProps
 * @property {string} currentPage - ID de la page actuellement active
 * @property {function} onNavigate - Callback appelé lors d'un clic sur un item du menu
 * @property {function} onLogout - Callback appelé lors du clic sur déconnexion
 * @property {string} [userName] - Nom de l'utilisateur connecté (défaut: 'Admin')
 * @property {boolean} [isOpen] - État d'ouverture sur mobile
 * @property {function} [onClose] - Callback pour fermer la sidebar sur mobile
 */
interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  userName?: string
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Sidebar - Composant de menu latéral de navigation
 *
 * Affiche le menu principal avec:
 * - 5 items de navigation (Accueil, Vaccins, Traitements, Rendez-vous, Config)
 * - Avatar et nom de l'utilisateur
 * - Indicateurs visuels de la page active
 * - Badges pour notifications (ex: 2 rendez-vous)
 * - Bouton de déconnexion
 *
 * @component
 * @param {SidebarProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le menu latéral de navigation
 */
function Sidebar({ currentPage, onNavigate, onLogout, userName = 'Admin', isOpen = false, onClose }: SidebarProps) {
  /**
   * Configuration des items du menu de navigation
   *
   * Chaque item contient:
   * - id: Identifiant unique correspondant à la page
   * - icon: Emoji utilisé comme icône
   * - label: Texte affiché dans le menu
   * - badge: Compteur optionnel (null si non utilisé)
   */
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Accueil', badge: null },
    { id: 'vaccins', icon: '💉', label: 'Vaccins', badge: null },
    { id: 'traitements', icon: '💊', label: 'Traitements', badge: null },
    { id: 'dossier-medical', icon: '📋', label: 'Dossier Médical', badge: null },
    { id: 'rendez-vous', icon: '📅', label: 'Rendez-vous', badge: '2' },
    { id: 'assistant-sante', icon: '🤖', label: 'Assistant Santé', badge: 'AI' },
    { id: 'chatdoctor', icon: '💬', label: 'ChatDoctor IA', badge: '🔥' },
    { id: 'analytics', icon: '📊', label: 'Analytics Santé', badge: 'NEW' },
    { id: 'timeline3d', icon: '📈', label: 'Timeline 3D', badge: '✨' },
    { id: 'mode-urgence', icon: '🆘', label: 'Mode Urgence', badge: null },
    { id: 'scanner', icon: '📸', label: 'Scanner Ordonnance', badge: null },
    { id: 'carte-urgence', icon: '🚨', label: 'Carte d\'Urgence', badge: null },
    { id: 'backup', icon: '💾', label: 'Backups', badge: null },
    { id: 'config', icon: '⚙️', label: 'Configuration', badge: null }
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* En-tête avec logo CareLink */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🏥</span>
          <h1 className="logo-text">CareLink</h1>
        </div>
        <p className="sidebar-subtitle">Gestion de Santé Familiale</p>
      </div>

      {/* Section utilisateur avec avatar */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {/* Affiche la première lettre du nom en majuscule */}
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <p className="user-name">{userName}</p>
          <p className="user-role">Administrateur</p>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {/* Badge de notification (si présent) */}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Footer avec bouton de déconnexion */}
      <div className="sidebar-footer">
        {/* Informations version et crédits */}
        <div className="sidebar-credits">
          <div className="credits-version">
            <span className="version-badge">v2.5.0</span>
          </div>
          <div className="credits-author">
            Créé par <strong>VIEY David</strong>
          </div>
          <div className="credits-role">
            Développeur & Créateur
          </div>
          {/* Badge IA compact */}
          <AIStatusBadge />
        </div>

        <button className="sidebar-logout" onClick={onLogout}>
          <span className="nav-icon">🔓</span>
          <span className="nav-label">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
