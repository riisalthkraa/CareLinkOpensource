/**
 * DossierMedical - Page de gestion complète du dossier médical d'un membre
 *
 * Cette page centralise toutes les informations médicales d'un membre de la famille:
 * - 📝 Antécédents médicaux (maladies passées, opérations, hospitalisations)
 * - 🩺 Diagnostics actifs (pathologies en cours de traitement)
 * - 📊 Bilans médicaux (analyses de sang, imagerie, ECG, etc.)
 * - 👨‍⚕️ Consultations spécialisées (cardio, allergo, dermato, etc.)
 *
 * FONCTIONNALITÉS:
 * - Menu déroulant de sélection de membre (nom + âge)
 * - Onglets pour naviguer entre les sections
 * - Formulaires d'ajout/modification pour chaque section
 * - Affichage chronologique des données
 * - Support du chiffrement pour les données sensibles
 * - Statistiques et résumé du dossier
 *
 * ARCHITECTURE:
 * - Composant principal avec système d'onglets
 * - Gestion d'état avec useState pour les formulaires
 * - Chargement asynchrone des données depuis SQLite
 * - Design system unifié (boutons, cartes, alerts)
 *
 * @module pages/DossierMedical
 * @author VIEY David
 * @version 2.5.0
 */

import { useState, useEffect } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/dossier-medical.css'

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

/**
 * Props du composant DossierMedical
 */
interface DossierMedicalProps {
  membreId: number | null           // ID du membre sélectionné (peut être null)
  onBack: () => void                // Callback pour retourner à la page précédente
  onSelectMembre?: (membreId: number) => void  // Callback optionnel pour changer de membre
}

/**
 * Interface pour un membre (données de base)
 */
interface Membre {
  id: number
  nom: string
  prenom: string
  date_naissance: string
}

/**
 * Interface pour un antécédent médical
 */
interface AntecedentMedical {
  id: number
  membre_id: number
  type_antecedent: 'maladie' | 'operation' | 'hospitalisation' | 'traumatisme' | 'autre'
  titre: string                     // Ex: "Appendicite", "Fracture tibia"
  description: string | null
  date_debut: string | null
  date_fin: string | null
  actif: number                     // 1 = chronique/actif, 0 = résolu
  severite: 'légère' | 'modérée' | 'grave' | null
  medecin: string | null
  hopital: string | null
  notes: string | null
  created_at: string
}

/**
 * Interface pour un diagnostic actif
 */
interface Diagnostic {
  id: number
  membre_id: number
  pathologie: string                // Ex: "Diabète type 2", "Hypertension"
  code_cim10: string | null         // Code CIM-10 (ex: E11)
  date_diagnostic: string
  medecin_diagnostic: string | null
  specialite: string | null         // cardiologue, allergologue, etc.
  severite: 'légère' | 'modérée' | 'grave' | 'critique' | null
  statut: 'actif' | 'en_remission' | 'guéri' | 'stabilisé'
  traitement_lie: number | null     // ID du traitement associé
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Interface pour un bilan médical
 */
interface BilanMedical {
  id: number
  membre_id: number
  type_bilan: 'analyse_sang' | 'imagerie' | 'electro' | 'spirometrie' | 'autre'
  nom_examen: string                // Ex: "Bilan lipidique", "IRM cérébrale"
  date_examen: string
  medecin_prescripteur: string | null
  laboratoire: string | null
  resultat_global: 'normal' | 'anormal' | 'pathologique' | 'en_attente'
  valeurs_principales: string | null // JSON ou texte des valeurs
  interpretation: string | null
  fichier_resultat: string | null   // Chemin vers le fichier PDF/image
  notes: string | null
  created_at: string
}

/**
 * Interface pour une consultation spécialisée
 */
interface ConsultationSpecialisee {
  id: number
  membre_id: number
  date_consultation: string
  specialite: string                // cardiologie, allergologie, etc.
  medecin_nom: string
  hopital_cabinet: string | null
  motif_consultation: string
  diagnostic_pose: string | null
  examens_prescrits: string | null
  traitements_prescrits: string | null
  suivi_recommande: string | null
  prochain_rdv: string | null
  compte_rendu: string | null
  fichier_cr: string | null         // Chemin vers le compte-rendu scanné
  notes: string | null
  created_at: string
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule l'âge d'une personne à partir de sa date de naissance
 *
 * @param dateNaissance - Date de naissance au format YYYY-MM-DD
 * @returns L'âge en années
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
 * Formate une date en français
 *
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée en français (ex: "15 mars 2024")
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Non renseignée'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Retourne l'emoji correspondant au type d'antécédent
 */
const getAntecedentEmoji = (type: string): string => {
  switch (type) {
    case 'maladie': return '🦠'
    case 'operation': return '🏥'
    case 'hospitalisation': return '🛏️'
    case 'traumatisme': return '🤕'
    default: return '📋'
  }
}

/**
 * Retourne la classe CSS selon la sévérité
 */
const getSeveriteClass = (severite: string | null): string => {
  switch (severite) {
    case 'légère': return 'severite-legere'
    case 'modérée': return 'severite-moderee'
    case 'grave': return 'severite-grave'
    case 'critique': return 'severite-critique'
    default: return ''
  }
}

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

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Composant DossierMedical
 *
 * Gère l'affichage et la modification du dossier médical complet d'un membre
 */
export default function DossierMedical({ membreId, onBack, onSelectMembre }: DossierMedicalProps) {
  // ==========================================================================
  // ÉTAT DU COMPOSANT
  // ==========================================================================

  const { addNotification } = useNotification()

  // Membres
  const [membre, setMembre] = useState<Membre | null>(null)
  const [membres, setMembres] = useState<Membre[]>([])
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(membreId)

  // Onglets
  const [activeTab, setActiveTab] = useState<'antecedents' | 'diagnostics' | 'bilans' | 'consultations'>('antecedents')

  // Données médicales
  const [antecedents, setAntecedents] = useState<AntecedentMedical[]>([])
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [bilans, setBilans] = useState<BilanMedical[]>([])
  const [consultations, setConsultations] = useState<ConsultationSpecialisee[]>([])

  // Données déchiffrées
  const [decryptedNotes, setDecryptedNotes] = useState<Record<string, Record<number, string>>>({})

  // Formulaires
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<any>({})

  // Loading
  const [loading, setLoading] = useState(true)

  // ==========================================================================
  // EFFETS (LIFECYCLE)
  // ==========================================================================

  /**
   * Charge la liste de tous les membres au montage du composant
   */
  useEffect(() => {
    loadAllMembres()
  }, [])

  /**
   * Charge les données du membre sélectionné
   */
  useEffect(() => {
    if (selectedMembreId) {
      loadMembreData()
      loadAllMedicalData()
    }
  }, [selectedMembreId])

  /**
   * Synchronise avec la prop membreId si elle change
   */
  useEffect(() => {
    if (membreId && membreId !== selectedMembreId) {
      setSelectedMembreId(membreId)
    }
  }, [membreId])

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  /**
   * Charge la liste complète des membres de la famille
   */
  const loadAllMembres = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT id, nom, prenom, date_naissance FROM membres ORDER BY prenom ASC',
        []
      )
      if (result.success) {
        setMembres(result.data)
        // Si aucun membre sélectionné, prendre le premier
        if (!selectedMembreId && result.data.length > 0) {
          setSelectedMembreId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger la liste des membres',
        duration: 5000
      })
    }
  }

  /**
   * Charge les informations de base du membre sélectionné
   */
  const loadMembreData = async () => {
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
   * Charge toutes les données médicales du membre
   */
  const loadAllMedicalData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadAntecedents(),
        loadDiagnostics(),
        loadBilans(),
        loadConsultations()
      ])
    } catch (error) {
      console.error('Erreur chargement données médicales:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Charge les antécédents médicaux
   */
  const loadAntecedents = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM antecedents_medicaux WHERE membre_id = ? ORDER BY date_debut DESC',
        [selectedMembreId]
      )
      if (result.success) {
        setAntecedents(result.data)

        // Déchiffrer les notes
        const decrypted: Record<number, string> = {}
        for (const ant of result.data) {
          if (ant.notes) {
            decrypted[ant.id] = await decryptText(ant.notes)
          }
        }
        setDecryptedNotes(prev => ({ ...prev, antecedents: decrypted }))
      }
    } catch (error) {
      console.error('Erreur chargement antécédents:', error)
    }
  }

  /**
   * Charge les diagnostics actifs
   */
  const loadDiagnostics = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        "SELECT * FROM diagnostics WHERE membre_id = ? ORDER BY date_diagnostic DESC",
        [selectedMembreId]
      )
      if (result.success) {
        setDiagnostics(result.data)

        // Déchiffrer les notes
        const decrypted: Record<number, string> = {}
        for (const diag of result.data) {
          if (diag.notes) {
            decrypted[diag.id] = await decryptText(diag.notes)
          }
        }
        setDecryptedNotes(prev => ({ ...prev, diagnostics: decrypted }))
      }
    } catch (error) {
      console.error('Erreur chargement diagnostics:', error)
    }
  }

  /**
   * Charge les bilans médicaux
   */
  const loadBilans = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM bilans_medicaux WHERE membre_id = ? ORDER BY date_examen DESC',
        [selectedMembreId]
      )
      if (result.success) {
        setBilans(result.data)

        // Déchiffrer les notes
        const decrypted: Record<number, string> = {}
        for (const bilan of result.data) {
          if (bilan.notes) {
            decrypted[bilan.id] = await decryptText(bilan.notes)
          }
        }
        setDecryptedNotes(prev => ({ ...prev, bilans: decrypted }))
      }
    } catch (error) {
      console.error('Erreur chargement bilans:', error)
    }
  }

  /**
   * Charge les consultations spécialisées
   */
  const loadConsultations = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM consultations_specialisees WHERE membre_id = ? ORDER BY date_consultation DESC',
        [selectedMembreId]
      )
      if (result.success) {
        setConsultations(result.data)

        // Déchiffrer les notes
        const decrypted: Record<number, string> = {}
        for (const consult of result.data) {
          if (consult.notes) {
            decrypted[consult.id] = await decryptText(consult.notes)
          }
        }
        setDecryptedNotes(prev => ({ ...prev, consultations: decrypted }))
      }
    } catch (error) {
      console.error('Erreur chargement consultations:', error)
    }
  }

  // ==========================================================================
  // GESTION DES ÉVÉNEMENTS
  // ==========================================================================

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
   * Ouvre le formulaire pour ajouter un nouvel élément
   */
  const handleAdd = () => {
    setFormData({})
    setEditingId(null)
    setShowAddForm(true)
  }

  /**
   * Ouvre le formulaire pour modifier un élément existant
   */
  const handleEdit = (item: any) => {
    setFormData(item)
    setEditingId(item.id)
    setShowAddForm(true)
  }

  /**
   * Ferme le formulaire
   */
  const handleCancelForm = () => {
    setShowAddForm(false)
    setFormData({})
    setEditingId(null)
  }

  // ==========================================================================
  // GESTION DES ANTÉCÉDENTS MÉDICAUX
  // ==========================================================================

  /**
   * Soumet le formulaire d'antécédent médical (ajout ou modification)
   */
  const handleSubmitAntecedent = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.titre || formData.titre.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le titre est obligatoire',
        duration: 5000
      })
      return
    }

    try {
      if (editingId) {
        // UPDATE
        await window.electronAPI.dbRun(
          `UPDATE antecedents_medicaux
           SET type_antecedent = ?, titre = ?, description = ?, date_debut = ?,
               date_fin = ?, actif = ?, severite = ?, medecin = ?, hopital = ?, notes = ?
           WHERE id = ?`,
          [
            formData.type_antecedent || 'autre',
            formData.titre,
            formData.description || null,
            formData.date_debut || null,
            formData.date_fin || null,
            formData.actif ? 1 : 0,
            formData.severite || null,
            formData.medecin || null,
            formData.hopital || null,
            formData.notes || null,
            editingId
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Antécédent modifié avec succès',
          duration: 3000
        })
      } else {
        // INSERT
        await window.electronAPI.dbRun(
          `INSERT INTO antecedents_medicaux
           (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            selectedMembreId,
            formData.type_antecedent || 'autre',
            formData.titre,
            formData.description || null,
            formData.date_debut || null,
            formData.date_fin || null,
            formData.actif ? 1 : 0,
            formData.severite || null,
            formData.medecin || null,
            formData.hopital || null,
            formData.notes || null
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Antécédent ajouté avec succès',
          duration: 3000
        })
      }

      // Recharger les données
      await loadAntecedents()
      handleCancelForm()
    } catch (error) {
      console.error('Erreur sauvegarde antécédent:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder l\'antécédent',
        duration: 5000
      })
    }
  }

  // ==========================================================================
  // GESTION DES DIAGNOSTICS
  // ==========================================================================

  /**
   * Soumet le formulaire de diagnostic (ajout ou modification)
   */
  const handleSubmitDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.pathologie || formData.pathologie.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La pathologie est obligatoire',
        duration: 5000
      })
      return
    }

    if (!formData.date_diagnostic) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La date de diagnostic est obligatoire',
        duration: 5000
      })
      return
    }

    try {
      if (editingId) {
        // UPDATE
        await window.electronAPI.dbRun(
          `UPDATE diagnostics
           SET pathologie = ?, code_cim10 = ?, date_diagnostic = ?, medecin_diagnostic = ?,
               specialite = ?, severite = ?, statut = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            formData.pathologie,
            formData.code_cim10 || null,
            formData.date_diagnostic,
            formData.medecin_diagnostic || null,
            formData.specialite || null,
            formData.severite || null,
            formData.statut || 'actif',
            formData.notes || null,
            editingId
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Diagnostic modifié avec succès',
          duration: 3000
        })
      } else {
        // INSERT
        await window.electronAPI.dbRun(
          `INSERT INTO diagnostics
           (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            selectedMembreId,
            formData.pathologie,
            formData.code_cim10 || null,
            formData.date_diagnostic,
            formData.medecin_diagnostic || null,
            formData.specialite || null,
            formData.severite || null,
            formData.statut || 'actif',
            formData.notes || null
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Diagnostic ajouté avec succès',
          duration: 3000
        })
      }

      // Recharger les données
      await loadDiagnostics()
      handleCancelForm()
    } catch (error) {
      console.error('Erreur sauvegarde diagnostic:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder le diagnostic',
        duration: 5000
      })
    }
  }

  // ==========================================================================
  // GESTION DES BILANS MÉDICAUX
  // ==========================================================================

  /**
   * Soumet le formulaire de bilan médical (ajout ou modification)
   */
  const handleSubmitBilan = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.nom_examen || formData.nom_examen.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom de l\'examen est obligatoire',
        duration: 5000
      })
      return
    }

    if (!formData.date_examen) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La date de l\'examen est obligatoire',
        duration: 5000
      })
      return
    }

    try {
      if (editingId) {
        // UPDATE
        await window.electronAPI.dbRun(
          `UPDATE bilans_medicaux
           SET type_bilan = ?, nom_examen = ?, date_examen = ?, medecin_prescripteur = ?,
               laboratoire = ?, resultat_global = ?, valeurs_principales = ?,
               interpretation = ?, notes = ?
           WHERE id = ?`,
          [
            formData.type_bilan || 'autre',
            formData.nom_examen,
            formData.date_examen,
            formData.medecin_prescripteur || null,
            formData.laboratoire || null,
            formData.resultat_global || 'en_attente',
            formData.valeurs_principales || null,
            formData.interpretation || null,
            formData.notes || null,
            editingId
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Bilan modifié avec succès',
          duration: 3000
        })
      } else {
        // INSERT
        await window.electronAPI.dbRun(
          `INSERT INTO bilans_medicaux
           (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire,
            resultat_global, valeurs_principales, interpretation, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            selectedMembreId,
            formData.type_bilan || 'autre',
            formData.nom_examen,
            formData.date_examen,
            formData.medecin_prescripteur || null,
            formData.laboratoire || null,
            formData.resultat_global || 'en_attente',
            formData.valeurs_principales || null,
            formData.interpretation || null,
            formData.notes || null
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Bilan ajouté avec succès',
          duration: 3000
        })
      }

      // Recharger les données
      await loadBilans()
      handleCancelForm()
    } catch (error) {
      console.error('Erreur sauvegarde bilan:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder le bilan',
        duration: 5000
      })
    }
  }

  // ==========================================================================
  // GESTION DES CONSULTATIONS SPÉCIALISÉES
  // ==========================================================================

  /**
   * Soumet le formulaire de consultation (ajout ou modification)
   */
  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.date_consultation) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La date de consultation est obligatoire',
        duration: 5000
      })
      return
    }

    if (!formData.specialite || formData.specialite.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La spécialité est obligatoire',
        duration: 5000
      })
      return
    }

    if (!formData.medecin_nom || formData.medecin_nom.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom du médecin est obligatoire',
        duration: 5000
      })
      return
    }

    if (!formData.motif_consultation || formData.motif_consultation.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le motif de consultation est obligatoire',
        duration: 5000
      })
      return
    }

    try {
      if (editingId) {
        // UPDATE
        await window.electronAPI.dbRun(
          `UPDATE consultations_specialisees
           SET date_consultation = ?, specialite = ?, medecin_nom = ?, hopital_cabinet = ?,
               motif_consultation = ?, diagnostic_pose = ?, examens_prescrits = ?,
               traitements_prescrits = ?, suivi_recommande = ?, prochain_rdv = ?,
               compte_rendu = ?, notes = ?
           WHERE id = ?`,
          [
            formData.date_consultation,
            formData.specialite,
            formData.medecin_nom,
            formData.hopital_cabinet || null,
            formData.motif_consultation,
            formData.diagnostic_pose || null,
            formData.examens_prescrits || null,
            formData.traitements_prescrits || null,
            formData.suivi_recommande || null,
            formData.prochain_rdv || null,
            formData.compte_rendu || null,
            formData.notes || null,
            editingId
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Consultation modifiée avec succès',
          duration: 3000
        })
      } else {
        // INSERT
        await window.electronAPI.dbRun(
          `INSERT INTO consultations_specialisees
           (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation,
            diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande,
            prochain_rdv, compte_rendu, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            selectedMembreId,
            formData.date_consultation,
            formData.specialite,
            formData.medecin_nom,
            formData.hopital_cabinet || null,
            formData.motif_consultation,
            formData.diagnostic_pose || null,
            formData.examens_prescrits || null,
            formData.traitements_prescrits || null,
            formData.suivi_recommande || null,
            formData.prochain_rdv || null,
            formData.compte_rendu || null,
            formData.notes || null
          ]
        )

        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Consultation ajoutée avec succès',
          duration: 3000
        })
      }

      // Recharger les données
      await loadConsultations()
      handleCancelForm()
    } catch (error) {
      console.error('Erreur sauvegarde consultation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder la consultation',
        duration: 5000
      })
    }
  }

  // ==========================================================================
  // RENDU DU COMPOSANT
  // ==========================================================================

  // État de chargement initial
  if (!membre) {
    return (
      <div className="dossier-medical-page">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }}></div>
            <p className="text-lg text-secondary">Chargement du dossier médical...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dossier-medical-page">
      {/* ====== EN-TÊTE ====== */}
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1 className="h1 m-0">📋 Dossier Médical</h1>
            <p className="text-sm text-secondary m-0">
              {membre.prenom} {membre.nom} - {calculateAge(membre.date_naissance)} ans
            </p>
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary">
            📄 Exporter PDF
          </button>
        </div>
      </div>

      {/* ====== SÉLECTEUR DE MEMBRE ====== */}
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

      {/* ====== STATISTIQUES RAPIDES ====== */}
      <div className="dossier-stats grid grid-cols-4 gap-md mb-lg">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{antecedents.length}</div>
          <div className="stat-label">Antécédent{antecedents.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🩺</div>
          <div className="stat-value">{diagnostics.filter(d => d.statut === 'actif').length}</div>
          <div className="stat-label">Diagnostic{diagnostics.filter(d => d.statut === 'actif').length > 1 ? 's' : ''} actif{diagnostics.filter(d => d.statut === 'actif').length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{bilans.length}</div>
          <div className="stat-label">Bilan{bilans.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-value">{consultations.length}</div>
          <div className="stat-label">Consultation{consultations.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ====== ONGLETS DE NAVIGATION ====== */}
      <div className="dossier-tabs mb-lg">
        <button
          className={`tab ${activeTab === 'antecedents' ? 'active' : ''}`}
          onClick={() => setActiveTab('antecedents')}
        >
          📝 Antécédents ({antecedents.length})
        </button>
        <button
          className={`tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          🩺 Diagnostics ({diagnostics.length})
        </button>
        <button
          className={`tab ${activeTab === 'bilans' ? 'active' : ''}`}
          onClick={() => setActiveTab('bilans')}
        >
          📊 Bilans ({bilans.length})
        </button>
        <button
          className={`tab ${activeTab === 'consultations' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultations')}
        >
          👨‍⚕️ Consultations ({consultations.length})
        </button>
      </div>

      {/* ====== CONTENU DES ONGLETS ====== */}
      <div className="dossier-content">
        {/* ONGLET ANTÉCÉDENTS */}
        {activeTab === 'antecedents' && (
          <div className="card">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="m-0">📝 Antécédents médicaux</h3>
              <button className="btn btn-primary" onClick={handleAdd}>
                ➕ Ajouter un antécédent
              </button>
            </div>

            {/* FORMULAIRE D'AJOUT/MODIFICATION */}
            {showAddForm && (
              <div className="card mb-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <h4>{editingId ? 'Modifier' : 'Ajouter'} un antécédent médical</h4>
                <form onSubmit={handleSubmitAntecedent}>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Type *</label>
                      <select
                        className="form-select"
                        value={formData.type_antecedent || 'autre'}
                        onChange={(e) => setFormData({ ...formData, type_antecedent: e.target.value })}
                      >
                        <option value="maladie">Maladie</option>
                        <option value="operation">Opération</option>
                        <option value="hospitalisation">Hospitalisation</option>
                        <option value="traumatisme">Traumatisme</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Titre *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.titre || ''}
                        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                        placeholder="Ex: Appendicite, Fracture tibia..."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Description détaillée de l'antécédent..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Date début</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date_debut || ''}
                        onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date fin</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date_fin || ''}
                        onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Sévérité</label>
                      <select
                        className="form-select"
                        value={formData.severite || ''}
                        onChange={(e) => setFormData({ ...formData, severite: e.target.value })}
                      >
                        <option value="">Non renseignée</option>
                        <option value="légère">Légère</option>
                        <option value="modérée">Modérée</option>
                        <option value="grave">Grave</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label flex items-center gap-sm">
                        <input
                          type="checkbox"
                          checked={formData.actif || false}
                          onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                        />
                        Actif / Chronique
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Médecin</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.medecin || ''}
                        onChange={(e) => setFormData({ ...formData, medecin: e.target.value })}
                        placeholder="Dr. Nom du médecin"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hôpital / Clinique</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.hopital || ''}
                        onChange={(e) => setFormData({ ...formData, hopital: e.target.value })}
                        placeholder="Nom de l'établissement"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      placeholder="Notes additionnelles..."
                    />
                  </div>

                  <div className="flex gap-md">
                    <button type="submit" className="btn btn-primary">
                      {editingId ? 'Modifier' : 'Enregistrer'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {antecedents.length === 0 ? (
              <div className="empty-state">
                <p className="text-lg">📋 Aucun antécédent médical enregistré</p>
                <p className="text-sm text-secondary">
                  Les antécédents incluent les maladies passées, opérations, hospitalisations, etc.
                </p>
              </div>
            ) : (
              <div className="antecedents-list">
                {antecedents.map((ant) => (
                  <div key={ant.id} className="antecedent-item card-item">
                    <div className="item-header">
                      <div className="item-title">
                        <span className="item-icon">{getAntecedentEmoji(ant.type_antecedent)}</span>
                        <strong>{ant.titre}</strong>
                        {ant.actif === 1 && <span className="badge badge-warning">Chronique</span>}
                      </div>
                      {ant.severite && (
                        <span className={`badge ${getSeveriteClass(ant.severite)}`}>
                          {ant.severite}
                        </span>
                      )}
                    </div>
                    {ant.description && (
                      <p className="item-description">{ant.description}</p>
                    )}
                    <div className="item-details">
                      {ant.date_debut && <span>📅 {formatDate(ant.date_debut)}</span>}
                      {ant.medecin && <span>👨‍⚕️ {ant.medecin}</span>}
                      {ant.hopital && <span>🏥 {ant.hopital}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="card">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="m-0">🩺 Diagnostics actifs</h3>
              <button className="btn btn-primary" onClick={handleAdd}>
                ➕ Ajouter un diagnostic
              </button>
            </div>

            {/* FORMULAIRE D'AJOUT/MODIFICATION */}
            {showAddForm && (
              <div className="card mb-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <h4>{editingId ? 'Modifier' : 'Ajouter'} un diagnostic</h4>
                <form onSubmit={handleSubmitDiagnostic}>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Pathologie *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.pathologie || ''}
                        onChange={(e) => setFormData({ ...formData, pathologie: e.target.value })}
                        placeholder="Ex: Diabète type 2, Hypertension..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Code CIM-10</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.code_cim10 || ''}
                        onChange={(e) => setFormData({ ...formData, code_cim10: e.target.value })}
                        placeholder="Ex: E11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Date diagnostic *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date_diagnostic || ''}
                        onChange={(e) => setFormData({ ...formData, date_diagnostic: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Médecin</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.medecin_diagnostic || ''}
                        onChange={(e) => setFormData({ ...formData, medecin_diagnostic: e.target.value })}
                        placeholder="Dr. Nom du médecin"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Spécialité</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.specialite || ''}
                        onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                        placeholder="Ex: Cardiologie, Endocrinologie..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sévérité</label>
                      <select
                        className="form-select"
                        value={formData.severite || ''}
                        onChange={(e) => setFormData({ ...formData, severite: e.target.value })}
                      >
                        <option value="">Non renseignée</option>
                        <option value="légère">Légère</option>
                        <option value="modérée">Modérée</option>
                        <option value="grave">Grave</option>
                        <option value="critique">Critique</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Statut</label>
                    <select
                      className="form-select"
                      value={formData.statut || 'actif'}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    >
                      <option value="actif">Actif</option>
                      <option value="en_remission">En rémission</option>
                      <option value="guéri">Guéri</option>
                      <option value="stabilisé">Stabilisé</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes additionnelles sur le diagnostic..."
                    />
                  </div>

                  <div className="flex gap-md">
                    <button type="submit" className="btn btn-primary">
                      {editingId ? 'Modifier' : 'Enregistrer'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {diagnostics.length === 0 ? (
              <div className="empty-state">
                <p className="text-lg">🩺 Aucun diagnostic enregistré</p>
                <p className="text-sm text-secondary">
                  Les diagnostics sont les pathologies actuellement suivies par un médecin.
                </p>
              </div>
            ) : (
              <div className="diagnostics-list">
                {diagnostics.map((diag) => (
                  <div key={diag.id} className="diagnostic-item card-item">
                    <div className="item-header">
                      <div className="item-title">
                        <span className="item-icon">🩺</span>
                        <strong>{diag.pathologie}</strong>
                        <span className={`badge badge-${diag.statut === 'actif' ? 'danger' : 'success'}`}>
                          {diag.statut}
                        </span>
                      </div>
                      {diag.severite && (
                        <span className={`badge ${getSeveriteClass(diag.severite)}`}>
                          {diag.severite}
                        </span>
                      )}
                    </div>
                    <div className="item-details">
                      <span>📅 Diagnostic: {formatDate(diag.date_diagnostic)}</span>
                      {diag.medecin_diagnostic && <span>👨‍⚕️ {diag.medecin_diagnostic}</span>}
                      {diag.specialite && <span>🏥 {diag.specialite}</span>}
                      {diag.code_cim10 && <span>🔖 CIM-10: {diag.code_cim10}</span>}
                    </div>
                    {decryptedNotes.diagnostics?.[diag.id] && (
                      <p className="item-notes">📝 {decryptedNotes.diagnostics[diag.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET BILANS */}
        {activeTab === 'bilans' && (
          <div className="card">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="m-0">📊 Bilans médicaux</h3>
              <button className="btn btn-primary" onClick={handleAdd}>
                ➕ Ajouter un bilan
              </button>
            </div>

            {/* FORMULAIRE D'AJOUT/MODIFICATION */}
            {showAddForm && (
              <div className="card mb-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <h4>{editingId ? 'Modifier' : 'Ajouter'} un bilan médical</h4>
                <form onSubmit={handleSubmitBilan}>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Type de bilan</label>
                      <select
                        className="form-select"
                        value={formData.type_bilan || 'autre'}
                        onChange={(e) => setFormData({ ...formData, type_bilan: e.target.value })}
                      >
                        <option value="analyse_sang">Analyse de sang</option>
                        <option value="imagerie">Imagerie</option>
                        <option value="electro">Électrocardiogramme</option>
                        <option value="spirometrie">Spirométrie</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nom de l'examen *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.nom_examen || ''}
                        onChange={(e) => setFormData({ ...formData, nom_examen: e.target.value })}
                        placeholder="Ex: Bilan lipidique, IRM cérébrale..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Date de l'examen *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date_examen || ''}
                        onChange={(e) => setFormData({ ...formData, date_examen: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Médecin prescripteur</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.medecin_prescripteur || ''}
                        onChange={(e) => setFormData({ ...formData, medecin_prescripteur: e.target.value })}
                        placeholder="Dr. Nom du médecin"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Laboratoire</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.laboratoire || ''}
                        onChange={(e) => setFormData({ ...formData, laboratoire: e.target.value })}
                        placeholder="Nom du laboratoire"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Résultat global</label>
                      <select
                        className="form-select"
                        value={formData.resultat_global || 'en_attente'}
                        onChange={(e) => setFormData({ ...formData, resultat_global: e.target.value })}
                      >
                        <option value="normal">Normal</option>
                        <option value="anormal">Anormal</option>
                        <option value="pathologique">Pathologique</option>
                        <option value="en_attente">En attente</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valeurs principales</label>
                    <textarea
                      className="form-textarea"
                      value={formData.valeurs_principales || ''}
                      onChange={(e) => setFormData({ ...formData, valeurs_principales: e.target.value })}
                      rows={3}
                      placeholder="Ex: Cholestérol total: 2.1 g/L, HDL: 0.6 g/L, LDL: 1.3 g/L..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interprétation</label>
                    <textarea
                      className="form-textarea"
                      value={formData.interpretation || ''}
                      onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                      rows={2}
                      placeholder="Interprétation du médecin..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      placeholder="Notes additionnelles..."
                    />
                  </div>

                  <div className="flex gap-md">
                    <button type="submit" className="btn btn-primary">
                      {editingId ? 'Modifier' : 'Enregistrer'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {bilans.length === 0 ? (
              <div className="empty-state">
                <p className="text-lg">📊 Aucun bilan médical enregistré</p>
                <p className="text-sm text-secondary">
                  Enregistrez ici les analyses de sang, imageries, ECG, et autres examens.
                </p>
              </div>
            ) : (
              <div className="bilans-list">
                {bilans.map((bilan) => (
                  <div key={bilan.id} className="bilan-item card-item">
                    <div className="item-header">
                      <div className="item-title">
                        <span className="item-icon">📊</span>
                        <strong>{bilan.nom_examen}</strong>
                      </div>
                      <span className={`badge badge-${bilan.resultat_global === 'normal' ? 'success' : bilan.resultat_global === 'anormal' ? 'warning' : 'danger'}`}>
                        {bilan.resultat_global}
                      </span>
                    </div>
                    <div className="item-details">
                      <span>📅 {formatDate(bilan.date_examen)}</span>
                      {bilan.medecin_prescripteur && <span>👨‍⚕️ {bilan.medecin_prescripteur}</span>}
                      {bilan.laboratoire && <span>🏥 {bilan.laboratoire}</span>}
                    </div>
                    {bilan.interpretation && (
                      <p className="item-notes">💡 {bilan.interpretation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET CONSULTATIONS */}
        {activeTab === 'consultations' && (
          <div className="card">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="m-0">👨‍⚕️ Consultations spécialisées</h3>
              <button className="btn btn-primary" onClick={handleAdd}>
                ➕ Ajouter une consultation
              </button>
            </div>

            {/* FORMULAIRE D'AJOUT/MODIFICATION */}
            {showAddForm && (
              <div className="card mb-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <h4>{editingId ? 'Modifier' : 'Ajouter'} une consultation spécialisée</h4>
                <form onSubmit={handleSubmitConsultation}>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Date de consultation *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date_consultation || ''}
                        onChange={(e) => setFormData({ ...formData, date_consultation: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Spécialité *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.specialite || ''}
                        onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                        placeholder="Ex: Cardiologie, Allergologie..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Nom du médecin *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.medecin_nom || ''}
                        onChange={(e) => setFormData({ ...formData, medecin_nom: e.target.value })}
                        placeholder="Dr. Nom Prénom"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hôpital / Cabinet</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.hopital_cabinet || ''}
                        onChange={(e) => setFormData({ ...formData, hopital_cabinet: e.target.value })}
                        placeholder="Nom de l'établissement"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Motif de consultation *</label>
                    <textarea
                      className="form-textarea"
                      value={formData.motif_consultation || ''}
                      onChange={(e) => setFormData({ ...formData, motif_consultation: e.target.value })}
                      rows={2}
                      placeholder="Raison de la consultation..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Diagnostic posé</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.diagnostic_pose || ''}
                      onChange={(e) => setFormData({ ...formData, diagnostic_pose: e.target.value })}
                      placeholder="Diagnostic établi par le médecin"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Examens prescrits</label>
                    <textarea
                      className="form-textarea"
                      value={formData.examens_prescrits || ''}
                      onChange={(e) => setFormData({ ...formData, examens_prescrits: e.target.value })}
                      rows={2}
                      placeholder="Liste des examens prescrits..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Traitements prescrits</label>
                    <textarea
                      className="form-textarea"
                      value={formData.traitements_prescrits || ''}
                      onChange={(e) => setFormData({ ...formData, traitements_prescrits: e.target.value })}
                      rows={2}
                      placeholder="Liste des traitements prescrits..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suivi recommandé</label>
                    <textarea
                      className="form-textarea"
                      value={formData.suivi_recommande || ''}
                      onChange={(e) => setFormData({ ...formData, suivi_recommande: e.target.value })}
                      rows={2}
                      placeholder="Recommandations de suivi..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prochain RDV</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.prochain_rdv || ''}
                      onChange={(e) => setFormData({ ...formData, prochain_rdv: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Compte rendu</label>
                    <textarea
                      className="form-textarea"
                      value={formData.compte_rendu || ''}
                      onChange={(e) => setFormData({ ...formData, compte_rendu: e.target.value })}
                      rows={3}
                      placeholder="Résumé détaillé de la consultation..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      placeholder="Notes additionnelles..."
                    />
                  </div>

                  <div className="flex gap-md">
                    <button type="submit" className="btn btn-primary">
                      {editingId ? 'Modifier' : 'Enregistrer'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {consultations.length === 0 ? (
              <div className="empty-state">
                <p className="text-lg">👨‍⚕️ Aucune consultation enregistrée</p>
                <p className="text-sm text-secondary">
                  Gardez trace des visites chez les spécialistes (cardiologue, allergologue, etc.)
                </p>
              </div>
            ) : (
              <div className="consultations-list">
                {consultations.map((consult) => (
                  <div key={consult.id} className="consultation-item card-item">
                    <div className="item-header">
                      <div className="item-title">
                        <span className="item-icon">👨‍⚕️</span>
                        <strong>{consult.specialite}</strong>
                      </div>
                      <span className="item-date">{formatDate(consult.date_consultation)}</span>
                    </div>
                    <div className="item-details">
                      <span>👨‍⚕️ Dr. {consult.medecin_nom}</span>
                      {consult.hopital_cabinet && <span>🏥 {consult.hopital_cabinet}</span>}
                    </div>
                    <p className="item-motif"><strong>Motif:</strong> {consult.motif_consultation}</p>
                    {consult.diagnostic_pose && (
                      <p className="item-diagnostic">🩺 <strong>Diagnostic:</strong> {consult.diagnostic_pose}</p>
                    )}
                    {consult.prochain_rdv && (
                      <p className="item-next-rdv">📅 <strong>Prochain RDV:</strong> {formatDate(consult.prochain_rdv)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

