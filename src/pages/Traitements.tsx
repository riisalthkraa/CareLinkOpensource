/**
 * Traitements - Page de gestion complète des traitements médicamenteux
 *
 * Fonctionnalités implémentées:
 * - Gestion des traitements actifs et passés
 * - Suivi du stock de médicaments
 * - Alertes de renouvellement d'ordonnance
 * - Rappels de prise (quotidien, ponctuel, si besoin)
 * - Historique complet des prescriptions
 * - Effets secondaires et notes
 *
 * @module Traitements
 */

import { useState, useEffect } from 'react'
import { Traitement, Membre, Allergie, ResultatVerificationInteraction, InteractionAllergique } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import InteractionAlert from '../components/InteractionAlert'
import ConfirmModal from '../components/ConfirmModal'
import { verifierInteractions, verifierAllergies, verifierTousLesTraitements } from '../services/InteractionChecker'

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
 * Déchiffre un texte si chiffré
 */
const decryptText = async (text: string | null): Promise<string> => {
  if (!text) return ''
  if (text.startsWith('{') && text.includes('"encrypted"')) {
    try {
      const result = await window.electronAPI.decryptText(text)
      return result.success ? result.data || '' : text
    } catch (error) {
      return text
    }
  }
  return text
}

/**
 * Props du composant Traitements
 */
interface TraitementsProps {
  membreId: number | null
  onBack: () => void
  onSelectMembre?: (membreId: number) => void
}

/**
 * Traitements - Composant de gestion complète des médicaments
 */
function Traitements({ membreId, onBack, onSelectMembre }: TraitementsProps) {
  const [membre, setMembre] = useState<Membre | null>(null)
  const [membres, setMembres] = useState<Membre[]>([])
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(membreId)
  const [traitements, setTraitements] = useState<Traitement[]>([])
  const [decryptedData, setDecryptedData] = useState<Record<number, { notes: string; effets: string }>>({})
  const [allergies, setAllergies] = useState<Allergie[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showInteractionAlert, setShowInteractionAlert] = useState(false)
  const [interactionResult, setInteractionResult] = useState<ResultatVerificationInteraction | null>(null)
  const [interactionsAllergiques, setInteractionsAllergiques] = useState<InteractionAllergique[]>([])
  const [pendingTraitement, setPendingTraitement] = useState<any>(null)
  const { addNotification } = useNotification()

  const [newTraitement, setNewTraitement] = useState({
    nom_medicament: '',
    dosage: '',
    frequence: '',
    date_debut: '',
    date_fin: '',
    type: 'quotidien' as 'quotidien' | 'ponctuel' | 'si_besoin',
    stock_restant: '',
    medecin_prescripteur: '',
    renouvellement_ordonnance: '',
    effets_secondaires: '',
    notes: ''
  })

  const [confirmArchive, setConfirmArchive] = useState<{ isOpen: boolean; traitement?: { id: number; nom: string } }>({ isOpen: false })
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; traitement?: { id: number; nom: string } }>({ isOpen: false })

  // Charger tous les membres au montage
  useEffect(() => {
    loadAllMembres()
  }, [])

  // Charger les données du membre sélectionné
  useEffect(() => {
    if (selectedMembreId) {
      loadMembre()
      loadTraitements()
      loadAllergies()
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
   * Charge tous les traitements du membre
   */
  const loadTraitements = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM traitements WHERE membre_id = ? ORDER BY actif DESC, date_debut DESC',
        [selectedMembreId]
      )
      if (result.success) {
        setTraitements(result.data)

        // Déchiffrer notes et effets secondaires
        const decrypted: Record<number, { notes: string; effets: string }> = {}
        for (const traitement of result.data) {
          decrypted[traitement.id] = {
            notes: await decryptText(traitement.notes),
            effets: await decryptText(traitement.effets_secondaires)
          }
        }
        setDecryptedData(decrypted)
      }
    } catch (error) {
      console.error('Erreur chargement traitements:', error)
    }
  }

  /**
   * Charge les allergies du membre
   */
  const loadAllergies = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM allergies WHERE membre_id = ?',
        [selectedMembreId]
      )
      if (result.success) {
        // Déchiffrer les allergies si nécessaire
        const decryptedAllergies = await Promise.all(
          result.data.map(async (allergie: any) => ({
            ...allergie,
            nom_allergie: await decryptText(allergie.nom_allergie),
            description: await decryptText(allergie.description)
          }))
        )
        setAllergies(decryptedAllergies)
      }
    } catch (error) {
      console.error('Erreur chargement allergies:', error)
    }
  }

  /**
   * Ajoute un nouveau traitement
   */
  const handleAddTraitement = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTraitement.nom_medicament) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom du médicament est obligatoire'
      })
      return
    }

    // Vérifier les interactions avec les médicaments existants
    const traitementsActifs = traitements.filter(t => t.actif === 1)
    const resultatInteractions = verifierInteractions(newTraitement.nom_medicament, traitementsActifs)

    // Vérifier les allergies
    const interAllergiques = verifierAllergies(newTraitement.nom_medicament, allergies)

    // Si des interactions ou allergies sont détectées, afficher l'alerte
    if (resultatInteractions.hasInteractions || interAllergiques.length > 0) {
      setInteractionResult(resultatInteractions)
      setInteractionsAllergiques(interAllergiques)
      setPendingTraitement(newTraitement)
      setShowInteractionAlert(true)
      return
    }

    // Si pas d'interactions, ajouter directement
    await ajouterTraitementDB()
  }

  /**
   * Ajoute le traitement dans la base de données
   */
  const ajouterTraitementDB = async () => {
    const traitementData = pendingTraitement || newTraitement

    try {
      const result = await window.electronAPI.dbRun(
        `INSERT INTO traitements (
          membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
          actif, type, stock_restant, medecin_prescripteur,
          renouvellement_ordonnance, effets_secondaires, notes
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
        [
          membreId,
          traitementData.nom_medicament,
          traitementData.dosage || null,
          traitementData.frequence || null,
          traitementData.date_debut || null,
          traitementData.date_fin || null,
          traitementData.type,
          traitementData.stock_restant ? parseInt(traitementData.stock_restant) : null,
          traitementData.medecin_prescripteur || null,
          traitementData.renouvellement_ordonnance || null,
          traitementData.effets_secondaires || null,
          traitementData.notes || null
        ]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Traitement ajouté',
          message: `${traitementData.nom_medicament} a été ajouté`
        })
        resetForm()
        loadTraitements()
      }
    } catch (error) {
      console.error('Erreur ajout traitement:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le traitement'
      })
    }
  }

  /**
   * Réinitialise le formulaire
   */
  const resetForm = () => {
    setNewTraitement({
      nom_medicament: '',
      dosage: '',
      frequence: '',
      date_debut: '',
      date_fin: '',
      type: 'quotidien',
      stock_restant: '',
      medecin_prescripteur: '',
      renouvellement_ordonnance: '',
      effets_secondaires: '',
      notes: ''
    })
    setShowAddForm(false)
    setShowInteractionAlert(false)
    setInteractionResult(null)
    setInteractionsAllergiques([])
    setPendingTraitement(null)
  }

  /**
   * Confirme l'ajout malgré les interactions
   */
  const handleConfirmWithInteractions = async () => {
    await ajouterTraitementDB()
  }

  /**
   * Annule l'ajout en cas d'interactions
   */
  const handleCancelInteractions = () => {
    setShowInteractionAlert(false)
    setInteractionResult(null)
    setInteractionsAllergiques([])
    setPendingTraitement(null)
  }

  /**
   * Affiche le modal d'archivage
   */
  const handleArchiveTraitement = (id: number, nom: string) => {
    setConfirmArchive({ isOpen: true, traitement: { id, nom } })
  }

  /**
   * Confirme l'archivage d'un traitement
   */
  const confirmArchiveTraitement = async () => {
    if (!confirmArchive.traitement) return

    const { id, nom } = confirmArchive.traitement

    try {
      const result = await window.electronAPI.dbRun(
        'UPDATE traitements SET actif = 0 WHERE id = ?',
        [id]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Traitement archivé',
          message: `${nom} a été archivé`
        })
        loadTraitements()
      }
    } catch (error) {
      console.error('Erreur archivage:', error)
    } finally {
      setConfirmArchive({ isOpen: false })
    }
  }

  /**
   * Affiche le modal de suppression
   */
  const handleDeleteTraitement = (id: number, nom: string) => {
    setConfirmDelete({ isOpen: true, traitement: { id, nom } })
  }

  /**
   * Confirme la suppression définitive d'un traitement
   */
  const confirmDeleteTraitement = async () => {
    if (!confirmDelete.traitement) return

    const { id, nom } = confirmDelete.traitement

    try {
      const result = await window.electronAPI.dbRun(
        'DELETE FROM traitements WHERE id = ?',
        [id]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Traitement supprimé',
          message: `${nom} a été supprimé`
        })
        loadTraitements()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setConfirmDelete({ isOpen: false })
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

  /**
   * Calcule le nombre de jours avant renouvellement
   */
  const joursAvantRenouvellement = (dateRenouvellement: string) => {
    if (!dateRenouvellement) return null
    const today = new Date()
    const renouvellement = new Date(dateRenouvellement)
    const diff = Math.ceil((renouvellement.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diff
  }

  /**
   * Retourne l'emoji du type de traitement
   */
  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'quotidien': return '📅'
      case 'ponctuel': return '⏱️'
      case 'si_besoin': return '🔔'
      default: return '💊'
    }
  }

  /**
   * Retourne la classe CSS selon le niveau de stock
   */
  const getStockClass = (stock: number) => {
    if (stock <= 5) return 'stock-critique'
    if (stock <= 15) return 'stock-faible'
    return 'stock-ok'
  }

  // Filtrer traitements actifs vs archivés
  const traitementsActifs = traitements.filter(t => t.actif === 1)
  const traitementsArchives = traitements.filter(t => t.actif === 0)

  if (!membre) {
    return (
      <div className="traitements-page">
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
    <div className="traitements-page">
      {/* Alerte d'interactions */}
      {showInteractionAlert && interactionResult && (
        <InteractionAlert
          resultat={interactionResult}
          interactionsAllergiques={interactionsAllergiques}
          onConfirm={handleConfirmWithInteractions}
          onCancel={handleCancelInteractions}
        />
      )}

      {/* Header */}
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">💊 Traitements médicaux</h1>
            <p className="text-sm text-secondary m-0">{membre.prenom} {membre.nom} - {traitementsActifs.length} traitement(s) actif(s)</p>
          </div>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={() => setShowArchived(!showArchived)}
          >
            📦 {showArchived ? 'Masquer' : 'Voir'} historique ({traitementsArchives.length})
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            ➕ Nouveau traitement
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
      {traitementsActifs.length === 0 && (
        <div className="alert alert-info mb-lg">
          <span className="alert-icon" aria-hidden="true">💡</span>
          <div className="alert-content">
            <div className="alert-title">Gérez facilement les médicaments de {membre.prenom}</div>
            <div className="alert-message">
              Ajoutez les traitements en cours, suivez le <strong>stock restant</strong>, et recevez des <strong>alertes de renouvellement</strong>. Le système vérifie automatiquement les <strong>interactions médicamenteuses</strong> et les <strong>allergies</strong> avant d'ajouter un traitement.
            </div>
          </div>
        </div>
      )}

      {/* Alertes importantes */}
      {traitementsActifs.length > 0 && (
        <div className="card card-alerts">
          <h3>⚠️ Alertes</h3>
          <div className="alerts-list">
            {traitementsActifs.map(traitement => {
              const alerts = []

              // Alerte stock faible
              if (traitement.stock_restant && traitement.stock_restant <= 15) {
                alerts.push(
                  <div key={`stock-${traitement.id}`} className={`alert-item ${getStockClass(traitement.stock_restant)}`}>
                    <span className="alert-icon">📦</span>
                    <span>
                      <strong>{traitement.nom_medicament}</strong> -
                      Stock faible: {traitement.stock_restant} unité(s) restante(s)
                    </span>
                  </div>
                )
              }

              // Alerte renouvellement ordonnance
              if (traitement.renouvellement_ordonnance) {
                const jours = joursAvantRenouvellement(traitement.renouvellement_ordonnance)
                if (jours !== null && jours <= 30) {
                  alerts.push(
                    <div key={`renouv-${traitement.id}`} className="alert-item alert-warning">
                      <span className="alert-icon">📋</span>
                      <span>
                        <strong>{traitement.nom_medicament}</strong> -
                        Renouvellement d'ordonnance {jours <= 0 ? 'expiré' : `dans ${jours} jour(s)`}
                      </span>
                    </div>
                  )
                }
              }

              return alerts
            })}
          </div>
          {traitementsActifs.every(t =>
            (!t.stock_restant || t.stock_restant > 15) &&
            (!t.renouvellement_ordonnance || joursAvantRenouvellement(t.renouvellement_ordonnance)! > 30)
          ) && (
            <p className="widget-empty">✅ Aucune alerte</p>
          )}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="card">
          <h3>➕ Nouveau traitement</h3>

          {/* Tip d'aide */}
          <div className="tip-box tip-success">
            <div className="tip-icon">✅</div>
            <div className="tip-content">
              <strong>Aide au remplissage</strong>
              <ul className="tip-list">
                <li>Le <strong>nom du médicament</strong> est obligatoire (ex: Doliprane, Amoxicilline)</li>
                <li><strong>Dosage</strong> : indiquez la dose par prise (ex: 500mg, 1g)</li>
                <li><strong>Fréquence</strong> : combien de fois par jour (ex: 2x/jour, matin et soir)</li>
                <li><strong>Stock</strong> : nombre de comprimés/boîtes restants pour les alertes</li>
                <li>Le système vérifie automatiquement les <strong>interactions</strong> et <strong>allergies</strong> !</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleAddTraitement} className="edit-form">
            <div className="form-section">
              <h4>💊 Informations du médicament</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du médicament *</label>
                  <input
                    type="text"
                    value={newTraitement.nom_medicament}
                    onChange={(e) => setNewTraitement({ ...newTraitement, nom_medicament: e.target.value })}
                    placeholder="Ex: Doliprane, Amoxicilline..."
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input
                    type="text"
                    value={newTraitement.dosage}
                    onChange={(e) => setNewTraitement({ ...newTraitement, dosage: e.target.value })}
                    placeholder="Ex: 500mg, 1g..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fréquence</label>
                  <input
                    type="text"
                    value={newTraitement.frequence}
                    onChange={(e) => setNewTraitement({ ...newTraitement, frequence: e.target.value })}
                    placeholder="Ex: 2x par jour, Matin et soir..."
                  />
                </div>
                <div className="form-group">
                  <label>Type de traitement</label>
                  <select
                    value={newTraitement.type}
                    onChange={(e) => setNewTraitement({ ...newTraitement, type: e.target.value as any })}
                  >
                    <option value="quotidien">📅 Quotidien</option>
                    <option value="ponctuel">⏱️ Ponctuel</option>
                    <option value="si_besoin">🔔 Si besoin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📅 Dates</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début</label>
                  <input
                    type="date"
                    value={newTraitement.date_debut}
                    onChange={(e) => setNewTraitement({ ...newTraitement, date_debut: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin prévue</label>
                  <input
                    type="date"
                    value={newTraitement.date_fin}
                    onChange={(e) => setNewTraitement({ ...newTraitement, date_fin: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Renouvellement d'ordonnance</label>
                <input
                  type="date"
                  value={newTraitement.renouvellement_ordonnance}
                  onChange={(e) => setNewTraitement({ ...newTraitement, renouvellement_ordonnance: e.target.value })}
                  placeholder="Date limite pour renouveler l'ordonnance"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>👨‍⚕️ Prescription</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Médecin prescripteur</label>
                  <input
                    type="text"
                    value={newTraitement.medecin_prescripteur}
                    onChange={(e) => setNewTraitement({ ...newTraitement, medecin_prescripteur: e.target.value })}
                    placeholder="Dr. Martin Dupont"
                  />
                </div>
                <div className="form-group">
                  <label>Stock restant (unités)</label>
                  <input
                    type="number"
                    value={newTraitement.stock_restant}
                    onChange={(e) => setNewTraitement({ ...newTraitement, stock_restant: e.target.value })}
                    placeholder="Nombre de comprimés/doses"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📝 Informations complémentaires</h4>
              <div className="form-group">
                <label>Effets secondaires observés</label>
                <textarea
                  value={newTraitement.effets_secondaires}
                  onChange={(e) => setNewTraitement({ ...newTraitement, effets_secondaires: e.target.value })}
                  placeholder="Nausées, maux de tête, etc..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newTraitement.notes}
                  onChange={(e) => setNewTraitement({ ...newTraitement, notes: e.target.value })}
                  placeholder="À prendre pendant les repas, etc..."
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">✅ Ajouter</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTraitement({
                    nom_medicament: '',
                    dosage: '',
                    frequence: '',
                    date_debut: '',
                    date_fin: '',
                    type: 'quotidien',
                    stock_restant: '',
                    medecin_prescripteur: '',
                    renouvellement_ordonnance: '',
                    effets_secondaires: '',
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

      {/* Traitements actifs */}
      <div className="card">
        <h3>💊 Traitements actifs ({traitementsActifs.length})</h3>
        {traitementsActifs.length === 0 ? (
          <p className="widget-empty">Aucun traitement actif</p>
        ) : (
          <div className="traitements-list">
            {traitementsActifs.map((traitement) => (
              <div key={traitement.id} className="traitement-item">
                <div className="traitement-header">
                  <div className="traitement-nom">
                    <span className="type-badge">{getTypeEmoji(traitement.type || 'quotidien')}</span>
                    <div>
                      <strong>{traitement.nom_medicament}</strong>
                      {traitement.dosage && <span className="dosage"> - {traitement.dosage}</span>}
                    </div>
                  </div>
                  <div className="traitement-actions">
                    <button
                      className="btn-archive"
                      onClick={() => handleArchiveTraitement(traitement.id, traitement.nom_medicament)}
                      title="Archiver"
                    >
                      📦
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteTraitement(traitement.id, traitement.nom_medicament)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="traitement-details">
                  {traitement.frequence && (
                    <span>🕐 {traitement.frequence}</span>
                  )}
                  {traitement.date_debut && (
                    <span>📅 Début: {formatDate(traitement.date_debut)}</span>
                  )}
                  {traitement.date_fin && (
                    <span>🏁 Fin: {formatDate(traitement.date_fin)}</span>
                  )}
                  {traitement.stock_restant !== undefined && traitement.stock_restant !== null && (
                    <span className={getStockClass(traitement.stock_restant)}>
                      📦 Stock: {traitement.stock_restant} unités
                    </span>
                  )}
                </div>

                {traitement.medecin_prescripteur && (
                  <p className="traitement-medecin">👨‍⚕️ Prescrit par {traitement.medecin_prescripteur}</p>
                )}

                {decryptedData[traitement.id]?.effets && (
                  <p className="traitement-effets">⚠️ Effets secondaires: {decryptedData[traitement.id].effets}</p>
                )}

                {decryptedData[traitement.id]?.notes && (
                  <p className="traitement-notes">📝 {decryptedData[traitement.id].notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique (traitements archivés) */}
      {showArchived && traitementsArchives.length > 0 && (
        <div className="card">
          <h3>📦 Historique des traitements ({traitementsArchives.length})</h3>
          <div className="traitements-list archived">
            {traitementsArchives.map((traitement) => (
              <div key={traitement.id} className="traitement-item archived">
                <div className="traitement-header">
                  <div className="traitement-nom">
                    <strong>{traitement.nom_medicament}</strong>
                    {traitement.dosage && <span className="dosage"> - {traitement.dosage}</span>}
                  </div>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDeleteTraitement(traitement.id, traitement.nom_medicament)}
                    title="Supprimer définitivement"
                  >
                    🗑️
                  </button>
                </div>
                <div className="traitement-details">
                  {traitement.date_debut && (
                    <span>📅 {formatDate(traitement.date_debut)}</span>
                  )}
                  {traitement.date_fin && (
                    <span>→ {formatDate(traitement.date_fin)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmArchive.isOpen}
        title="📦 Archiver le traitement"
        message={confirmArchive.traitement ? `Archiver le traitement "${confirmArchive.traitement.nom}" ?\n\nIl sera déplacé dans l'historique.` : ''}
        confirmText="Archiver"
        cancelText="Annuler"
        confirmVariant="warning"
        onConfirm={confirmArchiveTraitement}
        onCancel={() => setConfirmArchive({ isOpen: false })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="⚠️ Supprimer le traitement"
        message={confirmDelete.traitement ? `Supprimer définitivement le traitement "${confirmDelete.traitement.nom}" ?\n\nCette action est irréversible.` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={confirmDeleteTraitement}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  )
}

export default Traitements
