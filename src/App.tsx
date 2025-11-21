/**
 * App - Point d'entrée principal de CareLink
 *
 * Ce module gère l'architecture globale de l'application incluant:
 * - L'authentification des utilisateurs
 * - La navigation entre les pages
 * - Le système de thèmes
 * - Les notifications toast
 * - La gestion de l'état global
 *
 * ARCHITECTURE:
 * App (root)
 *   └─ ThemeProvider (gestion des thèmes)
 *       └─ NotificationProvider (système de notifications)
 *           └─ AppContent (logique applicative)
 *               ├─ Login (si non authentifié)
 *               └─ Layout principal (si authentifié)
 *                   ├─ Sidebar (navigation latérale)
 *                   ├─ TopBar (barre supérieure)
 *                   ├─ Content (page active)
 *                   └─ ToastContainer (notifications)
 *
 * @module App
 */

import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProfilMembre from './pages/ProfilMembre'
import Vaccins from './pages/Vaccins'
import Traitements from './pages/Traitements'
import RendezVous from './pages/RendezVous'
import Config from './pages/Config'
import CarteUrgence from './pages/CarteUrgence'
import ScannerOrdonnance from './pages/ScannerOrdonnance'
import Analytics from './pages/Analytics'
import ModeUrgence from './pages/ModeUrgence'
import AssistantSante from './pages/AssistantSante'
import ChatDoctor from './pages/ChatDoctor'
import Timeline3D from './pages/Timeline3D'
import DossierMedical from './pages/DossierMedical'
import Backup from './pages/Backup'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider, useNotification } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { loadAIConfigsFromStorage } from './services/aiConfigLoader'
import './App.css'
import './themes.css'
import './design-system.css'

/**
 * Type des pages disponibles dans l'application
 *
 * @typedef {'dashboard' | 'profil' | 'vaccins' | 'traitements' | 'rendez-vous' | 'config' | 'carte-urgence' | 'scanner' | 'analytics' | 'mode-urgence' | 'assistant-sante'} Page
 */
type Page = 'dashboard' | 'profil' | 'vaccins' | 'traitements' | 'rendez-vous' | 'config' | 'carte-urgence' | 'scanner' | 'analytics' | 'mode-urgence' | 'assistant-sante' | 'chatdoctor' | 'timeline3d' | 'dossier-medical' | 'backup'

/**
 * AppContent - Composant principal contenant la logique applicative
 *
 * Gère:
 * - L'état d'authentification
 * - La navigation entre les pages
 * - La sélection de membre actif
 * - Les actions de connexion/déconnexion
 *
 * @component
 * @returns {JSX.Element} L'interface complète de l'application
 */
function AppContent() {
  // ========== ÉTATS GLOBAUX ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>('Admin')
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedMembre, setSelectedMembre] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { addNotification } = useNotification()

  /**
   * Charger les configurations IA au démarrage de l'application
   */
  useEffect(() => {
    loadAIConfigsFromStorage()
  }, [])

  /**
   * Gère la connexion d'un utilisateur
   *
   * Processus:
   * 1. Enregistre l'ID utilisateur et met à jour l'état authentifié
   * 2. Charge les données de l'utilisateur (nom, etc.)
   * 3. Affiche un message de bienvenue après 500ms
   *
   * @function handleLogin
   * @param {number} loggedInUserId - L'ID de l'utilisateur qui vient de se connecter
   */
  const handleLogin = (loggedInUserId: number) => {
    setUserId(loggedInUserId)
    setIsAuthenticated(true)

    // Charger les infos utilisateur
    loadUserData(loggedInUserId)

    // Message de bienvenue avec délai pour une meilleure UX
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Bienvenue!',
        message: 'Vous êtes connecté. Bon retour sur CareLink!',
        duration: 4000
      })
    }, 500)
  }

  /**
   * Charge les données de l'utilisateur depuis la base de données
   *
   * Récupère le nom d'utilisateur pour l'afficher dans l'interface
   *
   * @async
   * @function loadUserData
   * @param {number} id - L'ID de l'utilisateur à charger
   */
  const loadUserData = async (id: number) => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT username FROM users WHERE id = ?',
        [id]
      )
      if (result.success && result.data.length > 0) {
        setUserName(result.data[0].username)
      }
    } catch (error) {
      console.error('Erreur chargement user:', error)
    }
  }

  /**
   * Gère la déconnexion de l'utilisateur
   *
   * Processus:
   * 1. Réinitialise l'état d'authentification
   * 2. Efface l'ID et le nom de l'utilisateur
   * 3. Retourne à la page dashboard
   * 4. Affiche un message d'au revoir
   *
   * @function handleLogout
   */
  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserId(null)
    setCurrentPage('dashboard')
    addNotification({
      type: 'info',
      title: 'Déconnexion',
      message: 'À bientôt!',
      duration: 3000
    })
  }

  /**
   * Toggle la sidebar sur mobile
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  /**
   * Ferme la sidebar
   */
  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Si non authentifié, afficher la page de connexion
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  /**
   * Fonction de rendu de la page active
   *
   * Utilise un switch pour rendre le composant correspondant à la page active.
   * Chaque page reçoit les props nécessaires (callbacks, IDs, etc.)
   *
   * @function renderPage
   * @returns {JSX.Element} Le composant de la page active
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        // Dashboard principal avec liste des membres de la famille
        return <Dashboard onNavigate={setCurrentPage} onSelectMembre={setSelectedMembre} />
      case 'profil':
        // Profil détaillé d'un membre sélectionné
        return <ProfilMembre membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} onNavigate={setCurrentPage} />
      case 'vaccins':
        // Gestion des vaccins d'un membre
        return <Vaccins membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'traitements':
        // Gestion des traitements médicaux d'un membre
        return <Traitements membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'rendez-vous':
        // Calendrier des rendez-vous médicaux
        return <RendezVous onBack={() => setCurrentPage('dashboard')} />
      case 'carte-urgence':
        // Génération de carte d'urgence avec QR code
        return <CarteUrgence onBack={() => setCurrentPage('dashboard')} membreId={selectedMembre} />
      case 'scanner':
        // Scanner OCR d'ordonnances
        return <ScannerOrdonnance onBack={() => setCurrentPage('dashboard')} membreId={selectedMembre} />
      case 'analytics':
        // Analytics santé avancés
        return <Analytics membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'dossier-medical':
        // Dossier médical complet (antécédents, diagnostics, bilans, consultations)
        return <DossierMedical membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'mode-urgence':
        // Mode urgence intelligent
        return <ModeUrgence membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'assistant-sante':
        // Assistant santé intelligent CareAI
        return <AssistantSante membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'chatdoctor':
        // ChatDoctor - Assistant médical IA conversationnel
        return <ChatDoctor membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'timeline3d':
        // Timeline 3D - Vue chronologique des données médicales
        return <Timeline3D membreId={selectedMembre} onBack={() => setCurrentPage('dashboard')} />
      case 'backup':
        // Gestion des backups - Sauvegarde et restauration de la base de données
        return <Backup onBack={() => setCurrentPage('dashboard')} />
      case 'config':
        // Configuration du compte et préférences
        return <Config userId={userId!} />
      default:
        // Fallback sur le dashboard
        return <Dashboard onNavigate={setCurrentPage} onSelectMembre={setSelectedMembre} />
    }
  }

  // Layout principal de l'application (après authentification)
  return (
    <div className="app-layout">
      {/* Menu latéral de navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page)
          closeSidebar() // Fermer la sidebar après navigation sur mobile
        }}
        onLogout={handleLogout}
        userName={userName}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Overlay pour fermer la sidebar sur mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Zone principale de contenu */}
      <div className="app-main">
        {/* Barre supérieure avec titre et infos utilisateur */}
        <TopBar
          userName={userName}
          currentPage={currentPage}
          onToggleSidebar={toggleSidebar}
        />

        {/* Contenu de la page active */}
        <main className="app-content">
          {renderPage()}
        </main>
      </div>

      {/* Conteneur des notifications toast */}
      <ToastContainer />
    </div>
  )
}

/**
 * App - Composant racine de l'application
 *
 * Encapsule l'application dans les providers nécessaires:
 * 1. ThemeProvider - Gestion des thèmes (20 thèmes disponibles)
 * 2. NotificationProvider - Système de notifications toast
 * 3. AppContent - Logique applicative principale
 *
 * Cette structure permet:
 * - Une gestion centralisée du thème accessible partout
 * - Un système de notifications global
 * - Une séparation claire des responsabilités
 *
 * @component
 * @returns {JSX.Element} L'application complète avec tous les providers
 */
function App() {
  return (
    <ErrorBoundary fallbackMessage="Une erreur critique est survenue dans l'application. Veuillez réessayer ou recharger la page.">
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
