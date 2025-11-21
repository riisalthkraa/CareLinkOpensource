/**
 * ConfigModern - Interface moderne de configuration avec thèmes améliorés
 *
 * Cette version améliorée inclut:
 * - Aperçu en temps réel des thèmes
 * - Présentation par catégories (Spécialisés, Clairs, Sombres)
 * - Affichage des caractéristiques uniques de chaque thème
 * - Interface de sélection plus visuelle et intuitive
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'

interface ConfigModernProps {
  userId: number
}

function ConfigModern({ userId }: ConfigModernProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'themes' | 'advanced'>('themes')
  const [previewTheme, setPreviewTheme] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'specialized' | 'light' | 'dark'>('specialized')

  const {
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
  } = useTheme()

  const [newUsername, setNewUsername] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customTimeStart, setCustomTimeStart] = useState(timeRange.start)
  const [customTimeEnd, setCustomTimeEnd] = useState(timeRange.end)

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData()
  }, [userId])

  useEffect(() => {
    setCustomTimeStart(timeRange.start)
    setCustomTimeEnd(timeRange.end)
  }, [timeRange])

  const loadUserData = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT id, username, created_at FROM users WHERE id = ?',
        [userId]
      )
      if (result.success && result.data.length > 0) {
        setCurrentUser(result.data[0])
        setNewUsername(result.data[0].username)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
    }
  }

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newUsername.trim()) {
      setError('Le nom d\'utilisateur ne peut pas être vide')
      return
    }

    try {
      const checkResult = await window.electronAPI.dbQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [newUsername, userId]
      )

      if (checkResult.success && checkResult.data.length > 0) {
        setError('Ce nom d\'utilisateur est déjà utilisé')
        return
      }

      const result = await window.electronAPI.dbRun(
        'UPDATE users SET username = ? WHERE id = ?',
        [newUsername, userId]
      )

      if (result.success) {
        setSuccess('Nom d\'utilisateur modifié avec succès')
        setIsEditingUsername(false)
        loadUserData()
      }
    } catch (error) {
      setError('Impossible de modifier le nom d\'utilisateur')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Tous les champs sont requis')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.newPassword.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères')
      return
    }

    try {
      const checkResult = await window.electronAPI.dbQuery(
        'SELECT id FROM users WHERE id = ? AND password = ?',
        [userId, passwordForm.currentPassword]
      )

      if (!checkResult.success || checkResult.data.length === 0) {
        setError('Mot de passe actuel incorrect')
        return
      }

      const result = await window.electronAPI.dbRun(
        'UPDATE users SET password = ? WHERE id = ?',
        [passwordForm.newPassword, userId]
      )

      if (result.success) {
        setSuccess('Mot de passe modifié avec succès')
        setIsEditingPassword(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      setError('Impossible de modifier le mot de passe')
    }
  }

  const handleTimeRangeUpdate = () => {
    setTimeRange(customTimeStart, customTimeEnd)
    setSuccess('Horaires mis à jour')
    setTimeout(() => setSuccess(''), 2000)
  }

  // Filtrer les thèmes par catégorie
  const specializedThemes = ['medical-pro', 'senior', 'night', 'accessibility', 'modern', 'minimalist']
  const getThemesByCategory = () => {
    switch (selectedCategory) {
      case 'specialized':
        return themes.filter(t => specializedThemes.includes(t.id))
      case 'light':
        return themes.filter(t => t.category === 'light' && !specializedThemes.includes(t.id))
      case 'dark':
        return themes.filter(t => t.category === 'dark' && !specializedThemes.includes(t.id))
      default:
        return []
    }
  }

  const handleThemeSelect = (themeId: string, category: string) => {
    if (category === 'dark') {
      setDarkTheme(themeId)
    } else {
      setLightTheme(themeId)
    }
    setSuccess('Thème appliqué avec succès')
    setTimeout(() => setSuccess(''), 2000)

    // Appliquer immédiatement si c'est le bon mode
    if ((category === 'dark' && isDarkMode) || (category !== 'dark' && !isDarkMode)) {
      document.documentElement.setAttribute('data-theme', themeId)
    }
  }

  const handlePreview = (themeId: string) => {
    if (previewTheme === themeId) {
      // Restaurer le thème actuel
      document.documentElement.setAttribute('data-theme', isDarkMode ? darkTheme : lightTheme)
      setPreviewTheme(null)
    } else {
      // Prévisualiser le nouveau thème
      document.documentElement.setAttribute('data-theme', themeId)
      setPreviewTheme(themeId)
    }
  }

  return (
    <div className="config-page-modern">
      {/* Header avec tabs */}
      <div className="config-header-modern">
        <h1 className="config-title">Configuration</h1>
        <p className="config-subtitle">Personnalisez votre expérience CareLink</p>

        <div className="config-tabs">
          <button
            className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveTab('themes')}
          >
            <span className="tab-icon">🎨</span>
            <span>Thèmes</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <span className="tab-icon">👤</span>
            <span>Compte</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <span className="tab-icon">⚙️</span>
            <span>Avancé</span>
          </button>
        </div>
      </div>

      {error && <div className="alert-modern alert-error">{error}</div>}
      {success && <div className="alert-modern alert-success">{success}</div>}

      {/* Tab Thèmes */}
      {activeTab === 'themes' && (
        <div className="themes-section">
          {/* Mode de basculement */}
          <div className="theme-mode-section card-modern">
            <h3>Mode de basculement</h3>
            <div className="theme-mode-options">
              <label className="mode-option">
                <input
                  type="radio"
                  name="themeMode"
                  value="manual"
                  checked={themeMode === 'manual'}
                  onChange={() => setThemeMode('manual')}
                />
                <div className="mode-option-content">
                  <span className="mode-icon">🔄</span>
                  <div>
                    <strong>Manuel</strong>
                    <p>Basculez manuellement entre les thèmes</p>
                  </div>
                </div>
              </label>

              <label className="mode-option">
                <input
                  type="radio"
                  name="themeMode"
                  value="time-based"
                  checked={themeMode === 'time-based'}
                  onChange={() => setThemeMode('time-based')}
                />
                <div className="mode-option-content">
                  <span className="mode-icon">⏰</span>
                  <div>
                    <strong>Selon l'heure</strong>
                    <p>Changement automatique jour/nuit</p>
                  </div>
                </div>
              </label>

              <label className="mode-option">
                <input
                  type="radio"
                  name="themeMode"
                  value="system"
                  checked={themeMode === 'system'}
                  onChange={() => setThemeMode('system')}
                />
                <div className="mode-option-content">
                  <span className="mode-icon">💻</span>
                  <div>
                    <strong>Système</strong>
                    <p>Suivre les préférences du système</p>
                  </div>
                </div>
              </label>
            </div>

            {themeMode === 'time-based' && (
              <div className="time-config">
                <h4>Configuration des horaires</h4>
                <div className="time-inputs">
                  <div className="time-input-group">
                    <label>Mode clair de</label>
                    <input
                      type="time"
                      value={customTimeStart}
                      onChange={(e) => setCustomTimeStart(e.target.value)}
                    />
                  </div>
                  <div className="time-input-group">
                    <label>Mode sombre à</label>
                    <input
                      type="time"
                      value={customTimeEnd}
                      onChange={(e) => setCustomTimeEnd(e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={handleTimeRangeUpdate} className="btn-apply-time">
                  Appliquer les horaires
                </button>
              </div>
            )}
          </div>

          {/* Sélection des thèmes */}
          <div className="theme-selection-section card-modern">
            <h3>Sélection des thèmes</h3>

            {/* Indicateur du thème actuel */}
            <div className="current-theme-info">
              <div className="current-theme-item">
                <span className="label">Thème clair actuel:</span>
                <span className="theme-name">
                  {themes.find(t => t.id === lightTheme)?.icon} {themes.find(t => t.id === lightTheme)?.name}
                </span>
              </div>
              <div className="current-theme-item">
                <span className="label">Thème sombre actuel:</span>
                <span className="theme-name">
                  {themes.find(t => t.id === darkTheme)?.icon} {themes.find(t => t.id === darkTheme)?.name}
                </span>
              </div>
              <div className="current-theme-item">
                <span className="label">Mode actif:</span>
                <span className="theme-name">
                  {isDarkMode ? '🌙 Sombre' : '☀️ Clair'}
                </span>
              </div>
            </div>

            {/* Catégories de thèmes */}
            <div className="theme-categories">
              <button
                className={`category-btn ${selectedCategory === 'specialized' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('specialized')}
              >
                <span>✨</span>
                <span>Thèmes Spécialisés</span>
              </button>
              <button
                className={`category-btn ${selectedCategory === 'light' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('light')}
              >
                <span>☀️</span>
                <span>Thèmes Clairs</span>
              </button>
              <button
                className={`category-btn ${selectedCategory === 'dark' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('dark')}
              >
                <span>🌙</span>
                <span>Thèmes Sombres</span>
              </button>
            </div>

            {/* Grille de thèmes */}
            <div className="themes-grid-modern">
              {getThemesByCategory().map(theme => (
                <div
                  key={theme.id}
                  className={`theme-card-modern ${
                    (theme.category === 'dark' ? darkTheme : lightTheme) === theme.id ? 'active' : ''
                  } ${previewTheme === theme.id ? 'previewing' : ''}`}
                  data-theme-category={theme.category}
                >
                  <div className="theme-card-header">
                    <span className="theme-icon">{theme.icon}</span>
                    <h4 className="theme-name">{theme.name}</h4>
                    {((theme.category === 'dark' ? darkTheme : lightTheme) === theme.id) && (
                      <span className="active-badge">Actif</span>
                    )}
                  </div>

                  <p className="theme-description">{theme.description}</p>

                  {theme.features && (
                    <div className="theme-features">
                      {theme.features.map((feature, idx) => (
                        <span key={idx} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  )}

                  <div className="theme-actions">
                    <button
                      className="btn-preview"
                      onClick={() => handlePreview(theme.id)}
                    >
                      {previewTheme === theme.id ? 'Arrêter' : 'Aperçu'}
                    </button>
                    <button
                      className="btn-apply"
                      onClick={() => handleThemeSelect(theme.id, theme.category)}
                      disabled={(theme.category === 'dark' ? darkTheme : lightTheme) === theme.id}
                    >
                      {(theme.category === 'dark' ? darkTheme : lightTheme) === theme.id ? 'Sélectionné' : 'Appliquer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Compte */}
      {activeTab === 'account' && currentUser && (
        <div className="account-section">
          <div className="card-modern">
            <h3>Informations du compte</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Identifiant</span>
                <span className="info-value">#{currentUser.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nom d'utilisateur</span>
                <span className="info-value">{currentUser.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Membre depuis</span>
                <span className="info-value">
                  {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Modification du nom d'utilisateur */}
          <div className="card-modern">
            <h3>Modifier le nom d'utilisateur</h3>
            {!isEditingUsername ? (
              <button
                onClick={() => setIsEditingUsername(true)}
                className="btn-secondary"
              >
                Modifier
              </button>
            ) : (
              <form onSubmit={handleUsernameChange}>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Nouveau nom d'utilisateur"
                  className="input-modern"
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Valider</button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(false)
                      setNewUsername(currentUser.username)
                    }}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Modification du mot de passe */}
          <div className="card-modern">
            <h3>Modifier le mot de passe</h3>
            {!isEditingPassword ? (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="btn-secondary"
              >
                Modifier
              </button>
            ) : (
              <form onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="input-modern"
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="input-modern"
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="input-modern"
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Valider</button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false)
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab Avancé */}
      {activeTab === 'advanced' && (
        <div className="advanced-section">
          <div className="card-modern">
            <h3>Préférences avancées</h3>
            <div className="preference-item">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Activer les animations</span>
              </label>
              <p className="preference-description">
                Animations fluides pour les transitions et interactions
              </p>
            </div>
            <div className="preference-item">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Activer les effets visuels</span>
              </label>
              <p className="preference-description">
                Glassmorphisme, néomorphisme et autres effets modernes
              </p>
            </div>
            <div className="preference-item">
              <label>
                <input type="checkbox" />
                <span>Mode haute performance</span>
              </label>
              <p className="preference-description">
                Désactive certains effets pour améliorer les performances
              </p>
            </div>
            <div className="preference-item">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Afficher les tooltips</span>
              </label>
              <p className="preference-description">
                Bulles d'aide au survol des éléments
              </p>
            </div>
          </div>

          <div className="card-modern">
            <h3>À propos de CareLink</h3>
            <div className="about-info">
              <p><strong>Version:</strong> 2.0.0</p>
              <p><strong>Développé par:</strong> CareLink Team</p>
              <p><strong>Technologies:</strong> React, TypeScript, Electron</p>
              <p className="about-description">
                CareLink est une application de gestion médicale moderne conçue pour
                simplifier le suivi des patients et la gestion des traitements médicaux.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigModern