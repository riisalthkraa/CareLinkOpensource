/**
 * Timeline3D - Vue chronologique 3D des données médicales
 *
 * Module de visualisation avancée qui agrège toutes les données médicales
 * (rendez-vous, vaccins, traitements, allergies) sur une timeline interactive.
 *
 * FONCTIONNALITÉS:
 * - Agrégation multi-sources (RDV, vaccins, traitements, allergies)
 * - Visualisation chronologique avec catégories colorées
 * - Filtres par type d'événement et plage de dates
 * - Zoom et navigation temporelle
 * - Export PNG/PDF
 * - Détails au survol et clic
 * - Indicateurs visuels de criticité (urgence, rappels)
 *
 * @module Timeline3D
 */

import { useState, useEffect } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import { SkeletonCard } from '../components/SkeletonLoader'

/**
 * Type d'événement médical sur la timeline
 */
type EventType = 'rendez-vous' | 'vaccin' | 'traitement' | 'allergie' | 'analyse' | 'hospitalisation'

/**
 * Niveau de criticité d'un événement
 */
type CriticalityLevel = 'normal' | 'important' | 'urgent' | 'critique'

/**
 * Interface représentant un événement médical sur la timeline
 */
interface TimelineEvent {
  id: string
  type: EventType
  date: Date
  titre: string
  description: string
  membreId: number
  membreNom: string
  criticality: CriticalityLevel
  metadata?: {
    specialite?: string
    medecin?: string
    dosage?: string
    effetsSecondaires?: string
    rappel?: Date
    statut?: string
  }
}

/**
 * Configuration des filtres de la timeline
 */
interface TimelineFilters {
  types: Set<EventType>
  dateDebut: Date | null
  dateFin: Date | null
  membres: Set<number>
  criticite: Set<CriticalityLevel>
}

/**
 * Props du composant Timeline3D
 */
interface Timeline3DProps {
  membreId?: number | null
  onBack: () => void
}

/**
 * Configuration visuelle des types d'événements
 */
const EVENT_CONFIG: Record<EventType, { icon: string; color: string; label: string }> = {
  'rendez-vous': { icon: '📅', color: '#3498db', label: 'Rendez-vous' },
  'vaccin': { icon: '💉', color: '#9b59b6', label: 'Vaccin' },
  'traitement': { icon: '💊', color: '#e74c3c', label: 'Traitement' },
  'allergie': { icon: '⚠️', color: '#f39c12', label: 'Allergie' },
  'analyse': { icon: '🔬', color: '#1abc9c', label: 'Analyse' },
  'hospitalisation': { icon: '🏥', color: '#e67e22', label: 'Hospitalisation' }
}

/**
 * Configuration des niveaux de criticité
 */
const CRITICALITY_CONFIG: Record<CriticalityLevel, { color: string; label: string }> = {
  'normal': { color: '#95a5a6', label: 'Normal' },
  'important': { color: '#3498db', label: 'Important' },
  'urgent': { color: '#f39c12', label: 'Urgent' },
  'critique': { color: '#e74c3c', label: 'Critique' }
}

/**
 * Timeline3D - Composant principal de visualisation chronologique
 *
 * Affiche tous les événements médicaux d'un ou plusieurs membres
 * sur une timeline interactive avec filtres et export.
 *
 * @component
 */
function Timeline3D({ membreId, onBack }: Timeline3DProps) {
  // ========== ÉTATS ==========
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([])
  const [membres, setMembres] = useState<Array<{ id: number; prenom: string; nom: string }>>([])
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState<'jour' | 'semaine' | 'mois' | 'année'>('mois')
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<TimelineFilters>({
    types: new Set(Object.keys(EVENT_CONFIG) as EventType[]),
    dateDebut: null,
    dateFin: null,
    membres: new Set(),
    criticite: new Set(Object.keys(CRITICALITY_CONFIG) as CriticalityLevel[])
  })

  const { addNotification } = useNotification()

  // ========== CHARGEMENT DES DONNÉES ==========

  useEffect(() => {
    loadData()
  }, [membreId])

  useEffect(() => {
    applyFilters()
  }, [events, filters])

  /**
   * Charge tous les membres de la famille
   */
  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT id, prenom, nom FROM membres ORDER BY prenom'
      )
      if (result.success) {
        setMembres(result.data)
        // Initialiser le filtre membres
        if (membreId) {
          setFilters(prev => ({ ...prev, membres: new Set([membreId]) }))
        } else {
          setFilters(prev => ({ ...prev, membres: new Set(result.data.map((m: any) => m.id)) }))
        }
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Déchiffre une donnée si elle est chiffrée
   */
  const decryptIfNeeded = async (data: string | null): Promise<string> => {
    if (!data) return ''

    // Si la donnée commence par '{"encrypted":', c'est du chiffré
    if (data.startsWith('{"encrypted":')) {
      try {
        const result = await window.electronAPI.decryptText(data)
        if (result.success && result.data) {
          return result.data
        }
      } catch (error) {
        console.error('Erreur déchiffrement:', error)
      }
    }

    return data
  }

  /**
   * Charge tous les événements médicaux
   */
  const loadData = async () => {
    setIsLoading(true)
    await loadMembres()

    try {
      const allEvents: TimelineEvent[] = []

      // 1. RENDEZ-VOUS
      const rdvResult = await window.electronAPI.dbQuery(
        `SELECT r.*, m.prenom, m.nom
         FROM rendez_vous r
         LEFT JOIN membres m ON r.membre_id = m.id
         ${membreId ? 'WHERE r.membre_id = ?' : ''}
         ORDER BY r.date_rdv DESC`,
        membreId ? [membreId] : []
      )

      if (rdvResult.success) {
        for (const rdv of rdvResult.data) {
          const notesDecrypted = await decryptIfNeeded(rdv.notes)

          allEvents.push({
            id: `rdv-${rdv.id}`,
            type: 'rendez-vous',
            date: new Date(rdv.date_rdv),
            titre: `${rdv.specialite || 'Consultation'}`,
            description: rdv.motif || 'Rendez-vous médical',
            membreId: rdv.membre_id,
            membreNom: `${rdv.prenom} ${rdv.nom}`,
            criticality: rdv.urgence ? 'urgent' : 'normal',
            metadata: {
              specialite: rdv.specialite,
              medecin: rdv.medecin,
              statut: rdv.statut,
              effetsSecondaires: notesDecrypted
            }
          })
        }
      }

      // 2. VACCINS
      const vaccinsResult = await window.electronAPI.dbQuery(
        `SELECT v.*, m.prenom, m.nom
         FROM vaccins v
         LEFT JOIN membres m ON v.membre_id = m.id
         ${membreId ? 'WHERE v.membre_id = ?' : ''}
         ORDER BY v.date_administration DESC`,
        membreId ? [membreId] : []
      )

      if (vaccinsResult.success) {
        for (const vaccin of vaccinsResult.data) {
          const dateVaccin = new Date(vaccin.date_administration)
          const rappelDate = vaccin.date_rappel ? new Date(vaccin.date_rappel) : null
          const needsRappel = rappelDate && rappelDate < new Date()
          const notesDecrypted = await decryptIfNeeded(vaccin.notes)

          allEvents.push({
            id: `vaccin-${vaccin.id}`,
            type: 'vaccin',
            date: dateVaccin,
            titre: vaccin.nom_vaccin,
            description: `${vaccin.nom_vaccin} - ${vaccin.lot || 'N/A'}`,
            membreId: vaccin.membre_id,
            membreNom: `${vaccin.prenom} ${vaccin.nom}`,
            criticality: needsRappel ? 'urgent' : 'normal',
            metadata: {
              dosage: `Lot: ${vaccin.lot}`,
              medecin: vaccin.medecin,
              rappel: rappelDate || undefined,
              effetsSecondaires: notesDecrypted
            }
          })
        }
      }

      // 3. TRAITEMENTS
      const traitementsResult = await window.electronAPI.dbQuery(
        `SELECT t.*, m.prenom, m.nom
         FROM traitements t
         LEFT JOIN membres m ON t.membre_id = m.id
         ${membreId ? 'WHERE t.membre_id = ?' : ''}
         ORDER BY t.date_debut DESC`,
        membreId ? [membreId] : []
      )

      if (traitementsResult.success) {
        for (const trait of traitementsResult.data) {
          const dateDebut = new Date(trait.date_debut)
          const dateFin = trait.date_fin ? new Date(trait.date_fin) : null
          const isActif = !dateFin || dateFin > new Date()
          const notesDecrypted = await decryptIfNeeded(trait.notes)

          allEvents.push({
            id: `traitement-${trait.id}`,
            type: 'traitement',
            date: dateDebut,
            titre: trait.nom_medicament,
            description: `${trait.nom_medicament} - ${trait.dosage}`,
            membreId: trait.membre_id,
            membreNom: `${trait.prenom} ${trait.nom}`,
            criticality: isActif ? 'important' : 'normal',
            metadata: {
              dosage: trait.dosage,
              medecin: trait.medecin_prescripteur,
              effetsSecondaires: notesDecrypted,
              statut: isActif ? 'En cours' : 'Terminé'
            }
          })
        }
      }

      // 4. ALLERGIES
      const allergiesResult = await window.electronAPI.dbQuery(
        `SELECT a.*, m.prenom, m.nom
         FROM allergies a
         LEFT JOIN membres m ON a.membre_id = m.id
         ${membreId ? 'WHERE a.membre_id = ?' : ''}`,
        membreId ? [membreId] : []
      )

      if (allergiesResult.success) {
        for (const allergie of allergiesResult.data) {
          const severite = allergie.severite?.toLowerCase() || 'modérée'
          let criticality: CriticalityLevel = 'normal'
          if (severite === 'élevée' || severite === 'sévère' || severite === 'grave') criticality = 'critique'
          else if (severite === 'modérée') criticality = 'important'

          // Déchiffrer le nom de l'allergie
          const nomAllergieDecrypted = await decryptIfNeeded(allergie.nom_allergie)

          allEvents.push({
            id: `allergie-${allergie.id}`,
            type: 'allergie',
            date: new Date(), // Allergies n'ont pas de date, on utilise maintenant
            titre: `⚠️ ${nomAllergieDecrypted}`,
            description: `Allergie: ${nomAllergieDecrypted} (${allergie.severite})`,
            membreId: allergie.membre_id,
            membreNom: `${allergie.prenom} ${allergie.nom}`,
            criticality: criticality,
            metadata: {
              effetsSecondaires: allergie.type_allergie,
              statut: allergie.severite
            }
          })
        }
      }

      // Trier tous les événements par date (plus récent en premier)
      allEvents.sort((a, b) => b.date.getTime() - a.date.getTime())
      setEvents(allEvents)

      addNotification({
        type: 'success',
        title: 'Timeline chargée',
        message: `${allEvents.length} événements médicaux affichés`,
        duration: 3000
      })
    } catch (error) {
      console.error('Erreur chargement timeline:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données médicales',
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Applique les filtres aux événements
   */
  const applyFilters = () => {
    let filtered = events.filter(event => {
      // Filtre par type
      if (!filters.types.has(event.type)) return false

      // Filtre par membre
      if (filters.membres.size > 0 && !filters.membres.has(event.membreId)) return false

      // Filtre par criticité
      if (!filters.criticite.has(event.criticality)) return false

      // Filtre par date
      if (filters.dateDebut && event.date < filters.dateDebut) return false
      if (filters.dateFin && event.date > filters.dateFin) return false

      return true
    })

    setFilteredEvents(filtered)
  }

  /**
   * Toggle un type d'événement dans les filtres
   */
  const toggleEventType = (type: EventType) => {
    setFilters(prev => {
      const newTypes = new Set(prev.types)
      if (newTypes.has(type)) {
        newTypes.delete(type)
      } else {
        newTypes.add(type)
      }
      return { ...prev, types: newTypes }
    })
  }

  /**
   * Toggle un membre dans les filtres
   */
  const toggleMembre = (id: number) => {
    setFilters(prev => {
      const newMembres = new Set(prev.membres)
      if (newMembres.has(id)) {
        newMembres.delete(id)
      } else {
        newMembres.add(id)
      }
      return { ...prev, membres: newMembres }
    })
  }

  /**
   * Exporte la timeline en PNG
   */
  const exportToPNG = async () => {
    try {
      // Utiliser html2canvas pour capturer la timeline
      addNotification({
        type: 'info',
        title: 'Export PNG',
        message: 'Fonctionnalité disponible prochainement',
        duration: 3000
      })
    } catch (error) {
      console.error('Erreur export PNG:', error)
    }
  }

  /**
   * Exporte la timeline en PDF
   */
  const exportToPDF = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export PDF',
        message: 'Fonctionnalité disponible prochainement',
        duration: 3000
      })
    } catch (error) {
      console.error('Erreur export PDF:', error)
    }
  }

  /**
   * Formate une date en français
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  /**
   * Retourne la couleur d'un événement en fonction de son type
   */
  const getEventColor = (event: TimelineEvent): string => {
    return EVENT_CONFIG[event.type].color
  }

  /**
   * Retourne l'icône d'un événement en fonction de son type
   */
  const getEventIcon = (event: TimelineEvent): string => {
    return EVENT_CONFIG[event.type].icon
  }

  // ========== STATISTIQUES ==========
  const stats = {
    total: filteredEvents.length,
    parType: Object.fromEntries(
      Object.keys(EVENT_CONFIG).map(type => [
        type,
        filteredEvents.filter(e => e.type === type).length
      ])
    ),
    parCriticite: Object.fromEntries(
      Object.keys(CRITICALITY_CONFIG).map(crit => [
        crit,
        filteredEvents.filter(e => e.criticality === crit).length
      ])
    )
  }

  // ========== RENDU ==========

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-md mb-lg">
          <div className="skeleton" style={{ width: '100px', height: '40px' }}></div>
          <div className="flex-1">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-md mb-lg">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }}></div>
          <p className="text-lg">Chargement de la timeline médicale...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div className="flex items-center gap-md">
          <button onClick={onBack} className="btn btn-secondary">
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">
              📊 Timeline Médicale 3D
            </h1>
            <p className="text-sm text-secondary m-0">
              Vue chronologique de tous les événements de santé
            </p>
          </div>
        </div>

        <div className="btn-group">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            🔍 Filtres {showFilters ? '▼' : '▶'}
          </button>
          <button onClick={exportToPNG} className="btn btn-secondary">
            📸 PNG
          </button>
          <button onClick={exportToPDF} className="btn btn-primary">
            📄 PDF
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-md mb-xl">
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Événements totaux
          </div>
        </div>

        {Object.entries(EVENT_CONFIG).map(([type, config]) => (
          <div key={type} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>{config.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: config.color }}>
              {stats.parType[type] || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
              {config.label}
            </div>
          </div>
        ))}
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="card" style={{ padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
            🔍 Filtres
          </h3>

          {/* Filtres par type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Types d'événements:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Object.entries(EVENT_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => toggleEventType(type as EventType)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filters.types.has(type as EventType)
                      ? config.color
                      : 'var(--bg-secondary)',
                    color: filters.types.has(type as EventType) ? '#fff' : 'var(--text-secondary)',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres par membre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Membres de la famille:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {membres.map(membre => (
                <button
                  key={membre.id}
                  onClick={() => toggleMembre(membre.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filters.membres.has(membre.id)
                      ? 'var(--primary-color)'
                      : 'var(--bg-secondary)',
                    color: filters.membres.has(membre.id) ? '#fff' : 'var(--text-secondary)',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  👤 {membre.prenom}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom level */}
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Niveau de zoom:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['jour', 'semaine', 'mois', 'année'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      zoomLevel === level ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: zoomLevel === level ? '#fff' : 'var(--text-secondary)',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline visuelle */}
      <div className="card" style={{ padding: '30px' }}>
        <h3 style={{ marginTop: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
          📅 Chronologie ({filteredEvents.length} événements)
        </h3>

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Aucun événement trouvé
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Ajustez vos filtres ou ajoutez de nouveaux événements médicaux
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Ligne centrale de la timeline */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '4px',
                background: 'linear-gradient(to bottom, var(--primary-color), var(--secondary-color))',
                borderRadius: '4px',
                transform: 'translateX(-50%)'
              }}
            />

            {/* Événements */}
            <div style={{ position: 'relative' }}>
              {filteredEvents.map((event, index) => {
                const isLeft = index % 2 === 0
                return (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      justifyContent: isLeft ? 'flex-end' : 'flex-start',
                      marginBottom: '40px',
                      position: 'relative'
                    }}
                  >
                    {/* Carte d'événement */}
                    <div
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        width: '45%',
                        padding: '20px',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        border: `3px solid ${getEventColor(event)}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedEvent?.id === event.id
                          ? `0 8px 24px ${getEventColor(event)}40`
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        transform: selectedEvent?.id === event.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {/* En-tête */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '32px', marginRight: '12px' }}>
                          {getEventIcon(event)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '16px',
                              color: 'var(--text-primary)',
                              fontWeight: '600'
                            }}
                          >
                            {event.titre}
                          </h4>
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: '12px',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {formatDate(event.date)}
                          </p>
                        </div>
                        {/* Badge criticité */}
                        <div
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: CRITICALITY_CONFIG[event.criticality].color,
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}
                        >
                          {CRITICALITY_CONFIG[event.criticality].label}
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          margin: '0 0 12px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          lineHeight: '1.5'
                        }}
                      >
                        {event.description}
                      </p>

                      {/* Membre */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <span>👤</span>
                        <span style={{ fontWeight: '500' }}>{event.membreNom}</span>
                      </div>

                      {/* Métadonnées supplémentaires si sélectionné */}
                      {selectedEvent?.id === event.id && event.metadata && (
                        <div
                          style={{
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '1px solid var(--border-color)'
                          }}
                        >
                          {event.metadata.medecin && (
                            <p style={{ margin: '5px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
                              <strong>Médecin:</strong> {event.metadata.medecin}
                            </p>
                          )}
                          {event.metadata.specialite && (
                            <p style={{ margin: '5px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
                              <strong>Spécialité:</strong> {event.metadata.specialite}
                            </p>
                          )}
                          {event.metadata.dosage && (
                            <p style={{ margin: '5px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
                              <strong>Dosage:</strong> {event.metadata.dosage}
                            </p>
                          )}
                          {event.metadata.statut && (
                            <p style={{ margin: '5px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
                              <strong>Statut:</strong> {event.metadata.statut}
                            </p>
                          )}
                          {event.metadata.rappel && (
                            <p style={{ margin: '5px 0', fontSize: '13px', color: '#f39c12' }}>
                              <strong>⏰ Rappel:</strong> {formatDate(event.metadata.rappel)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Point de connexion à la ligne centrale */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '20px',
                        width: '16px',
                        height: '16px',
                        backgroundColor: getEventColor(event),
                        border: '4px solid var(--card-bg)',
                        borderRadius: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                        boxShadow: `0 0 0 4px ${getEventColor(event)}30`
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Timeline3D
