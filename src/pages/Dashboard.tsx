/**
 * Dashboard - Page d'accueil et gestion des membres de la famille
 *
 * Page principale de l'application affichant:
 * - Bannière de bienvenue avec date du jour
 * - Cartes statistiques (membres, rendez-vous, vaccins, alertes)
 * - Widget des actions requises / alertes importantes
 * - Liste des membres de la famille avec carte détaillée
 * - Formulaire enrichi d'ajout de membre (17 champs)
 * - Fonctions de gestion: ajout, suppression, navigation vers profils
 *
 * FONCTIONNALITÉS:
 * - Affichage de tous les membres de la famille
 * - Ajout de nouveau membre avec formulaire complet
 * - Suppression de membre avec confirmation
 * - Calcul automatique de l'âge
 * - Navigation vers les pages Profil/Vaccins/Traitements par membre
 * - Notifications toast pour toutes les actions
 *
 * @module Dashboard
 */

import { useState, useEffect, useRef } from 'react'
import StatCard from '../components/StatCard'
import ConfirmModal from '../components/ConfirmModal'
import Alert from '../components/Alert'
import { SkeletonCard } from '../components/SkeletonLoader'
import { useNotification } from '../contexts/NotificationContext'

/**
 * Props du composant Dashboard
 *
 * @interface DashboardProps
 * @property {function} onNavigate - Callback pour naviguer vers une autre page
 * @property {function} onSelectMembre - Callback pour sélectionner un membre et naviguer vers son profil
 */
interface DashboardProps {
  onNavigate: (page: string) => void
  onSelectMembre: (id: number) => void
}

/**
 * Interface représentant un membre de la famille
 *
 * @interface Membre
 * @property {number} id - Identifiant unique du membre
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} date_naissance - Date de naissance (format ISO)
 */
interface Membre {
  id: number
  nom: string
  prenom: string
  date_naissance: string
}

interface RendezVous {
  id: number
  membre_id: number
  date_rdv: string
  heure: string
  medecin: string
  specialite: string
  motif: string
  membre_prenom: string
  membre_nom: string
}

interface Traitement {
  id: number
  membre_id: number
  nom_medicament: string
  dosage: string
  frequence: string
  membre_prenom: string
  membre_nom: string
}

interface Vaccin {
  id: number
  membre_id: number
  nom_vaccin: string
  date_administration: string
  membre_prenom: string
  membre_nom: string
}

/**
 * Dashboard - Composant page d'accueil
 *
 * Page centrale de l'application permettant de:
 * - Visualiser tous les membres de la famille
 * - Ajouter de nouveaux membres avec formulaire enrichi (17 champs)
 * - Supprimer des membres (avec suppression en cascade)
 * - Voir les statistiques et alertes
 * - Naviguer vers les détails de chaque membre
 *
 * @component
 * @param {DashboardProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le tableau de bord principal
 */
function Dashboard({ onNavigate, onSelectMembre }: DashboardProps) {
  // ========== ÉTATS LOCAUX ==========
  const [membres, setMembres] = useState<Membre[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; membre?: { id: number; nom: string; prenom: string } }>({ isOpen: false })
  const { addNotification } = useNotification()
  const nomInputRef = useRef<HTMLInputElement>(null)

  // États pour les widgets du dashboard
  const [prochainRdvs, setProchainRdvs] = useState<RendezVous[]>([])
  const [traitementsActifs, setTraitementsActifs] = useState<Traitement[]>([])
  const [vaccinsRecents, setVaccinsRecents] = useState<Vaccin[]>([])
  const [totalVaccins, setTotalVaccins] = useState(0)
  const [totalRdvAVenir, setTotalRdvAVenir] = useState(0)
  const [totalTraitementsActifs, setTotalTraitementsActifs] = useState(0)

  // État pour les alertes dynamiques
  interface Alert {
    id: number
    type: 'warning' | 'info' | 'success'
    icon: string
    title: string
    description: string
  }
  const [alerts, setAlerts] = useState<Alert[]>([])

  /**
   * État du formulaire de nouveau membre
   * Contient 17 champs: informations de base, médicales, contacts, urgence
   */
  const [newMembre, setNewMembre] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    groupe_sanguin: '',
    rhesus: '',
    poids: '',
    taille: '',
    telephone: '',
    email: '',
    numero_securite_sociale: '',
    medecin_traitant: '',
    telephone_medecin: '',
    contact_urgence_nom: '',
    contact_urgence_telephone: '',
    contact_urgence_relation: '',
    notes: ''
  })

  // Charger les membres et statistiques au montage du composant
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true)
      await Promise.all([
        loadMembres(),
        loadDashboardStats(),
        loadAlerts()
      ])
      setIsLoading(false)
    }
    initDashboard()
  }, [])

  // Focus automatique sur le champ Nom quand le formulaire s'ouvre
  useEffect(() => {
    if (showAddForm && nomInputRef.current) {
      nomInputRef.current.focus()
    }
  }, [showAddForm])

  /**
   * Charge tous les membres de la famille depuis la base de données
   *
   * Récupère tous les membres triés par ID décroissant (plus récents d'abord)
   *
   * @async
   * @function loadMembres
   */
  const loadMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM membres ORDER BY id DESC')
      if (result.success) {
        setMembres(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    }
  }

  /**
   * Charge les statistiques du dashboard (rendez-vous, traitements, vaccins)
   *
   * @async
   * @function loadDashboardStats
   */
  const loadDashboardStats = async () => {
    console.log('🔍 [DEBUG] loadDashboardStats() appelée')
    try {
      // Charger les prochains rendez-vous (5 prochains, statut à_venir)
      console.log('🔍 [DEBUG] Exécution requête RDV...')
      const rdvResult = await window.electronAPI.dbQuery(`
        SELECT r.*, m.prenom as membre_prenom, m.nom as membre_nom
        FROM rendez_vous r
        JOIN membres m ON r.membre_id = m.id
        WHERE r.statut = 'à_venir' AND r.date_rdv >= date('now')
        ORDER BY r.date_rdv ASC, r.heure ASC
        LIMIT 5
      `)
      console.log('📅 RDV Result:', rdvResult)
      console.log('📅 RDV Data length:', rdvResult.data?.length)
      if (rdvResult.success) {
        setProchainRdvs(rdvResult.data)
      }

      // Charger les traitements actifs (5 premiers)
      const traitResult = await window.electronAPI.dbQuery(`
        SELECT t.*, m.prenom as membre_prenom, m.nom as membre_nom
        FROM traitements t
        JOIN membres m ON t.membre_id = m.id
        WHERE t.actif = 1
        ORDER BY t.id DESC
        LIMIT 5
      `)
      console.log('💊 Traitements Result:', traitResult)
      if (traitResult.success) {
        setTraitementsActifs(traitResult.data)
      }

      // Charger les vaccins récents (5 plus récents)
      const vaccinResult = await window.electronAPI.dbQuery(`
        SELECT v.*, m.prenom as membre_prenom, m.nom as membre_nom
        FROM vaccins v
        JOIN membres m ON v.membre_id = m.id
        ORDER BY v.date_administration DESC
        LIMIT 5
      `)
      console.log('💉 Vaccins Result:', vaccinResult)
      if (vaccinResult.success) {
        setVaccinsRecents(vaccinResult.data)
      }

      // Charger le total de vaccins pour le KPI
      const totalVaccinResult = await window.electronAPI.dbQuery(`
        SELECT COUNT(*) as total FROM vaccins
      `)
      if (totalVaccinResult.success && totalVaccinResult.data.length > 0) {
        setTotalVaccins(totalVaccinResult.data[0].total)
      }

      // Charger le total de RDV à venir pour le KPI
      const totalRdvResult = await window.electronAPI.dbQuery(`
        SELECT COUNT(*) as total FROM rendez_vous
        WHERE statut = 'à_venir' AND date_rdv >= date('now')
      `)
      if (totalRdvResult.success && totalRdvResult.data.length > 0) {
        setTotalRdvAVenir(totalRdvResult.data[0].total)
      }

      // Charger le total de traitements actifs pour le KPI
      const totalTraitResult = await window.electronAPI.dbQuery(`
        SELECT COUNT(*) as total FROM traitements WHERE actif = 1
      `)
      if (totalTraitResult.success && totalTraitResult.data.length > 0) {
        setTotalTraitementsActifs(totalTraitResult.data[0].total)
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    }
  }

  /**
   * Charge les alertes dynamiques depuis la base de données
   *
   * Génère des alertes pour:
   * - Vaccins expirant dans les 30 jours
   * - Stock faible de médicaments (< 10)
   * - RDV à venir dans les 3 jours
   * - Renouvellements d'ordonnance urgents (< 7 jours)
   *
   * @async
   * @function loadAlerts
   */
  const loadAlerts = async () => {
    console.log('🔍 [DEBUG] loadAlerts() appelée')
    const alertsList: Alert[] = []
    let idCounter = 1

    try {
      // 1. Vaccins expirant bientôt (30 jours)
      console.log('🔍 [DEBUG] Recherche alertes vaccins...')
      const vaccinsResult = await window.electronAPI.dbQuery(`
        SELECT v.*, m.prenom, m.nom
        FROM vaccins v
        JOIN membres m ON v.membre_id = m.id
        WHERE v.date_rappel IS NOT NULL
          AND v.date_rappel >= date('now')
          AND v.date_rappel <= date('now', '+30 days')
          AND v.statut = 'fait'
        ORDER BY v.date_rappel ASC
        LIMIT 3
      `)

      if (vaccinsResult.success && vaccinsResult.data.length > 0) {
        vaccinsResult.data.forEach((vaccin: any) => {
          const daysUntil = getDaysUntil(vaccin.date_rappel)
          alertsList.push({
            id: idCounter++,
            type: daysUntil <= 7 ? 'warning' : 'info',
            icon: '💉',
            title: 'Vaccin à renouveler',
            description: `Le vaccin ${vaccin.nom_vaccin} de ${vaccin.prenom} expire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
          })
        })
      }

      // 2. Stock faible de médicaments (< 10)
      const stockResult = await window.electronAPI.dbQuery(`
        SELECT t.*, m.prenom, m.nom
        FROM traitements t
        JOIN membres m ON t.membre_id = m.id
        WHERE t.actif = 1 AND t.stock_restant IS NOT NULL AND t.stock_restant < 10
        ORDER BY t.stock_restant ASC
        LIMIT 2
      `)

      if (stockResult.success && stockResult.data.length > 0) {
        stockResult.data.forEach((trait: any) => {
          alertsList.push({
            id: idCounter++,
            type: trait.stock_restant <= 5 ? 'warning' : 'info',
            icon: '💊',
            title: 'Stock faible',
            description: `${trait.nom_medicament} (${trait.prenom}) - ${trait.stock_restant} restant${trait.stock_restant > 1 ? 's' : ''}`
          })
        })
      }

      // 3. RDV à venir dans les 3 jours
      const rdvResult = await window.electronAPI.dbQuery(`
        SELECT r.*, m.prenom, m.nom
        FROM rendez_vous r
        JOIN membres m ON r.membre_id = m.id
        WHERE r.statut = 'à_venir'
          AND r.date_rdv >= date('now')
          AND r.date_rdv <= date('now', '+3 days')
        ORDER BY r.date_rdv ASC, r.heure ASC
        LIMIT 2
      `)

      if (rdvResult.success && rdvResult.data.length > 0) {
        rdvResult.data.forEach((rdv: any) => {
          const daysUntil = getDaysUntil(rdv.date_rdv)
          const dayText = daysUntil === 0 ? "aujourd'hui" : daysUntil === 1 ? 'demain' : `dans ${daysUntil} jours`
          alertsList.push({
            id: idCounter++,
            type: daysUntil === 0 ? 'warning' : 'info',
            icon: '📅',
            title: 'Rendez-vous proche',
            description: `${rdv.specialite || rdv.motif} ${rdv.prenom} ${dayText} ${rdv.heure}`
          })
        })
      }

      // 4. Renouvellements d'ordonnance urgents (< 7 jours)
      const renouResult = await window.electronAPI.dbQuery(`
        SELECT t.*, m.prenom, m.nom
        FROM traitements t
        JOIN membres m ON t.membre_id = m.id
        WHERE t.actif = 1
          AND t.renouvellement_ordonnance IS NOT NULL
          AND t.renouvellement_ordonnance >= date('now')
          AND t.renouvellement_ordonnance <= date('now', '+7 days')
        ORDER BY t.renouvellement_ordonnance ASC
        LIMIT 2
      `)

      if (renouResult.success && renouResult.data.length > 0) {
        renouResult.data.forEach((trait: any) => {
          const daysUntil = getDaysUntil(trait.renouvellement_ordonnance)
          alertsList.push({
            id: idCounter++,
            type: 'warning',
            icon: '📋',
            title: 'Renouvellement ordonnance',
            description: `${trait.nom_medicament} (${trait.prenom}) à renouveler dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
          })
        })
      }

      setAlerts(alertsList)
    } catch (error) {
      console.error('Erreur chargement alertes:', error)
    }
  }

  /**
   * Calcule le nombre de jours entre aujourd'hui et une date future
   */
  const getDaysUntil = (dateStr: string): number => {
    const targetDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Gère la soumission du formulaire d'ajout de membre
   *
   * Processus:
   * 1. Insère le nouveau membre dans la base avec tous les champs
   * 2. Convertit poids/taille en nombres si présents
   * 3. Gère les champs optionnels (null si vide)
   * 4. Réinitialise le formulaire
   * 5. Recharge la liste des membres
   * 6. Affiche une notification de succès
   *
   * @async
   * @function handleAddMembre
   * @param {React.FormEvent} e - L'événement de soumission du formulaire
   */
  const handleAddMembre = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await window.electronAPI.dbRun(
        `INSERT INTO membres (
          famille_id, nom, prenom, date_naissance, sexe,
          groupe_sanguin, rhesus, poids, taille, telephone, email,
          numero_securite_sociale, medecin_traitant, telephone_medecin,
          contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newMembre.nom,
          newMembre.prenom,
          newMembre.date_naissance,
          newMembre.sexe || null,
          newMembre.groupe_sanguin || null,
          newMembre.rhesus || null,
          newMembre.poids ? parseFloat(newMembre.poids) : null,
          newMembre.taille ? parseInt(newMembre.taille) : null,
          newMembre.telephone || null,
          newMembre.email || null,
          newMembre.numero_securite_sociale || null,
          newMembre.medecin_traitant || null,
          newMembre.telephone_medecin || null,
          newMembre.contact_urgence_nom || null,
          newMembre.contact_urgence_telephone || null,
          newMembre.contact_urgence_relation || null,
          newMembre.notes || null
        ]
      )

      if (result.success) {
        // Réinitialiser le formulaire
        setNewMembre({
          nom: '', prenom: '', date_naissance: '', sexe: '',
          groupe_sanguin: '', rhesus: '', poids: '', taille: '',
          telephone: '', email: '', numero_securite_sociale: '',
          medecin_traitant: '', telephone_medecin: '',
          contact_urgence_nom: '', contact_urgence_telephone: '',
          contact_urgence_relation: '', notes: ''
        })
        setShowAddForm(false)
        loadMembres()
        loadDashboardStats()
        loadAlerts()
        addNotification({
          type: 'success',
          title: 'Membre ajouté',
          message: `${newMembre.prenom} ${newMembre.nom} a été ajouté avec succès`
        })
      }
    } catch (error) {
      console.error('Erreur ajout membre:', error)
    }
  }

  /**
   * Supprime un membre et toutes ses données associées
   *
   * Processus de suppression en cascade:
   * 1. Demande confirmation utilisateur
   * 2. Supprime les allergies du membre
   * 3. Supprime les vaccins du membre
   * 4. Supprime les traitements du membre
   * 5. Supprime les rendez-vous du membre
   * 6. Supprime le membre lui-même
   * 7. Recharge la liste et affiche notification
   *
   * @async
   * @function handleDeleteMembre
   * @param {number} id - L'ID du membre à supprimer
   * @param {string} nom - Nom du membre (pour confirmation)
   * @param {string} prenom - Prénom du membre (pour confirmation)
   */
  const handleDeleteMembre = (id: number, nom: string, prenom: string) => {
    setConfirmDelete({ isOpen: true, membre: { id, nom, prenom } })
  }

  const confirmDeleteMembre = async () => {
    if (!confirmDelete.membre) return

    const { id, nom, prenom } = confirmDelete.membre

    try {
      // Supprimer toutes les données liées (CASCADE)
      await window.electronAPI.dbRun('DELETE FROM allergies WHERE membre_id = ?', [id])
      await window.electronAPI.dbRun('DELETE FROM vaccins WHERE membre_id = ?', [id])
      await window.electronAPI.dbRun('DELETE FROM traitements WHERE membre_id = ?', [id])
      await window.electronAPI.dbRun('DELETE FROM rendez_vous WHERE membre_id = ?', [id])

      // Supprimer le membre
      const result = await window.electronAPI.dbRun('DELETE FROM membres WHERE id = ?', [id])

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Membre supprimé',
          message: `${prenom} ${nom} a été supprimé avec succès`
        })
        loadMembres()
        loadDashboardStats()
        loadAlerts()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le membre'
      })
    } finally {
      setConfirmDelete({ isOpen: false })
    }
  }

  /**
   * Calcule l'âge d'une personne à partir de sa date de naissance
   *
   * Prend en compte le mois et le jour pour déterminer si l'anniversaire
   * de l'année en cours est déjà passé ou non.
   *
   * @function calculateAge
   * @param {string} birthDate - Date de naissance (format ISO)
   * @returns {number} L'âge en années
   */
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  /**
   * Retourne la date actuelle en format français complet
   *
   * @function getCurrentDateString
   * @returns {string} Date formatée (ex: "Lundi 29 Octobre 2025")
   */
  const getCurrentDateString = () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    const today = new Date()
    return `${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
  }

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <h2>Bonjour! 👋</h2>
        <p>{getCurrentDateString()}</p>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <StatCard
          icon="👨‍👩‍👧‍👦"
          label="Membres"
          value={membres.length}
          color="primary"
          onClick={() => {
            // Scroll vers la liste des membres
            document.querySelector('.membres-grid')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
        <StatCard
          icon="📅"
          label="Rendez-vous"
          value={totalRdvAVenir.toString()}
          color="info"
          onClick={() => onNavigate('rendez-vous')}
        />
        <StatCard
          icon="💉"
          label="Vaccins"
          value={totalVaccins}
          color="success"
          onClick={() => {
            // Si un membre est disponible, aller vers ses vaccins
            if (membres.length > 0) {
              onSelectMembre(membres[0].id)
              onNavigate('vaccins')
            }
          }}
        />
        <StatCard
          icon="💊"
          label="Traitements"
          value={totalTraitementsActifs.toString()}
          color="warning"
          onClick={() => {
            // Si un membre est disponible, aller vers ses traitements
            if (membres.length > 0) {
              onSelectMembre(membres[0].id)
              onNavigate('traitements')
            }
          }}
        />
      </div>

      {/* Actions requises */}
      <div className="widget">
        <h3>⚠️ Actions requises</h3>
        {alerts.length > 0 ? (
          <>
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <div className="alert-icon">{alert.icon}</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">
                    {alert.description}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="widget-empty">Aucune action requise</p>
        )}
      </div>

      <div className="dashboard-header">
        <h2>👨‍👩‍👧‍👦 Membres de la famille</h2>
        <button className="btn btn-primary btn-lg" onClick={() => setShowAddForm(!showAddForm)}>
          ➕ Ajouter un membre
        </button>
      </div>

      {showAddForm && (
        <div className="card add-form">
          <h3>Nouveau membre de la famille</h3>
          <form onSubmit={handleAddMembre}>
            {/* Informations de base */}
            <div className="form-section">
              <h4>📋 Informations de base</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    ref={nomInputRef}
                    type="text"
                    value={newMembre.nom}
                    onChange={(e) => setNewMembre({ ...newMembre, nom: e.target.value })}
                    required
                    placeholder="Nom"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={newMembre.prenom}
                    onChange={(e) => setNewMembre({ ...newMembre, prenom: e.target.value })}
                    required
                    placeholder="Prénom"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de naissance *</label>
                  <input
                    type="date"
                    value={newMembre.date_naissance}
                    onChange={(e) => setNewMembre({ ...newMembre, date_naissance: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sexe</label>
                  <select
                    value={newMembre.sexe}
                    onChange={(e) => setNewMembre({ ...newMembre, sexe: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informations médicales */}
            <div className="form-section">
              <h4>🩺 Informations médicales</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Groupe sanguin</label>
                  <select
                    value={newMembre.groupe_sanguin}
                    onChange={(e) => setNewMembre({ ...newMembre, groupe_sanguin: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Rhésus</label>
                  <select
                    value={newMembre.rhesus}
                    onChange={(e) => setNewMembre({ ...newMembre, rhesus: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="+">Positif (+)</option>
                    <option value="-">Négatif (-)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMembre.poids}
                    onChange={(e) => setNewMembre({ ...newMembre, poids: e.target.value })}
                    placeholder="Ex: 75.5"
                  />
                </div>
                <div className="form-group">
                  <label>Taille (cm)</label>
                  <input
                    type="number"
                    value={newMembre.taille}
                    onChange={(e) => setNewMembre({ ...newMembre, taille: e.target.value })}
                    placeholder="Ex: 175"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>N° Sécurité Sociale</label>
                <input
                  type="text"
                  value={newMembre.numero_securite_sociale}
                  onChange={(e) => setNewMembre({ ...newMembre, numero_securite_sociale: e.target.value })}
                  placeholder="Ex: 1 85 03 75 123 456 78"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="form-section">
              <h4>📞 Contact</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newMembre.telephone}
                    onChange={(e) => setNewMembre({ ...newMembre, telephone: e.target.value })}
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newMembre.email}
                    onChange={(e) => setNewMembre({ ...newMembre, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Médecin traitant */}
            <div className="form-section">
              <h4>👨‍⚕️ Médecin traitant</h4>
              <div className="form-group">
                <label>Nom du médecin</label>
                <input
                  type="text"
                  value={newMembre.medecin_traitant}
                  onChange={(e) => setNewMembre({ ...newMembre, medecin_traitant: e.target.value })}
                  placeholder="Dr Dupont"
                />
              </div>
              <div className="form-group">
                <label>Téléphone du médecin</label>
                <input
                  type="tel"
                  value={newMembre.telephone_medecin}
                  onChange={(e) => setNewMembre({ ...newMembre, telephone_medecin: e.target.value })}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>

            {/* Contact d'urgence */}
            <div className="form-section">
              <h4>🚨 Contact d'urgence</h4>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={newMembre.contact_urgence_nom}
                  onChange={(e) => setNewMembre({ ...newMembre, contact_urgence_nom: e.target.value })}
                  placeholder="Nom du contact"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newMembre.contact_urgence_telephone}
                    onChange={(e) => setNewMembre({ ...newMembre, contact_urgence_telephone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <input
                    type="text"
                    value={newMembre.contact_urgence_relation}
                    onChange={(e) => setNewMembre({ ...newMembre, contact_urgence_relation: e.target.value })}
                    placeholder="Ex: Conjoint, Parent..."
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h4>📝 Notes</h4>
              <div className="form-group">
                <label>Notes supplémentaires</label>
                <textarea
                  rows={3}
                  value={newMembre.notes}
                  onChange={(e) => setNewMembre({ ...newMembre, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success btn-lg">✅ Ajouter le membre</button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowAddForm(false)}>
                ❌ Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="membres-grid">
        {isLoading ? (
          // Skeleton loaders pendant le chargement
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : membres.length === 0 ? (
          // Alert si aucun membre
          <Alert type="info" title="Aucun membre">
            👋 Commencez par ajouter un membre de votre famille en cliquant sur le bouton "➕ Ajouter un membre" ci-dessus.
          </Alert>
        ) : (
          membres.map((membre) => (
            <div key={membre.id} className="membre-card">
              <button
                className="btn-delete-membre"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteMembre(membre.id, membre.nom, membre.prenom)
                }}
                title="Supprimer ce membre"
              >
                ❌
              </button>
              <div
                className="membre-card-content"
                onClick={() => {
                  onSelectMembre(membre.id)
                  onNavigate('profil')
                }}
              >
                <div className="membre-avatar">
                  {membre.prenom.charAt(0).toUpperCase()}
                </div>
                <div className="membre-info">
                  <h3>{membre.prenom} {membre.nom}</h3>
                  <p>{calculateAge(membre.date_naissance)} ans</p>
                  <p className="status">✅ À jour</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dashboard-widgets">
        <div className="widget">
          <h3>📅 Prochains rendez-vous</h3>
          {prochainRdvs.length > 0 ? (
            <ul className="widget-list">
              {prochainRdvs.map((rdv) => (
                <li key={rdv.id}>
                  <div>
                    <strong>{rdv.specialite || rdv.motif}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} - {rdv.heure}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem' }}>{rdv.membre_prenom}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="widget-empty">Aucun rendez-vous à venir</p>
          )}
        </div>

        <div className="widget">
          <h3>💊 Traitements actifs</h3>
          {traitementsActifs.length > 0 ? (
            <ul className="widget-list">
              {traitementsActifs.map((traitement) => (
                <li key={traitement.id}>
                  <div>
                    <strong>{traitement.nom_medicament} {traitement.dosage}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {traitement.frequence}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem' }}>{traitement.membre_prenom}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="widget-empty">Aucun traitement en cours</p>
          )}
        </div>

        <div className="widget">
          <h3>💉 Vaccins récents</h3>
          {vaccinsRecents.length > 0 ? (
            <ul className="widget-list">
              {vaccinsRecents.map((vaccin) => (
                <li key={vaccin.id}>
                  <div>
                    <strong>{vaccin.nom_vaccin}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(vaccin.date_administration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem' }}>{vaccin.membre_prenom}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="widget-empty">Aucun vaccin enregistré</p>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="⚠️ Supprimer le membre"
        message={confirmDelete.membre ? `Êtes-vous sûr de vouloir supprimer ${confirmDelete.membre.prenom} ${confirmDelete.membre.nom} ?\n\nToutes les données associées (vaccins, traitements, RDV) seront également supprimées.` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={confirmDeleteMembre}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  )
}

export default Dashboard
