/**
 * Config - Page de configuration de l'utilisateur
 *
 * Cette page permet à l'utilisateur de:
 * - Modifier son nom d'utilisateur
 * - Changer son mot de passe
 * - Sélectionner un thème clair et un thème sombre
 * - Configurer le mode de basculement automatique
 * - Voir les informations de son compte
 *
 * @module Config
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'
import { aiManager, AIProvider, AVAILABLE_MODELS, type AIProviderConfig } from '../utils/aiProviders'

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

  // Configuration IA
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.ANTHROPIC)
  const [aiApiKey, setAiApiKey] = useState('')
  const [aiModel, setAiModel] = useState('claude-3-sonnet-20240229')
  const [aiEndpoint, setAiEndpoint] = useState('http://localhost:11434')
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

  // Charger la configuration IA sauvegardée depuis le stockage sécurisé
  useEffect(() => {
    const loadSecureConfig = async () => {
      try {
        const result = await window.electronAPI.secureGetConfig('aiConfig')
        if (result.success && result.data) {
          const config: AIProviderConfig = JSON.parse(result.data)
          setAiProvider(config.provider)
          setAiApiKey(config.apiKey || '')
          setAiModel(config.model)
          setAiEndpoint(config.endpoint || 'http://localhost:11434')
          // Configurer aiManager avec la config sauvegardée
          aiManager.setConfig(config)
        }
      } catch (error) {
        console.error('Erreur chargement config IA:', error)
      }
    }
    loadSecureConfig()
  }, [])

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

  const handleTestConnection = async () => {
    setAiTestStatus('testing')
    setAiTestMessage('')

    try {
      // Configurer temporairement avec les valeurs actuelles
      const testConfig: AIProviderConfig = {
        provider: aiProvider,
        apiKey: aiApiKey,
        model: aiModel,
        endpoint: aiEndpoint
      }

      aiManager.setConfig(testConfig)
      const result = await aiManager.testConnection()

      if (result.success) {
        setAiTestStatus('success')
        setAiTestMessage('Connexion réussie!')
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

  const handleSaveAIConfig = async () => {
    try {
      const config: AIProviderConfig = {
        provider: aiProvider,
        apiKey: aiApiKey,
        model: aiModel,
        endpoint: aiEndpoint
      }

      // Sauvegarder dans le stockage sécurisé (au lieu de localStorage)
      const result = await window.electronAPI.secureSaveConfig('aiConfig', JSON.stringify(config))

      if (!result.success) {
        throw new Error(result.error || 'Erreur de sauvegarde')
      }

      // Configurer aiManager
      aiManager.setConfig(config)

      setSuccess('Configuration IA enregistrée avec succès (stockage sécurisé)')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur sauvegarde config IA:', error)
      setError('Impossible de sauvegarder la configuration IA')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleProviderChange = (newProvider: AIProvider) => {
    setAiProvider(newProvider)
    // Sélectionner le premier modèle du nouveau provider
    const firstModel = AVAILABLE_MODELS[newProvider][0]
    setAiModel(firstModel.id)
    // Réinitialiser le statut de test
    setAiTestStatus('idle')
    setAiTestMessage('')
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

      {/* Configuration IA */}
      <div className="card">
        <h3>🤖 Configuration IA</h3>
        <p className="text-sm text-secondary mb-md">
          Configurez votre fournisseur d'IA pour utiliser l'Assistant Santé et ChatDoctor.
          Vous pouvez utiliser OpenAI, Anthropic (Claude), Google (Gemini) ou un modèle local (Ollama).
        </p>

        <div className="form-group">
          <label>Fournisseur d'IA</label>
          <select
            value={aiProvider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
            className="form-select"
          >
            <option value={AIProvider.OPENAI}>OpenAI (GPT-4, GPT-3.5)</option>
            <option value={AIProvider.ANTHROPIC}>Anthropic (Claude 3)</option>
            <option value={AIProvider.GOOGLE}>Google (Gemini)</option>
            <option value={AIProvider.LOCAL}>Local (Ollama)</option>
          </select>
        </div>

        {aiProvider !== AIProvider.LOCAL && (
          <div className="form-group">
            <label>Clé API</label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={
                aiProvider === AIProvider.OPENAI ? 'sk-...' :
                aiProvider === AIProvider.ANTHROPIC ? 'sk-ant-...' :
                'Votre clé API'
              }
              className="form-input"
            />
            <p className="text-xs text-secondary mt-xs">
              {aiProvider === AIProvider.OPENAI && 'Obtenez votre clé sur platform.openai.com'}
              {aiProvider === AIProvider.ANTHROPIC && 'Obtenez votre clé sur console.anthropic.com'}
              {aiProvider === AIProvider.GOOGLE && 'Obtenez votre clé sur makersuite.google.com'}
            </p>
          </div>
        )}

        <div className="form-group">
          <label>Modèle</label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="form-select"
          >
            {AVAILABLE_MODELS[aiProvider].map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {aiProvider === AIProvider.LOCAL && (
          <div className="form-group">
            <label>Endpoint</label>
            <input
              type="text"
              value={aiEndpoint}
              onChange={(e) => setAiEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="form-input"
            />
            <p className="text-xs text-secondary mt-xs">
              Assurez-vous qu'Ollama est en cours d'exécution sur ce endpoint
            </p>
          </div>
        )}

        <div className="flex gap-md mt-md">
          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={aiTestStatus === 'testing' || (aiProvider !== AIProvider.LOCAL && !aiApiKey)}
          >
            {aiTestStatus === 'testing' ? '⏳ Test en cours...' : '🔍 Tester la connexion'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveAIConfig}
            disabled={aiProvider !== AIProvider.LOCAL && !aiApiKey}
          >
            💾 Enregistrer
          </button>
        </div>

        {aiTestStatus === 'success' && (
          <div className="alert alert-success mt-md">
            <span className="alert-icon">✅</span>
            <div className="alert-content">
              <div className="alert-message">{aiTestMessage}</div>
            </div>
          </div>
        )}

        {aiTestStatus === 'error' && (
          <div className="alert alert-error mt-md">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <div className="alert-message">{aiTestMessage}</div>
            </div>
          </div>
        )}

        <div className="info-box mt-md">
          <p className="text-sm">
            <strong>ℹ️ Information:</strong> Vos clés API sont stockées localement sur votre ordinateur et ne sont jamais transmises à des serveurs tiers.
            Elles sont uniquement utilisées pour communiquer directement avec le fournisseur d'IA que vous avez choisi.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Config
