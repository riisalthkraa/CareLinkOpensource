/**
 * Script de correction des dates obsolètes dans la base de données
 *
 * Problème: Les rendez-vous/traitements créés avec des dates relatives (in7days, in30days)
 * deviennent obsolètes après quelques jours, ce qui cause des listes vides dans le Dashboard.
 *
 * Solution: Ce script met à jour toutes les dates pour qu'elles soient à nouveau dans le futur.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Chemin vers la base de données (même emplacement que l'app)
const dbPath = path.join(
  os.homedir(),
  'AppData',
  'Roaming',
  'Electron',
  'carelink.db'
);

console.log('🔧 Correction des dates obsolètes dans la base de données...');
console.log(`📂 Base de données: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée!');
  console.error('   Assure-toi que l\'app a été lancée au moins une fois.');
  process.exit(1);
}

// Calculer les nouvelles dates (à partir d'aujourd'hui)
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

const dates = {
  today: formatDate(today),
  in7days: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  in14days: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  in21days: formatDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)),
  in30days: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  in60days: formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
  in90days: formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
};

console.log('📅 Nouvelles dates calculées:');
console.log(`   - Aujourd'hui: ${dates.today}`);
console.log(`   - +7 jours: ${dates.in7days}`);
console.log(`   - +30 jours: ${dates.in30days}`);
console.log('');

async function fixDates() {
  // Initialiser sql.js
  const SQL = await initSqlJs();

  // Charger la base de données
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('🔍 Analyse de la base de données...');

  // Vérifier combien de RDV sont à venir
  const rdvResult = db.exec('SELECT COUNT(*) as total FROM rendez_vous WHERE statut = "à_venir"');
  const totalRdv = rdvResult[0]?.values[0][0] || 0;
  console.log(`   ℹ️  Rendez-vous "à_venir" trouvés: ${totalRdv}`);

  // Vérifier combien sont dans le passé
  const rdvPassedResult = db.exec(`SELECT COUNT(*) as total FROM rendez_vous WHERE statut = 'à_venir' AND date_rdv < date('now')`);
  const rdvPassed = rdvPassedResult[0]?.values[0][0] || 0;
  console.log(`   ⚠️  Rendez-vous dans le passé: ${rdvPassed}`);

  if (rdvPassed === 0) {
    console.log('✅ Aucune date à corriger! Tout est OK.');
    return;
  }

  console.log('');
  console.log('🔧 Correction des dates...');

  // Mettre à jour les rendez-vous "à_venir" qui sont dans le passé
  // On les décale pour qu'ils soient dans le futur
  db.run(`
    UPDATE rendez_vous
    SET date_rdv = date('now', '+' || (
      CASE
        WHEN RANDOM() % 3 = 0 THEN 7
        WHEN RANDOM() % 3 = 1 THEN 14
        ELSE 30
      END
    ) || ' days')
    WHERE statut = 'à_venir' AND date_rdv < date('now')
  `);

  console.log(`   ✅ ${rdvPassed} rendez-vous mis à jour`);

  // Mettre à jour les dates de rappel de vaccins
  db.run(`
    UPDATE vaccins
    SET date_rappel = date('now', '+30 days')
    WHERE date_rappel IS NOT NULL AND date_rappel < date('now')
  `);

  console.log('   ✅ Dates de rappel vaccins mises à jour');

  // Mettre à jour les dates de renouvellement d'ordonnances
  db.run(`
    UPDATE traitements
    SET renouvellement_ordonnance = date('now', '+' || (
      CASE
        WHEN stock_restant < 10 THEN 7
        WHEN stock_restant < 30 THEN 21
        ELSE 30
      END
    ) || ' days')
    WHERE renouvellement_ordonnance IS NOT NULL AND renouvellement_ordonnance < date('now')
  `);

  console.log('   ✅ Dates de renouvellement traitements mises à jour');

  // Sauvegarder la base de données
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log('');
  console.log('✅ Base de données mise à jour et sauvegardée!');
  console.log('');
  console.log('🎯 Prochaines étapes:');
  console.log('   1. Ferme l\'application si elle est ouverte');
  console.log('   2. Relance avec: npm start');
  console.log('   3. Les listes du Dashboard devraient maintenant être remplies!');

  db.close();
}

fixDates().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
