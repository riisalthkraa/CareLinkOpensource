/**
 * ProfilMembre - Page de profil détaillé d'un membre de la famille
 *
 * Affiche et permet de modifier toutes les informations d'un membre:
 * - Informations personnelles (nom, prénom, âge, date de naissance)
 * - Données médicales (groupe sanguin, poids, taille, IMC)
 * - Contacts (téléphone, email)
 * - Médecin traitant et contact d'urgence
 * - Notes additionnelles
 *
 * FONCTIONNALITÉS:
 * - Affichage du profil complet
 * - Mode édition pour modifier les informations
 * - Calcul automatique de l'âge et de l'IMC
 * - Formatage des dates en français
 * - Bouton retour vers le dashboard
 *
 * @module ProfilMembre
 */

import { useState, useEffect } from 'react'
import { Membre } from '../types'
import { useNotification } from '../contexts/NotificationContext'

/**
 * Props du composant ProfilMembre
 *
 * @interface ProfilMembreProps
 * @property {number | null} membreId - ID du membre à afficher
 * @property {function} onBack - Callback pour retourner au dashboard
 * @property {function} onNavigate - Callback pour naviguer vers une autre page (optionnel)
 */
interface ProfilMembreProps {
  membreId: number | null
  onBack: () => void
  onNavigate?: (page: string) => void
}

function ProfilMembre({ membreId, onBack, onNavigate }: ProfilMembreProps) {
  const [membre, setMembre] = useState<Membre | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const { addNotification } = useNotification()
  const [decryptedNotes, setDecryptedNotes] = useState<string>('')
  const [allergies, setAllergies] = useState<any[]>([])
  const [vaccins, setVaccins] = useState<any[]>([])
  const [traitements, setTraitements] = useState<any[]>([])
  const [showTips, setShowTips] = useState(true)

  useEffect(() => {
    if (membreId) {
      loadMembre()
      loadAllergies()
      loadVaccins()
      loadTraitements()
    }
  }, [membreId])

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

  const loadMembre = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM membres WHERE id = ?',
        [membreId]
      )
      if (result.success && result.data.length > 0) {
        const membreData = result.data[0]
        setMembre(membreData)

        // Déchiffrer les notes
        const notesDecrypted = await decryptText(membreData.notes)
        setDecryptedNotes(notesDecrypted)
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error)
    }
  }

  const loadAllergies = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM allergies WHERE membre_id = ? ORDER BY severite DESC',
        [membreId]
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

  const loadVaccins = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM vaccins WHERE membre_id = ? ORDER BY date_administration DESC LIMIT 3',
        [membreId]
      )
      if (result.success) {
        setVaccins(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement vaccins:', error)
    }
  }

  const loadTraitements = async () => {
    try {
      const result = await window.electronAPI.dbQuery(
        'SELECT * FROM traitements WHERE membre_id = ? AND actif = 1 ORDER BY date_debut DESC LIMIT 3',
        [membreId]
      )
      if (result.success) {
        setTraitements(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement traitements:', error)
    }
  }

  if (!membre) {
    return <div className="profil-membre"><div className="card">Chargement...</div></div>
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateIMC = () => {
    if (membre.poids && membre.taille) {
      const tailleMetre = membre.taille / 100
      const imc = membre.poids / (tailleMetre * tailleMetre)
      return imc.toFixed(1)
    }
    return null
  }

  /**
   * Initialise le mode édition en copiant les données du membre
   */
  const startEditing = () => {
    setEditForm({ ...membre })
    setIsEditing(true)
  }

  /**
   * Annule l'édition et restaure les données d'origine
   */
  const handleCancel = () => {
    setEditForm(null)
    setIsEditing(false)
  }

  /**
   * Sauvegarde les modifications dans la base de données
   */
  const handleSave = async () => {
    try {
      const result = await window.electronAPI.dbRun(
        `UPDATE membres SET
          nom = ?, prenom = ?, date_naissance = ?, sexe = ?,
          groupe_sanguin = ?, rhesus = ?, poids = ?, taille = ?,
          telephone = ?, email = ?, numero_securite_sociale = ?,
          medecin_traitant = ?, telephone_medecin = ?,
          contact_urgence_nom = ?, contact_urgence_telephone = ?,
          contact_urgence_relation = ?, notes = ?
        WHERE id = ?`,
        [
          editForm.nom,
          editForm.prenom,
          editForm.date_naissance,
          editForm.sexe || null,
          editForm.groupe_sanguin || null,
          editForm.rhesus || null,
          editForm.poids ? parseFloat(editForm.poids) : null,
          editForm.taille ? parseInt(editForm.taille) : null,
          editForm.telephone || null,
          editForm.email || null,
          editForm.numero_securite_sociale || null,
          editForm.medecin_traitant || null,
          editForm.telephone_medecin || null,
          editForm.contact_urgence_nom || null,
          editForm.contact_urgence_telephone || null,
          editForm.contact_urgence_relation || null,
          editForm.notes || null,
          membreId
        ]
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Profil mis à jour',
          message: `Les modifications ont été enregistrées`
        })
        setIsEditing(false)
        setEditForm(null)
        loadMembre() // Recharger les données
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder les modifications'
      })
    }
  }

  return (
    <div className="profil-membre">
      <div className="page-header mb-lg">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
          {membre && (
            <div>
              <h1 className="h1 m-0">👤 Profil de {membre.prenom} {membre.nom}</h1>
              <p className="text-sm text-secondary m-0">{calculateAge(membre.date_naissance)} ans</p>
            </div>
          )}
        </div>
        {!isEditing ? (
          <div className="page-header-right">
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate && onNavigate('carte-urgence')}
              title="Générer une carte d'urgence imprimable"
            >
              🚨 Carte d'Urgence
            </button>
            <button className="btn btn-primary" onClick={startEditing}>
              ✏️ Modifier
            </button>
          </div>
        ) : (
          <div className="page-header-right">
            <button className="btn btn-success" onClick={handleSave}>
              ✅ Enregistrer
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              ❌ Annuler
            </button>
          </div>
        )}
      </div>

      <div className="profil-header">
        <div className="profil-avatar-large">
          {membre.prenom.charAt(0).toUpperCase()}
        </div>
        <div className="profil-header-info">
          <h2>{membre.prenom} {membre.nom}</h2>
          <p className="age">{calculateAge(membre.date_naissance)} ans</p>
          {membre.sexe && <p className="sexe">👤 {membre.sexe === 'M' ? 'Masculin' : membre.sexe === 'F' ? 'Féminin' : 'Autre'}</p>}
        </div>
      </div>

      <div className="profil-sections">
        {!isEditing ? (
          <>
            {/* MODE AFFICHAGE - Informations de base */}
            <div className="card">
              <h3>📋 Informations de base</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Date de naissance</span>
                  <span className="value">{formatDate(membre.date_naissance)}</span>
                </div>
                {membre.sexe && (
                  <div className="info-item">
                    <span className="label">Sexe</span>
                    <span className="value">{membre.sexe === 'M' ? 'Masculin' : membre.sexe === 'F' ? 'Féminin' : 'Autre'}</span>
                  </div>
                )}
                {membre.telephone && (
                  <div className="info-item">
                    <span className="label">Téléphone</span>
                    <span className="value">{membre.telephone}</span>
                  </div>
                )}
                {membre.email && (
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">{membre.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* MODE AFFICHAGE - Informations médicales */}
            <div className="card">
              <h3>🩺 Informations médicales</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Groupe sanguin</span>
                  <span className="value">
                    {membre.groupe_sanguin && membre.rhesus
                      ? `${membre.groupe_sanguin} ${membre.rhesus}`
                      : membre.groupe_sanguin || 'Non renseigné'}
                  </span>
                </div>
                {membre.poids && (
                  <div className="info-item">
                    <span className="label">Poids</span>
                    <span className="value">{membre.poids} kg</span>
                  </div>
                )}
                {membre.taille && (
                  <div className="info-item">
                    <span className="label">Taille</span>
                    <span className="value">{membre.taille} cm</span>
                  </div>
                )}
                {calculateIMC() && (
                  <div className="info-item">
                    <span className="label">IMC</span>
                    <span className="value">{calculateIMC()}</span>
                  </div>
                )}
                {membre.numero_securite_sociale && (
                  <div className="info-item full-width">
                    <span className="label">N° Sécurité Sociale</span>
                    <span className="value">{membre.numero_securite_sociale}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* MODE ÉDITION - Formulaire */}
            <div className="card">
              <h3>✏️ Modifier le profil</h3>

              {/* Aide à la modification */}
              <div className="alert alert-success mb-lg">
                <span className="alert-icon" aria-hidden="true">✅</span>
                <div className="alert-content">
                  <div className="alert-title">Informations importantes à renseigner</div>
                  <div className="alert-message">
                    <ul style={{ margin: '0.5rem 0 0 1.5rem', lineHeight: '1.8' }}>
                      <li><strong>Groupe sanguin</strong> : essentiel en cas de transfusion d'urgence</li>
                      <li><strong>Médecin traitant</strong> : contact pour coordonner les soins</li>
                      <li><strong>Contact d'urgence</strong> : personne à prévenir en priorité</li>
                      <li><strong>Poids/Taille</strong> : nécessaire pour calculer les dosages médicamenteux</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form>
                {/* Informations de base */}
                <div className="form-section">
                  <h4>📋 Informations de base</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        value={editForm.prenom}
                        onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={editForm.nom}
                        onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date de naissance *</label>
                      <input
                        type="date"
                        value={editForm.date_naissance}
                        onChange={(e) => setEditForm({ ...editForm, date_naissance: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Sexe</label>
                      <select
                        value={editForm.sexe || ''}
                        onChange={(e) => setEditForm({ ...editForm, sexe: e.target.value })}
                      >
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        value={editForm.telephone || ''}
                        onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="exemple@email.com"
                      />
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
                        value={editForm.groupe_sanguin || ''}
                        onChange={(e) => setEditForm({ ...editForm, groupe_sanguin: e.target.value })}
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
                        value={editForm.rhesus || ''}
                        onChange={(e) => setEditForm({ ...editForm, rhesus: e.target.value })}
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
                        value={editForm.poids || ''}
                        onChange={(e) => setEditForm({ ...editForm, poids: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Taille (cm)</label>
                      <input
                        type="number"
                        value={editForm.taille || ''}
                        onChange={(e) => setEditForm({ ...editForm, taille: e.target.value })}
                        placeholder="175"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>N° Sécurité Sociale</label>
                    <input
                      type="text"
                      value={editForm.numero_securite_sociale || ''}
                      onChange={(e) => setEditForm({ ...editForm, numero_securite_sociale: e.target.value })}
                      placeholder="1 23 45 67 890 123 45"
                    />
                  </div>
                </div>

                {/* Médecin traitant */}
                <div className="form-section">
                  <h4>👨‍⚕️ Médecin traitant</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom du médecin</label>
                      <input
                        type="text"
                        value={editForm.medecin_traitant || ''}
                        onChange={(e) => setEditForm({ ...editForm, medecin_traitant: e.target.value })}
                        placeholder="Dr. Martin Dupont"
                      />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        value={editForm.telephone_medecin || ''}
                        onChange={(e) => setEditForm({ ...editForm, telephone_medecin: e.target.value })}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact d'urgence */}
                <div className="form-section">
                  <h4>🚨 Contact d'urgence</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        value={editForm.contact_urgence_nom || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact_urgence_nom: e.target.value })}
                        placeholder="Marie Durand"
                      />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        value={editForm.contact_urgence_telephone || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact_urgence_telephone: e.target.value })}
                        placeholder="06 98 76 54 32"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <input
                      type="text"
                      value={editForm.contact_urgence_relation || ''}
                      onChange={(e) => setEditForm({ ...editForm, contact_urgence_relation: e.target.value })}
                      placeholder="Mère, Père, Conjoint(e), etc."
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                  <h4>📝 Notes</h4>
                  <div className="form-group">
                    <label>Notes additionnelles</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Informations complémentaires..."
                      rows={4}
                    />
                  </div>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Sections en mode affichage uniquement */}
        {!isEditing && (
          <>
            {/* Médecin traitant */}
            {(membre.medecin_traitant || membre.telephone_medecin) && (
              <div className="card">
                <h3>👨‍⚕️ Médecin traitant</h3>
                <div className="info-grid">
                  {membre.medecin_traitant && (
                    <div className="info-item">
                      <span className="label">Nom</span>
                      <span className="value">{membre.medecin_traitant}</span>
                    </div>
                  )}
                  {membre.telephone_medecin && (
                    <div className="info-item">
                      <span className="label">Téléphone</span>
                      <span className="value">{membre.telephone_medecin}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact d'urgence */}
            {(membre.contact_urgence_nom || membre.contact_urgence_telephone) && (
              <div className="card card-urgence">
                <h3>🚨 Contact d'urgence</h3>
                <div className="info-grid">
                  {membre.contact_urgence_nom && (
                    <div className="info-item">
                      <span className="label">Nom</span>
                      <span className="value">{membre.contact_urgence_nom}</span>
                    </div>
                  )}
                  {membre.contact_urgence_telephone && (
                    <div className="info-item">
                      <span className="label">Téléphone</span>
                      <span className="value">
                        <a href={`tel:${membre.contact_urgence_telephone}`}>
                          {membre.contact_urgence_telephone}
                        </a>
                      </span>
                    </div>
                  )}
                  {membre.contact_urgence_relation && (
                    <div className="info-item">
                      <span className="label">Relation</span>
                      <span className="value">{membre.contact_urgence_relation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {decryptedNotes && (
              <div className="card">
                <h3>📝 Notes</h3>
                <p className="notes-content">{decryptedNotes}</p>
              </div>
            )}
          </>
        )}

        {/* Tip d'aide */}
        {showTips && !isEditing && (
          <div className="tip-box tip-info">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              <strong>Profil médical complet</strong>
              <p>
                Ce profil regroupe toutes les <strong>informations essentielles</strong> de {membre.prenom}.
                Pensez à remplir le <strong>groupe sanguin</strong>, le <strong>médecin traitant</strong>
                et le <strong>contact d'urgence</strong> - ces informations peuvent être vitales en cas d'urgence !
                La carte d'urgence imprimable en contient un résumé.
              </p>
            </div>
          </div>
        )}

        {/* Allergies */}
        <div className="card card-urgence">
          <div className="card-header-inline">
            <h3>🔴 ALLERGIES</h3>
          </div>
          {allergies.length === 0 ? (
            <p className="widget-empty">
              ✅ Aucune allergie renseignée - Excellent ! Si {membre.prenom} développe une allergie,
              n'oubliez pas de la signaler ici pour éviter les interactions médicamenteuses.
            </p>
          ) : (
            <div className="allergies-list">
              {allergies.map((allergie: any) => (
                <div key={allergie.id} className={`allergie-item severite-${allergie.severite}`}>
                  <div className="allergie-header">
                    <strong>{allergie.nom_allergie}</strong>
                    <span className="badge-severite">{allergie.severite?.toUpperCase()}</span>
                  </div>
                  {allergie.type_allergie && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Type: {allergie.type_allergie}
                    </div>
                  )}
                  {allergie.description && <p>{allergie.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vaccins récents */}
        <div className="card">
          <div className="card-header-inline">
            <h3>💉 Vaccins récents</h3>
            <button
              className="btn-secondary btn-small"
              onClick={() => onNavigate && onNavigate('vaccins')}
            >
              Voir tout →
            </button>
          </div>
          {vaccins.length === 0 ? (
            <p className="widget-empty">Aucun vaccin enregistré</p>
          ) : (
            <div className="vaccins-mini-list">
              {vaccins.map((vaccin: any) => (
                <div key={vaccin.id} className="vaccin-mini-item">
                  <span className="vaccin-nom">💉 {vaccin.nom_vaccin}</span>
                  <span className="vaccin-date">
                    {vaccin.date_administration
                      ? new Date(vaccin.date_administration).toLocaleDateString('fr-FR')
                      : 'Date non renseignée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traitements actifs */}
        <div className="card">
          <div className="card-header-inline">
            <h3>💊 Traitements actifs</h3>
            <button
              className="btn-secondary btn-small"
              onClick={() => onNavigate && onNavigate('traitements')}
            >
              Voir tout →
            </button>
          </div>
          {traitements.length === 0 ? (
            <p className="widget-empty">Aucun traitement actif</p>
          ) : (
            <div className="traitements-mini-list">
              {traitements.map((traitement: any) => (
                <div key={traitement.id} className="traitement-mini-item">
                  <span className="traitement-nom">💊 {traitement.nom_medicament}</span>
                  <span className="traitement-details">
                    {traitement.dosage && `${traitement.dosage} • `}
                    {traitement.frequence || 'Fréquence non renseignée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilMembre
