/**
 * Config - Page de configuration de l'utilisateur
 *
 * Cette page permet à l'utilisateur de:
 * - Modifier son nom d'utilisateur
 * - Changer son mot de passe
 * - Sélectionner un thème clair et un thème sombre
 * - Configurer le mode de basculement automatique
 * - Gérer plusieurs providers IA avec priorités
 * - Voir les informations de son compte
 *
 * @module Config
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'
import { aiManager, AIProvider, AVAILABLE_MODELS, type AIProviderConfig } from '../utils/aiProviders'
import { OllamaSetup } from '../components/OllamaSetup'

/**
 * Props du composant Config
 */
interface ConfigProps {
  userId: number
}

/**
 * Validates password strength according to security requirements
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 12) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins 12 caractères' }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule' }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule' }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)' }
  }

  return { isValid: true, message: 'Mot de passe fort' }
}

function Config({ userId }: ConfigProps) {
  // ========== ÉTATS LOCAUX ==========
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)

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

  // Horaires personnalisés
  const [customTimeStart, setCustomTimeStart] = useState(timeRange.start)
  const [customTimeEnd, setCustomTimeEnd] = useState(timeRange.end)

  // Multi-provider IA
  const [showAddForm, setShowAddForm] = useState(false)
  const [aiConfigs, setAiConfigs] = useState<AIProviderConfig[]>([])
  const [formData, setFormData] = useState({
    provider: AIProvider.GOOGLE,
    apiKey: '',
    model: 'gemini-1.5-pro',
    endpoint: '',
    priority: 50
  })
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [aiTestMessage, setAiTestMessage] = useState('')

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData()
  }, [userId])

  useEffect(() => {
    setCustomTimeStart(timeRange.start)
    setCustomTimeEnd(timeRange.end)
  }, [timeRange])

  // Charger les configurations IA
  useEffect(() => {
    loadAIConfigs()
  }, [])

  const loadAIConfigs = async () => {
    try {
      // Charger depuis le stockage sécurisé
      const result = await window.electronAPI.secureGetConfig('aiConfigs')
      if (result.success && result.data) {
        const savedConfigs: AIProviderConfig[] = JSON.parse(result.data)
        // Restaurer dans aiManager
        savedConfigs.forEach(config => {
          aiManager.addConfig(config)
        })
      }
    } catch (error) {
      console.error('Erreur chargement configurations IA:', error)
    }

    // Mettre à jour l'affichage
    const configs = aiManager.getAllConfigs()
    setAiConfigs(configs)
  }

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

    if (newUsername === currentUser.username) {
      setError('Le nouveau nom est identique à l\'ancien')
      return
    }

    try {
      // Vérifier si le nom est déjà pris
      const checkResult = await window.electronAPI.dbQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [newUsername, userId]
      )

      if (checkResult.success && checkResult.data.length > 0) {
        setError('Ce nom d\'utilisateur est déjà utilisé')
        return
      }

      // Mettre à jour
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
      console.error('Erreur modification username:', error)
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

    // Validate password strength
    const validation = validatePasswordStrength(passwordForm.newPassword)
    if (!validation.isValid) {
      setError(validation.message)
      return
    }

    try {
      // Use the secure authChangePassword IPC handler that properly verifies with bcrypt
      const result = await window.electronAPI.authChangePassword(
        userId,
        passwordForm.currentPassword,
        passwordForm.newPassword
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
      console.error('Erreur modification password:', error)
      setError('Impossible de modifier le mot de passe')
    }
  }

  const handleTimeRangeUpdate = () => {
    setTimeRange(customTimeStart, customTimeEnd)
    setSuccess('Horaires mis à jour')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleProviderChange = (newProvider: AIProvider) => {
    const firstModel = AVAILABLE_MODELS[newProvider][0]
    setFormData({
      ...formData,
      provider: newProvider,
      model: firstModel.id,
      endpoint: newProvider === AIProvider.LOCAL ? 'http://localhost:11434' : '',
      apiKey: newProvider === AIProvider.LOCAL ? '' : formData.apiKey
    })
  }

  const handleAddConfig = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (formData.provider !== AIProvider.LOCAL && formData.provider !== AIProvider.BASIC && !formData.apiKey) {
      setError('La clé API est requise pour ce provider')
      return
    }

    try {
      const config: AIProviderConfig = {
        provider: formData.provider,
        apiKey: formData.apiKey || undefined,
        model: formData.model,
        endpoint: formData.endpoint || undefined,
        priority: formData.priority,
        isActive: true
      }

      aiManager.addConfig(config)

      // Sauvegarder dans le stockage sécurisé
      const allConfigs = aiManager.getAllConfigs()
      await window.electronAPI.secureSaveConfig('aiConfigs', JSON.stringify(allConfigs))

      setSuccess('Configuration ajoutée avec succès')
      loadAIConfigs()
      setShowAddForm(false)
      setFormData({
        provider: AIProvider.GOOGLE,
        apiKey: '',
        model: 'gemini-1.5-pro',
        endpoint: '',
        priority: 50
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout de la configuration')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette configuration ?')) {
      return
    }

    try {
      aiManager.removeConfig(id)

      // Sauvegarder dans le stockage sécurisé
      const allConfigs = aiManager.getAllConfigs()
      await window.electronAPI.secureSaveConfig('aiConfigs', JSON.stringify(allConfigs))

      setSuccess('Configuration supprimée')
      loadAIConfigs()
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      setError('Erreur lors de la suppression')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleToggleConfig = async (id: string, isActive: boolean) => {
    try {
      aiManager.toggleConfig(id, isActive)

      // Sauvegarder dans le stockage sécurisé
      const allConfigs = aiManager.getAllConfigs()
      await window.electronAPI.secureSaveConfig('aiConfigs', JSON.stringify(allConfigs))

      loadAIConfigs()
    } catch (error) {
      setError('Erreur lors de la modification')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleSetPriority = async (id: string, priority: number) => {
    try {
      aiManager.setPriority(id, priority)

      // Sauvegarder dans le stockage sécurisé
      const allConfigs = aiManager.getAllConfigs()
      await window.electronAPI.secureSaveConfig('aiConfigs', JSON.stringify(allConfigs))

      loadAIConfigs()
    } catch (error) {
      setError('Erreur lors de la modification de priorité')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleTestConnection = async () => {
    setAiTestStatus('testing')
    setAiTestMessage('')

    try {
      const testConfig: AIProviderConfig = {
        provider: formData.provider,
        apiKey: formData.apiKey || undefined,
        model: formData.model,
        endpoint: formData.endpoint || undefined
      }

      aiManager.setConfig(testConfig)
      const result = await aiManager.testConnection()

      if (result.success) {
        setAiTestStatus('success')
        setAiTestMessage('Connexion réussie! ✅')
        setTimeout(() => {
          setAiTestStatus('idle')
          setAiTestMessage('')
        }, 3000)
      } else {
        setAiTestStatus('error')
        setAiTestMessage(result.error || 'Échec de la connexion')
        setTimeout(() => {
          setAiTestStatus('idle')
          setAiTestMessage('')
        }, 5000)
      }
    } catch (error: any) {
      setAiTestStatus('error')
      setAiTestMessage(error.message || 'Erreur lors du test')
      setTimeout(() => {
        setAiTestStatus('idle')
        setAiTestMessage('')
      }, 5000)
    }
  }

  // Informations sur les providers
  const providerInfo: Record<AIProvider, { name: string; gradient: string; bgLight: string; textColor: string; emoji: string }> = {
    [AIProvider.OPENAI]: {
      name: 'OpenAI',
      gradient: 'linear-gradient(135deg, #10a37f 0%, #0d8a6c 100%)',
      bgLight: 'rgba(16, 163, 127, 0.1)',
      textColor: '#10a37f',
      emoji: '🤖'
    },
    [AIProvider.ANTHROPIC]: {
      name: 'Claude (Anthropic)',
      gradient: 'linear-gradient(135deg, #D4A574 0%, #B8854F 100%)',
      bgLight: 'rgba(212, 165, 116, 0.1)',
      textColor: '#D4A574',
      emoji: '🧠'
    },
    [AIProvider.GOOGLE]: {
      name: 'Google Gemini',
      gradient: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)',
      bgLight: 'rgba(66, 133, 244, 0.1)',
      textColor: '#4285f4',
      emoji: '✨'
    },
    [AIProvider.LOCAL]: {
      name: 'Ollama (Local)',
      gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
      bgLight: 'rgba(107, 114, 128, 0.1)',
      textColor: '#6b7280',
      emoji: '🏠'
    },
    [AIProvider.BASIC]: {
      name: 'Mode Basique (Démo)',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      bgLight: 'rgba(239, 68, 68, 0.1)',
      textColor: '#ef4444',
      emoji: '📋'
    }
  }

  // Séparer les thèmes clairs et sombres
  const lightThemes = themes.filter(t => t.category === 'light')
  const darkThemes = themes.filter(t => t.category === 'dark')

  return (
    <div className="config-page">
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <div>
            <h1 className="h1 m-0">⚙️ Configuration</h1>
            <p className="text-sm text-secondary m-0">Gérez votre compte et vos préférences</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-md dismissible">
          <span className="alert-icon" aria-hidden="true">⚠️</span>
          <div className="alert-content">
            <div className="alert-message">{error}</div>
          </div>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-md dismissible">
          <span className="alert-icon" aria-hidden="true">✅</span>
          <div className="alert-content">
            <div className="alert-message">{success}</div>
          </div>
        </div>
      )}

      {/* Informations du compte */}
      <div className="card">
        <h3>👤 Compte</h3>

        {!isEditingUsername ? (
          <div className="info-group">
            <label>Nom d'utilisateur</label>
            <div className="info-value">
              <span>{currentUser?.username}</span>
              <button className="btn-link" onClick={() => setIsEditingUsername(true)}>
                Modifier
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUsernameChange} className="form-section">
            <div className="form-group">
              <label>Nouveau nom d'utilisateur</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-md mt-md">
              <button type="submit" className="btn btn-success">Enregistrer</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditingUsername(false)
                  setNewUsername(currentUser?.username || '')
                  setError('')
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {!isEditingPassword ? (
          <div className="info-group">
            <label>Mot de passe</label>
            <div className="info-value">
              <span>••••••••</span>
              <button className="btn-link" onClick={() => setIsEditingPassword(true)}>
                Changer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="form-section">
            <div className="form-group">
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Enregistrer</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditingPassword(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setError('')
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {currentUser && (
          <div className="info-group">
            <label>Membre depuis</label>
            <div className="info-value">
              <span>{new Date(currentUser.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Thèmes */}
      <div className="card">
        <h3>🎨 Apparence</h3>

        {/* Thème Clair */}
        <div className="theme-section">
          <h4>🌞 Thème Clair</h4>
          <p className="theme-description">Utilisé pendant la journée</p>
          <div className="theme-grid">
            {lightThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${lightTheme === theme.id ? 'active' : ''}`}
                onClick={() => setLightTheme(theme.id)}
                data-theme={theme.id}
              >
                <div className="theme-preview" />
                <span className="theme-name">{theme.name}</span>
                {lightTheme === theme.id && <span className="theme-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Thème Sombre */}
        <div className="theme-section">
          <h4>🌙 Thème Sombre</h4>
          <p className="theme-description">Utilisé pendant la nuit</p>
          <div className="theme-grid">
            {darkThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${darkTheme === theme.id ? 'active' : ''}`}
                onClick={() => setDarkTheme(theme.id)}
                data-theme={theme.id}
              >
                <div className="theme-preview" />
                <span className="theme-name">{theme.name}</span>
                {darkTheme === theme.id && <span className="theme-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Mode de basculement */}
        <div className="theme-section">
          <h4>🔄 Basculement Automatique</h4>
          <div className="theme-mode-options">
            <label className="radio-option">
              <input
                type="radio"
                name="themeMode"
                checked={themeMode === 'manual'}
                onChange={() => setThemeMode('manual')}
              />
              <div className="radio-content">
                <strong>Manuel uniquement</strong>
                <span>Basculez manuellement avec le bouton dans la barre supérieure</span>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="themeMode"
                checked={themeMode === 'time-based'}
                onChange={() => setThemeMode('time-based')}
              />
              <div className="radio-content">
                <strong>Selon l'heure</strong>
                <span>Basculement automatique selon les horaires définis</span>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="themeMode"
                checked={themeMode === 'system'}
                onChange={() => setThemeMode('system')}
              />
              <div className="radio-content">
                <strong>Suivre le système</strong>
                <span>Suit les préférences de Windows (mode clair/sombre)</span>
              </div>
            </label>
          </div>

          {/* Horaires personnalisés */}
          {themeMode === 'time-based' && (
            <div className="time-range-config">
              <h5>⏰ Horaires personnalisés</h5>
              <div className="time-inputs">
                <div className="form-group">
                  <label>Début mode clair</label>
                  <input
                    type="time"
                    value={customTimeStart}
                    onChange={(e) => setCustomTimeStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Fin mode clair</label>
                  <input
                    type="time"
                    value={customTimeEnd}
                    onChange={(e) => setCustomTimeEnd(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn-secondary btn-small" onClick={handleTimeRangeUpdate}>
                Mettre à jour les horaires
              </button>
              <p className="time-range-hint">
                Mode clair: {customTimeStart} - {customTimeEnd}<br />
                Mode sombre: {customTimeEnd} - {customTimeStart}
              </p>
            </div>
          )}
        </div>

        {/* Aperçu en temps réel */}
        <div className="theme-preview-section">
          <h4>💡 Aperçu</h4>
          <div className="preview-toggle">
            <button
              className={`preview-btn ${!isDarkMode ? 'active' : ''}`}
              onClick={() => !isDarkMode || toggleDarkMode()}
            >
              🌞 Mode Clair
            </button>
            <button
              className={`preview-btn ${isDarkMode ? 'active' : ''}`}
              onClick={() => isDarkMode || toggleDarkMode()}
            >
              🌙 Mode Sombre
            </button>
          </div>
          <p className="preview-info">
            Thème actuel: <strong>{isDarkMode ? 'Sombre' : 'Clair'}</strong>
          </p>
        </div>
      </div>

      {/* Configuration IA Multi-Provider */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>🤖 Configuration IA Multi-Provider</h3>
            <p className="text-sm text-secondary" style={{ margin: '0.5rem 0 0 0' }}>
              Configurez plusieurs fournisseurs d'IA avec ordre de priorité et fallback automatique
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {showAddForm ? '❌ Annuler' : '➕ Ajouter une clé'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-bg)',
            border: '2px solid var(--primary-color)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ marginTop: 0 }}>Nouvelle configuration</h4>

            <div className="form-group">
              <label>Fournisseur d'IA *</label>
              <select
                value={formData.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="form-select"
              >
                <option value={AIProvider.GOOGLE}>Google Gemini - 60 req/min gratuites ✨</option>
                <option value={AIProvider.ANTHROPIC}>Anthropic Claude - Meilleur pour le code 🧠</option>
                <option value={AIProvider.OPENAI}>OpenAI GPT-4 - Très populaire 🤖</option>
                <option value={AIProvider.LOCAL}>Ollama (Local) - 100% Gratuit & Privé 🏠</option>
                <option value={AIProvider.BASIC}>Mode Basique (mots-clés) - Gratuit 📋</option>
              </select>
            </div>

            {formData.provider !== AIProvider.LOCAL && formData.provider !== AIProvider.BASIC && (
              <div className="form-group">
                <label>Clé API *</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={
                    formData.provider === AIProvider.OPENAI ? 'sk-...' :
                    formData.provider === AIProvider.ANTHROPIC ? 'sk-ant-...' :
                    'Votre clé API'
                  }
                  className="form-input"
                />
                <p className="text-xs text-secondary mt-xs">
                  {formData.provider === AIProvider.OPENAI && '🔗 Obtenez votre clé sur platform.openai.com'}
                  {formData.provider === AIProvider.ANTHROPIC && '🔗 Obtenez votre clé sur console.anthropic.com'}
                  {formData.provider === AIProvider.GOOGLE && '🔗 Obtenez votre clé sur makersuite.google.com'}
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Modèle *</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="form-select"
              >
                {AVAILABLE_MODELS[formData.provider].map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {(m as any).power ? `- ${(m as any).power}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {formData.provider === AIProvider.LOCAL && (
              <div className="form-group">
                <label>Endpoint</label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label>Priorité *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="form-select"
              >
                <option value="100">Priorité maximale (100) - Utilisé en premier</option>
                <option value="50">Priorité normale (50) - Fallback principal</option>
                <option value="25">Priorité basse (25) - Fallback secondaire</option>
                <option value="1">Priorité minimale (1) - Dernier recours</option>
              </select>
              <p className="text-xs text-secondary mt-xs">
                💡 Le système utilisera le provider avec la priorité la plus haute. Si celui-ci échoue, il passera automatiquement au suivant.
              </p>
            </div>

            <div className="flex gap-md mt-md">
              <button
                className="btn btn-secondary"
                onClick={handleTestConnection}
                disabled={aiTestStatus === 'testing' || (formData.provider !== AIProvider.LOCAL && formData.provider !== AIProvider.BASIC && !formData.apiKey)}
              >
                {aiTestStatus === 'testing' ? '⏳ Test en cours...' : '🔍 Tester'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddConfig}
                disabled={formData.provider !== AIProvider.LOCAL && formData.provider !== AIProvider.BASIC && !formData.apiKey}
              >
                💾 Enregistrer
              </button>
            </div>

            {aiTestMessage && (
              <div className={`alert ${aiTestStatus === 'success' ? 'alert-success' : 'alert-error'} mt-md`}>
                <span className="alert-icon">{aiTestStatus === 'success' ? '✅' : '❌'}</span>
                <div className="alert-content">
                  <div className="alert-message">{aiTestMessage}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste des configurations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {aiConfigs.length > 0 ? (
            aiConfigs
              .sort((a, b) => (b.priority || 50) - (a.priority || 50))
              .map((config) => {
                const info = providerInfo[config.provider]
                return (
                  <div
                    key={config.id}
                    style={{
                      position: 'relative',
                      padding: '1.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '12px',
                      background: info.bgLight,
                      transition: 'all 0.3s ease',
                      opacity: config.isActive ? 1 : 0.6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: info.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          {info.emoji}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              color: 'var(--text-primary)'
                            }}>
                              {info.name}
                            </span>
                            {config.isActive && (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: '#10b981',
                                color: '#fff',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  background: '#fff',
                                  borderRadius: '50%',
                                  animation: 'pulse 2s infinite'
                                }}></div>
                                ACTIF
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                            background: 'rgba(0,0,0,0.05)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {config.model}
                          </div>
                          {config.createdAt && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              Ajoutée le {new Date(config.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Priority Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Priorité:
                          </label>
                          <select
                            value={config.priority || 50}
                            onChange={(e) => handleSetPriority(config.id!, parseInt(e.target.value))}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: info.textColor,
                              background: 'var(--card-bg)'
                            }}
                          >
                            <option value="100">100 (Max)</option>
                            <option value="50">50 (Normal)</option>
                            <option value="25">25 (Basse)</option>
                            <option value="1">1 (Min)</option>
                          </select>
                        </div>

                        {/* Toggle Active */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={config.isActive}
                            onChange={(e) => handleToggleConfig(config.id!, e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Actif
                          </span>
                        </label>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteConfig(config.id!)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '2px solid #ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#ef4444'
                            e.currentTarget.style.color = '#fff'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#ef4444'
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Aucune configuration IA</p>
              <p style={{ fontSize: '0.9rem' }}>Ajoutez une clé API pour activer l'intelligence artificielle</p>
            </div>
          )}
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(66, 133, 244, 0.1)',
          borderLeft: '4px solid var(--primary-color)',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
            <strong>ℹ️ Comment ça marche ?</strong><br />
            Le système utilisera automatiquement le provider avec la <strong>priorité la plus haute</strong>.
            Si celui-ci échoue ou n'est pas disponible, il passera automatiquement au suivant dans l'ordre de priorité.
            Vous pouvez configurer plusieurs clés API pour différents providers et activer/désactiver selon vos besoins.
          </p>
        </div>
      </div>

      {/* Configuration Ollama */}
      <div className="card">
        <h3>🏠 Configuration Ollama (Local)</h3>
        <p className="text-sm text-secondary mb-md">
          Installez Ollama pour utiliser des modèles IA locaux (100% gratuit et privé)
        </p>
        <OllamaSetup />
      </div>
    </div>
  )
}

export default Config
