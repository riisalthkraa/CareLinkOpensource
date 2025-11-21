const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function insertMedicalData() {
  console.log('🏥 Insertion des données médicales fictives...\n');

  // Chemin de la base de données
  const dbPath = path.join(process.env.APPDATA || process.env.HOME, 'Electron', 'carelink.db');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Base de données non trouvée à:', dbPath);
    console.log('💡 Lance d\'abord l\'application pour créer la base de données');
    return;
  }

  console.log('📂 Base de données:', dbPath);

  // Charger sql.js
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  try {
    // ANTÉCÉDENTS MÉDICAUX
    console.log('\n📝 Insertion des antécédents médicaux...');
    const antecedents = [
      [1, 'operation', 'Appendicectomie', 'Opération urgence suite à appendicite aiguë', '2015-03-15', '2015-03-20', 0, 'modérée', 'Dr. Martin', 'CHU Paris', 'Récupération complète sans complications'],
      [1, 'maladie', 'Hypertension artérielle', 'Diagnostiquée lors bilan de routine', '2018-06-10', null, 1, 'modérée', 'Dr. Leblanc', null, 'Traitement médicamenteux en cours'],
      [1, 'traumatisme', 'Fracture du poignet droit', 'Chute lors randonnée', '2019-08-22', '2019-10-15', 0, 'légère', 'Dr. Rousseau', 'Clinique Saint-Louis', 'Guérison complète avec rééducation'],
      [2, 'maladie', 'Migraine chronique', 'Migraines récurrentes depuis adolescence', '2010-01-01', null, 1, 'modérée', 'Dr. Petit', null, 'Crises 2-3 fois par mois, traitement préventif'],
      [2, 'operation', 'Césarienne', 'Naissance de Sophie', '2018-05-12', '2018-05-17', 0, 'légère', 'Dr. Dubois', 'Maternité Sainte-Anne', 'Accouchement sans complications'],
      [2, 'autre', 'Allergie pollen', 'Rhinite allergique saisonnière', '2012-04-01', null, 1, 'légère', 'Dr. Allergo', null, 'Symptômes au printemps, antihistaminiques'],
      [3, 'maladie', 'Asthme léger', 'Diagnostiqué à 3 ans', '2021-02-14', null, 1, 'légère', 'Dr. Pédiatre', 'Hôpital Necker', 'Bien contrôlé avec traitement de fond'],
      [3, 'hospitalisation', 'Bronchiolite', 'Hospitalisation de 3 jours à 6 mois', '2018-11-10', '2018-11-13', 0, 'modérée', 'Dr. Martin', 'Hôpital Trousseau', 'Récupération complète']
    ];

    const stmtAnt = db.prepare('INSERT INTO antecedents_medicaux (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    antecedents.forEach(ant => stmtAnt.run(ant));
    console.log(`   ✅ ${antecedents.length} antécédents insérés`);

    // DIAGNOSTICS
    console.log('\n🩺 Insertion des diagnostics...');
    const diagnostics = [
      [1, 'Hypertension artérielle essentielle', 'I10', '2018-06-10', 'Dr. Leblanc', 'Cardiologie', 'modérée', 'actif', 'Contrôle tous les 6 mois, traitement IEC'],
      [1, 'Hypercholestérolémie', 'E78.0', '2019-11-20', 'Dr. Leblanc', 'Médecine générale', 'légère', 'stabilisé', 'Régime alimentaire et statines'],
      [2, 'Migraine sans aura', 'G43.0', '2010-03-15', 'Dr. Petit', 'Neurologie', 'modérée', 'actif', 'Crises fréquentes, traitement de fond bêta-bloquants'],
      [2, 'Anémie ferriprive', 'D50.9', '2023-01-10', 'Dr. Bernard', 'Médecine générale', 'légère', 'en_remission', 'Supplémentation en fer pendant 3 mois'],
      [3, 'Asthme persistant léger', 'J45.0', '2021-02-14', 'Dr. Durand', 'Pneumologie pédiatrique', 'légère', 'actif', 'Corticoïdes inhalés quotidiens + bronchodilatateur si besoin']
    ];

    const stmtDiag = db.prepare('INSERT INTO diagnostics (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    diagnostics.forEach(diag => stmtDiag.run(diag));
    console.log(`   ✅ ${diagnostics.length} diagnostics insérés`);

    // BILANS MÉDICAUX
    console.log('\n📊 Insertion des bilans médicaux...');
    const bilans = [
      [1, 'analyse_sang', 'Bilan lipidique complet', '2024-01-15', 'Dr. Leblanc', 'Laboratoire Biopath', 'anormal', 'Cholestérol total: 2.3 g/L, LDL: 1.6 g/L, HDL: 0.5 g/L', 'LDL légèrement élevé, ajustement du traitement nécessaire', 'Contrôle dans 3 mois'],
      [1, 'electro', 'Électrocardiogramme de repos', '2024-02-20', 'Dr. Cardio', 'Cabinet de Cardiologie', 'normal', 'Rythme sinusal, FC: 72 bpm', 'ECG normal pour âge', 'Contrôle annuel'],
      [1, 'analyse_sang', 'Bilan rénal (créatinine)', '2024-01-15', 'Dr. Leblanc', 'Laboratoire Biopath', 'normal', 'Créatinine: 85 µmol/L, DFG: 90 mL/min', 'Fonction rénale normale', null],
      [2, 'analyse_sang', 'NFS (Numération Formule Sanguine)', '2023-12-10', 'Dr. Bernard', 'Laboratoire Central', 'normal', 'Hémoglobine: 13.2 g/dL, GR: 4.5 M/µL, GB: 7200/µL', 'Anémie corrigée, taux normalisés', 'Arrêt de la supplémentation'],
      [2, 'imagerie', 'IRM cérébrale', '2023-06-05', 'Dr. Petit', 'Centre Imagerie Médicale', 'normal', 'Pas anomalie visible, pas de lésion', 'IRM normale, migraines sans cause organique', 'Bilan de contrôle migraine'],
      [3, 'spirometrie', 'Épreuve Fonctionnelle Respiratoire (EFR)', '2024-03-10', 'Dr. Durand', 'Hôpital Robert Debré', 'anormal', 'VEMS: 85% théorique, DEP: 90%', 'Légère obstruction réversible après bronchodilatateur', 'Asthme bien contrôlé, ajustement du traitement'],
      [3, 'analyse_sang', 'Dosage IgE totales', '2021-03-20', 'Dr. Allergo', 'Laboratoire Allergologie', 'anormal', 'IgE totales: 250 UI/mL (normal < 100)', 'Terrain atopique confirmé', 'Éviction des allergènes']
    ];

    const stmtBilan = db.prepare('INSERT INTO bilans_medicaux (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire, resultat_global, valeurs_principales, interpretation, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    bilans.forEach(bilan => stmtBilan.run(bilan));
    console.log(`   ✅ ${bilans.length} bilans insérés`);

    // CONSULTATIONS SPÉCIALISÉES
    console.log('\n👨‍⚕️ Insertion des consultations spécialisées...');
    const consultations = [
      [1, '2024-02-20', 'Cardiologie', 'Dr. Cardio', 'Cabinet Cardiologie Paris 15', 'Bilan cardiologique de routine pour HTA', 'Hypertension artérielle bien contrôlée', 'ECG, Échographie cardiaque', 'Poursuite du traitement actuel (IEC)', 'Contrôle dans 1 an', '2025-02-20', 'Patient hypertendu depuis 2018, traitement bien toléré. ECG normal. Échographie programmée.', 'Bon contrôle tensionnel'],
      [1, '2023-11-15', 'Ophtalmologie', 'Dr. Vision', 'Centre Ophtalmo', 'Contrôle annuel vue', 'Presbytie débutante', 'Fond oeil', 'Lunettes de lecture prescrites', 'Contrôle annuel', '2024-11-15', 'Vision normale, début de presbytie lié à âge.', null],
      [2, '2023-06-05', 'Neurologie', 'Dr. Petit', 'Hôpital Lariboisière', 'Migraines résistantes au traitement', 'Migraine chronique sans aura', 'IRM cérébrale', 'Changement de traitement de fond (topiramate)', 'Suivi tous les 3 mois', '2023-09-05', 'Patiente avec migraines depuis adolescence. IRM normale. Changement de traitement proposé.', 'Amélioration attendue sous nouveau traitement'],
      [2, '2024-01-22', 'Gynécologie', 'Dr. Femme', 'Cabinet Gynécologie', 'Suivi gynécologique annuel', 'RAS', 'Frottis, Échographie pelvienne', null, 'Contrôle dans 1 an', '2025-01-22', 'Examen gynécologique normal. Frottis normal.', null],
      [3, '2024-03-10', 'Pneumologie pédiatrique', 'Dr. Durand', 'Hôpital Robert Debré', 'Suivi asthme', 'Asthme persistant léger bien contrôlé', 'EFR (spirométrie)', 'Poursuite corticoïdes inhalés', 'Contrôle tous les 6 mois', '2024-09-10', 'Enfant de 6 ans, asthme diagnostiqué à 3 ans. Bon contrôle sous traitement. EFR satisfaisante.', 'Continuer traitement actuel'],
      [3, '2023-04-18', 'Allergologie', 'Dr. Allergo', 'Hôpital Necker', 'Bilan allergologique', 'Allergie pollens de graminées', 'Prick-tests, IgE spécifiques', 'Antihistaminiques en cure courte au printemps', 'Réévaluation dans 1 an', '2024-04-18', 'Tests cutanés positifs aux pollens. Désensibilisation non indiquée pour le moment.', 'Éviter exposition pollens au printemps']
    ];

    const stmtConsult = db.prepare('INSERT INTO consultations_specialisees (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation, diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande, prochain_rdv, compte_rendu, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    consultations.forEach(consult => stmtConsult.run(consult));
    console.log(`   ✅ ${consultations.length} consultations insérées`);

    // Sauvegarder la base de données
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));

    console.log('\n🎉 Toutes les données médicales ont été insérées avec succès !');
    console.log('📋 Relance l\'application pour voir les données\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    db.close();
  }
}

insertMedicalData();
