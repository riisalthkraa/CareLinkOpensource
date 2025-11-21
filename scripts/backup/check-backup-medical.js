const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const backupPath = 'C:\\Users\\RK\\AppData\\Roaming\\Electron\\backups\\carelink_backup_2025-11-03_18-28-38.db';

async function checkBackup() {
  console.log(`Vérification du backup: ${backupPath}\n`);

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(backupPath);
  const db = new SQL.Database(buffer);

  console.log('📋 ANTÉCÉDENTS MÉDICAUX:');
  const antecedents = db.exec('SELECT id, membre_id, titre, date_debut FROM antecedents_medicaux');
  if (antecedents.length > 0 && antecedents[0].values) {
    console.log(`Trouvé ${antecedents[0].values.length} antécédent(s)`);
    antecedents[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]}, date: ${row[3]})`));
  } else {
    console.log('  Aucun antécédent');
  }

  console.log('\n📋 DIAGNOSTICS:');
  const diagnostics = db.exec('SELECT id, membre_id, pathologie, date_diagnostic FROM diagnostics');
  if (diagnostics.length > 0 && diagnostics[0].values) {
    console.log(`Trouvé ${diagnostics[0].values.length} diagnostic(s)`);
    diagnostics[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]}, date: ${row[3]})`));
  } else {
    console.log('  Aucun diagnostic');
  }

  console.log('\n📋 BILANS MÉDICAUX:');
  const bilans = db.exec('SELECT id, membre_id, nom_examen, date_examen FROM bilans_medicaux');
  if (bilans.length > 0 && bilans[0].values) {
    console.log(`Trouvé ${bilans[0].values.length} bilan(s)`);
    bilans[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]}, date: ${row[3]})`));
  } else {
    console.log('  Aucun bilan');
  }

  console.log('\n📋 CONSULTATIONS SPÉCIALISÉES:');
  const consultations = db.exec('SELECT id, membre_id, specialite, date_consultation FROM consultations_specialisees');
  if (consultations.length > 0 && consultations[0].values) {
    console.log(`Trouvé ${consultations[0].values.length} consultation(s)`);
    consultations[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]}, date: ${row[3]})`));
  } else {
    console.log('  Aucune consultation');
  }
}

checkBackup().catch(console.error);
