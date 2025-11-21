const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkDB() {
  const dbPath = path.join(process.env.APPDATA || process.env.HOME, 'Electron', 'carelink.db');

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  console.log('\n=== VÉRIFICATION BASE DE DONNÉES ===\n');

  // Vérifier antécédents
  const antecedents = db.exec('SELECT COUNT(*) as count FROM antecedents_medicaux');
  console.log('Antécédents:', antecedents[0]?.values[0][0] || 0);

  // Vérifier diagnostics
  const diagnostics = db.exec('SELECT COUNT(*) as count FROM diagnostics');
  console.log('Diagnostics:', diagnostics[0]?.values[0][0] || 0);

  // Vérifier bilans
  const bilans = db.exec('SELECT COUNT(*) as count FROM bilans_medicaux');
  console.log('Bilans:', bilans[0]?.values[0][0] || 0);

  // Vérifier consultations
  const consultations = db.exec('SELECT COUNT(*) as count FROM consultations_specialisees');
  console.log('Consultations:', consultations[0]?.values[0][0] || 0);

  // Afficher quelques antécédents
  console.log('\n=== EXEMPLE ANTÉCÉDENTS ===');
  const examples = db.exec('SELECT id, membre_id, titre FROM antecedents_medicaux LIMIT 5');
  if (examples[0]) {
    console.log(examples[0].values);
  }

  db.close();
}

checkDB();
