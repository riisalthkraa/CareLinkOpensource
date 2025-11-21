/**
 * RendezVous - Page de gestion complète des rendez-vous médicaux
 *
 * Fonctionnalités implémentées:
 * - Gestion des rendez-vous pour tous les membres de la famille
 * - Système d'alertes pour les RDV à venir
 * - Filtres par membre, statut et période
 * - Vue calendrier et liste
 * - Statuts: à venir, effectué, annulé
 * - Historique complet des consultations
 *
 * @module RendezVous
 */

import { useState, useEffect } from 'react'
import { RendezVous as RdvType, Membre } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import ConfirmModal from '../components/ConfirmModal'

/**
 * Props du composant RendezVous
 */
interface RendezVousProps {
  onBack: () => void
}

/**
 * RendezVous - Composant de gestion des rendez-vous médicaux
 */
function RendezVous({ onBack }: RendezVousProps) {
  const [rendezVous, setRendezVous] = useState<RdvType[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPassed, setShowPassed] = useState(false)
  const [filterMembre, setFilterMembre] = useState<number | null>(null)
  const [filterStatut, setFilterStatut] = useState<string>('tous')
  const { addNotification } = useNotification()
  const [decryptedData, setDecryptedData] = useState<Record<number, { notes: string; lieu: string; motif: string }>>({})
  const [showTips, setShowTips] = useState(true)

  const [newRdv, setNewRdv] = useState({
    membre_id: 0,
    date_rdv: '',
    heure: '',
    medecin: '',
    specialite: '',
    lieu: '',
    telephone_cabinet: '',
    motif: '',
    statut: 'à_venir' as 'à_venir' | 'effectué' | 'annulé',
    rappel: 1,
    duree: 30,
    notes: ''
  })

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; rdv?: { id: number; membreNom: string; date: string } }>({ isOpen: false })

  /**
   * Déchiffre un texte s'il est chiffré
   */
  const decryptText = async (text: string | null): Promise<string> => {
    if (!text) return ''
    if (text.startsWith('{') && text.includes('"encrypted"')) {
      try {
        const result = await window.electronAPI.decryptText(text)
        return result.success ? result.data || '' : text
      } catch (error) {
        console.error('Erreur déchiffrement:', error)
        return text
      }
    }
    return text
  }

  useEffect(() => {
    loadMembres()
    loadRendezVous()
  }, [])

  /**
   * Charge tous les membres de la famille
   */
  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM membres ORDER BY nom, prenom',
        []
      )
      if (result.success) {
        setMembres(result.data)
        if (result.data.length > 0 && newRdv.membre_id === 0) {
          setNewRdv({ ...newRdv, membre_id: result.data[0].id })
        }
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Charge tous les rendez-vous
   */
  const loadRendezVous = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT r.*, m.prenom, m.nom FROM rendez_vous r JOIN membres m ON r.membre_id = m.id ORDER BY r.date_rdv DESC, r.heure DESC',
        []
      )
      if (result.success) {
        setRendezVous(result.data)

        // Déchiffrer les notes, lieu et motif
        const decrypted: Record<number, { notes: string; lieu: string; motif: string }> = {}
        for (const rdv of result.data) {
          decrypted[rdv.id] = {
            notes: await decryptText(rdv.notes),
            lieu: await decryptText(rdv.lieu),
            motif: await decryptText(rdv.motif)
          }
        }
        setDecryptedData(decrypted)
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error)
    }
  }

  /**
   * Ajoute un nouveau rendez-vous
   */
  const handleAddRdv = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRdv.membre_id || !newRdv.date_rdv) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le membre et la date sont obligatoires'
      })
      return
    }

    try {
      const result = await window.electronAPI.dbRun(
        `INSERT INTO rendez_vous (
          membre_id, date_rdv, heure, medecin, specialite, lieu,
          telephone_cabinet, motif, statut, rappel, duree, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newRdv.membre_id,
          newRdv.date_rdv,
          newRdv.heure || null,
          newRdv.medecin || null,
          newRdv.specialite || null,
          newRdv.lieu || null,
          newRdv.telephone_cabinet || null,
          newRdv.motif || null,
          newRdv.statut,
          newRdv.rappel || null,
          newRdv.duree || null,
          newRdv.notes || null
        ]
      )

      if (result.success) {
        const membreNom = getMemberName(newRdv.membre_id)
        addNotification({
          type: 'success',
          title: 'Rendez-vous ajouté',
          message: `RDV pour ${membreNom} le ${formatDate(newRdv.date_rdv)}`
        })
        setNewRdv({
          membre_id: membres[0]?.id || 0,
          date_rdv: '',
          heure: '',
          medecin: '',
          specialite: '',
          lieu: '',
          telephone_cabinet: '',
          motif: '',
          statut: 'à_venir',
          rappel: 1,
          duree: 30,
          notes: ''
        })
        setShowAddForm(false)
        loadRendezVous()
      }
    } catch (error) {
      console.error('Erreur ajout rendez-vous:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le rendez-vous'
      })
    }
  }

  /**
   * Affiche le modal de suppression
   */
  const handleDeleteRdv = (id: number, membre_id: number, date: string) => {
    const membreNom = getMemberName(membre_id)
    setConfirmDelete({ isOpen: true, rdv: { id, membreNom, date } })
  }

  /**
   * Confirme la suppression d'un rendez-vous
   */
  const confirmDeleteRdv = async () => {
    if (!confirmDelete.rdv) return

    const { id } = confirmDelete.rdv

    try {
      const result = await window.electronAPI.dbRun(
        'DELETE FROM rendez_vous WHERE id = ?',
        [id]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Rendez-vous supprimé',
          message: `Le RDV a été supprimé`
        })
        loadRendezVous()
      }
    } catch (error) {
      console.error('Erreur suppression rendez-vous:', error)
    } finally {
      setConfirmDelete({ isOpen: false })
    }
  }

  /**
   * Change le statut d'un rendez-vous
   */
  const handleChangeStatut = async (id: number, newStatut: 'à_venir' | 'effectué' | 'annulé') => {
    try {
      const result = await window.electronAPI.dbRun(
        'UPDATE rendez_vous SET statut = ? WHERE id = ?',
        [newStatut, id]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Statut modifié',
          message: `Rendez-vous marqué comme ${newStatut}`
        })
        loadRendezVous()
      }
    } catch (error) {
      console.error('Erreur modification statut:', error)
    }
  }

  /**
   * Retourne le nom complet d'un membre à partir d'un rendez-vous
   */
  const getMemberName = (membreId: number, rdv?: any): string => {
    // Si le RDV contient directement prenom et nom (depuis le JOIN), les utiliser
    if (rdv?.prenom && rdv?.nom) {
      return `${rdv.prenom} ${rdv.nom}`
    }
    // Sinon chercher dans la liste des membres
    const membre = membres.find(m => m.id === membreId)
    return membre ? `${membre.prenom} ${membre.nom}` : 'Inconnu'
  }

  /**
   * Retourne la classe CSS selon le statut
   */
  const getStatutClass = (statut: string) => {
    switch (statut) {
      case 'à_venir': return 'rdv-a-venir'
      case 'effectué': return 'rdv-effectue'
      case 'annulé': return 'rdv-annule'
      default: return ''
    }
  }

  /**
   * Retourne l'emoji selon le statut
   */
  const getStatutEmoji = (statut: string) => {
    switch (statut) {
      case 'à_venir': return '📅'
      case 'effectué': return '✅'
      case 'annulé': return '❌'
      default: return '📌'
    }
  }

  /**
   * Calcule le nombre de jours avant un rendez-vous
   */
  const getJoursAvantRdv = (dateRdv: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rdv = new Date(dateRdv)
    rdv.setHours(0, 0, 0, 0)
    const diff = Math.ceil((rdv.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diff
  }

  /**
   * Retourne la classe d'alerte selon la proximité du RDV
   */
  const getAlertClass = (dateRdv: string, statut: string): string => {
    if (statut !== 'à_venir') return ''
    const jours = getJoursAvantRdv(dateRdv)
    if (jours === 0) return 'rdv-aujourdhui'
    if (jours === 1) return 'rdv-demain'
    if (jours <= 7) return 'rdv-proche'
    return ''
  }

  /**
   * Formate une date en français
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseignée'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Formate une date courte
   */
  const formatDateCourt = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrage des rendez-vous
  let rdvFiltres = rendezVous

  // Filtre par membre
  if (filterMembre !== null) {
    rdvFiltres = rdvFiltres.filter(rdv => rdv.membre_id === filterMembre)
  }

  // Filtre par statut
  if (filterStatut !== 'tous') {
    rdvFiltres = rdvFiltres.filter(rdv => rdv.statut === filterStatut)
  }

  // Séparation passés/futurs
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rdvFuturs = rdvFiltres
    .filter(rdv => {
      const dateRdv = new Date(rdv.date_rdv)
      dateRdv.setHours(0, 0, 0, 0)
      return dateRdv >= today
    })
    .sort((a, b) => new Date(a.date_rdv).getTime() - new Date(b.date_rdv).getTime())

  const rdvPasses = rdvFiltres
    .filter(rdv => {
      const dateRdv = new Date(rdv.date_rdv)
      dateRdv.setHours(0, 0, 0, 0)
      return dateRdv < today
    })
    .sort((a, b) => new Date(b.date_rdv).getTime() - new Date(a.date_rdv).getTime())

  // Alertes pour les RDV proches
  const alertesRdv = rdvFuturs.filter(rdv => {
    if (rdv.statut !== 'à_venir') return false
    const jours = getJoursAvantRdv(rdv.date_rdv)
    return jours >= 0 && jours <= 7
  })

  return (
    <div className="rdv-page">
      {/* Header */}
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">📅 Calendrier des Rendez-vous</h1>
            <p className="text-sm text-secondary m-0">{rdvFuturs.length} à venir • {rdvPasses.length} passés</p>
          </div>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPassed(!showPassed)}
          >
            📜 {showPassed ? 'Masquer' : 'Voir'} historique
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            ➕ Ajouter un RDV
          </button>
        </div>
      </div>

      {/* Alertes RDV proches */}
      {alertesRdv.length > 0 && (
        <div className="card rdv-alertes">
          <h3>🔔 Rendez-vous à venir (7 prochains jours)</h3>
          <div className="alertes-list">
            {alertesRdv.map(rdv => {
              const jours = getJoursAvantRdv(rdv.date_rdv)
              return (
                <div key={rdv.id} className={`alerte-item ${getAlertClass(rdv.date_rdv, rdv.statut || '')}`}>
                  <div className="alerte-info">
                    <strong>{getMemberName(rdv.membre_id, rdv)}</strong>
                    <span className="alerte-date">
                      {jours === 0 && '🔴 Aujourd\'hui'}
                      {jours === 1 && '🟠 Demain'}
                      {jours > 1 && `🟡 Dans ${jours} jours`}
                      {rdv.heure && ` à ${rdv.heure}`}
                    </span>
                  </div>
                  <div className="alerte-details">
                    {rdv.specialite && <span>👨‍⚕️ {rdv.specialite}</span>}
                    {rdv.medecin && <span>{rdv.medecin}</span>}
                    {decryptedData[rdv.id]?.motif && <span>📋 {decryptedData[rdv.id].motif}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tip de bienvenue */}
      {rdvFuturs.length === 0 && showTips && (
        <div className="tip-box tip-info">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <strong>Organisez tous vos rendez-vous médicaux au même endroit !</strong>
            <p>
              Ajoutez les consultations, suivez les <strong>délais d'attente</strong> (même 6-12 mois pour les spécialistes),
              et recevez des <strong>rappels automatiques</strong>. L'application vous alerte
              pour les RDV proches et garde un historique complet.
            </p>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="card">
          <h3>➕ Ajouter un rendez-vous</h3>

          {/* Tip d'aide au remplissage */}
          <div className="tip-box tip-success">
            <div className="tip-icon">✅</div>
            <div className="tip-content">
              <strong>Aide au remplissage</strong>
              <ul className="tip-list">
                <li>Seuls le <strong>membre</strong> et la <strong>date</strong> sont obligatoires</li>
                <li><strong>Spécialité</strong> : choisissez le type de praticien (généraliste, cardiologue, dentiste...)</li>
                <li><strong>Lieu</strong> : l'adresse complète du cabinet pour éviter de chercher le jour J</li>
                <li><strong>Téléphone</strong> : utile pour reporter ou confirmer le RDV</li>
                <li><strong>Rappel</strong> : vous serez alerté automatiquement X jours avant</li>
                <li>Pour les <strong>spécialistes</strong> : n'hésitez pas à entrer des dates à 6-12 mois !</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleAddRdv} className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>Membre de la famille *</label>
                <select
                  value={newRdv.membre_id}
                  onChange={(e) => setNewRdv({ ...newRdv, membre_id: parseInt(e.target.value) })}
                  required
                >
                  {membres.map(membre => (
                    <option key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date du rendez-vous *</label>
                <input
                  type="date"
                  value={newRdv.date_rdv}
                  onChange={(e) => setNewRdv({ ...newRdv, date_rdv: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Heure</label>
                <input
                  type="time"
                  value={newRdv.heure}
                  onChange={(e) => setNewRdv({ ...newRdv, heure: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Médecin/Praticien</label>
                <input
                  type="text"
                  value={newRdv.medecin}
                  onChange={(e) => setNewRdv({ ...newRdv, medecin: e.target.value })}
                  placeholder="Dr. Martin Dupont"
                />
              </div>
              <div className="form-group">
                <label>Spécialité</label>
                <select
                  value={newRdv.specialite}
                  onChange={(e) => setNewRdv({ ...newRdv, specialite: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Médecin généraliste">Médecin généraliste</option>
                  <option value="Cardiologue">Cardiologue</option>
                  <option value="Dentiste">Dentiste</option>
                  <option value="Dermatologue">Dermatologue</option>
                  <option value="Gynécologue">Gynécologue</option>
                  <option value="Ophtalmologue">Ophtalmologue</option>
                  <option value="ORL">ORL</option>
                  <option value="Pédiatre">Pédiatre</option>
                  <option value="Psychiatre">Psychiatre</option>
                  <option value="Radiologue">Radiologue</option>
                  <option value="Kinésithérapeute">Kinésithérapeute</option>
                  <option value="Ostéopathe">Ostéopathe</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lieu (adresse du cabinet)</label>
                <input
                  type="text"
                  value={newRdv.lieu}
                  onChange={(e) => setNewRdv({ ...newRdv, lieu: e.target.value })}
                  placeholder="15 rue de la Santé, 75013 Paris"
                />
              </div>
              <div className="form-group">
                <label>Téléphone du cabinet</label>
                <input
                  type="tel"
                  value={newRdv.telephone_cabinet}
                  onChange={(e) => setNewRdv({ ...newRdv, telephone_cabinet: e.target.value })}
                  placeholder="01 42 34 56 78"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Motif de consultation</label>
                <input
                  type="text"
                  value={newRdv.motif}
                  onChange={(e) => setNewRdv({ ...newRdv, motif: e.target.value })}
                  placeholder="Consultation de suivi, bilan sanguin..."
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={newRdv.statut}
                  onChange={(e) => setNewRdv({ ...newRdv, statut: e.target.value as any })}
                >
                  <option value="à_venir">📅 À venir</option>
                  <option value="effectué">✅ Effectué</option>
                  <option value="annulé">❌ Annulé</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rappel (jours avant)</label>
                <select
                  value={newRdv.rappel}
                  onChange={(e) => setNewRdv({ ...newRdv, rappel: parseInt(e.target.value) })}
                >
                  <option value="1">1 jour avant</option>
                  <option value="3">3 jours avant</option>
                  <option value="7">7 jours avant</option>
                  <option value="14">14 jours avant</option>
                </select>
              </div>
              <div className="form-group">
                <label>Durée estimée (minutes)</label>
                <input
                  type="number"
                  value={newRdv.duree}
                  onChange={(e) => setNewRdv({ ...newRdv, duree: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newRdv.notes}
                onChange={(e) => setNewRdv({ ...newRdv, notes: e.target.value })}
                placeholder="Apporter ordonnances, résultats d'analyses..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">✅ Ajouter</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setNewRdv({
                    membre_id: membres[0]?.id || 0,
                    date_rdv: '',
                    heure: '',
                    medecin: '',
                    specialite: '',
                    lieu: '',
                    telephone_cabinet: '',
                    motif: '',
                    statut: 'à_venir',
                    rappel: 1,
                    duree: 30,
                    notes: ''
                  })
                }}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tip d'organisation */}
      {rdvFuturs.length > 0 && showTips && (
        <div className="tip-box tip-info">
          <div className="tip-icon">📋</div>
          <div className="tip-content">
            <strong>Organisation intelligente des rendez-vous</strong>
            <p>
              Les RDV sont organisés par <strong>période de temps</strong> pour vous aider à planifier :
              cette semaine (urgent), ce mois-ci, prochains mois, et <strong>long terme (6+ mois)</strong>
              pour les spécialistes avec de longs délais d'attente. Les RDV proches sont automatiquement
              mis en évidence avec des couleurs.
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card">
        <h3>🔍 Filtres</h3>
        <div className="filters-row">
          <div className="filter-group">
            <label>Membre</label>
            <select
              value={filterMembre || ''}
              onChange={(e) => setFilterMembre(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Tous les membres</option>
              {membres.map(membre => (
                <option key={membre.id} value={membre.id}>
                  {membre.prenom} {membre.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Statut</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="à_venir">📅 À venir</option>
              <option value="effectué">✅ Effectué</option>
              <option value="annulé">❌ Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rendez-vous à venir - organisés par période */}
      <div className="card">
        <h3>📅 Rendez-vous à venir ({rdvFuturs.length})</h3>
        {rdvFuturs.length === 0 ? (
          <div className="empty-state-box">
            <p className="empty-state-icon">📅</p>
            <p className="empty-state-text">Aucun rendez-vous prévu</p>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ Ajouter le premier rendez-vous
            </button>
          </div>
        ) : (
          <>
            {/* Organisation par période */}
            {[
              {
                titre: "📍 Cette semaine",
                filtre: (rdv: any) => getJoursAvantRdv(rdv.date_rdv) <= 7,
                empty: "Aucun RDV cette semaine"
              },
              {
                titre: "📆 Ce mois-ci (8-30 jours)",
                filtre: (rdv: any) => {
                  const jours = getJoursAvantRdv(rdv.date_rdv)
                  return jours > 7 && jours <= 30
                },
                empty: "Aucun RDV ce mois-ci"
              },
              {
                titre: "🗓️ Prochains mois (1-6 mois)",
                filtre: (rdv: any) => {
                  const jours = getJoursAvantRdv(rdv.date_rdv)
                  return jours > 30 && jours <= 180
                },
                empty: "Aucun RDV dans les prochains mois"
              },
              {
                titre: "⏰ Long terme (6+ mois)",
                filtre: (rdv: any) => getJoursAvantRdv(rdv.date_rdv) > 180,
                empty: "Aucun RDV long terme"
              }
            ].map((periode) => {
              const rdvsPeriode = rdvFuturs.filter(periode.filtre)
              if (rdvsPeriode.length === 0) return null

              return (
                <div key={periode.titre} className="rdv-periode">
                  <h4 className="periode-title">{periode.titre} ({rdvsPeriode.length})</h4>
                  <div className="rdv-list">
                    {rdvsPeriode.map((rdv: any) => (
              <div key={rdv.id} className={`rdv-item ${getStatutClass(rdv.statut || '')} ${getAlertClass(rdv.date_rdv, rdv.statut || '')}`}>
                <div className="rdv-header-main">
                  <div className="rdv-membre">
                    <span className="statut-badge">{getStatutEmoji(rdv.statut || '')}</span>
                    <strong>{getMemberName(rdv.membre_id, rdv)}</strong>
                  </div>
                  <div className="rdv-actions">
                    {rdv.statut === 'à_venir' && (
                      <>
                        <button
                          className="btn-status-small"
                          onClick={() => handleChangeStatut(rdv.id, 'effectué')}
                          title="Marquer comme effectué"
                        >
                          ✅
                        </button>
                        <button
                          className="btn-status-small"
                          onClick={() => handleChangeStatut(rdv.id, 'annulé')}
                          title="Annuler"
                        >
                          ❌
                        </button>
                      </>
                    )}
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteRdv(rdv.id, rdv.membre_id, rdv.date_rdv)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="rdv-date-main">
                  📅 <strong>{formatDate(rdv.date_rdv)}</strong>
                  {rdv.heure && <span className="rdv-heure"> à {rdv.heure}</span>}
                  {rdv.duree && <span className="rdv-duree"> ({rdv.duree} min)</span>}
                </div>

                <div className="rdv-details">
                  {rdv.specialite && <span className="rdv-specialite">👨‍⚕️ {rdv.specialite}</span>}
                  {rdv.medecin && <span>Dr. {rdv.medecin}</span>}
                  {decryptedData[rdv.id]?.motif && <span>📋 {decryptedData[rdv.id].motif}</span>}
                </div>

                {(decryptedData[rdv.id]?.lieu || rdv.telephone_cabinet) && (
                  <div className="rdv-contact">
                    {decryptedData[rdv.id]?.lieu && <span>📍 {decryptedData[rdv.id].lieu}</span>}
                    {rdv.telephone_cabinet && <span>📞 {rdv.telephone_cabinet}</span>}
                  </div>
                )}

                {decryptedData[rdv.id]?.notes && (
                  <p className="rdv-notes">📝 {decryptedData[rdv.id].notes}</p>
                )}
              </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Historique des rendez-vous passés */}
      {showPassed && (
        <div className="card">
          <h3>📜 Historique ({rdvPasses.length})</h3>
          {rdvPasses.length === 0 ? (
            <p className="widget-empty">Aucun rendez-vous passé</p>
          ) : (
            <div className="rdv-list rdv-list-compact">
              {rdvPasses.map((rdv) => (
                <div key={rdv.id} className={`rdv-item rdv-item-compact ${getStatutClass(rdv.statut || '')}`}>
                  <div className="rdv-header-main">
                    <div className="rdv-membre">
                      <span className="statut-badge">{getStatutEmoji(rdv.statut || '')}</span>
                      <strong>{getMemberName(rdv.membre_id, rdv)}</strong>
                    </div>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteRdv(rdv.id, rdv.membre_id, rdv.date_rdv)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="rdv-date-main">
                    📅 {formatDateCourt(rdv.date_rdv)}
                    {rdv.heure && ` • ${rdv.heure}`}
                  </div>

                  <div className="rdv-details">
                    {rdv.specialite && <span>{rdv.specialite}</span>}
                    {rdv.medecin && <span>Dr. {rdv.medecin}</span>}
                    {decryptedData[rdv.id]?.motif && <span>{decryptedData[rdv.id].motif}</span>}
                  </div>

                  {decryptedData[rdv.id]?.notes && (
                    <p className="rdv-notes">📝 {decryptedData[rdv.id].notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="⚠️ Supprimer le rendez-vous"
        message={confirmDelete.rdv ? `Supprimer le rendez-vous de ${confirmDelete.rdv.membreNom} du ${formatDate(confirmDelete.rdv.date)} ?` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={confirmDeleteRdv}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  )
}

export default RendezVous
