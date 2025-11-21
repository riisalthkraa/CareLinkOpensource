/**
 * ChatDoctor - Assistant Médical IA Conversationnel
 *
 * Interface de chat avec Claude pour des questions médicales
 * - Analyse de symptômes
 * - Détection d'urgences
 * - Conseils personnalisés
 * - Export de conversations
 *
 * ⚠️ DISCLAIMERS LÉGAUX OBLIGATOIRES
 */

import { useState, useEffect, useRef } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import chatService from '../services/ChatService'
import { aiManager } from '../utils/aiProviders'
import { isAIConfigured } from '../services/aiConfigLoader'
import {
  ChatMessage,
  Conversation,
  MedicalContext,
  SeverityLevel
} from '../types/chat'

interface ChatDoctorProps {
  membreId?: number | null
  onBack: () => void
}

function ChatDoctor({ membreId, onBack }: ChatDoctorProps) {
  const { addNotification } = useNotification()

  // États principaux
  const [membres, setMembres] = useState<any[]>([])
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(membreId || null)
  const [membre, setMembre] = useState<any>(null)
  const [medicalContext, setMedicalContext] = useState<MedicalContext | null>(null)

  // États du chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)

  // États UI
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false)
  const [showConversations, setShowConversations] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isAPIConfigured, setIsAPIConfigured] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Charger les membres au montage
   */
  useEffect(() => {
    loadMembres()
    loadConversations()
    checkAPIKey()
  }, [])

  /**
   * Charger le membre sélectionné
   */
  useEffect(() => {
    if (selectedMembreId) {
      loadMembre(selectedMembreId)
      loadMedicalContext(selectedMembreId)
    }
  }, [selectedMembreId])

  /**
   * Auto-scroll vers le bas quand nouveaux messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * Charger les membres
   */
  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM membres ORDER BY nom, prenom', [])
      if (result.success) {
        setMembres(result.data)
        if (!selectedMembreId && result.data.length > 0) {
          setSelectedMembreId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Charger un membre
   */
  const loadMembre = async (id: number) => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM membres WHERE id = ?', [id])
      if (result.success && result.data.length > 0) {
        setMembre(result.data[0])
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error)
    }
  }

  /**
   * Charger le contexte médical du patient
   */
  const loadMedicalContext = async (id: number) => {
    try {
      // Charger le membre
      const membreResult = await window.electronAPI.dbQuery('SELECT * FROM membres WHERE id = ?', [id])
      if (!membreResult.success || membreResult.data.length === 0) return

      const membreData = membreResult.data[0]

      // Calculer l'âge
      const age = calculateAge(membreData.date_naissance)

      // Charger les allergies
      const allergiesResult = await window.electronAPI.dbQuery(
        'SELECT nom_allergie FROM allergies WHERE membre_id = ?',
        [id]
      )
      const allergies = allergiesResult.success
        ? allergiesResult.data.map((a: any) => a.nom_allergie)
        : []

      // Charger les traitements actifs
      const traitementsResult = await window.electronAPI.dbQuery(
        'SELECT nom_medicament FROM traitements WHERE membre_id = ? AND actif = 1',
        [id]
      )
      const traitements = traitementsResult.success
        ? traitementsResult.data.map((t: any) => t.nom_medicament)
        : []

      // Charger les derniers RDV
      const rdvResult = await window.electronAPI.dbQuery(
        `SELECT date_rdv, specialite, motif FROM rendez_vous
         WHERE membre_id = ? AND statut = 'effectué'
         ORDER BY date_rdv DESC LIMIT 3`,
        [id]
      )
      const derniersRdv = rdvResult.success
        ? rdvResult.data.map((r: any) => ({
            date: new Date(r.date_rdv).toLocaleDateString('fr-FR'),
            specialite: r.specialite || 'Non spécifié',
            motif: r.motif || 'Consultation'
          }))
        : []

      const context: MedicalContext = {
        membreId: id,
        prenom: membreData.prenom,
        age,
        sexe: membreData.sexe,
        groupeSanguin: membreData.groupe_sanguin && membreData.rhesus
          ? `${membreData.groupe_sanguin}${membreData.rhesus}`
          : undefined,
        allergies,
        traitements,
        conditions: [], // À enrichir si besoin
        derniersRdv
      }

      setMedicalContext(context)
    } catch (error) {
      console.error('Erreur chargement contexte médical:', error)
    }
  }

  /**
   * Calculer l'âge
   */
  const calculateAge = (dateNaissance: string): number => {
    const birthDate = new Date(dateNaissance)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  /**
   * Vérifier si l'API IA est configurée
   */
  const checkAPIKey = () => {
    // Vérifier si au moins un provider actif existe (multi-provider)
    const configured = isAIConfigured()
    setIsAPIConfigured(configured)
  }

  /**
   * Envoyer un message
   */
  const handleSendMessage = async () => {
    if (!userInput.trim() || !medicalContext) return

    if (!hasAcceptedDisclaimer) {
      addNotification({
        type: 'warning',
        title: 'Disclaimer requis',
        message: 'Veuillez accepter les conditions d\'utilisation'
      })
      return
    }

    // Vérifier que l'API IA est configurée
    if (!isAPIConfigured) {
      addNotification({
        type: 'error',
        title: 'Configuration requise',
        message: 'Veuillez configurer une API IA dans le menu Configuration pour utiliser ChatDoctor',
        duration: 5000
      })
      return
    }

    const userMessage: ChatMessage = {
      id: chatService.generateMessageId(),
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date()
    }

    // Ajouter le message utilisateur
    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)

    try {
      // Appeler Claude
      const response = await chatService.sendMessage(
        userMessage.content,
        medicalContext,
        messages
      )

      const assistantMessage: ChatMessage = {
        id: chatService.generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        severity: response.severity
      }

      setMessages(prev => [...prev, assistantMessage])

      // Afficher notification si urgence
      if (response.needsEmergency) {
        addNotification({
          type: 'error',
          title: '🚨 URGENCE DÉTECTÉE',
          message: 'Consultez immédiatement les services d\'urgence (15 ou 112)',
          duration: 0 // Ne pas fermer automatiquement
        })
      }

      // Sauvegarder la conversation
      saveCurrentConversation([...messages, userMessage, assistantMessage])

    } catch (error: any) {
      console.error('Erreur envoi message:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible d\'envoyer le message'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sauvegarder la conversation
   */
  const saveCurrentConversation = (msgs: ChatMessage[]) => {
    if (!membre || msgs.length === 0) return

    const conv: Conversation = currentConversation || {
      id: chatService.generateConversationId(),
      membreId: membre.id,
      membreNom: `${membre.prenom} ${membre.nom}`,
      titre: `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
      messages: [],
      dateDebut: new Date(),
      dateDernierMessage: new Date(),
      status: 'active'
    }

    conv.messages = msgs
    conv.dateDernierMessage = new Date()

    chatService.saveConversation(conv)
    setCurrentConversation(conv)
  }

  /**
   * Charger les conversations
   */
  const loadConversations = () => {
    const convs = chatService.loadConversations()
    setConversations(convs)
  }

  /**
   * Nouvelle conversation
   */
  const handleNewConversation = () => {
    setMessages([])
    setCurrentConversation(null)
    setShowConversations(false)
  }

  /**
   * Charger une conversation
   */
  const handleLoadConversation = (conv: Conversation) => {
    setMessages(conv.messages)
    setCurrentConversation(conv)
    setSelectedMembreId(conv.membreId)
    setShowConversations(false)
  }

  /**
   * Supprimer une conversation
   */
  const handleDeleteConversation = (convId: string) => {
    chatService.deleteConversation(convId)
    loadConversations()
    if (currentConversation?.id === convId) {
      handleNewConversation()
    }
  }

  /**
   * Obtenir la couleur selon la gravité
   */
  const getSeverityColor = (severity?: SeverityLevel): string => {
    switch (severity) {
      case 'emergency': return '#dc3545'
      case 'urgent': return '#fd7e14'
      case 'warning': return '#ffc107'
      default: return 'var(--text-primary)'
    }
  }

  /**
   * Formater l'heure
   */
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="page chatdoctor-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">🤖 ChatDoctor</h1>
            <p className="text-sm text-secondary m-0">Assistant médical intelligent par Claude AI</p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => setShowConversations(!showConversations)}>
            📜 Historique
          </button>
        </div>
      </div>

      {/* Sélecteur de membre */}
      {membres.length > 0 && (
        <div className="form-group mb-lg">
          <label className="form-label">👤 Patient :</label>
          <select
            className="form-select form-select-lg"
            value={selectedMembreId || ''}
            onChange={(e) => setSelectedMembreId(parseInt(e.target.value))}
          >
            {membres.map(m => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Avertissement si API non configurée */}
      {!isAPIConfigured && (
        <div className="card" style={{
          marginBottom: '20px',
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          padding: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>⚙️ Configuration requise</h3>
          <p style={{ marginBottom: '15px' }}>
            Pour utiliser ChatDoctor, vous devez d'abord configurer une API d'intelligence artificielle
            (OpenAI, Anthropic, Google ou Ollama local).
          </p>
          <p style={{ marginBottom: 0, fontWeight: '600' }}>
            👉 Rendez-vous dans le menu <strong>Configuration</strong> pour définir votre API.
          </p>
        </div>
      )}

      {/* Disclaimer légal */}
      {!hasAcceptedDisclaimer && isAPIConfigured && (
        <div className="card card-urgence" style={{ marginBottom: '20px' }}>
          <h3>⚠️ Important - Conditions d'utilisation</h3>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', marginTop: '15px' }}>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>
                <strong>ChatDoctor est un assistant d'information, PAS un médecin.</strong>
              </li>
              <li>
                Les conseils fournis sont généraux et ne constituent <strong>PAS un diagnostic médical</strong>.
              </li>
              <li>
                En cas d'urgence médicale : <strong>Appelez le 15 (SAMU) ou le 112</strong>.
              </li>
              <li>
                Consultez TOUJOURS un professionnel de santé pour un diagnostic et un traitement.
              </li>
              <li>
                Ne modifiez JAMAIS vos traitements sans l'avis de votre médecin.
              </li>
            </ul>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setHasAcceptedDisclaimer(true)}
            >
              ✅ J'ai compris et j'accepte
            </button>
          </div>
        </div>
      )}

      {/* Zone de chat */}
      {hasAcceptedDisclaimer && membre && (
        <div className="chat-container card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div className="chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
                <h3 style={{ marginBottom: '10px' }}>Bonjour {membre.prenom} !</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Je suis votre assistant médical virtuel. Posez-moi vos questions santé.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginTop: '30px'
                }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setUserInput('J\'ai de la fièvre et mal à la gorge depuis 2 jours')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    💊 Symptômes
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setUserInput('Puis-je prendre du paracétamol avec mon traitement actuel ?')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    💉 Interactions
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setUserInput('Quelles questions devrais-je poser à mon médecin ?')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    📋 Préparer RDV
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '15px'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                      color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                      border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                      borderLeft: msg.severity ? `4px solid ${getSeverityColor(msg.severity)}` : undefined
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {msg.content}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        marginTop: '8px',
                        opacity: 0.7,
                        textAlign: 'right'
                      }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <span>💭 En train de réfléchir...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Zone de saisie */}
          <div style={{
            padding: '20px',
            borderTop: '2px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)'
          }}>
            <div className="flex items-end gap-md">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Décrivez vos symptômes ou posez votre question médicale..."
                rows={3}
                className="form-textarea"
                style={{ flex: 1, resize: 'none' }}
                disabled={isLoading}
              />
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                style={{ minWidth: '120px' }}
              >
                {isLoading ? '⏳' : '📤 Envoyer'}
              </button>
            </div>
            <div className="text-sm text-secondary mt-sm">
              💡 Appuyez sur Entrée pour envoyer, Shift+Entrée pour un saut de ligne
            </div>
          </div>
        </div>
      )}

      {/* Modal historique des conversations */}
      {showConversations && (
        <div className="modal-overlay" onClick={() => setShowConversations(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>📜 Historique des conversations</h2>
            <button
              className="btn btn-primary mb-lg"
              onClick={handleNewConversation}
            >
              ➕ Nouvelle conversation
            </button>
            {conversations.length === 0 ? (
              <p className="text-center text-secondary" style={{ padding: '40px' }}>
                Aucune conversation sauvegardée
              </p>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className="card mb-md"
                    style={{
                      backgroundColor: conv.id === currentConversation?.id ? '#e3f2fd' : undefined,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleLoadConversation(conv)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{conv.titre}</strong>
                        <div className="text-sm text-secondary">
                          {conv.membreNom} • {conv.messages.length} messages • {new Date(conv.dateDernierMessage).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.id)
                        }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConversations(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatDoctor
