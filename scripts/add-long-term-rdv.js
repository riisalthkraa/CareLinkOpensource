/**
 * Script pour ajouter les rendez-vous long terme (6-12 mois)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const dbPath = path.join(
  os.homedir(),
  'AppData',
  'Roaming',
  'Electron',
  'carelink.db'
);

console.log('📅 Ajout des rendez-vous long terme...\n');

async function addLongTermRdv() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // Calculer les dates futures
  const in6months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in8months = new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in10months = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in1year = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log('📆 Dates calculées:');
  console.log(`   +6 mois: ${in6months}`);
  console.log(`   +8 mois: ${in8months}`);
  console.log(`   +10 mois: ${in10months}`);
  console.log(`   +1 an: ${in1year}`);
  console.log('');

  // Récupérer les IDs des membres (pour mapper correctement)
  const membresResult = db.exec('SELECT id, prenom, nom FROM membres ORDER BY id');
  if (!membresResult.length) {
    console.error('❌ Aucun membre trouvé!');
    return;
  }

  const membres = membresResult[0].values;
  const membreMap = {};
  membres.forEach(([id, prenom, nom]) => {
    membreMap[`${prenom} ${nom}`] = id;
  });

  console.log('👥 Mapping membres:');
  Object.entries(membreMap).forEach(([nom, id]) => {
    console.log(`   - ${nom} → ID ${id}`);
  });
  console.log('');

  // Vérifier si ces RDV existent déjà
  const checkResult = db.exec(`
    SELECT COUNT(*) as total FROM rendez_vous
    WHERE specialite IN ('Rhumatologie', 'Dermatologie', 'ORL', 'Endocrinologie')
  `);
  const existing = checkResult[0]?.values[0][0] || 0;

  if (existing > 0) {
    console.log(`ℹ️  ${existing} RDV spécialisés déjà présents - Skip`);
    console.log('');
    db.close();
    return;
  }

  console.log('➕ Ajout des 5 rendez-vous long terme...');

  const rdvs = [
    {
      membre: 'Monique Dupont',
      date: in6months,
      heure: '14:30',
      medecin: 'Dr. Lambert',
      specialite: 'Rhumatologie',
      lieu: 'Centre Rhumatologie Paris',
      motif: 'Première consultation',
      notes: 'Suivi ostéoporose - Délai d\'attente: 6 mois'
    },
    {
      membre: 'Jean Dupont',
      date: in8months,
      heure: '10:00',
      medecin: 'Dr. Petit',
      specialite: 'Dermatologie',
      lieu: 'Clinique Dermatologique',
      motif: 'Contrôle grains de beauté',
      notes: 'Dépistage mélanome - Délai: 8 mois'
    },
    {
      membre: 'Françoise Martin',
      date: in8months,
      heure: '15:00',
      medecin: 'Dr. Thomas',
      specialite: 'Rhumatologie',
      lieu: 'Hôpital Saint-Antoine',
      motif: 'Suivi polyarthrite',
      notes: 'Consultation spécialisée - Délai: 8 mois'
    },
    {
      membre: 'Marie Dupont',
      date: in10months,
      heure: '11:30',
      medecin: 'Dr. Martin',
      specialite: 'ORL',
      lieu: 'Service ORL - Hôpital Cochin',
      motif: 'Allergies ORL',
      notes: 'Bilan allergie complète - Délai: 10 mois'
    },
    {
      membre: 'Robert Dupont',
      date: in1year,
      heure: '09:00',
      medecin: 'Dr. Garcia',
      specialite: 'Endocrinologie',
      lieu: 'Service Endocrino - CHU',
      motif: 'Suivi diabète complexe',
      notes: 'Consultation endocrinologue - Délai: 1 an'
    }
  ];

  let added = 0;
  rdvs.forEach((rdv) => {
    const membreId = membreMap[rdv.membre];
    if (!membreId) {
      console.log(`   ⚠️  ${rdv.membre} non trouvé - Skip`);
      return;
    }

    db.run(
      `INSERT INTO rendez_vous (membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'à_venir', ?)`,
      [membreId, rdv.date, rdv.heure, rdv.medecin, rdv.specialite, rdv.lieu, rdv.motif, rdv.notes]
    );

    console.log(`   ✅ ${rdv.specialite} pour ${rdv.membre} - ${rdv.date}`);
    added++;
  });

  // Sauvegarder
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log('');
  console.log(`✅ ${added} rendez-vous long terme ajoutés!`);
  console.log('');
  console.log('🎯 Prochaine étape: npm start');

  db.close();
}

addLongTermRdv().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
