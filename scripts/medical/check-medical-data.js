const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'Electron', 'carelink.db');

async function checkData() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  console.log('\n📋 ANTÉCÉDENTS MÉDICAUX:');
  const antecedents = db.exec('SELECT id, membre_id, titre, date_debut FROM antecedents_medicaux');
  if (antecedents.length > 0 && antecedents[0].values) {
    console.log(`Trouvé ${antecedents[0].values.length} antécédent(s)`);
    antecedents[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]})`));
  } else {
    console.log('  Aucun antécédent');
  }

  console.log('\n📋 DIAGNOSTICS:');
  const diagnostics = db.exec('SELECT id, membre_id, pathologie FROM diagnostics');
  if (diagnostics.length > 0 && diagnostics[0].values) {
    console.log(`Trouvé ${diagnostics[0].values.length} diagnostic(s)`);
    diagnostics[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]})`));
  } else {
    console.log('  Aucun diagnostic');
  }

  console.log('\n📋 BILANS MÉDICAUX:');
  const bilans = db.exec('SELECT id, membre_id, nom_examen FROM bilans_medicaux');
  if (bilans.length > 0 && bilans[0].values) {
    console.log(`Trouvé ${bilans[0].values.length} bilan(s)`);
    bilans[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]})`));
  } else {
    console.log('  Aucun bilan');
  }

  console.log('\n📋 CONSULTATIONS SPÉCIALISÉES:');
  const consultations = db.exec('SELECT id, membre_id, specialite FROM consultations_specialisees');
  if (consultations.length > 0 && consultations[0].values) {
    console.log(`Trouvé ${consultations[0].values.length} consultation(s)`);
    consultations[0].values.forEach(row => console.log(`  - ${row[2]} (membre ${row[1]})`));
  } else {
    console.log('  Aucune consultation');
  }

  console.log('\n👥 MEMBRES:');
  const membres = db.exec('SELECT id, prenom, nom FROM membres');
  if (membres.length > 0 && membres[0].values) {
    console.log(`Trouvé ${membres[0].values.length} membre(s)`);
    membres[0].values.forEach(row => console.log(`  - ${row[1]} ${row[2]} (ID: ${row[0]})`));
  }
}

checkData().catch(console.error);
