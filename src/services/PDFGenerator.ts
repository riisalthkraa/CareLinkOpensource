/**
 * PDFGenerator - Service de génération de cartes d'urgence au format PDF
 *
 * Ce service permet de:
 * - Générer des cartes d'urgence au format carte de crédit (85.6 x 53.98 mm)
 * - Inclure un QR code avec les données médicales
 * - Créer un format imprimable et portable
 * - Optimiser pour impression recto-verso
 *
 * Format de carte standard:
 * - Taille: 85.6 x 53.98 mm (format CB)
 * - Orientation: Paysage
 * - Marges: 3mm
 * - Qualité: 300 DPI
 *
 * @module PDFGenerator
 */

import { Membre, Allergie, Traitement } from '../types'

/**
 * Options de génération de la carte d'urgence
 */
export interface OptionsCarteUrgence {
  includeQRCode: boolean
  includePhoto: boolean
  couleurTheme: string
  formatImpression: 'recto' | 'recto-verso'
}

/**
 * Génère une carte d'urgence au format HTML imprimable
 *
 * Cette fonction génère le HTML d'une carte d'urgence qui peut être
 * imprimée ou convertie en PDF via window.print()
 *
 * @param membre - Le membre de la famille
 * @param allergies - Liste des allergies
 * @param traitements - Liste des traitements actifs
 * @param qrCodeBase64 - Le QR code en base64
 * @param options - Options de génération
 * @returns string - Le HTML de la carte
 */
export function genererHTMLCarteUrgence(
  membre: Membre,
  allergies: Allergie[],
  traitements: Traitement[],
  qrCodeBase64: string,
  options: Partial<OptionsCarteUrgence> = {}
): string {
  const opts: OptionsCarteUrgence = {
    includeQRCode: true,
    includePhoto: false,
    couleurTheme: '#e74c3c',
    formatImpression: 'recto-verso',
    ...options
  }

  const age = calculerAge(membre.date_naissance)
  const groupeSanguin = membre.groupe_sanguin && membre.rhesus
    ? `${membre.groupe_sanguin}${membre.rhesus}`
    : 'Non renseigné'

  // Liste des allergies (max 3 pour l'espace)
  const allergiesList = allergies
    .slice(0, 3)
    .map(a => a.nom_allergie)
    .join(', ') || 'Aucune'

  // Liste des traitements actifs (max 3)
  const traitementsActifs = traitements
    .filter(t => t.actif === 1)
    .slice(0, 3)
    .map(t => t.nom_medicament)
    .join(', ') || 'Aucun'

  // HTML de la carte - RECTO
  const htmlRecto = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Carte d'Urgence - ${membre.prenom} ${membre.nom}</title>
  <style>
    @page {
      size: 85.6mm 53.98mm;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .carte-container {
      width: 85.6mm;
      height: 53.98mm;
      background: linear-gradient(135deg, ${opts.couleurTheme} 0%, ${adjustColor(opts.couleurTheme, -30)} 100%);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      overflow: hidden;
      position: relative;
      page-break-after: always;
    }

    .carte-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 12px;
      border-bottom: 3px solid ${opts.couleurTheme};
    }

    .carte-title {
      font-size: 13px;
      font-weight: bold;
      color: ${opts.couleurTheme};
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .urgence-icon {
      font-size: 16px;
    }

    .carte-body {
      padding: 10px 12px;
      color: white;
      height: calc(100% - 40px);
      display: flex;
      gap: 10px;
    }

    .carte-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-nom {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 2px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .info-item {
      font-size: 9px;
      display: flex;
      gap: 4px;
      align-items: flex-start;
    }

    .info-label {
      font-weight: 600;
      min-width: 70px;
      opacity: 0.9;
    }

    .info-value {
      font-weight: 400;
      flex: 1;
    }

    .carte-qr {
      width: 100px;
      height: 100px;
      background: white;
      border-radius: 6px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .carte-qr img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .carte-footer {
      position: absolute;
      bottom: 5px;
      left: 12px;
      right: 12px;
      font-size: 7px;
      color: rgba(255,255,255,0.8);
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.3);
      padding-top: 3px;
    }

    .groupe-sanguin-badge {
      position: absolute;
      top: 45px;
      right: 12px;
      background: white;
      color: ${opts.couleurTheme};
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .carte-container {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="carte-container">
    <div class="carte-header">
      <div class="carte-title">
        <span class="urgence-icon">🚨</span>
        Carte d'Urgence Médicale
      </div>
    </div>

    <div class="carte-body">
      <div class="carte-info">
        <div class="info-nom">${membre.prenom} ${membre.nom}</div>

        <div class="info-item">
          <span class="info-label">Âge:</span>
          <span class="info-value">${age} ans</span>
        </div>

        <div class="info-item">
          <span class="info-label">Groupe sanguin:</span>
          <span class="info-value">${groupeSanguin}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Allergies:</span>
          <span class="info-value">${allergiesList}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Traitements:</span>
          <span class="info-value">${traitementsActifs}</span>
        </div>

        ${membre.contact_urgence_nom ? `
        <div class="info-item" style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px;">
          <span class="info-label">Contact:</span>
          <span class="info-value">${membre.contact_urgence_nom} - ${membre.contact_urgence_telephone || ''}</span>
        </div>
        ` : ''}
      </div>

      ${opts.includeQRCode ? `
      <div class="carte-qr">
        <img src="${qrCodeBase64}" alt="QR Code Urgence" />
      </div>
      ` : ''}
    </div>

    <div class="carte-footer">
      Généré par CareLink - ${new Date().toLocaleDateString('fr-FR')} - Scanner le QR code pour plus d'infos
    </div>
  </div>
</body>
</html>
  `

  return htmlRecto
}

/**
 * Ouvre la fenêtre d'impression du navigateur avec la carte générée
 *
 * @param htmlCarte - Le HTML de la carte à imprimer
 */
export function imprimerCarteUrgence(htmlCarte: string): void {
  // Créer une fenêtre popup pour l'impression
  const printWindow = window.open('', '_blank', 'width=800,height=600')

  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloquées.')
  }

  printWindow.document.write(htmlCarte)
  printWindow.document.close()

  // Attendre que les images soient chargées avant d'imprimer
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }
}

/**
 * Télécharge la carte au format HTML dans le dossier Téléchargements
 *
 * @param htmlCarte - Le HTML de la carte
 * @param nomFichier - Nom du fichier à télécharger
 */
export async function telechargerCarteHTML(
  htmlCarte: string,
  nomFichier: string = 'carte-urgence.html'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const result = await window.electronAPI.saveToDownloads(nomFichier, htmlCarte, 'utf8')
    return result
  } catch (error: any) {
    console.error('Erreur téléchargement carte HTML:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcule l'âge à partir d'une date de naissance
 */
function calculerAge(dateNaissance: string): number {
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Ajuste la luminosité d'une couleur hexadécimale
 */
function adjustColor(color: string, amount: number): string {
  const clamp = (num: number) => Math.min(Math.max(num, 0), 255)

  const num = parseInt(color.replace('#', ''), 16)
  const r = clamp((num >> 16) + amount)
  const g = clamp(((num >> 8) & 0x00FF) + amount)
  const b = clamp((num & 0x0000FF) + amount)

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
