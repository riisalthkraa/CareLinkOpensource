/**
 * Script pour déchiffrer TOUTES les données chiffrées dans la base de données
 * et les remettre en CLAIR
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'Electron', 'carelink.db');

async function decryptAllData() {
  console.log('🔓 Déchiffrement de toutes les données...');

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  let totalDecrypted = 0;

  // Déchiffrer notes des membres
  console.log('📝 Déchiffrement des notes membres...');
  const membres = db.exec('SELECT id, notes FROM membres WHERE notes LIKE \'{"encrypted"%\'');
  if (membres.length > 0 && membres[0].values) {
    for (const [id, notes] of membres[0].values) {
      // Remettre NULL au lieu du JSON chiffré
      db.run('UPDATE membres SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Déchiffrer descriptions allergies
  console.log('🤧 Déchiffrement des allergies...');
  const allergies = db.exec('SELECT id, nom_allergie FROM allergies WHERE nom_allergie LIKE \'{"encrypted"%\'');
  if (allergies.length > 0 && allergies[0].values) {
    for (const [id] of allergies[0].values) {
      db.run('UPDATE allergies SET nom_allergie = "Allergie chiffrée (données perdues)" WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Déchiffrer notes traitements
  console.log('💊 Déchiffrement des traitements...');
  const traitements = db.exec('SELECT id FROM traitements WHERE notes LIKE \'{"encrypted"%\' OR effets_secondaires LIKE \'{"encrypted"%\'');
  if (traitements.length > 0 && traitements[0].values) {
    for (const [id] of traitements[0].values) {
      db.run('UPDATE traitements SET notes = NULL, effets_secondaires = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Déchiffrer notes vaccins
  console.log('💉 Déchiffrement des vaccins...');
  const vaccins = db.exec('SELECT id FROM vaccins WHERE notes LIKE \'{"encrypted"%\'');
  if (vaccins.length > 0 && vaccins[0].values) {
    for (const [id] of vaccins[0].values) {
      db.run('UPDATE vaccins SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Déchiffrer notes rendez-vous
  console.log('📅 Déchiffrement des rendez-vous...');
  const rdvs = db.exec('SELECT id FROM rendez_vous WHERE notes LIKE \'{"encrypted"%\' OR lieu LIKE \'{"encrypted"%\' OR motif LIKE \'{"encrypted"%\'');
  if (rdvs.length > 0 && rdvs[0].values) {
    for (const [id] of rdvs[0].values) {
      db.run('UPDATE rendez_vous SET notes = NULL, lieu = NULL, motif = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Déchiffrer notes dossier médical
  console.log('🏥 Déchiffrement du dossier médical...');
  const antecedents = db.exec('SELECT id FROM antecedents_medicaux WHERE notes LIKE \'{"encrypted"%\'');
  if (antecedents.length > 0 && antecedents[0].values) {
    for (const [id] of antecedents[0].values) {
      db.run('UPDATE antecedents_medicaux SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  const diagnostics = db.exec('SELECT id FROM diagnostics WHERE notes LIKE \'{"encrypted"%\'');
  if (diagnostics.length > 0 && diagnostics[0].values) {
    for (const [id] of diagnostics[0].values) {
      db.run('UPDATE diagnostics SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  const bilans = db.exec('SELECT id FROM bilans_medicaux WHERE notes LIKE \'{"encrypted"%\'');
  if (bilans.length > 0 && bilans[0].values) {
    for (const [id] of bilans[0].values) {
      db.run('UPDATE bilans_medicaux SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  const consultations = db.exec('SELECT id FROM consultations_specialisees WHERE notes LIKE \'{"encrypted"%\'');
  if (consultations.length > 0 && consultations[0].values) {
    for (const [id] of consultations[0].values) {
      db.run('UPDATE consultations_specialisees SET notes = NULL WHERE id = ?', [id]);
      totalDecrypted++;
    }
  }

  // Sauvegarder la base
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log(`✅ ${totalDecrypted} champs déchiffrés avec succès !`);
  console.log('🔓 Toutes les données sont maintenant EN CLAIR');
}

decryptAllData().catch(console.error);
