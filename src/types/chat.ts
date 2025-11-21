/**
 * Types pour le module ChatDoctor - Assistant médical IA
 */

/**
 * Rôle de l'émetteur du message
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * Statut de la conversation
 */
export type ConversationStatus = 'active' | 'archived' | 'emergency'

/**
 * Niveau de gravité détecté
 */
export type SeverityLevel = 'normal' | 'warning' | 'urgent' | 'emergency'

/**
 * Message dans une conversation
 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  severity?: SeverityLevel
  context?: MedicalContext
}

/**
 * Contexte médical du patient pour l'IA
 */
export interface MedicalContext {
  membreId: number
  prenom: string
  age: number
  sexe?: string
  groupeSanguin?: string
  allergies: string[]
  traitements: string[]
  conditions: string[]
  derniersRdv: Array<{
    date: string
    specialite: string
    motif: string
  }>
}

/**
 * Conversation complète
 */
export interface Conversation {
  id: string
  membreId: number
  membreNom: string
  titre: string
  messages: ChatMessage[]
  dateDebut: Date
  dateDernierMessage: Date
  status: ConversationStatus
  severityMax?: SeverityLevel
}

/**
 * Réponse de l'API Claude
 */
export interface ClaudeResponse {
  content: string
  severity: SeverityLevel
  suggestions?: string[]
  needsEmergency?: boolean
  relatedSymptoms?: string[]
}

/**
 * Statistiques d'utilisation
 */
export interface ChatStats {
  totalConversations: number
  totalMessages: number
  emergencyDetected: number
  averageMessagesPerConversation: number
}

/**
 * Export de conversation
 */
export interface ConversationExport {
  format: 'pdf' | 'txt' | 'json'
  conversationId: string
  includeContext: boolean
  includeTimestamps: boolean
}
