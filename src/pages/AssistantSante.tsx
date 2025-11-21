/**
 * AssistantSante - Page de l'assistant intelligent de santé "CareAI"
 *
 * Cette page affiche:
 * - Score de santé global avec jauge circulaire
 * - Alertes intelligentes prioritaires
 * - Graphiques de tendances (rendez-vous, traitements)
 * - Recommandations personnalisées
 * - Timeline des insights santé
 *
 * FONCTIONNALITÉS:
 * - Analyse en temps réel des données de santé
 * - Prédictions basées sur l'algorithme
 * - Conseils personnalisés par âge/sexe
 * - Système d'alertes proactif
 *
 * @module AssistantSante
 */

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNotification } from '../contexts/NotificationContext'
import {
  generateHealthScore,
  analyzeAppointmentTrends,
  analyzeTreatmentAdherence,
  predictNextHealthIssues,
  HealthScore,
  AppointmentTrendAnalysis,
  TreatmentAdherenceAnalysis,
  HealthRiskPrediction
} from '../services/HealthAnalyzer'
import {
  checkAllAlerts,
  dismissAlert,
  snoozeAlert,
  getAlertColor,
  getAlertPriorityLabel,
  SmartAlert,
  AlertCheckResult
} from '../services/SmartAlerts'
import {
  generateRecommendations,
  getRecommendationColor,
  getRecommendationCategoryLabel,
  HealthRecommendation,
  RecommendationResult
} from '../services/RecommendationEngine'

interface AssistantSanteProps {
  membreId: number | null
  onBack: () => void
}

/**
 * AssistantSante - Assistant intelligent de santé CareAI
 *
 * Composant principal affichant le tableau de bord d'intelligence santé
 * avec analyses, alertes et recommandations personnalisées.
 */
function AssistantSante({ membreId, onBack }: AssistantSanteProps) {
  const { addNotification } = useNotification()

  // États pour les données d'analyse
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrendAnalysis | null>(null)
  const [adherence, setAdherence] = useState<TreatmentAdherenceAnalysis | null>(null)
  const [risks, setRisks] = useState<HealthRiskPrediction | null>(null)
  const [alerts, setAlerts] = useState<AlertCheckResult | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)

  // États UI
  const [loading, setLoading] = useState(true)
  const [selectedMembre, setSelectedMembre] = useState<any>(null)
  const [membres, setMembres] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'recommendations'>('overview')

  /**
   * Charge tous les membres au montage
   */
  useEffect(() => {
    loadMembres()
  }, [])

  /**
   * Charge les analyses quand un membre est sélectionné
   */
  useEffect(() => {
    if (membreId) {
      loadMemberData(membreId.toString())
      loadAllAnalytics(membreId.toString())
    } else if (membres.length > 0) {
      // Sélectionner le premier membre par défaut
      const firstMembre = membres[0]
      setSelectedMembre(firstMembre)
      loadAllAnalytics(firstMembre.id.toString())
    }
  }, [membreId, membres])

  /**
   * Charge la liste des membres
   */
  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM membres', [])
      if (result.success) {
        setMembres(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Charge les données d'un membre spécifique
   */
  const loadMemberData = async (id: string) => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM membres WHERE id = ?', [id])
      if (result.success && result.data.length > 0) {
        setSelectedMembre(result.data[0])
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error)
    }
  }

  /**
   * Charge toutes les analyses pour un membre
   */
  const loadAllAnalytics = async (id: string) => {
    setLoading(true)
    try {
      // Lancer toutes les analyses en parallèle
      const [scoreResult, trendsResult, adherenceResult, risksResult, alertsResult, recsResult] =
        await Promise.all([
          generateHealthScore(id),
          analyzeAppointmentTrends(id),
          analyzeTreatmentAdherence(id),
          predictNextHealthIssues(id),
          checkAllAlerts(id),
          generateRecommendations(id)
        ])

      setHealthScore(scoreResult)
      setAppointmentTrends(trendsResult)
      setAdherence(adherenceResult)
      setRisks(risksResult)
      setAlerts(alertsResult)
      setRecommendations(recsResult)

      addNotification({
        type: 'success',
        title: 'Analyse terminée',
        message: 'Toutes les données ont été analysées avec succès',
        duration: 3000
      })
    } catch (error) {
      console.error('Erreur analyse:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'analyse',
        message: 'Impossible de charger les analyses de santé',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Change de membre sélectionné
   */
  const handleMemberChange = (id: string) => {
    const membre = membres.find(m => m.id.toString() === id)
    if (membre) {
      setSelectedMembre(membre)
      loadAllAnalytics(id)
    }
  }

  /**
   * Gère la suppression d'une alerte
   */
  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId)
    if (selectedMembre) {
      loadAllAnalytics(selectedMembre.id.toString())
    }
    addNotification({
      type: 'info',
      title: 'Alerte masquée',
      message: 'L\'alerte a été marquée comme vue',
      duration: 2000
    })
  }

  /**
   * Gère le report d'une alerte
   */
  const handleSnoozeAlert = (alertId: string, hours: number) => {
    snoozeAlert(alertId, hours)
    if (selectedMembre) {
      loadAllAnalytics(selectedMembre.id.toString())
    }
    addNotification({
      type: 'info',
      title: 'Alerte reportée',
      message: `L'alerte sera de nouveau visible dans ${hours}h`,
      duration: 2000
    })
  }

  /**
   * Calcule l'âge à partir de la date de naissance
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
   * Obtient la couleur du score
   */
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#2ecc71' // Vert
    if (score >= 70) return '#3498db' // Bleu
    if (score >= 50) return '#f39c12' // Orange
    return '#e74c3c' // Rouge
  }

  /**
   * Obtient le libellé du niveau de score
   */
  const getScoreLabel = (level: string): string => {
    switch (level) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Bon'
      case 'moderate':
        return 'Moyen'
      case 'poor':
        return 'Faible'
      default:
        return 'Inconnu'
    }
  }

  // Interface de chargement
  if (loading) {
    return (
      <div className="page assistant-sante">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={onBack}>
              ← Retour
            </button>
            <div>
              <h1 className="page-title">Assistant Santé CareAI</h1>
              <p className="page-subtitle">Intelligence artificielle pour votre santé</p>
            </div>
          </div>
        </div>
        <div className="loading-container" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ fontSize: '48px', marginBottom: '20px' }}>
            🔄
          </div>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            Analyse de vos données en cours...
          </p>
        </div>
      </div>
    )
  }

  // Si aucun membre
  if (!selectedMembre) {
    return (
      <div className="page assistant-sante">
        <div className="page-header">
          <button className="btn-back" onClick={onBack}>
            ← Retour
          </button>
          <h1 className="page-title">Assistant Santé CareAI</h1>
        </div>
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            Aucun membre trouvé. Ajoutez un membre pour commencer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page assistant-sante">
      {/* En-tête */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn-back" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="page-title">🤖 Assistant Santé CareAI</h1>
            <p className="page-subtitle">Analyse intelligente et recommandations personnalisées</p>
          </div>
        </div>
      </div>

      {/* Sélecteur de membre */}
      {membres.length > 1 && (
        <div className="member-selector" style={{ marginBottom: '30px' }}>
          <label style={{ fontWeight: '600', marginRight: '15px' }}>Membre analysé:</label>
          <select
            value={selectedMembre.id}
            onChange={e => handleMemberChange(e.target.value)}
            style={{
              padding: '10px 15px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {membres.map(m => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.nom}
                {m.date_naissance && ` (${calculateAge(m.date_naissance)} ans)`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom: '30px', borderBottom: '2px solid var(--border-color)' }}>
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary-color)' : 'none',
            cursor: 'pointer'
          }}
        >
          📊 Vue d'ensemble
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'alerts' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'alerts' ? '3px solid var(--primary-color)' : 'none',
            cursor: 'pointer'
          }}
        >
          🔔 Alertes ({alerts?.totalCount || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'recommendations' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'recommendations' ? '3px solid var(--primary-color)' : 'none',
            cursor: 'pointer'
          }}
        >
          💡 Recommandations ({recommendations?.totalCount || 0})
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          {/* Score de santé global */}
          {healthScore && (
            <div className="health-score-card" style={{
              backgroundColor: 'var(--card-bg)',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Score de Santé Global</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
                {/* Jauge circulaire */}
                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                  <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="20"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={getScoreColor(healthScore.score)}
                      strokeWidth="20"
                      strokeDasharray={`${(healthScore.score / 100) * 502} 502`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: getScoreColor(healthScore.score) }}>
                      {healthScore.score}
                    </div>
                    <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                      / 100
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
                    Niveau: {getScoreLabel(healthScore.level)}
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Dernière mise à jour: {new Date(healthScore.lastCalculated).toLocaleDateString('fr-FR')}
                  </div>

                  {/* Composantes du score */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Vaccination</div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>{healthScore.components.vaccination}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Régularité RDV</div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>{healthScore.components.appointmentRegularity}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Adhérence traitements</div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>{healthScore.components.treatmentAdherence}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>État général</div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>{healthScore.components.healthIssues}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {healthScore.insights.length > 0 && (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--text-primary)' }}>💡 Insights</h3>
                  {healthScore.insights.map((insight, index) => (
                    <div key={index} style={{ padding: '10px 0', borderBottom: index < healthScore.insights.length - 1 ? '1px solid var(--border-color)' : 'none', color: 'var(--text-primary)' }}>
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grille d'analyses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Tendances RDV */}
            {appointmentTrends && (
              <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>📅 Rendez-vous</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {appointmentTrends.totalAppointments}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  Tendance: {appointmentTrends.trend === 'increasing' ? '📈 En hausse' : appointmentTrends.trend === 'decreasing' ? '📉 En baisse' : '➡️ Stable'}
                  {appointmentTrends.trendPercentage !== 0 && ` (${appointmentTrends.trendPercentage > 0 ? '+' : ''}${appointmentTrends.trendPercentage}%)`}
                </div>
                <div style={{ fontSize: '14px', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', color: 'var(--text-primary)' }}>
                  {appointmentTrends.recommendation}
                </div>
              </div>
            )}

            {/* Adhérence traitements */}
            {adherence && (
              <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>💊 Traitements</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {adherence.adherenceScore}%
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  Niveau: {adherence.level === 'excellent' ? 'Excellent' : adherence.level === 'good' ? 'Bon' : adherence.level === 'moderate' ? 'Moyen' : 'Faible'}
                </div>
                {adherence.issues.length > 0 && (
                  <div style={{ fontSize: '13px', padding: '10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '6px' }}>
                    ⚠️ {adherence.issues[0]}
                  </div>
                )}
              </div>
            )}

            {/* Risques */}
            {risks && (
              <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>⚕️ Risques</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {risks.riskLevel === 'low' ? '✅ Faible' : risks.riskLevel === 'moderate' ? '⚠️ Modéré' : risks.riskLevel === 'high' ? '🔶 Élevé' : '🚨 Critique'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  Score de risque: {risks.riskScore}/100
                </div>
                {risks.urgentActionRequired && (
                  <div style={{ fontSize: '13px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px' }}>
                    🚨 Action urgente recommandée
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onglet Alertes */}
      {activeTab === 'alerts' && alerts && (
        <div className="alerts-content">
          {alerts.totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Aucune alerte active</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tout va bien! Aucune action n'est requise pour le moment.
              </p>
            </div>
          ) : (
            <>
              {/* Résumé des alertes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{alerts.criticalCount}</div>
                  <div style={{ fontSize: '14px', color: '#721c24' }}>Critiques</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{alerts.highCount}</div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>Élevées</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5460' }}>{alerts.mediumCount}</div>
                  <div style={{ fontSize: '14px', color: '#0c5460' }}>Moyennes</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{alerts.lowCount}</div>
                  <div style={{ fontSize: '14px', color: '#155724' }}>Faibles</div>
                </div>
              </div>

              {/* Liste des alertes */}
              <div style={{ display: 'grid', gap: '15px' }}>
                {alerts.alerts.map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      padding: '20px',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${getAlertColor(alert.priority)}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{alert.icon}</span>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
                            {alert.title}
                          </h4>
                          <span
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: getAlertColor(alert.priority),
                              color: 'white',
                              borderRadius: '4px'
                            }}
                          >
                            {getAlertPriorityLabel(alert.priority)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleSnoozeAlert(alert.id, 24)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Reporter 24h"
                        >
                          ⏰
                        </button>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Masquer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                      {alert.message}
                    </p>
                    {alert.actionable && alert.actionLabel && (
                      <button
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Onglet Recommandations */}
      {activeTab === 'recommendations' && recommendations && (
        <div className="recommendations-content">
          {recommendations.totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💡</div>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Aucune recommandation</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Pas de recommandation disponible pour le moment.
              </p>
            </div>
          ) : (
            <>
              {/* Résumé */}
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>
                  {recommendations.personalized ? '✨ Recommandations personnalisées' : '📋 Recommandations générales'}
                </h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {recommendations.highPriority}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      Priorité élevée
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                      {recommendations.mediumPriority}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      Priorité moyenne
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                      {recommendations.lowPriority}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      Priorité faible
                    </span>
                  </div>
                </div>
              </div>

              {/* Liste des recommandations */}
              <div style={{ display: 'grid', gap: '20px' }}>
                {recommendations.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      padding: '25px',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${getRecommendationColor(rec.category)}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '15px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '32px' }}>{rec.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '20px', fontWeight: '600' }}>{rec.title}</h4>
                          <span
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: getRecommendationColor(rec.category),
                              color: 'white',
                              borderRadius: '4px'
                            }}
                          >
                            {getRecommendationCategoryLabel(rec.category)}
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          {rec.description}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Raison</div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>{rec.reason}</div>
                          </div>
                          {rec.frequency && (
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fréquence</div>
                              <div style={{ fontSize: '14px', fontWeight: '500' }}>{rec.frequency}</div>
                            </div>
                          )}
                        </div>
                        <div style={{
                          marginTop: '15px',
                          padding: '12px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '6px'
                        }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                            ➜ Action recommandée:
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{rec.action}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AssistantSante
