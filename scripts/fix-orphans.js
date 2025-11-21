/**
 * Script de correction des membre_id orphelins
 *
 * Problème: Les rendez-vous/traitements/vaccins référencent d'anciens membre_id (1-8)
 * qui n'existent plus. Les nouveaux membres ont des IDs différents (17-24).
 *
 * Solution: Réassigner les membre_id pour qu'ils correspondent aux membres actuels.
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

console.log('🔧 Correction des membre_id orphelins...\n');

async function fixOrphans() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // Récupérer les membres actuels
  const membresResult = db.exec('SELECT id, prenom, nom FROM membres ORDER BY id');

  if (!membresResult.length || membresResult[0].values.length === 0) {
    console.error('❌ Aucun membre trouvé! Impossible de corriger.');
    return;
  }

  const membres = membresResult[0].values;
  console.log('👥 Membres actuels:');
  membres.forEach(([id, prenom, nom]) => {
    console.log(`   - ID ${id}: ${prenom} ${nom}`);
  });

  // Créer un mapping basé sur le NOM et PRÉNOM
  // Exemple: "Robert Dupont" ancien ID 1 → nouveau ID 17
  const mapping = {};

  // Les noms de la seed data dans l'ordre (IDs 1-8)
  const expectedNames = [
    ['Robert', 'Dupont'],     // ancien ID 1
    ['Monique', 'Dupont'],    // ancien ID 2
    ['Claude', 'Martin'],     // ancien ID 3
    ['Françoise', 'Martin'],  // ancien ID 4
    ['Jean', 'Dupont'],       // ancien ID 5
    ['Marie', 'Dupont'],      // ancien ID 6
    ['Lucas', 'Dupont'],      // ancien ID 7
    ['Emma', 'Dupont']        // ancien ID 8
  ];

  console.log('');
  console.log('🔗 Mapping ancien ID → nouveau ID:');

  expectedNames.forEach(([prenom, nom], index) => {
    const oldId = index + 1;
    const membre = membres.find(([id, p, n]) => p === prenom && n === nom);

    if (membre) {
      const newId = membre[0];
      mapping[oldId] = newId;
      console.log(`   ${oldId} → ${newId} (${prenom} ${nom})`);
    } else {
      console.log(`   ${oldId} → ❌ Non trouvé (${prenom} ${nom})`);
    }
  });

  console.log('');

  if (Object.keys(mapping).length === 0) {
    console.error('❌ Aucun mapping possible! Les noms ne correspondent pas.');
    console.log('');
    console.log('💡 Solution alternative:');
    console.log('   1. Supprime toutes les données (RDV, traitements, vaccins)');
    console.log('   2. OU reset complètement la DB avec: node scripts/reset-db.js');
    return;
  }

  // Appliquer les corrections
  console.log('🔧 Application des corrections...');
  let updatedCount = 0;

  // Rendez-vous
  for (const [oldId, newId] of Object.entries(mapping)) {
    db.run(`UPDATE rendez_vous SET membre_id = ? WHERE membre_id = ?`, [newId, oldId]);
    updatedCount++;
  }
  console.log(`   ✅ Rendez-vous mis à jour`);

  // Traitements
  for (const [oldId, newId] of Object.entries(mapping)) {
    db.run(`UPDATE traitements SET membre_id = ? WHERE membre_id = ?`, [newId, oldId]);
  }
  console.log(`   ✅ Traitements mis à jour`);

  // Vaccins
  for (const [oldId, newId] of Object.entries(mapping)) {
    db.run(`UPDATE vaccins SET membre_id = ? WHERE membre_id = ?`, [newId, oldId]);
  }
  console.log(`   ✅ Vaccins mis à jour`);

  // Allergies
  for (const [oldId, newId] of Object.entries(mapping)) {
    db.run(`UPDATE allergies SET membre_id = ? WHERE membre_id = ?`, [newId, oldId]);
  }
  console.log(`   ✅ Allergies mises à jour`);

  // Sauvegarder
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log('');
  console.log('✅ Base de données corrigée et sauvegardée!');
  console.log('');

  // Vérification
  console.log('🔍 Vérification post-correction...');
  const verifyResult = db.exec(`
    SELECT COUNT(*) as total
    FROM rendez_vous r
    JOIN membres m ON r.membre_id = m.id
    WHERE r.statut = 'à_venir' AND r.date_rdv >= date('now')
  `);

  const joinCount = verifyResult[0]?.values[0][0] || 0;
  console.log(`   JOIN rendez_vous: ${joinCount} résultats ✅`);

  console.log('');
  console.log('🎯 Prochaines étapes:');
  console.log('   1. Rafraîchis la page du Dashboard (F5)');
  console.log('   2. Les listes devraient maintenant être remplies!');

  db.close();
}

fixOrphans().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
