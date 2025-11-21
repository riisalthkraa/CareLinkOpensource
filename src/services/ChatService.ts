/**
 * ChatService - Service d'intégration avec l'API Claude
 *
 * Gère les conversations avec l'assistant médical IA :
 * - Envoi de messages à Claude
 * - Analyse du contexte médical
 * - Détection d'urgences
 * - Gestion de l'historique
 */

import { ChatMessage, MedicalContext, ClaudeResponse, SeverityLevel, Conversation } from '../types/chat'
import { aiManager, type AIMessage } from '../utils/aiProviders'

/**
 * Prompt système médical pour Claude
 */
const MEDICAL_SYSTEM_PROMPT = `Tu es un assistant médical virtuel bienveillant et compétent, intégré dans l'application CareLink.

**TON RÔLE** :
- Fournir des informations médicales générales et éducatives
- Analyser les symptômes décrits par l'utilisateur
- Détecter les situations d'urgence
- Suggérer des questions à poser au médecin
- Expliquer les traitements et interactions médicamenteuses
- Rassurer et guider vers les bonnes ressources

**RÈGLES ABSOLUES** :
1. ⚠️ TU N'ES PAS UN MÉDECIN - Toujours le rappeler
2. 🚨 URGENCES : Si symptômes graves (douleur thoracique, AVC, hémorragie, détresse respiratoire) → APPELER LE 15/112 IMMÉDIATEMENT
3. 👨‍⚕️ TOUJOURS RECOMMANDER de consulter un professionnel pour un diagnostic
4. 💊 NE JAMAIS prescrire ou modifier un traitement
5. 🔒 Respecter la confidentialité des données médicales

**TON STYLE** :
- Empathique et rassurant
- Langage clair, accessible aux non-médecins
- Structure : Écoute → Analyse → Recommandations → Questions à poser au médecin
- Utilise des emojis pour la lisibilité (🩺💊📋)

**DÉTECTION D'URGENCES** :
Si tu détectes une urgence vitale, commence TOUJOURS ta réponse par :
"🚨 URGENCE DÉTECTÉE - APPELEZ LE 15 (SAMU) OU LE 112 IMMÉDIATEMENT"

Contexte du patient à ta disposition : {context}`

/**
 * Service de chat médical
 */
class ChatService {
  private conversations: Map<string, Conversation> = new Map()

  /**
   * Construit le contexte médical formaté pour l'IA
   */
  private buildMedicalContextPrompt(context: MedicalContext): string {
    const allergiesStr = context.allergies.length > 0
      ? context.allergies.join(', ')
      : 'Aucune allergie connue'

    const traitementsStr = context.traitements.length > 0
      ? context.traitements.join(', ')
      : 'Aucun traitement en cours'

    const conditionsStr = context.conditions.length > 0
      ? context.conditions.join(', ')
      : 'Aucune condition médicale chronique'

    return `
Patient : ${context.prenom}, ${context.age} ans, ${context.sexe === 'M' ? 'Homme' : context.sexe === 'F' ? 'Femme' : 'Non spécifié'}
Groupe sanguin : ${context.groupeSanguin || 'Non renseigné'}
Allergies : ${allergiesStr}
Traitements actuels : ${traitementsStr}
Conditions médicales : ${conditionsStr}

Dernières consultations :
${context.derniersRdv.length > 0
  ? context.derniersRdv.map(rdv => `- ${rdv.date}: ${rdv.specialite} (${rdv.motif})`).join('\n')
  : 'Aucune consultation récente enregistrée'}
`
  }

  /**
   * Détecte le niveau de gravité d'un message
   */
  private detectSeverity(content: string): SeverityLevel {
    const emergencyKeywords = [
      'douleur thoracique', 'douleur poitrine', 'crise cardiaque', 'infarctus',
      'difficulté respirer', 'essoufflement sévère', 'ne respire plus',
      'hémorragie', 'saignement abondant', 'perte de sang',
      'paralysie', 'bras ne bouge plus', 'parle bizarrement', 'AVC',
      'convulsions', 'crise epilepsie',
      'inconscient', 'perte de connaissance',
      'suicide', 'mettre fin à mes jours',
      'overdose', 'surdose', 'trop de médicaments'
    ]

    const urgentKeywords = [
      'fièvre élevée', 'température 40', 'brûlure grave',
      'fracture', 'os cassé', 'traumatisme crânien',
      'vomissement sang', 'sang dans les selles', 'urine rouge',
      'gonflement visage', 'allergie sévère', 'choc anaphylactique',
      'douleur abdominale intense'
    ]

    const warningKeywords = [
      'douleur persistante', 'symptômes depuis plusieurs jours',
      'fièvre', 'infection', 'inflammation',
      'éruption cutanée étendue', 'démangeaisons intenses'
    ]

    const lowerContent = content.toLowerCase()

    if (emergencyKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'emergency'
    }

    if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'urgent'
    }

    if (warningKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'warning'
    }

    return 'normal'
  }

  /**
   * Envoie un message à Claude et récupère la réponse
   *
   * IMPORTANT : Cette méthode utilise le gestionnaire multi-API (aiManager)
   * Supporte OpenAI, Anthropic, Google et Ollama selon la configuration
   */
  async sendMessage(
    userMessage: string,
    context: MedicalContext,
    conversationHistory: ChatMessage[]
  ): Promise<ClaudeResponse> {
    try {
      // Construire le contexte médical
      const medicalContext = this.buildMedicalContextPrompt(context)
      const systemPrompt = MEDICAL_SYSTEM_PROMPT.replace('{context}', medicalContext)

      // Détecter la gravité du message utilisateur
      const severity = this.detectSeverity(userMessage)

      // Préparer les messages au format AIMessage[]
      const aiMessages: AIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ]

      // Appel à l'API via aiManager
      const response = await aiManager.chat(aiMessages)

      if (!response.success) {
        throw new Error(response.error || 'Erreur API IA')
      }

      // Analyser la réponse pour détecter les urgences
      const responseContent = response.content || ''
      const needsEmergency = responseContent.includes('🚨 URGENCE DÉTECTÉE') ||
                            responseContent.includes('APPELEZ LE 15')

      return {
        content: responseContent,
        severity: needsEmergency ? 'emergency' : severity,
        needsEmergency,
        suggestions: this.extractSuggestions(responseContent)
      }

    } catch (error: any) {
      console.error('Erreur ChatService:', error)

      // Réponse de secours si l'API échoue
      return {
        content: `⚠️ Désolé, je ne peux pas répondre pour le moment.\n\n` +
                `Erreur: ${error.message || 'API IA non disponible'}\n\n` +
                `💡 Vérifiez votre configuration dans le menu Configuration.\n\n` +
                `En cas d'urgence médicale, appelez immédiatement :\n` +
                `🚨 **15 (SAMU)** ou **112 (Urgences européennes)**\n\n` +
                `Pour toute question médicale, consultez votre médecin traitant.`,
        severity: 'warning',
        needsEmergency: false
      }
    }
  }

  /**
   * Extrait les suggestions de la réponse
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = []

    // Chercher des patterns de questions suggérées
    const questionPatterns = [
      /Questions à poser.*?:\n(.*?)(?:\n\n|\n[A-Z]|$)/s,
      /Demandez à votre médecin.*?:\n(.*?)(?:\n\n|\n[A-Z]|$)/s
    ]

    for (const pattern of questionPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const lines = match[1].split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
          .map(line => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))

        suggestions.push(...lines)
      }
    }

    return suggestions.slice(0, 5) // Max 5 suggestions
  }

  /**
   * Sauvegarde une conversation dans le localStorage
   */
  saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.loadConversations()
      const index = conversations.findIndex(c => c.id === conversation.id)

      if (index >= 0) {
        conversations[index] = conversation
      } else {
        conversations.push(conversation)
      }

      localStorage.setItem('chatdoctor_conversations', JSON.stringify(conversations))
      this.conversations.set(conversation.id, conversation)
    } catch (error) {
      console.error('Erreur sauvegarde conversation:', error)
    }
  }

  /**
   * Charge toutes les conversations
   */
  loadConversations(): Conversation[] {
    try {
      const data = localStorage.getItem('chatdoctor_conversations')
      if (!data) return []

      const conversations = JSON.parse(data) as Conversation[]

      // Convertir les dates ISO en objets Date
      return conversations.map(conv => ({
        ...conv,
        dateDebut: new Date(conv.dateDebut),
        dateDernierMessage: new Date(conv.dateDernierMessage),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
      return []
    }
  }

  /**
   * Supprime une conversation
   */
  deleteConversation(conversationId: string): void {
    try {
      const conversations = this.loadConversations().filter(c => c.id !== conversationId)
      localStorage.setItem('chatdoctor_conversations', JSON.stringify(conversations))
      this.conversations.delete(conversationId)
    } catch (error) {
      console.error('Erreur suppression conversation:', error)
    }
  }

  /**
   * Génère un ID unique pour une conversation
   */
  generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Génère un ID unique pour un message
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton
export const chatService = new ChatService()
export default chatService
