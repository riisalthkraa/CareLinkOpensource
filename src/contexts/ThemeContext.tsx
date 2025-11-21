/**
 * ThemeContext - Gestion globale des thèmes de l'application CareLink
 *
 * Ce module fournit un système de thèmes complet avec 20 thèmes différents
 * (10 clairs et 10 sombres) qui personnalisent l'apparence de toute l'application.
 *
 * @module ThemeContext
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * Liste des thèmes disponibles dans CareLink
 *
 * Chaque thème définit une palette de couleurs complète incluant:
 * - Couleurs principales et secondaires
 * - Couleurs de fond et de texte
 * - Gradients pour la sidebar
 * - Typographie personnalisée
 * - Animations et transitions uniques
 * - Effets visuels spéciaux (glassmorphisme, néomorphisme, etc.)
 *
 * Les définitions CSS de ces thèmes se trouvent dans:
 * - src/themes.css (thèmes originaux)
 * - src/themes-modern.css (thèmes modernes avec personnalités uniques)
 */
export const themes = [
  // ========== THÈMES SPÉCIALISÉS ==========
  {
    id: 'medical-pro',
    name: 'Médical Pro',
    category: 'light',
    description: 'Ultra-professionnel pour cabinets médicaux',
    features: ['Typographie IBM Plex', 'Design épuré', 'Animations subtiles', 'Haute lisibilité'],
    icon: '🏥'
  },
  {
    id: 'senior',
    name: 'Sénior',
    category: 'light',
    description: 'Grandes polices et contraste élevé',
    features: ['Police Lexend', 'Taille 18px+', 'Bordures épaisses', 'Navigation simplifiée'],
    icon: '👴'
  },
  {
    id: 'night',
    name: 'Nuit',
    category: 'dark',
    description: 'Optimisé pour utilisation nocturne',
    features: ['Lumière douce', 'Effets néon', 'Protection oculaire', 'Ambiance relaxante'],
    icon: '🌙'
  },
  {
    id: 'accessibility',
    name: 'Accessibilité',
    category: 'light',
    description: 'WCAG AAA compliant',
    features: ['Contraste maximal', 'Sans animations', 'Focus visible', 'Navigation clavier'],
    icon: '♿'
  },
  {
    id: 'modern',
    name: 'Moderne',
    category: 'light',
    description: 'Design cutting-edge avec animations',
    features: ['Glassmorphisme', 'Animations 3D', 'Effets parallaxe', 'Micro-interactions'],
    icon: '✨'
  },
  {
    id: 'minimalist',
    name: 'Minimaliste',
    category: 'light',
    description: 'Épuré et zen',
    features: ['Sans bordures', 'Monochrome', 'Espaces généreux', 'Focus sur le contenu'],
    icon: '⚪'
  },

  // ========== THÈMES CLAIRS CLASSIQUES ==========
  { id: 'classic-blue', name: 'Classic Blue', category: 'light', description: 'Bleu professionnel médical', icon: '💙' },
  { id: 'medical-green', name: 'Medical Green', category: 'light', description: 'Vert apaisant', icon: '💚' },
  { id: 'warm-orange', name: 'Warm Orange', category: 'light', description: 'Orange chaleureux', icon: '🧡' },
  { id: 'purple-pro', name: 'Purple Pro', category: 'light', description: 'Violet élégant', icon: '💜' },
  { id: 'ocean-teal', name: 'Ocean Teal', category: 'light', description: 'Turquoise océan', icon: '🌊' },
  { id: 'sunset-pink', name: 'Sunset Pink', category: 'light', description: 'Rose coucher de soleil', icon: '🌅' },
  { id: 'fresh-mint', name: 'Fresh Mint', category: 'light', description: 'Vert menthe frais', icon: '🌿' },
  { id: 'sky-blue', name: 'Sky Blue', category: 'light', description: 'Bleu ciel lumineux', icon: '☁️' },
  { id: 'elegant-gray', name: 'Elegant Gray', category: 'light', description: 'Gris minimaliste', icon: '🔘' },
  { id: 'vibrant-red', name: 'Vibrant Red', category: 'light', description: 'Rouge énergique', icon: '❤️' },

  // ========== THÈMES SOMBRES CLASSIQUES ==========
  { id: 'dark-blue', name: 'Dark Blue', category: 'dark', description: 'Bleu foncé élégant', icon: '🌌' },
  { id: 'carbon', name: 'Carbon', category: 'dark', description: 'Noir carbone profond', icon: '⚫' },
  { id: 'forest-night', name: 'Forest Night', category: 'dark', description: 'Vert forêt nuit', icon: '🌲' },
  { id: 'purple-haze', name: 'Purple Haze', category: 'dark', description: 'Violet mystique', icon: '🔮' },
  { id: 'midnight', name: 'Midnight', category: 'dark', description: 'Minuit profond', icon: '🌃' },
  { id: 'crimson-dark', name: 'Crimson Dark', category: 'dark', description: 'Rouge sombre', icon: '🩸' },
  { id: 'ocean-deep', name: 'Ocean Deep', category: 'dark', description: 'Océan profond', icon: '🌊' },
  { id: 'slate', name: 'Slate', category: 'dark', description: 'Ardoise sophistiquée', icon: '🪨' },
  { id: 'charcoal', name: 'Charcoal', category: 'dark', description: 'Charbon mat', icon: '◼️' },
  { id: 'neon', name: 'Neon', category: 'dark', description: 'Cyberpunk néon', icon: '🎮' },
]

/**
 * Modes de basculement automatique du thème
 */
export type ThemeMode = 'manual' | 'time-based' | 'system'

/**
 * Type du contexte de thème
 *
 * @interface ThemeContextType
 * @property {string} currentTheme - L'ID du thème actuellement actif
 * @property {string} lightTheme - L'ID du thème clair préféré
 * @property {string} darkTheme - L'ID du thème sombre préféré
 * @property {boolean} isDarkMode - Si le mode sombre est actif
 * @property {ThemeMode} themeMode - Mode de basculement (manual/time-based/system)
 * @property {function} setLightTheme - Définir le thème clair
 * @property {function} setDarkTheme - Définir le thème sombre
 * @property {function} toggleDarkMode - Basculer manuellement clair/sombre
 * @property {function} setThemeMode - Changer le mode de basculement
 * @property {function} setTimeRange - Définir les heures de basculement
 * @property {Object} timeRange - Heures de début/fin du mode clair
 * @property {Array} themes - Liste de tous les thèmes disponibles
 */
interface ThemeContextType {
  currentTheme: string
  lightTheme: string
  darkTheme: string
  isDarkMode: boolean
  themeMode: ThemeMode
  setLightTheme: (themeId: string) => void
  setDarkTheme: (themeId: string) => void
  toggleDarkMode: () => void
  setThemeMode: (mode: ThemeMode) => void
  setTimeRange: (start: string, end: string) => void
  timeRange: { start: string; end: string }
  themes: typeof themes
}

// Création du contexte React pour le thème
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider - Composant fournisseur de thème
 *
 * Gère l'état du thème actuel et sa persistance dans localStorage.
 * Applique automatiquement le thème sélectionné à tout le document.
 *
 * @component
 * @param {Object} props
 * @param {ReactNode} props.children - Composants enfants qui auront accès au contexte
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // États pour les thèmes préférés
  const [lightTheme, setLightThemeState] = useState('classic-blue')
  const [darkTheme, setDarkThemeState] = useState('dark-blue')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeMode, setThemeModeState] = useState<ThemeMode>('manual')
  const [timeRange, setTimeRangeState] = useState({ start: '08:00', end: '20:00' })

  /**
   * Effet: Charger les préférences sauvegardées au montage
   */
  useEffect(() => {
    const savedLightTheme = localStorage.getItem('carelink-light-theme')
    const savedDarkTheme = localStorage.getItem('carelink-dark-theme')
    const savedMode = localStorage.getItem('carelink-theme-mode') as ThemeMode
    const savedTimeStart = localStorage.getItem('carelink-time-start')
    const savedTimeEnd = localStorage.getItem('carelink-time-end')
    const savedIsDark = localStorage.getItem('carelink-is-dark-mode')

    if (savedLightTheme) setLightThemeState(savedLightTheme)
    if (savedDarkTheme) setDarkThemeState(savedDarkTheme)
    if (savedMode) setThemeModeState(savedMode)
    if (savedTimeStart && savedTimeEnd) {
      setTimeRangeState({ start: savedTimeStart, end: savedTimeEnd })
    }
    if (savedIsDark) setIsDarkMode(savedIsDark === 'true')
  }, [])

  /**
   * Effet: Gérer le basculement automatique selon le mode
   */
  useEffect(() => {
    const checkThemeMode = () => {
      if (themeMode === 'time-based') {
        // Basculement selon l'heure
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const shouldBeDark = currentTime < timeRange.start || currentTime >= timeRange.end
        console.log('🌓 Theme time-based check:', {
          currentTime,
          timeRange,
          shouldBeDark,
          currentMode: themeMode
        })
        setIsDarkMode(shouldBeDark)
      } else if (themeMode === 'system') {
        // Basculement selon les préférences système
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        console.log('🌓 Theme system check:', { systemPrefersDark })
        setIsDarkMode(systemPrefersDark)
      }
    }

    checkThemeMode()

    // Vérifier toutes les minutes pour le mode time-based
    const interval = setInterval(checkThemeMode, 60000)

    // Écouter les changements système pour le mode system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (themeMode === 'system') {
        setIsDarkMode(mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      clearInterval(interval)
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeMode, timeRange])

  /**
   * Effet: Appliquer le thème au document HTML
   */
  useEffect(() => {
    const currentTheme = isDarkMode ? darkTheme : lightTheme
    document.documentElement.setAttribute('data-theme', currentTheme)
    localStorage.setItem('carelink-is-dark-mode', String(isDarkMode))
  }, [isDarkMode, lightTheme, darkTheme])

  /**
   * Fonctions pour modifier les thèmes
   */
  const setLightTheme = (themeId: string) => {
    setLightThemeState(themeId)
    localStorage.setItem('carelink-light-theme', themeId)
  }

  const setDarkTheme = (themeId: string) => {
    setDarkThemeState(themeId)
    localStorage.setItem('carelink-dark-theme', themeId)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('carelink-theme-mode', mode)
  }

  const setTimeRange = (start: string, end: string) => {
    setTimeRangeState({ start, end })
    localStorage.setItem('carelink-time-start', start)
    localStorage.setItem('carelink-time-end', end)
  }

  const currentTheme = isDarkMode ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        lightTheme,
        darkTheme,
        isDarkMode,
        themeMode,
        setLightTheme,
        setDarkTheme,
        toggleDarkMode,
        setThemeMode,
        setTimeRange,
        timeRange,
        themes
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook personnalisé pour accéder au contexte de thème
 *
 * Permet aux composants d'accéder au thème actuel et de le modifier
 *
 * @returns {ThemeContextType} L'objet contenant theme, setTheme, et themes
 * @throws {Error} Si utilisé en dehors d'un ThemeProvider
 *
 * @example
 * function MyComponent() {
 *   const { theme, setTheme } = useTheme()
 *   return <button onClick={() => setTheme('dark-blue')}>Changer thème</button>
 * }
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
