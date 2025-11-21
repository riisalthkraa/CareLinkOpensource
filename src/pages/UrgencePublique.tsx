/**
 * Urgence Publique - Protocoles et numéros d'urgence accessibles SANS connexion
 *
 * Fonctionnalités:
 * - Accès aux protocoles de premiers secours
 * - Numéros d'urgence français et européens
 * - Aucune donnée personnelle (pas besoin de mot de passe)
 * - Accessible depuis l'écran de connexion
 *
 * @module pages/UrgencePublique
 */

import { useState } from 'react'
import '../styles/mode-urgence.css'

interface UrgencePubliqueProps {
  onClose: () => void
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
      '3. Aidez-la à utiliser son inhalateur (bronchodilatateur)',
      '4. Encouragez à respirer lentement',
      '5. Appelez le 15 si: pas d\'amélioration après 10 min, lèvres bleues, confusion, épuisement',
      '6. Continuez à rassurer en attendant les secours',
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
 * Composant UrgencePublique
 */
export default function UrgencePublique({ onClose }: UrgencePubliqueProps) {
  const [activeTab, setActiveTab] = useState<'numeros' | 'protocoles'>('numeros')
  const [selectedProtocole, setSelectedProtocole] = useState<ProtocoleUrgence | null>(null)

  // Fonction pour appeler un numéro d'urgence (ouvre le téléphone sur mobile)
  const callNumber = (numero: string) => {
    window.location.href = `tel:${numero}`
  }

  return (
    <div className="login-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-md)',
          borderBottom: '2px solid var(--border-light)'
        }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 'var(--spacing-xs)' }}>🆘 Mode Urgence Public</h1>
            <p className="text-secondary">Accessible sans connexion</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
          >
            ✕ Fermer
          </button>
        </div>

        {/* Alert Info */}
        <div className="alert alert-warning mb-lg">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Urgence Vitale</div>
            <div className="alert-message">
              En cas d'urgence vitale, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong> immédiatement.
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mb-lg">
          <button
            className={`tab-btn ${activeTab === 'numeros' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('numeros')
              setSelectedProtocole(null)
            }}
          >
            📞 Numéros d'Urgence
          </button>
          <button
            className={`tab-btn ${activeTab === 'protocoles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('protocoles')
              setSelectedProtocole(null)
            }}
          >
            🩺 Protocoles de Secours
          </button>
        </div>

        {/* Content */}
        {activeTab === 'numeros' && (
          <div>
            <h3 className="h3 mb-md">Numéros d'Urgence France</h3>
            <div className="grid grid-cols-2 gap-md">
              {NUMEROS_URGENCE.map((numero) => (
                <div key={numero.numero} className="card" style={{
                  padding: 'var(--spacing-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid var(--border-light)'
                }}
                onClick={() => callNumber(numero.numero)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>{numero.icon}</div>
                  <h4 className="h4" style={{ marginBottom: 'var(--spacing-xs)' }}>{numero.nom}</h4>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    {numero.numero}
                  </div>
                  <p className="text-sm text-secondary">{numero.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'protocoles' && !selectedProtocole && (
          <div>
            <h3 className="h3 mb-md">Protocoles de Premiers Secours</h3>
            <div className="grid grid-cols-2 gap-md">
              {PROTOCOLES.map((protocole) => (
                <div
                  key={protocole.id}
                  className="card"
                  style={{
                    padding: 'var(--spacing-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '2px solid var(--border-light)',
                    borderLeft: `4px solid ${
                      protocole.urgence === 'critique' ? 'var(--error)' :
                      protocole.urgence === 'haute' ? 'var(--warning)' :
                      'var(--info)'
                    }`
                  }}
                  onClick={() => setSelectedProtocole(protocole)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>{protocole.icon}</div>
                  <h4 className="h4">{protocole.titre}</h4>
                  <div style={{ marginTop: 'var(--spacing-xs)' }}>
                    <span className={`badge badge-${
                      protocole.urgence === 'critique' ? 'error' :
                      protocole.urgence === 'haute' ? 'warning' :
                      'info'
                    }`}>
                      {protocole.urgence === 'critique' ? '🔴 CRITIQUE' :
                       protocole.urgence === 'haute' ? '🟠 HAUTE' :
                       '🟡 MOYENNE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProtocole && (
          <div>
            <button
              className="btn btn-secondary btn-sm mb-md"
              onClick={() => setSelectedProtocole(null)}
            >
              ← Retour aux protocoles
            </button>

            <div className="card" style={{
              padding: 'var(--spacing-lg)',
              borderLeft: `4px solid ${
                selectedProtocole.urgence === 'critique' ? 'var(--error)' :
                selectedProtocole.urgence === 'haute' ? 'var(--warning)' :
                'var(--info)'
              }`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '3rem' }}>{selectedProtocole.icon}</div>
                <div>
                  <h2 className="h2">{selectedProtocole.titre}</h2>
                  <span className={`badge badge-${
                    selectedProtocole.urgence === 'critique' ? 'error' :
                    selectedProtocole.urgence === 'haute' ? 'warning' :
                    'info'
                  }`}>
                    {selectedProtocole.urgence === 'critique' ? '🔴 URGENCE CRITIQUE' :
                     selectedProtocole.urgence === 'haute' ? '🟠 URGENCE HAUTE' :
                     '🟡 URGENCE MOYENNE'}
                  </span>
                </div>
              </div>

              {selectedProtocole.telUrgence && (
                <div className="alert alert-error mb-md">
                  <span className="alert-icon">📞</span>
                  <div className="alert-content">
                    <div className="alert-title">Appelez immédiatement</div>
                    <div className="alert-message">
                      <button
                        className="btn btn-error"
                        onClick={() => callNumber(selectedProtocole.telUrgence!)}
                        style={{ marginTop: 'var(--spacing-sm)' }}
                      >
                        📞 Appeler le {selectedProtocole.telUrgence}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="h3 mb-md">Étapes à suivre :</h3>
              <ol style={{
                listStyle: 'none',
                padding: 0,
                fontSize: '1.1rem',
                lineHeight: '1.8'
              }}>
                {selectedProtocole.etapes.map((etape, index) => (
                  <li
                    key={index}
                    style={{
                      padding: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--primary)'
                    }}
                  >
                    {etape}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-lg" style={{
          paddingTop: 'var(--spacing-md)',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center'
        }}>
          <p className="text-sm text-secondary">
            ℹ️ Ces informations ne remplacent pas un avis médical professionnel.<br/>
            En cas de doute, contactez toujours les services d'urgence.
          </p>
        </div>
      </div>
    </div>
  )
}
