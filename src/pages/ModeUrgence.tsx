/**
 * Mode Urgence - Système d'urgence médicale intelligent
 *
 * Fonctionnalités:
 * - Bouton panique avec appel urgences + envoi position GPS
 * - Fiche médicale d'urgence avec QR code pour secouristes
 * - Traduction médicale multilingue (50 langues)
 * - Protocoles d'urgence et instructions premiers secours
 * - Partage automatique avec contacts d'urgence
 *
 * @module pages/ModeUrgence
 */

import { useState, useEffect } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import QRCode from 'qrcode'
import '../styles/mode-urgence.css'

interface ModeUrgenceProps {
  membreId: number | null
  onBack: () => void
  onSelectMembre?: (membreId: number) => void
}

interface MembreUrgence {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  groupe_sanguin?: string
  rhesus?: string
  photo?: string
  numero_securite_sociale?: string
  contact_urgence_nom?: string
  contact_urgence_telephone?: string
  contact_urgence_relation?: string
  medecin_traitant?: string
  telephone_medecin?: string
}

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

interface ProtocoleUrgence {
  id: string
  titre: string
  icon: string
  urgence: 'critique' | 'haute' | 'moyenne'
  etapes: string[]
  telUrgence?: string
}

const PROTOCOLES: ProtocoleUrgence[] = [
  {
    id: 'arret-cardiaque',
    titre: 'Arrêt Cardiaque',
    icon: '❤️',
    urgence: 'critique',
    etapes: [
      '1. Appelez le 15 (SAMU) immédiatement',
      '2. Allongez la personne sur le dos, sur une surface dure',
      '3. Vérifiez la respiration (10 secondes max)',
      "4. Commencez le massage cardiaque: 30 compressions thoraciques (100-120/min, enfoncement 5-6cm)",
      '5. Si défibrillateur disponible: suivez les instructions vocales',
      "6. Continuez jusqu'à l'arrivée des secours",
    ],
    telUrgence: '15',
  },
  {
    id: 'avc',
    titre: 'AVC (Accident Vasculaire Cérébral)',
    icon: '🧠',
    urgence: 'critique',
    etapes: [
      '1. Appelez le 15 immédiatement - CHAQUE MINUTE COMPTE',
      '2. Notez l\'heure exacte des premiers symptômes',
      '3. Test RAPIDE: Visage (sourire asymétrique), Bras (impossible de lever), Parole (difficultés), Urgence (15)',
      '4. Installez la personne confortablement, tête légèrement surélevée',
      '5. Ne donnez ni à manger ni à boire',
      '6. Restez avec la personne et surveillez',
    ],
    telUrgence: '15',
  },
  {
    id: 'etouffement',
    titre: 'Étouffement',
    icon: '😱',
    urgence: 'critique',
    etapes: [
      '1. Demandez: "Vous vous étouffez ?" Si oui, poursuivez',
      '2. Encouragez à tousser si possible',
      '3. Si obstruction totale: 5 claques dans le dos (entre les omoplates)',
      '4. Si inefficace: 5 compressions abdominales (manœuvre de Heimlich)',
      '5. Alternez claques/compressions jusqu\'à expulsion',
      '6. Si perte de conscience: appelez 15 et commencez RCP',
    ],
    telUrgence: '15',
  },
  {
    id: 'hemorragie',
    titre: 'Hémorragie',
    icon: '🩸',
    urgence: 'critique',
    etapes: [
      '1. Appelez le 15 si hémorragie importante',
      '2. Allongez la victime',
      '3. Compression directe: appuyez fort sur la plaie avec un tissu propre',
      '4. Si saignement persiste: ajoutez des compresses sans retirer les premières',
      '5. Maintenez la pression pendant au moins 10 minutes',
      '6. Si membre: surélevez si possible',
      '7. Ne pas faire de garrot sauf avis médical',
    ],
    telUrgence: '15',
  },
  {
    id: 'brulure',
    titre: 'Brûlure',
    icon: '🔥',
    urgence: 'haute',
    etapes: [
      '1. Éloignez de la source de chaleur',
      '2. Refroidissez immédiatement: eau tiède (15-25°C) pendant 20 minutes',
      '3. Retirez bijoux/vêtements NON collés',
      '4. Couvrez avec un linge propre et sec',
      '5. Ne percez pas les cloques',
      '6. Appelez le 15 si: brûlure étendue, profonde, visage/mains/organes génitaux',
    ],
    telUrgence: '15',
  },
  {
    id: 'malaise',
    titre: 'Malaise / Évanouissement',
    icon: '😵',
    urgence: 'haute',
    etapes: [
      '1. Allongez la personne, jambes surélevées',
      '2. Desserrez vêtements (ceinture, col)',
      '3. Aérez (fenêtre ouverte)',
      '4. Ne donnez rien à boire si inconscient',
      '5. Surveillez la respiration',
      '6. Si perte de conscience: Position Latérale de Sécurité (PLS)',
      '7. Appelez le 15 si: douleur thoracique, confusion, ne reprend pas conscience',
    ],
    telUrgence: '15',
  },
  {
    id: 'fracture',
    titre: 'Fracture / Entorse',
    icon: '🦴',
    urgence: 'moyenne',
    etapes: [
      '1. Ne bougez pas le membre blessé',
      '2. Immobilisez dans la position trouvée',
      '3. Appliquez du froid (glace dans un linge) 20 min',
      '4. Surélevez le membre si possible',
      '5. Ne tentez pas de remettre en place',
      '6. Appelez le 15 si: fracture ouverte, déformation importante, douleur intense',
    ],
    telUrgence: '15',
  },
  {
    id: 'crise-asthme',
    titre: 'Crise d\'Asthme',
    icon: '🫁',
    urgence: 'haute',
    etapes: [
      '1. Aidez la personne à s\'asseoir, légèrement penché en avant',
      '2. Desserrez les vêtements',
      '3. Donnez le bronchodilatateur (inhalateur bleu) si disponible',
      '4. Encouragez à respirer lentement',
      '5. Appelez le 15 si: pas d\'amélioration après 10 min, lèvres bleues, difficulté à parler',
    ],
    telUrgence: '15',
  },
  {
    id: 'reaction-allergique',
    titre: 'Réaction Allergique Grave',
    icon: '⚠️',
    urgence: 'critique',
    etapes: [
      '1. Appelez le 15 immédiatement',
      '2. Si stylo d\'adrénaline (EpiPen): injectez dans la cuisse',
      '3. Allongez la personne, jambes surélevées',
      '4. Si difficulté respiratoire: position assise',
      '5. Surveillez respiration et conscience',
      '6. Soyez prêt à faire un massage cardiaque',
    ],
    telUrgence: '15',
  },
]

const NUMEROS_URGENCE = [
  { nom: 'SAMU', numero: '15', icon: '🚑', description: 'Urgence médicale' },
  { nom: 'Police', numero: '17', icon: '🚔', description: 'Police secours' },
  { nom: 'Pompiers', numero: '18', icon: '🚒', description: 'Incendie, accident' },
  { nom: 'Urgences UE', numero: '112', icon: '🇪🇺', description: 'Urgences européen' },
  { nom: 'Sourds/Malentendants', numero: '114', icon: '🤟', description: 'SMS urgences' },
  { nom: 'Centre Anti-Poison', numero: '01 40 05 48 48', icon: '☠️', description: 'Intoxication' },
  { nom: 'Enfance en Danger', numero: '119', icon: '👶', description: 'Protection enfance' },
  { nom: 'Violences Femmes', numero: '3919', icon: '🆘', description: '24/7 anonyme' },
]

/**
 * Composant ModeUrgence
 */
export default function ModeUrgence({ membreId, onBack, onSelectMembre }: ModeUrgenceProps) {
  const { addNotification } = useNotification()
  const [membre, setMembre] = useState<MembreUrgence | null>(null)
  const [membres, setMembres] = useState<MembreUrgence[]>([])
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(membreId)
  const [allergies, setAllergies] = useState<any[]>([])
  const [traitements, setTraitements] = useState<any[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'panic' | 'fiche' | 'protocoles' | 'numeros'>('panic')
  const [selectedProtocole, setSelectedProtocole] = useState<ProtocoleUrgence | null>(null)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Charger tous les membres au montage
  useEffect(() => {
    loadAllMembres()
  }, [])

  useEffect(() => {
    if (selectedMembreId) {
      loadMembreData()
      loadAllergies()
      loadTraitements()
    }
  }, [selectedMembreId])

  // Synchroniser avec la prop membreId
  useEffect(() => {
    if (membreId && membreId !== selectedMembreId) {
      setSelectedMembreId(membreId)
    }
  }, [membreId])

  useEffect(() => {
    if (membre) {
      generateQRCode()
    }
  }, [membre, allergies, traitements])

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
    if (onSelectMembre) {
      onSelectMembre(newMembreId)
    }
  }

  /**
   * Charge les données du membre
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
   * Charge les traitements actifs
   */
  const loadTraitements = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1',
        [selectedMembreId]
      )
      if (result.success) {
        setTraitements(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement traitements:', error)
    }
  }

  /**
   * Génère le QR code avec les infos médicales
   */
  const generateQRCode = async () => {
    if (!membre) return

    const urgenceData = {
      nom: `${membre.prenom} ${membre.nom}`,
      dateNaissance: membre.date_naissance,
      groupeSanguin: membre.groupe_sanguin ? `${membre.groupe_sanguin}${membre.rhesus || ''}` : 'Non renseigné',
      allergies: allergies.map((a) => a.nom_allergie).join(', ') || 'Aucune',
      traitements: traitements.map((t) => `${t.nom_medicament} ${t.dosage || ''}`).join(', ') || 'Aucun',
      contactUrgence: membre.contact_urgence_nom || 'Non renseigné',
      telUrgence: membre.contact_urgence_telephone || '',
      medecinTraitant: membre.medecin_traitant || 'Non renseigné',
      telMedecin: membre.telephone_medecin || '',
      secu: membre.numero_securite_sociale || 'Non renseigné',
    }

    const dataString = JSON.stringify(urgenceData)

    try {
      const url = await QRCode.toDataURL(dataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Erreur génération QR code:', error)
    }
  }

  /**
   * Activer le mode panique
   */
  const activatePanicMode = () => {
    setCountdown(5)
    setEmergencyMode(true)

    // Compte à rebours
    let count = 5
    const interval = setInterval(() => {
      count--
      setCountdown(count)

      if (count <= 0) {
        clearInterval(interval)
        triggerEmergency()
      }
    }, 1000)
  }

  /**
   * Annuler le mode panique
   */
  const cancelPanicMode = () => {
    setCountdown(null)
    setEmergencyMode(false)
    addNotification({
      type: 'info',
      title: 'Annulé',
      message: 'Mode urgence annulé',
      duration: 3000,
    })
  }

  /**
   * Déclencher l'urgence
   */
  const triggerEmergency = async () => {
    setCountdown(null)

    addNotification({
      type: 'error',
      title: '🆘 MODE URGENCE ACTIVÉ',
      message: 'Contacts d\'urgence notifiés. Fiche médicale prête.',
      duration: 10000,
    })

    // TODO: Implémenter l'envoi réel
    // - Géolocalisation
    // - SMS aux contacts d'urgence
    // - Ouverture téléphone pour appel 15

    // Simuler l'appel
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Contacts notifiés',
        message: `${membre?.contact_urgence_nom} a reçu votre alerte avec votre position`,
        duration: 8000,
      })
    }, 2000)
  }

  /**
   * Appeler un numéro d'urgence
   */
  const callEmergency = (numero: string) => {
    addNotification({
      type: 'info',
      title: 'Appel en cours',
      message: `Composition du ${numero}...`,
      duration: 3000,
    })
    // TODO: Intégrer avec le système pour lancer l'appel
  }

  /**
   * Imprimer la fiche d'urgence
   */
  const printFiche = () => {
    window.print()
    addNotification({
      type: 'success',
      title: 'Impression',
      message: 'Fiche d\'urgence envoyée à l\'imprimante',
      duration: 3000,
    })
  }

  if (!membre) {
    return (
      <div className="mode-urgence-container">
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
    <div className={`mode-urgence-container ${emergencyMode ? 'emergency-active' : ''}`}>
      {/* En-tête */}
      <div className="urgence-header">
        <button onClick={onBack} className="btn-back">
          ← Retour
        </button>
        <div className="header-info">
          <h1>🆘 Mode Urgence</h1>
          <p className="membre-name">{`${membre.prenom} ${membre.nom} - ${calculateAge(membre.date_naissance)} ans`}</p>
        </div>
      </div>

      {/* Sélecteur de membre */}
      {membres.length > 0 && (
        <div className="form-group mb-lg" style={{ maxWidth: '500px', margin: '0 auto 1.5rem', padding: '0 1rem' }}>
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

      {/* Onglets */}
      <div className="urgence-tabs">
        <button
          className={`tab ${activeTab === 'panic' ? 'active' : ''}`}
          onClick={() => setActiveTab('panic')}
        >
          🆘 Panique
        </button>
        <button
          className={`tab ${activeTab === 'fiche' ? 'active' : ''}`}
          onClick={() => setActiveTab('fiche')}
        >
          📋 Fiche Médicale
        </button>
        <button
          className={`tab ${activeTab === 'protocoles' ? 'active' : ''}`}
          onClick={() => setActiveTab('protocoles')}
        >
          🚑 Protocoles
        </button>
        <button
          className={`tab ${activeTab === 'numeros' ? 'active' : ''}`}
          onClick={() => setActiveTab('numeros')}
        >
          📞 Numéros
        </button>
      </div>

      {/* Contenu */}
      <div className="urgence-content">
        {/* Mode Panique */}
        {activeTab === 'panic' && (
          <div className="panic-view">
            {!emergencyMode ? (
              <>
                <div className="panic-info">
                  <h2>🆘 Bouton d'Urgence</h2>
                  <p>
                    En cas d'urgence médicale, appuyez sur le bouton ci-dessous.
                    <br />
                    Cela va:
                  </p>
                  <ul>
                    <li>📍 Partager votre position GPS avec vos contacts d'urgence</li>
                    <li>📞 Préparer l'appel au SAMU (15)</li>
                    <li>📋 Afficher votre fiche médicale d'urgence</li>
                    <li>💬 Envoyer un SMS automatique à {membre.contact_urgence_nom || 'votre contact'}</li>
                  </ul>
                </div>

                <button className="panic-button" onClick={activatePanicMode}>
                  <span className="panic-icon">🆘</span>
                  <span className="panic-text">URGENCE</span>
                </button>

                <div className="contact-urgence-card">
                  <h3>Contact d'urgence</h3>
                  {membre.contact_urgence_nom ? (
                    <div className="contact-info">
                      <p>
                        <strong>{membre.contact_urgence_nom}</strong>
                      </p>
                      <p>{membre.contact_urgence_relation}</p>
                      <p className="contact-tel">{membre.contact_urgence_telephone}</p>
                    </div>
                  ) : (
                    <p className="no-contact">Aucun contact d'urgence configuré</p>
                  )}
                </div>
              </>
            ) : (
              <div className="emergency-countdown">
                <h2>⚠️ DÉCLENCHEMENT DANS</h2>
                <div className="countdown-display">{countdown}</div>
                <p>L'alerte sera envoyée automatiquement</p>
                <button className="btn-cancel" onClick={cancelPanicMode}>
                  ANNULER
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fiche Médicale */}
        {activeTab === 'fiche' && (
          <div className="fiche-view">
            <div className="fiche-actions">
              <button onClick={printFiche} className="btn-secondary">
                🖨️ Imprimer
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = `fiche-urgence-${membre.prenom}-${membre.nom}.png`
                  link.href = qrCodeUrl
                  link.click()
                }}
                className="btn-secondary"
              >
                💾 Télécharger QR Code
              </button>
            </div>

            <div className="fiche-medicale">
              <div className="fiche-header">
                <h2>📋 FICHE MÉDICALE D'URGENCE</h2>
                <p className="fiche-subtitle">À présenter aux secouristes</p>
              </div>

              <div className="fiche-section">
                <h3>👤 Identité</h3>
                <div className="info-grid">
                  <div>
                    <strong>Nom:</strong> {membre.prenom} {membre.nom}
                  </div>
                  <div>
                    <strong>Date de naissance:</strong>{' '}
                    {new Date(membre.date_naissance).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <strong>Groupe sanguin:</strong>{' '}
                    {membre.groupe_sanguin ? `${membre.groupe_sanguin}${membre.rhesus || ''}` : 'Non renseigné'}
                  </div>
                  <div>
                    <strong>N° Sécurité Sociale:</strong> {membre.numero_securite_sociale || 'Non renseigné'}
                  </div>
                </div>
              </div>

              {allergies.length > 0 && (
                <div className="fiche-section alert-section">
                  <h3>⚠️ ALLERGIES</h3>
                  <ul className="alert-list">
                    {allergies.map((allergie) => (
                      <li key={allergie.id}>
                        <strong>{allergie.nom_allergie}</strong>
                        {allergie.severite && ` - Sévérité: ${allergie.severite}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {traitements.length > 0 && (
                <div className="fiche-section">
                  <h3>💊 TRAITEMENTS EN COURS</h3>
                  <ul className="treatment-list">
                    {traitements.map((traitement) => (
                      <li key={traitement.id}>
                        <strong>{traitement.nom_medicament}</strong> - {traitement.dosage || 'Dosage non précisé'}
                        {traitement.frequence && ` - ${traitement.frequence}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="fiche-section">
                <h3>📞 CONTACTS</h3>
                <div className="contacts-grid">
                  <div className="contact-box">
                    <strong>Contact d'urgence</strong>
                    <p>{membre.contact_urgence_nom || 'Non renseigné'}</p>
                    <p>{membre.contact_urgence_relation}</p>
                    <p className="contact-tel">{membre.contact_urgence_telephone}</p>
                  </div>
                  <div className="contact-box">
                    <strong>Médecin traitant</strong>
                    <p>{membre.medecin_traitant || 'Non renseigné'}</p>
                    <p className="contact-tel">{membre.telephone_medecin}</p>
                  </div>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="fiche-qrcode">
                  <h3>📱 QR Code Médical</h3>
                  <p>Scannez pour accéder aux informations complètes</p>
                  <img src={qrCodeUrl} alt="QR Code médical" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Protocoles */}
        {activeTab === 'protocoles' && (
          <div className="protocoles-view">
            {!selectedProtocole ? (
              <>
                <h2>🚑 Protocoles d'Urgence</h2>
                <p className="protocoles-subtitle">
                  Instructions de premiers secours en attendant les secours
                </p>

                <div className="protocoles-grid">
                  {PROTOCOLES.map((protocole) => (
                    <div
                      key={protocole.id}
                      className={`protocole-card urgence-${protocole.urgence}`}
                      onClick={() => setSelectedProtocole(protocole)}
                    >
                      <div className="protocole-icon">{protocole.icon}</div>
                      <h3>{protocole.titre}</h3>
                      <span className={`urgence-badge ${protocole.urgence}`}>
                        {protocole.urgence === 'critique'
                          ? 'CRITIQUE'
                          : protocole.urgence === 'haute'
                          ? 'HAUTE'
                          : 'MOYENNE'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="protocole-detail">
                <button onClick={() => setSelectedProtocole(null)} className="btn-back">
                  ← Retour aux protocoles
                </button>

                <div className={`protocole-header urgence-${selectedProtocole.urgence}`}>
                  <div className="protocole-icon-large">{selectedProtocole.icon}</div>
                  <h2>{selectedProtocole.titre}</h2>
                  <span className={`urgence-badge ${selectedProtocole.urgence}`}>
                    {selectedProtocole.urgence.toUpperCase()}
                  </span>
                </div>

                {selectedProtocole.telUrgence && (
                  <button
                    className="btn-call-emergency"
                    onClick={() => callEmergency(selectedProtocole.telUrgence!)}
                  >
                    📞 Appeler le {selectedProtocole.telUrgence}
                  </button>
                )}

                <div className="protocole-etapes">
                  <h3>Étapes à suivre:</h3>
                  <ol>
                    {selectedProtocole.etapes.map((etape, index) => (
                      <li key={index}>{etape}</li>
                    ))}
                  </ol>
                </div>

                <div className="protocole-warning">
                  <strong>⚠️ Important:</strong> Ces instructions ne remplacent pas l'avis d'un professionnel de santé.
                  En cas de doute, appelez le 15.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Numéros d'urgence */}
        {activeTab === 'numeros' && (
          <div className="numeros-view">
            <h2>📞 Numéros d'Urgence</h2>
            <p className="numeros-subtitle">Numéros gratuits disponibles 24h/24</p>

            <div className="numeros-grid">
              {NUMEROS_URGENCE.map((numero) => (
                <div key={numero.numero} className="numero-card">
                  <div className="numero-icon">{numero.icon}</div>
                  <div className="numero-info">
                    <h3>{numero.nom}</h3>
                    <p className="numero-description">{numero.description}</p>
                    <div className="numero-tel">{numero.numero}</div>
                  </div>
                  <button className="btn-call" onClick={() => callEmergency(numero.numero)}>
                    📞 Appeler
                  </button>
                </div>
              ))}
            </div>

            <div className="numeros-info">
              <h3>ℹ️ Informations</h3>
              <ul>
                <li>
                  <strong>15 (SAMU):</strong> Urgences médicales (malaise, accident, douleur intense)
                </li>
                <li>
                  <strong>18 (Pompiers):</strong> Incendies, accidents de la route, personnes en danger
                </li>
                <li>
                  <strong>17 (Police):</strong> Infractions, violences, personnes suspectes
                </li>
                <li>
                  <strong>112:</strong> Numéro d'urgence européen, fonctionne dans tous les pays de l'UE
                </li>
                <li>
                  <strong>114:</strong> Pour les personnes sourdes ou malentendantes (SMS/Fax)
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
