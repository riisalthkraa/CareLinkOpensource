/**
 * Login - Page d'authentification et de création de compte
 *
 * Cette page gère deux modes:
 * 1. Mode Setup (première utilisation) - Création du premier utilisateur
 * 2. Mode Login (utilisations suivantes) - Connexion standard
 *
 * FONCTIONNALITÉS:
 * - Détection automatique de la première utilisation
 * - Création de compte avec famille par défaut
 * - Authentification sécurisée
 * - Bouton de remplissage rapide pour tests
 * - Messages de bienvenue et rappels Config
 * - Stockage local SQLite (100% offline)
 *
 * SÉCURITÉ:
 * Les mots de passe sont hashés avec bcrypt (salt rounds: 10) avant stockage.
 * Support de la migration automatique des anciens mots de passe en clair.
 *
 * @module Login
 */

import { useState, useEffect } from 'react'
import UrgencePublique from './UrgencePublique'

/**
 * Props du composant Login
 *
 * @interface LoginProps
 * @property {function} onLogin - Callback appelé après connexion réussie avec l'ID utilisateur
 */
interface LoginProps {
  onLogin: (userId: number) => void
}

/**
 * Login - Composant de connexion et création de compte
 *
 * Gère l'authentification complète de l'application avec:
 * - Détection première utilisation
 * - Création du premier compte
 * - Connexion utilisateurs existants
 * - Feedback visuel et notifications
 *
 * @component
 * @param {LoginProps} props - Les propriétés du composant
 * @returns {JSX.Element} La page de connexion/création
 */
function Login({ onLogin }: LoginProps) {
  // ========== ÉTATS LOCAUX ==========
  const [isSetupMode, setIsSetupMode] = useState(false) // Mode création de compte
  const [isFirstTime, setIsFirstTime] = useState(true)  // Première utilisation détectée
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true) // État de chargement initial
  const [showUrgence, setShowUrgence] = useState(false) // État pour afficher le mode urgence public

  // Vérifier si c'est la première utilisation au montage
  useEffect(() => {
    checkFirstTime()
  }, [])

  /**
   * Vérifie s'il existe déjà des utilisateurs dans la base de données
   *
   * Si aucun utilisateur n'existe:
   * - Active le mode Setup pour créer le premier compte
   * - Affiche un message de bienvenue
   *
   * @async
   * @function checkFirstTime
   */
  const checkFirstTime = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM users LIMIT 1')

      if (result.success && result.data.length === 0) {
        // Pas d'utilisateur = première utilisation
        setIsFirstTime(true)
        setIsSetupMode(true)
      } else {
        setIsFirstTime(false)
      }
    } catch (error) {
      console.error('Erreur vérification:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Gère la soumission du formulaire (création ou connexion)
   *
   * MODE SETUP (première fois):
   * 1. Valide les champs
   * 2. Crée l'utilisateur dans la base
   * 3. Crée une famille par défaut "Ma Famille"
   * 4. Affiche une notification de bienvenue
   * 5. Appelle onLogin avec l'ID du nouvel utilisateur
   *
   * MODE LOGIN (connexions suivantes):
   * 1. Valide les champs
   * 2. Vérifie les identifiants dans la base
   * 3. Affiche notification de succès ou erreur
   * 4. Appelle onLogin avec l'ID utilisateur
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - L'événement de soumission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation: tous les champs doivent être remplis
    if (!formData.username || !formData.password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    try {
      if (isSetupMode) {
        // ========== MODE CRÉATION DE COMPTE (avec bcrypt) ==========
        const result = await window.electronAPI.authRegister(
          formData.username,
          formData.password
        )

        if (result.success) {
          // Créer aussi une famille par défaut pour le nouvel utilisateur
          await window.electronAPI.dbRun(
            'INSERT INTO famille (nom, user_id) VALUES (?, ?)',
            ['Ma Famille', result.data.lastInsertRowid]
          )

          window.electronAPI.showNotification(
            '✅ Compte créé avec sécurité renforcée',
            `Bienvenue ${formData.username} ! Votre mot de passe est hashé avec bcrypt.`
          )

          onLogin(result.data.lastInsertRowid)
        } else {
          setError(result.error || 'Erreur lors de la création du compte')
        }
      } else {
        // ========== MODE CONNEXION (avec bcrypt) ==========
        const result = await window.electronAPI.authLogin(
          formData.username,
          formData.password
        )

        if (result.success && result.data.length > 0) {
          const user = result.data[0]
          window.electronAPI.showNotification(
            '✅ Connexion réussie',
            `Bon retour ${formData.username} !`
          )
          onLogin(user.id)
        } else {
          setError(result.error || 'Identifiant ou mot de passe incorrect')
        }
      }
    } catch (error: any) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue')
    }
  }

  /**
   * Remplit automatiquement le formulaire avec des identifiants par défaut
   *
   * Utilisé pour faciliter les tests et la démonstration.
   * Credentials par défaut: admin / admin123
   *
   * @function useDefaultCredentials
   */
  const useDefaultCredentials = () => {
    setFormData({
      username: 'admin',
      password: 'admin123'
    })
  }

  // Afficher un loader pendant la vérification initiale
  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box card">
          <div className="login-loader" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }}></div>
            <p className="text-lg text-secondary">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  // Rendu du formulaire de connexion/création
  return (
    <div className="login-container">
      <div className="login-box card">
        {/* En-tête avec logo et titre */}
        <div className="login-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="h1" style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>🏥 CareLink</h1>
          <p className="text-lg text-secondary">Gestion de Santé Familiale</p>
          <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)' }}>
            <strong>v2.5.0</strong> • Créé par VIEY David
          </div>
        </div>

        {/* Message de bienvenue pour première utilisation */}
        {isFirstTime && (
          <div className="alert alert-info mb-lg">
            <span className="alert-icon" aria-hidden="true">👋</span>
            <div className="alert-content">
              <div className="alert-title">Bienvenue !</div>
              <div className="alert-message">
                Créez votre compte pour commencer. Vous pourrez modifier vos identifiants dans l'onglet Config.
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de connexion/création */}
        <form onSubmit={handleSubmit}>
          {/* Message d'erreur si présent */}
          {error && (
            <div className="alert alert-error mb-md">
              <span className="alert-icon" aria-hidden="true">⚠️</span>
              <div className="alert-content">
                <div className="alert-message">{error}</div>
              </div>
            </div>
          )}

          {/* Champ nom d'utilisateur */}
          <div className="form-group mb-md">
            <label className="form-label">Nom d'utilisateur</label>
            <input
              type="text"
              className="form-input form-input-lg"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Entrez votre nom d'utilisateur"
              autoFocus
            />
          </div>

          {/* Champ mot de passe */}
          <div className="form-group mb-lg">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input form-input-lg"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Entrez votre mot de passe"
            />
          </div>

          {/* Bouton de soumission (texte adapté au mode) */}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {isSetupMode ? '🔐 Créer mon compte' : '🔓 Se connecter'}
          </button>

          {/* Aide pour remplissage rapide (première utilisation) */}
          {isFirstTime && (
            <div className="mt-md" style={{ textAlign: 'center' }}>
              <p className="text-sm text-secondary mb-sm">💡 Pour tester rapidement :</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={useDefaultCredentials}
              >
                Utiliser admin / admin123
              </button>
            </div>
          )}

          {/* Rappel Config pour utilisateurs existants */}
          {!isFirstTime && (
            <div className="mt-md text-center">
              <p className="text-sm text-secondary">💡 Vous pouvez modifier vos identifiants dans l'onglet ⚙️ Config</p>
            </div>
          )}
        </form>

        {/* Footer avec message de sécurité et bouton urgence */}
        <div className="login-footer mt-xl" style={{ textAlign: 'center', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-light)' }}>
          <button
            type="button"
            className="btn btn-error mb-md"
            onClick={() => setShowUrgence(true)}
            style={{ width: '100%', fontSize: '1.1rem' }}
          >
            🆘 Mode Urgence (Sans Connexion)
          </button>
          <p className="text-sm text-secondary">🔒 Vos données restent 100% locales sur votre ordinateur</p>
        </div>
      </div>

      {/* Composant UrgencePublique (affiché par-dessus) */}
      {showUrgence && <UrgencePublique onClose={() => setShowUrgence(false)} />}
    </div>
  )
}

export default Login
