/**
 * Script de diagnostic de la base de données
 * Vérifie l'intégrité des foreign keys entre les tables
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

console.log('🔍 Diagnostic de la base de données CareLink...\n');

async function diagnostic() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // 1. Vérifier les membres
  console.log('👥 MEMBRES:');
  const membresResult = db.exec('SELECT id, prenom, nom FROM membres ORDER BY id');
  if (membresResult.length > 0) {
    const membres = membresResult[0].values;
    console.log(`   Total: ${membres.length}`);
    membres.forEach(([id, prenom, nom]) => {
      console.log(`   - ID ${id}: ${prenom} ${nom}`);
    });
  } else {
    console.log('   ❌ Aucun membre trouvé!');
  }

  console.log('');

  // 2. Vérifier les rendez-vous et leurs membre_id
  console.log('📅 RENDEZ-VOUS:');
  const rdvResult = db.exec(`
    SELECT id, membre_id, date_rdv, heure, statut, medecin
    FROM rendez_vous
    WHERE statut = 'à_venir' AND date_rdv >= date('now')
    ORDER BY date_rdv
    LIMIT 10
  `);

  if (rdvResult.length > 0) {
    const rdvs = rdvResult[0].values;
    console.log(`   Total (à venir): ${rdvs.length}`);
    rdvs.forEach(([id, membre_id, date_rdv, heure, statut, medecin]) => {
      console.log(`   - RDV #${id}: membre_id=${membre_id}, date=${date_rdv}, ${medecin}`);
    });
  } else {
    console.log('   ❌ Aucun RDV à venir trouvé!');
  }

  console.log('');

  // 3. TEST DU JOIN (CRITIQUE!)
  console.log('🔗 TEST DU JOIN rendez_vous ↔ membres:');
  const joinResult = db.exec(`
    SELECT r.id, r.membre_id, r.date_rdv, m.prenom, m.nom
    FROM rendez_vous r
    JOIN membres m ON r.membre_id = m.id
    WHERE r.statut = 'à_venir' AND r.date_rdv >= date('now')
    ORDER BY r.date_rdv
    LIMIT 5
  `);

  if (joinResult.length > 0) {
    const joined = joinResult[0].values;
    console.log(`   ✅ JOIN réussi! ${joined.length} résultats:`);
    joined.forEach(([id, membre_id, date_rdv, prenom, nom]) => {
      console.log(`   - RDV #${id} pour ${prenom} ${nom} (membre_id=${membre_id}) le ${date_rdv}`);
    });
  } else {
    console.log('   ❌ JOIN échoué - Aucun résultat!');
    console.log('   → C\'est LE problème! Les membre_id ne correspondent pas.');
  }

  console.log('');

  // 4. Vérifier les membre_id orphelins
  console.log('🔍 MEMBRE_ID ORPHELINS (rendez-vous sans membre correspondant):');
  const orphanResult = db.exec(`
    SELECT DISTINCT r.membre_id
    FROM rendez_vous r
    LEFT JOIN membres m ON r.membre_id = m.id
    WHERE m.id IS NULL
  `);

  if (orphanResult.length > 0 && orphanResult[0].values.length > 0) {
    const orphans = orphanResult[0].values;
    console.log(`   ⚠️  ${orphans.length} membre_id orphelins trouvés:`);
    orphans.forEach(([membre_id]) => {
      console.log(`   - membre_id=${membre_id} (n'existe pas dans la table membres)`);
    });
  } else {
    console.log('   ✅ Aucun orphelin - Tous les membre_id sont valides!');
  }

  console.log('');

  // 5. Vérifier les traitements
  console.log('💊 TRAITEMENTS:');
  const traitResult = db.exec(`
    SELECT COUNT(*) as total FROM traitements WHERE actif = 1
  `);
  const totalTrait = traitResult[0]?.values[0][0] || 0;
  console.log(`   Total actifs: ${totalTrait}`);

  const traitJoinResult = db.exec(`
    SELECT COUNT(*) as total
    FROM traitements t
    JOIN membres m ON t.membre_id = m.id
    WHERE t.actif = 1
  `);
  const totalTraitJoin = traitJoinResult[0]?.values[0][0] || 0;
  console.log(`   Avec JOIN: ${totalTraitJoin}`);

  if (totalTrait !== totalTraitJoin) {
    console.log(`   ⚠️  DIFFÉRENCE! ${totalTrait - totalTraitJoin} traitements orphelins!`);
  } else {
    console.log('   ✅ Tous les traitements ont un membre valide');
  }

  console.log('');

  // 6. Vérifier les vaccins
  console.log('💉 VACCINS:');
  const vaccinResult = db.exec(`SELECT COUNT(*) as total FROM vaccins`);
  const totalVaccin = vaccinResult[0]?.values[0][0] || 0;
  console.log(`   Total: ${totalVaccin}`);

  const vaccinJoinResult = db.exec(`
    SELECT COUNT(*) as total
    FROM vaccins v
    JOIN membres m ON v.membre_id = m.id
  `);
  const totalVaccinJoin = vaccinJoinResult[0]?.values[0][0] || 0;
  console.log(`   Avec JOIN: ${totalVaccinJoin}`);

  if (totalVaccin !== totalVaccinJoin) {
    console.log(`   ⚠️  DIFFÉRENCE! ${totalVaccin - totalVaccinJoin} vaccins orphelins!`);
  } else {
    console.log('   ✅ Tous les vaccins ont un membre valide');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (joinResult.length === 0 || joinResult[0].values.length === 0) {
    console.log('❌ PROBLÈME IDENTIFIÉ:');
    console.log('   Les rendez-vous existent, mais le JOIN avec les membres échoue.');
    console.log('   → Solution: Supprimer les données orphelines OU recréer les membres.');
    console.log('');
    console.log('💡 Pour corriger, lance:');
    console.log('   node scripts/fix-orphans.js');
  } else {
    console.log('✅ TOUT SEMBLE OK!');
    console.log('   Les JOINs fonctionnent correctement.');
    console.log('   → Le problème doit venir du frontend (React state?)');
  }

  db.close();
}

diagnostic().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
