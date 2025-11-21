/**
 * Script de création de données de test complètes pour CareLink
 * Crée une famille complète avec tous les modules remplis
 */

const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

// Chemin de la base de données
const dbPath = path.join(app.getPath('userData'), 'carelink.db')
const db = new Database(dbPath)

console.log('🗑️  Nettoyage des données existantes...')

// Nettoyer toutes les tables
db.exec(`
  DELETE FROM rendez_vous;
  DELETE FROM traitements;
  DELETE FROM vaccins;
  DELETE FROM allergies;
  DELETE FROM membres;
`)

console.log('✅ Données nettoyées')
console.log('👨‍👩‍👧‍👦 Création de la famille Dupont...')

// Créer les membres de la famille
const membres = [
  // Parents
  {
    nom: 'Dupont',
    prenom: 'Jean',
    date_naissance: '1985-03-15',
    sexe: 'M',
    groupe_sanguin: 'A',
    rhesus: '+',
    poids: 78.5,
    taille: 178,
    telephone: '06 12 34 56 78',
    email: 'jean.dupont@email.fr',
    numero_securite_sociale: '1 85 03 75 123 456 78',
    medecin_traitant: 'Dr. Martin',
    telephone_medecin: '01 45 67 89 12',
    contact_urgence_nom: 'Marie Dupont',
    contact_urgence_telephone: '06 98 76 54 32',
    contact_urgence_relation: 'Épouse',
    notes: 'Légère hypertension'
  },
  {
    nom: 'Dupont',
    prenom: 'Marie',
    date_naissance: '1987-07-22',
    sexe: 'F',
    groupe_sanguin: 'O',
    rhesus: '+',
    poids: 62.0,
    taille: 165,
    telephone: '06 98 76 54 32',
    email: 'marie.dupont@email.fr',
    numero_securite_sociale: '2 87 07 75 123 456 89',
    medecin_traitant: 'Dr. Martin',
    telephone_medecin: '01 45 67 89 12',
    contact_urgence_nom: 'Jean Dupont',
    contact_urgence_telephone: '06 12 34 56 78',
    contact_urgence_relation: 'Époux',
    notes: 'Asthme léger'
  },
  // Enfants
  {
    nom: 'Dupont',
    prenom: 'Lucas',
    date_naissance: '2015-04-10',
    sexe: 'M',
    groupe_sanguin: 'A',
    rhesus: '+',
    poids: 28.5,
    taille: 130,
    telephone: null,
    email: null,
    numero_securite_sociale: '1 15 04 75 123 456 90',
    medecin_traitant: 'Dr. Petit',
    telephone_medecin: '01 23 45 67 89',
    contact_urgence_nom: 'Marie Dupont',
    contact_urgence_telephone: '06 98 76 54 32',
    contact_urgence_relation: 'Mère',
    notes: 'Bon état de santé général'
  },
  {
    nom: 'Dupont',
    prenom: 'Emma',
    date_naissance: '2018-09-28',
    sexe: 'F',
    groupe_sanguin: 'O',
    rhesus: '+',
    poids: 18.0,
    taille: 105,
    telephone: null,
    email: null,
    numero_securite_sociale: '2 18 09 75 123 456 91',
    medecin_traitant: 'Dr. Petit',
    telephone_medecin: '01 23 45 67 89',
    contact_urgence_nom: 'Jean Dupont',
    contact_urgence_telephone: '06 12 34 56 78',
    contact_urgence_relation: 'Père',
    notes: 'Allergies alimentaires (arachides)'
  }
]

const membreIds = {}

membres.forEach(m => {
  const result = db.prepare(`
    INSERT INTO membres (
      famille_id, nom, prenom, date_naissance, sexe,
      groupe_sanguin, rhesus, poids, taille, telephone, email,
      numero_securite_sociale, medecin_traitant, telephone_medecin,
      contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    m.nom, m.prenom, m.date_naissance, m.sexe,
    m.groupe_sanguin, m.rhesus, m.poids, m.taille, m.telephone, m.email,
    m.numero_securite_sociale, m.medecin_traitant, m.telephone_medecin,
    m.contact_urgence_nom, m.contact_urgence_telephone, m.contact_urgence_relation, m.notes
  )
  membreIds[m.prenom] = result.lastInsertRowid
  console.log(`  ✅ ${m.prenom} ${m.nom} créé(e)`)
})

console.log('\n🩺 Ajout des allergies...')

// Allergies
const allergies = [
  { membre: 'Marie', substance: 'Pénicilline', severite: 'Élevée', date_decouverte: '2010-05-12', notes: 'Réaction anaphylactique' },
  { membre: 'Emma', substance: 'Arachides', severite: 'Élevée', date_decouverte: '2022-03-20', notes: 'Éviter tout contact' },
  { membre: 'Emma', substance: 'Pollen', severite: 'Modérée', date_decouverte: '2023-04-15', notes: 'Rhume des foins au printemps' },
  { membre: 'Lucas', substance: 'Poils de chat', severite: 'Modérée', date_decouverte: '2020-08-10', notes: 'Éternuements, yeux rouges' }
]

allergies.forEach(a => {
  db.prepare(`
    INSERT INTO allergies (membre_id, substance, severite, date_decouverte, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(membreIds[a.membre], a.substance, a.severite, a.date_decouverte, a.notes)
  console.log(`  ✅ ${a.membre}: Allergie à ${a.substance}`)
})

console.log('\n💊 Ajout des traitements...')

// Date d'aujourd'hui et dans le futur
const today = new Date().toISOString().split('T')[0]
const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// Traitements
const traitements = [
  // Jean
  { membre: 'Jean', nom: 'Lisinopril', dosage: '10 mg', frequence: '1 fois par jour le matin', date_debut: '2023-01-15', date_fin: null, type: 'quotidien', stock: 90, medecin: 'Dr. Martin', renouvellement: in30days, actif: 1, notes: 'Pour hypertension' },
  { membre: 'Jean', nom: 'Doliprane', dosage: '1000 mg', frequence: 'Si besoin (max 3/jour)', date_debut: '2023-01-01', date_fin: null, type: 'si_besoin', stock: 45, medecin: 'Dr. Martin', renouvellement: in60days, actif: 1, notes: 'Douleurs et fièvre' },

  // Marie
  { membre: 'Marie', nom: 'Ventoline', dosage: '100 µg/dose', frequence: '2 bouffées si besoin', date_debut: '2020-06-10', date_fin: null, type: 'si_besoin', stock: 1, medecin: 'Dr. Martin', renouvellement: in7days, actif: 1, notes: 'Asthme - STOCK FAIBLE!' },
  { membre: 'Marie', nom: 'Fer', dosage: '80 mg', frequence: '1 comprimé par jour', date_debut: '2024-09-01', date_fin: '2024-12-01', type: 'quotidien', stock: 30, medecin: 'Dr. Martin', renouvellement: null, actif: 1, notes: 'Cure de 3 mois' },

  // Lucas
  { membre: 'Lucas', nom: 'Doliprane Enfant', dosage: '250 mg', frequence: 'Si fièvre (max 4/jour)', date_debut: '2023-01-01', date_fin: null, type: 'si_besoin', stock: 20, medecin: 'Dr. Petit', renouvellement: in60days, actif: 1, notes: 'Selon poids' },

  // Emma
  { membre: 'Emma', nom: 'Aerius', dosage: '0.5 mg/ml', frequence: '5 ml par jour', date_debut: '2024-03-15', date_fin: '2024-06-15', type: 'quotidien', stock: 10, medecin: 'Dr. Petit', renouvellement: null, actif: 1, notes: 'Antihistaminique pour allergie pollen' },
  { membre: 'Emma', nom: 'Amoxicilline', dosage: '250 mg', frequence: '3 fois par jour', date_debut: '2024-10-20', date_fin: '2024-10-27', type: 'quotidien', stock: 15, medecin: 'Dr. Petit', renouvellement: null, actif: 0, notes: 'Otite - TRAITEMENT TERMINÉ' }
]

traitements.forEach(t => {
  db.prepare(`
    INSERT INTO traitements (
      membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
      type, stock_restant, medecin_prescripteur, renouvellement_ordonnance,
      actif, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    membreIds[t.membre], t.nom, t.dosage, t.frequence, t.date_debut, t.date_fin,
    t.type, t.stock, t.medecin, t.renouvellement, t.actif, t.notes
  )
  console.log(`  ✅ ${t.membre}: ${t.nom} (${t.actif ? 'actif' : 'archivé'})`)
})

console.log('\n💉 Ajout des vaccins...')

// Vaccins
const vaccins = [
  // Jean
  { membre: 'Jean', nom: 'COVID-19', date_injection: '2024-09-15', date_rappel: '2025-09-15', lot: 'COV2024-789', lieu: 'Pharmacie', medecin: 'Dr. Martin', notes: 'Dose de rappel annuelle' },
  { membre: 'Jean', nom: 'Tétanos', date_injection: '2020-05-10', date_rappel: '2030-05-10', lot: 'TET2020-456', lieu: 'Cabinet Dr. Martin', medecin: 'Dr. Martin', notes: 'Rappel tous les 10 ans' },

  // Marie
  { membre: 'Marie', nom: 'COVID-19', date_injection: '2024-09-15', date_rappel: '2025-09-15', lot: 'COV2024-790', lieu: 'Pharmacie', medecin: 'Dr. Martin', notes: 'Dose de rappel annuelle' },
  { membre: 'Marie', nom: 'Grippe', date_injection: '2023-10-20', date_rappel: '2024-10-20', lot: 'FLU2023-123', lieu: 'Pharmacie', medecin: 'Dr. Martin', notes: 'EXPIRE BIENTÔT!' },

  // Lucas
  { membre: 'Lucas', nom: 'ROR', date_injection: '2016-04-15', date_rappel: null, lot: 'ROR2016-345', lieu: 'PMI', medecin: 'Dr. Petit', notes: 'Rougeole-Oreillons-Rubéole' },
  { membre: 'Lucas', nom: 'DTP', date_injection: '2023-04-10', date_rappel: '2028-04-10', lot: 'DTP2023-678', lieu: 'Cabinet Dr. Petit', medecin: 'Dr. Petit', notes: 'Diphtérie-Tétanos-Polio' },

  // Emma
  { membre: 'Emma', nom: 'ROR', date_injection: '2019-09-30', date_rappel: null, lot: 'ROR2019-456', lieu: 'PMI', medecin: 'Dr. Petit', notes: 'Rougeole-Oreillons-Rubéole' },
  { membre: 'Emma', nom: 'Hépatite B', date_injection: '2018-11-28', date_rappel: null, lot: 'HEP2018-789', lieu: 'Maternité', medecin: 'Dr. Petit', notes: 'Vaccination complète' }
]

vaccins.forEach(v => {
  db.prepare(`
    INSERT INTO vaccins (
      membre_id, nom_vaccin, date_injection, date_rappel, numero_lot,
      lieu_injection, medecin, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    membreIds[v.membre], v.nom, v.date_injection, v.date_rappel, v.lot,
    v.lieu, v.medecin, v.notes
  )
  console.log(`  ✅ ${v.membre}: ${v.nom}`)
})

console.log('\n📅 Ajout des rendez-vous...')

// Rendez-vous (passés et futurs)
const rdvs = [
  // Passés
  { membre: 'Jean', date: yesterday, heure: '09:30', type: 'Consultation', medecin: 'Dr. Martin', specialite: 'Médecine générale', lieu: 'Cabinet médical', statut: 'termine', notes: 'Bilan de santé annuel - RAS' },
  { membre: 'Emma', date: '2024-10-20', heure: '14:00', type: 'Consultation', medecin: 'Dr. Petit', specialite: 'Pédiatrie', lieu: 'Cabinet pédiatrique', statut: 'termine', notes: 'Otite - Antibiotiques prescrits' },

  // Futurs
  { membre: 'Marie', date: in7days, heure: '10:00', type: 'Suivi', medecin: 'Dr. Dubois', specialite: 'Pneumologie', lieu: 'Hôpital Saint-Joseph', statut: 'planifie', notes: 'Suivi asthme annuel' },
  { membre: 'Lucas', date: in30days, heure: '15:30', type: 'Dentiste', medecin: 'Dr. Blanc', specialite: 'Dentiste', lieu: 'Cabinet dentaire', statut: 'planifie', notes: 'Contrôle semestriel' },
  { membre: 'Jean', date: in30days, heure: '11:00', type: 'Examen', medecin: 'Dr. Martin', specialite: 'Médecine générale', lieu: 'Laboratoire d\'analyses', statut: 'planifie', notes: 'Bilan sanguin de contrôle' },
  { membre: 'Emma', date: in60days, heure: '16:00', type: 'Vaccination', medecin: 'Dr. Petit', specialite: 'Pédiatrie', lieu: 'Cabinet pédiatrique', statut: 'planifie', notes: 'Rappel DTP' }
]

rdvs.forEach(r => {
  db.prepare(`
    INSERT INTO rendez_vous (
      membre_id, date_rendez_vous, heure, type, medecin, specialite,
      lieu, statut, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    membreIds[r.membre], r.date, r.heure, r.type, r.medecin, r.specialite,
    r.lieu, r.statut, r.notes
  )
  console.log(`  ✅ ${r.membre}: ${r.type} le ${r.date} (${r.statut})`)
})

console.log('\n✨ Base de données seed complète!')
console.log('\n📊 Résumé:')
console.log(`  👨‍👩‍👧‍👦 ${membres.length} membres`)
console.log(`  🩺 ${allergies.length} allergies`)
console.log(`  💊 ${traitements.length} traitements`)
console.log(`  💉 ${vaccins.length} vaccins`)
console.log(`  📅 ${rdvs.length} rendez-vous`)

db.close()
console.log('\n🎉 Terminé! Redémarrez l\'application pour voir les nouvelles données.')
