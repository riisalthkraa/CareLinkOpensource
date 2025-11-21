/**
 * Vaccins - Page de gestion complète des vaccins d'un membre
 *
 * Fonctionnalités implémentées:
 * - Affichage des vaccins effectués
 * - Calendrier vaccinal français recommandé (28 vaccins)
 * - Ajout de vaccins personnalisés
 * - Système d'alertes pour les rappels
 * - Statuts colorés (à faire, fait, rappel, expiré)
 * - Filtres obligatoires/recommandés
 *
 * @module Vaccins
 */

import { useState, useEffect } from 'react'
import { Vaccin, VaccinRecommande, Membre } from '../types'
import { calendrierVaccinal, getVaccinsObligatoires } from '../data/vaccins-calendrier'
import { useNotification } from '../contexts/NotificationContext'
import ConfirmModal from '../components/ConfirmModal'

/**
 * Calcule l'âge d'une personne à partir de sa date de naissance
 */
const calculateAge = (dateNaissance: string): number => {
  const today = new Date()
  const birthDate = new Date(dateNaissance)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Déchiffre les notes si elles sont chiffrées
 */
const decryptNotes = async (notes: string | null): Promise<string> => {
  if (!notes) return ''

  // Vérifier si c'est un JSON chiffré
  if (notes.startsWith('{') && notes.includes('"encrypted"')) {
    try {
      const result = await window.electronAPI.decryptText(notes)
      return result.success ? result.data || '' : notes
    } catch (error) {
      console.error('Erreur déchiffrement:', error)
      return notes
    }
  }

  return notes
}

/**
 * Props du composant Vaccins
 */
interface VaccinsProps {
  membreId: number | null
  onBack: () => void
  onSelectMembre?: (membreId: number) => void
}

/**
 * Vaccins - Composant de gestion complète des vaccins
 */
function Vaccins({ membreId, onBack, onSelectMembre }: VaccinsProps) {
  const [membre, setMembre] = useState<Membre | null>(null)
  const [membres, setMembres] = useState<Membre[]>([])
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(membreId)
  const [vaccins, setVaccins] = useState<Vaccin[]>([])
  const [decryptedNotes, setDecryptedNotes] = useState<Record<number, string>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [filterObligatoires, setFilterObligatoires] = useState(false)
  const { addNotification } = useNotification()

  const [newVaccin, setNewVaccin] = useState({
    nom_vaccin: '',
    date_administration: '',
    date_rappel: '',
    statut: 'fait' as 'à_faire' | 'fait' | 'rappel' | 'expiré',
    lot: '',
    medecin: '',
    notes: ''
  })

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; vaccin?: { id: number; nom: string } }>({ isOpen: false })

  // Charger tous les membres au montage
  useEffect(() => {
    loadAllMembres()
  }, [])

  // Charger les données du membre sélectionné
  useEffect(() => {
    if (selectedMembreId) {
      loadMembre()
      loadVaccins()
    }
  }, [selectedMembreId])

  // Synchroniser avec la prop membreId
  useEffect(() => {
    if (membreId && membreId !== selectedMembreId) {
      setSelectedMembreId(membreId)
    }
  }, [membreId])

  /**
   * Charge la liste de tous les membres
   */
  const loadAllMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT id, nom, prenom, date_naissance FROM membres ORDER BY prenom ASC',
        []
      )
      if (result.success) {
        setMembres(result.data)
        // Si aucun membre n'est sélectionné, sélectionner le premier
        if (!selectedMembreId && result.data.length > 0) {
          setSelectedMembreId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Gère le changement de membre sélectionné
   */
  const handleMembreChange = (newMembreId: number) => {
    setSelectedMembreId(newMembreId)
    setShowAddForm(false) // Fermer le formulaire si ouvert
    if (onSelectMembre) {
      onSelectMembre(newMembreId)
    }
  }

  /**
   * Charge les informations du membre
   */
  const loadMembre = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM membres WHERE id = ?',
        [selectedMembreId]
      )
      if (result.success && result.data.length > 0) {
        setMembre(result.data[0])
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error)
    }
  }

  /**
   * Charge tous les vaccins du membre
   */
  const loadVaccins = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM vaccins WHERE membre_id = ? ORDER BY date_administration DESC',
        [selectedMembreId]
      )
      if (result.success) {
        setVaccins(result.data)

        // Déchiffrer les notes
        const decrypted: Record<number, string> = {}
        for (const vaccin of result.data) {
          if (vaccin.notes) {
            decrypted[vaccin.id] = await decryptNotes(vaccin.notes)
          }
        }
        setDecryptedNotes(decrypted)
      }
    } catch (error) {
      console.error('Erreur chargement vaccins:', error)
    }
  }

  /**
   * Ajoute un nouveau vaccin
   */
  const handleAddVaccin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newVaccin.nom_vaccin) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom du vaccin est obligatoire'
      })
      return
    }

    try {
      const result = await window.electronAPI.dbRun(
        `INSERT INTO vaccins (
          membre_id, nom_vaccin, date_administration, date_rappel,
          statut, lot, medecin, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          selectedMembreId,
          newVaccin.nom_vaccin,
          newVaccin.date_administration || null,
          newVaccin.date_rappel || null,
          newVaccin.statut,
          newVaccin.lot || null,
          newVaccin.medecin || null,
          newVaccin.notes || null
        ]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Vaccin ajouté',
          message: `${newVaccin.nom_vaccin} a été ajouté au carnet`
        })
        setNewVaccin({
          nom_vaccin: '',
          date_administration: '',
          date_rappel: '',
          statut: 'fait',
          lot: '',
          medecin: '',
          notes: ''
        })
        setShowAddForm(false)
        loadVaccins()
      }
    } catch (error) {
      console.error('Erreur ajout vaccin:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le vaccin'
      })
    }
  }

  /**
   * Affiche le modal de suppression
   */
  const handleDeleteVaccin = (id: number, nom: string) => {
    setConfirmDelete({ isOpen: true, vaccin: { id, nom } })
  }

  /**
   * Confirme la suppression d'un vaccin
   */
  const confirmDeleteVaccin = async () => {
    if (!confirmDelete.vaccin) return

    const { id, nom } = confirmDelete.vaccin

    try {
      const result = await window.electronAPI.dbRun(
        'DELETE FROM vaccins WHERE id = ?',
        [id]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Vaccin supprimé',
          message: `${nom} a été retiré du carnet`
        })
        loadVaccins()
      }
    } catch (error) {
      console.error('Erreur suppression vaccin:', error)
    } finally {
      setConfirmDelete({ isOpen: false })
    }
  }

  /**
   * Ajoute un vaccin depuis le calendrier recommandé
   */
  const handleAddFromCalendar = (vaccinReco: VaccinRecommande) => {
    setNewVaccin({
      ...newVaccin,
      nom_vaccin: vaccinReco.nom,
      statut: 'à_faire'
    })
    setShowAddForm(true)
    setShowCalendar(false)
  }

  /**
   * Retourne la classe CSS selon le statut du vaccin
   */
  const getStatutClass = (statut: string) => {
    switch (statut) {
      case 'fait': return 'statut-fait'
      case 'à_faire': return 'statut-a-faire'
      case 'rappel': return 'statut-rappel'
      case 'expiré': return 'statut-expire'
      default: return ''
    }
  }

  /**
   * Retourne l'emoji selon le statut
   */
  const getStatutEmoji = (statut: string) => {
    switch (statut) {
      case 'fait': return '✅'
      case 'à_faire': return '⏳'
      case 'rappel': return '🔔'
      case 'expiré': return '⚠️'
      default: return '📌'
    }
  }

  /**
   * Formate une date en français
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseignée'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Filtrer le calendrier si nécessaire
  const calendrierFiltre = filterObligatoires
    ? getVaccinsObligatoires()
    : calendrierVaccinal

  if (!membre) {
    return (
      <div className="vaccins-page">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }}></div>
            <p className="text-lg text-secondary">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="vaccins-page">
      {/* Header */}
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">💉 Carnet de vaccination</h1>
            <p className="text-sm text-secondary m-0">{membre.prenom} {membre.nom} - {vaccins.length} vaccin(s) enregistré(s)</p>
          </div>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            📅 {showCalendar ? 'Masquer' : 'Voir'} calendrier
          </button>
        </div>
      </div>

      {/* Sélecteur de membre */}
      {membres.length > 0 && (
        <div className="form-group mb-lg">
          <label htmlFor="membre-select" className="form-label">
            👤 Membre sélectionné:
          </label>
          <select
            id="membre-select"
            className="form-select form-select-lg"
            value={selectedMembreId || ''}
            onChange={(e) => handleMembreChange(Number(e.target.value))}
          >
            {membres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.nom} - {calculateAge(m.date_naissance)} ans
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tip principal */}
      {vaccins.length === 0 && (
        <div className="alert alert-info mb-lg">
          <span className="alert-icon" aria-hidden="true">💡</span>
          <div className="alert-content">
            <div className="alert-title">Bienvenue sur le carnet de vaccination !</div>
            <div className="alert-message">
              Suivez facilement les vaccins de {membre.prenom}. Vous pouvez ajouter des vaccins manuellement ou utiliser le <strong>calendrier vaccinal français</strong> pour voir les vaccins recommandés par âge. Les données sont <strong>chiffrées</strong> et <strong>sauvegardées automatiquement</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="card mb-lg">
          <h3 className="mb-md">➕ Ajouter un vaccin</h3>

          {/* Aide au remplissage */}
          <div className="alert alert-success mb-lg">
            <span className="alert-icon" aria-hidden="true">✅</span>
            <div className="alert-content">
              <div className="alert-title">Aide au remplissage</div>
              <div className="alert-message">
                <ul style={{ margin: '0.5rem 0 0 1.5rem', lineHeight: '1.8' }}>
                  <li>Le <strong>nom du vaccin</strong> est obligatoire (ex: DTP, COVID-19, Grippe)</li>
                  <li>Utilisez le <strong>calendrier</strong> ci-dessous pour ajouter rapidement un vaccin recommandé</li>
                  <li>Le <strong>n° de lot</strong> se trouve sur votre carnet de vaccination papier</li>
                  <li>Les <strong>notes</strong> peuvent inclure effets secondaires ou remarques</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddVaccin}>
            <div className="grid grid-cols-2 gap-md mb-md">
              <div className="form-group">
                <label className="form-label">Nom du vaccin *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVaccin.nom_vaccin}
                  onChange={(e) => setNewVaccin({ ...newVaccin, nom_vaccin: e.target.value })}
                  placeholder="Ex: DTP, ROR, COVID-19..."
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select
                  className="form-select"
                  value={newVaccin.statut}
                  onChange={(e) => setNewVaccin({ ...newVaccin, statut: e.target.value as any })}
                >
                  <option value="fait">✅ Fait</option>
                  <option value="à_faire">⏳ À faire</option>
                  <option value="rappel">🔔 Rappel</option>
                  <option value="expiré">⚠️ Expiré</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md mb-md">
              <div className="form-group">
                <label className="form-label">Date d'administration</label>
                <input
                  type="date"
                  className="form-input"
                  value={newVaccin.date_administration}
                  onChange={(e) => setNewVaccin({ ...newVaccin, date_administration: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date de rappel</label>
                <input
                  type="date"
                  className="form-input"
                  value={newVaccin.date_rappel}
                  onChange={(e) => setNewVaccin({ ...newVaccin, date_rappel: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md mb-md">
              <div className="form-group">
                <label className="form-label">N° de lot</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVaccin.lot}
                  onChange={(e) => setNewVaccin({ ...newVaccin, lot: e.target.value })}
                  placeholder="Ex: AB12345"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Médecin/Centre</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVaccin.medecin}
                  onChange={(e) => setNewVaccin({ ...newVaccin, medecin: e.target.value })}
                  placeholder="Dr. Martin Dupont"
                />
              </div>
            </div>

            <div className="form-group mb-lg">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={newVaccin.notes}
                onChange={(e) => setNewVaccin({ ...newVaccin, notes: e.target.value })}
                placeholder="Effets secondaires, remarques..."
                rows={3}
              />
            </div>

            <div className="flex gap-md">
              <button type="submit" className="btn btn-success">✅ Ajouter</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setNewVaccin({
                    nom_vaccin: '',
                    date_administration: '',
                    date_rappel: '',
                    statut: 'fait',
                    lot: '',
                    medecin: '',
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

      {/* Liste des vaccins effectués */}
      <div className="card mb-lg">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="m-0">📋 Vaccins enregistrés ({vaccins.length})</h3>
          {!showAddForm && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ Ajouter un vaccin
            </button>
          )}
        </div>

        {vaccins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-light)' }}>
            <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>💉</p>
            <p className="text-lg text-secondary mb-md">Aucun vaccin enregistré</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ Ajouter le premier vaccin
            </button>
          </div>
        ) : (
          <div className="vaccins-list">
            {vaccins.map((vaccin) => (
              <div key={vaccin.id} className={`vaccin-item ${getStatutClass(vaccin.statut)}`}>
                <div className="vaccin-header">
                  <div className="vaccin-nom">
                    <span className="statut-badge">{getStatutEmoji(vaccin.statut)}</span>
                    <strong>{vaccin.nom_vaccin}</strong>
                  </div>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDeleteVaccin(vaccin.id, vaccin.nom_vaccin)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
                <div className="vaccin-details">
                  {vaccin.date_administration && (
                    <span>📅 {formatDate(vaccin.date_administration)}</span>
                  )}
                  {vaccin.date_rappel && (
                    <span>🔔 Rappel: {formatDate(vaccin.date_rappel)}</span>
                  )}
                  {vaccin.lot && <span>🏷️ Lot {vaccin.lot}</span>}
                  {vaccin.medecin && <span>👨‍⚕️ {vaccin.medecin}</span>}
                </div>
                {decryptedNotes[vaccin.id] && (
                  <p className="vaccin-notes">📝 {decryptedNotes[vaccin.id]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendrier vaccinal français */}
      {showCalendar && (
        <div className="card mb-lg">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="m-0">📅 Guide des vaccins recommandés</h3>
            <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterObligatoires}
                onChange={(e) => setFilterObligatoires(e.target.checked)}
              />
              <span className="text-sm">Obligatoires uniquement</span>
            </label>
          </div>

          {/* Tip info */}
          <div className="alert alert-info mb-lg">
            <span className="alert-icon" aria-hidden="true">💡</span>
            <div className="alert-content">
              <div className="alert-title">Comment utiliser ce calendrier ?</div>
              <div className="alert-message">
                Cliquez sur <strong>➕ Ajouter</strong> à côté d'un vaccin pour l'ajouter rapidement au carnet. Les vaccins marqués "OBLIGATOIRE" sont requis par la loi française.
              </div>
            </div>
          </div>

          {/* Grouper par catégories d'âge */}
          {[
            {
              titre: "👶 Bébés (0-2 ans)",
              icon: "👶",
              filtre: (v: any) => v.age_recommande.includes('mois') || v.age_recommande.includes('1 an') || v.age_recommande.includes('2 ans')
            },
            {
              titre: "🧒 Enfants (3-11 ans)",
              icon: "🧒",
              filtre: (v: any) => (v.age_recommande.includes('ans') && !v.age_recommande.includes('65') && !v.age_recommande.includes('adulte'))
            },
            {
              titre: "👦 Adolescents (12-17 ans)",
              icon: "👦",
              filtre: (v: any) => v.age_recommande.includes('11-14') || v.age_recommande.includes('11-13')
            },
            {
              titre: "👨 Adultes (18-64 ans)",
              icon: "👨",
              filtre: (v: any) => v.age_recommande.includes('adulte') || v.age_recommande.includes('25')
            },
            {
              titre: "👴 Seniors (65+ ans)",
              icon: "👴",
              filtre: (v: any) => v.age_recommande.includes('65')
            }
          ].map((categorie) => {
            const vaccinsCategorie = calendrierFiltre.filter(categorie.filtre)
            if (vaccinsCategorie.length === 0) return null

            return (
              <div key={categorie.titre} className="calendar-category">
                <h4 className="category-title">{categorie.titre}</h4>
                <div className="calendar-list">
                  {vaccinsCategorie.map((vaccinReco, index) => (
                    <div key={index} className="calendar-item">
                      <div className="calendar-item-header">
                        <div className="calendar-item-nom">
                          <strong>{vaccinReco.nom}</strong>
                          {vaccinReco.obligatoire && (
                            <span className="badge badge-danger">OBLIGATOIRE</span>
                          )}
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddFromCalendar(vaccinReco)}
                          title="Ajouter au carnet"
                        >
                          ➕ Ajouter
                        </button>
                      </div>
                      <p className="calendar-description">{vaccinReco.description}</p>
                      <div className="calendar-details">
                        <span>📌 Âge: {vaccinReco.age_recommande}</span>
                        {vaccinReco.rappel && (
                          <span>🔔 Rappel: {vaccinReco.rappel}</span>
                        )}
                      </div>
                      {vaccinReco.details && (
                        <p className="calendar-info">ℹ️ {vaccinReco.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Note officielle */}
          <div className="calendar-footer">
            <p className="calendar-source">
              📋 Source : Calendrier vaccinal français 2024 - Ministère de la Santé et HAS
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="⚠️ Supprimer le vaccin"
        message={confirmDelete.vaccin ? `Supprimer le vaccin ${confirmDelete.vaccin.nom} ?` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={confirmDeleteVaccin}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  )
}

export default Vaccins
