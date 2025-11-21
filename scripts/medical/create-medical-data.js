const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'Electron', 'carelink.db');

async function createMedicalData() {
  console.log('📋 Création de données de dossier médical pour chaque membre...\n');

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Récupérer tous les membres
  const membres = db.exec('SELECT id, prenom, nom, date_naissance FROM membres');

  if (membres.length === 0 || !membres[0].values) {
    console.log('❌ Aucun membre trouvé');
    return;
  }

  let totalCreated = 0;

  for (const [id, prenom, nom, dateNaissance] of membres[0].values) {
    console.log(`\n👤 ${prenom} ${nom} (ID: ${id})`);

    // Calculer l'âge
    const age = new Date().getFullYear() - new Date(dateNaissance).getFullYear();

    // 1. ANTÉCÉDENTS MÉDICAUX (selon l'âge)
    if (age > 50) {
      db.run(`INSERT INTO antecedents_medicaux
        (membre_id, type_antecedent, titre, description, date_debut, actif, severite)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'maladie', 'Hypertension artérielle', 'Sous traitement depuis 5 ans', '2019-03-15', 1, 'modérée']
      );
      console.log('  ✅ Antécédent: Hypertension artérielle');
      totalCreated++;
    }

    if (age > 60) {
      db.run(`INSERT INTO antecedents_medicaux
        (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'traumatisme', 'Fracture poignet gauche', 'Chute à domicile, consolidation complète', '2018-11-20', '2019-02-15', 0, 'modérée']
      );
      console.log('  ✅ Antécédent: Fracture poignet gauche (résolu)');
      totalCreated++;
    }

    // 2. DIAGNOSTICS ACTIFS
    if (age > 55) {
      db.run(`INSERT INTO diagnostics
        (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'Arthrose genou droit', 'M17.1', '2022-06-10', 'Dr. Martin', 'Rhumatologue', 'modérée', 'actif']
      );
      console.log('  ✅ Diagnostic: Arthrose genou droit');
      totalCreated++;
    }

    if (age > 65) {
      db.run(`INSERT INTO diagnostics
        (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, severite, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'Cholestérol élevé', 'E78.0', '2021-03-22', 'Dr. Rousseau', 'légère', 'actif']
      );
      console.log('  ✅ Diagnostic: Cholestérol élevé');
      totalCreated++;
    }

    // 3. BILANS MÉDICAUX (pour tous)
    db.run(`INSERT INTO bilans_medicaux
      (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, resultat_global, valeurs_principales)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, 'analyse_sang', 'Bilan sanguin complet', '2024-09-15', 'Dr. Rousseau', 'normal', 'Glycémie: 0.95 g/L, Cholestérol: 1.8 g/L']
    );
    console.log('  ✅ Bilan: Bilan sanguin complet (Sept 2024)');
    totalCreated++;

    if (age > 50) {
      db.run(`INSERT INTO bilans_medicaux
        (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, resultat_global, interpretation)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'electro', 'Électrocardiogramme (ECG)', '2024-05-20', 'Dr. Leblanc', 'normal', 'Rythme sinusal normal, pas d\'anomalie détectée']
      );
      console.log('  ✅ Bilan: ECG (Mai 2024)');
      totalCreated++;
    }

    // 4. CONSULTATIONS SPÉCIALISÉES
    if (age > 55) {
      db.run(`INSERT INTO consultations_specialisees
        (membre_id, specialite, medecin_nom, date_consultation, motif_consultation, diagnostic_pose, traitements_prescrits)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'Cardiologie', 'Dr. Leblanc', '2024-03-12', 'Bilan cardiologique de routine', 'Tension artérielle bien contrôlée', 'Poursuite du traitement actuel']
      );
      console.log('  ✅ Consultation: Cardiologie (Mars 2024)');
      totalCreated++;
    }

    if (age > 40 && age < 60) {
      db.run(`INSERT INTO consultations_specialisees
        (membre_id, specialite, medecin_nom, date_consultation, motif_consultation, diagnostic_pose)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id, 'Ophtalmologie', 'Dr. Durand', '2024-07-08', 'Contrôle vision', 'Vision stable, légère presbytie']
      );
      console.log('  ✅ Consultation: Ophtalmologie (Juil 2024)');
      totalCreated++;
    }
  }

  // Sauvegarder
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log(`\n✅ TERMINÉ: ${totalCreated} entrées de dossier médical créées!`);
  console.log('📊 Vérification...');

  const antecedents = db.exec('SELECT COUNT(*) FROM antecedents_medicaux');
  const diagnostics = db.exec('SELECT COUNT(*) FROM diagnostics');
  const bilans = db.exec('SELECT COUNT(*) FROM bilans_medicaux');
  const consultations = db.exec('SELECT COUNT(*) FROM consultations_specialisees');

  console.log(`  - Antécédents: ${antecedents[0].values[0][0]}`);
  console.log(`  - Diagnostics: ${diagnostics[0].values[0][0]}`);
  console.log(`  - Bilans: ${bilans[0].values[0][0]}`);
  console.log(`  - Consultations: ${consultations[0].values[0][0]}`);
}

createMedicalData().catch(console.error);
