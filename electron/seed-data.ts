/**
 * Données de seed réalistes pour CareLink
 * Famille Dupont + familles Martin (3 générations)
 */

export async function seedDatabase(db: any, forceReset: boolean = false) {
  // Vérifier si des données existent déjà
  const checkStmt = db.prepare("SELECT COUNT(*) as count FROM membres")
  checkStmt.step()
  const count = checkStmt.getAsObject().count
  checkStmt.free()

  if (count > 0 && !forceReset) {
    console.log('✅ Données déjà présentes')
    return
  }

  if (count > 0 && forceReset) {
    console.log('🗑️  Suppression des anciennes données...')
    db.run('DELETE FROM documents')
    db.run('DELETE FROM allergies')
    db.run('DELETE FROM rendez_vous')
    db.run('DELETE FROM vaccins')
    db.run('DELETE FROM traitements')
    db.run('DELETE FROM membres')
    db.run('DELETE FROM famille')
    console.log('✅ Anciennes données supprimées')
  }

  console.log('🌱 Création de la famille (3 générations)...')

  // Dates utiles
  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in21days = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in6months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in8months = new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in10months = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in1year = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // ===== 1. CRÉER LES MEMBRES (8 personnes, 3 générations) =====
  console.log('👨‍👩‍👧‍👦 Création des membres...')

  // GÉNÉRATION 1: LES GRANDS-PARENTS

  // Robert Dupont (père de Jean, 72 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Robert', '1953-02-14', 'M', 'A', '+', 82.0, 175,
    '06 11 22 33 44', 'robert.dupont@email.fr', '1 53 02 75 456 123 45',
    'Dr. Leblanc', '01 48 88 99 00', 'Monique Dupont', '06 11 22 33 55',
    'Épouse', 'Hypertension, diabète type 2, arthrose genoux'
  ])

  // Monique Dupont (mère de Jean, 70 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Monique', '1955-06-08', 'F', 'O', '+', 68.0, 162,
    '06 11 22 33 55', 'monique.dupont@email.fr', '2 55 06 75 456 123 67',
    'Dr. Leblanc', '01 48 88 99 00', 'Robert Dupont', '06 11 22 33 44',
    'Époux', 'Ostéoporose, cholestérol'
  ])

  // Claude Martin (père de Marie, 74 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Martin', 'Claude', '1951-11-20', 'M', 'B', '+', 79.0, 172,
    '06 22 33 44 55', 'claude.martin@email.fr', '1 51 11 75 234 567 89',
    'Dr. Rousseau', '01 42 55 66 77', 'Françoise Martin', '06 22 33 44 66',
    'Épouse', 'Insuffisance cardiaque, hypertension'
  ])

  // Françoise Martin (mère de Marie, 71 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Martin', 'Françoise', '1954-03-25', 'F', 'A', '-', 74.0, 158,
    '06 22 33 44 66', 'francoise.martin@email.fr', '2 54 03 75 234 567 90',
    'Dr. Rousseau', '01 42 55 66 77', 'Claude Martin', '06 22 33 44 55',
    'Époux', 'Polyarthrite rhumatoïde, glaucome'
  ])

  // GÉNÉRATION 2: LES PARENTS

  // Jean Dupont (père, 40 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Jean', '1985-03-15', 'M', 'A', '+', 82.0, 180,
    '06 12 34 56 78', 'jean.dupont@email.fr', '1 85 03 75 123 456 78',
    'Dr. Moreau', '01 45 67 89 12', 'Marie Dupont', '06 98 76 54 32',
    'Épouse', 'Bon état général, pratique sport'
  ])

  // Marie Dupont (mère, 38 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Marie', '1987-07-22', 'F', 'O', '+', 65.0, 168,
    '06 98 76 54 32', 'marie.dupont@email.fr', '2 87 07 75 123 456 89',
    'Dr. Moreau', '01 45 67 89 12', 'Jean Dupont', '06 12 34 56 78',
    'Époux', 'Allergies saisonnières'
  ])

  // GÉNÉRATION 3: LES ENFANTS

  // Lucas Dupont (fils, 9 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Lucas', '2016-04-10', 'M', 'A', '+', 32.0, 135,
    null, null, '1 16 04 75 123 456 90',
    'Dr. Bernard (pédiatre)', '01 23 45 67 89', 'Marie Dupont', '06 98 76 54 32',
    'Mère', 'Bon état de santé général, sportif'
  ])

  // Emma Dupont (fille, 6 ans)
  db.run(`INSERT INTO membres (
    famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille,
    telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin,
    contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Dupont', 'Emma', '2019-09-28', 'F', 'O', '+', 21.0, 115,
    null, null, '2 19 09 75 123 456 91',
    'Dr. Bernard (pédiatre)', '01 23 45 67 89', 'Jean Dupont', '06 12 34 56 78',
    'Père', 'Allergies alimentaires (arachides, fruits à coque)'
  ])

  console.log('  ✅ 8 membres créés (3 générations)')

  // ===== 2. ALLERGIES (5) =====
  console.log('🩺 Création des allergies...')

  // Marie - allergies saisonnières
  db.run(`INSERT INTO allergies (membre_id, type_allergie, nom_allergie, severite) VALUES (?, ?, ?, ?)`,
    [6, 'Environnement', 'Pollens (bouleau, graminées)', 'Modérée'])

  // Emma - allergies alimentaires
  db.run(`INSERT INTO allergies (membre_id, type_allergie, nom_allergie, severite) VALUES (?, ?, ?, ?)`,
    [8, 'Alimentaire', 'Arachides', 'Élevée'])
  db.run(`INSERT INTO allergies (membre_id, type_allergie, nom_allergie, severite) VALUES (?, ?, ?, ?)`,
    [8, 'Alimentaire', 'Fruits à coque (noix, noisettes)', 'Élevée'])

  // Lucas - allergie animaux
  db.run(`INSERT INTO allergies (membre_id, type_allergie, nom_allergie, severite) VALUES (?, ?, ?, ?)`,
    [7, 'Environnement', 'Poils de chat', 'Modérée'])

  // Françoise - allergie médicament
  db.run(`INSERT INTO allergies (membre_id, type_allergie, nom_allergie, severite) VALUES (?, ?, ?, ?)`,
    [4, 'Médicament', 'Pénicilline', 'Élevée'])

  console.log('  ✅ 5 allergies créées')

  // ===== 3. TRAITEMENTS (18 traitements réalistes) =====
  console.log('💊 Création des traitements...')

  // ROBERT (72 ans) - hypertension + diabète + arthrose
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Amlor (amlodipine)', '5 mg', '1 comprimé le matin', '2020-05-10', null,
    'quotidien', 45, 'Dr. Leblanc', in30days, 1, 'Hypertension artérielle'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Metformine', '850 mg', '2 fois par jour (matin et soir)', '2018-03-15', null,
    'quotidien', 32, 'Dr. Leblanc', in21days, 1, 'Diabète type 2'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Doliprane', '1000 mg', 'Si douleurs (max 3/jour)', '2023-01-01', null,
    'si_besoin', 18, 'Dr. Leblanc', in60days, 1, 'Douleurs articulaires'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Aspirine cardio', '75 mg', '1 comprimé le soir', '2021-08-20', null,
    'quotidien', 60, 'Dr. Leblanc', in90days, 1, 'Prévention cardiovasculaire'
  ])

  // MONIQUE (70 ans) - ostéoporose + cholestérol
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, 'Tahor (atorvastatine)', '20 mg', '1 comprimé le soir', '2019-02-10', null,
    'quotidien', 55, 'Dr. Leblanc', in60days, 1, 'Hypercholestérolémie'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, 'Calcium + Vitamine D3', '500mg/400UI', '1 comprimé 2 fois par jour', '2020-11-05', null,
    'quotidien', 90, 'Dr. Leblanc', in90days, 1, 'Ostéoporose'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, 'Fosamax (alendronate)', '70 mg', '1 comprimé le dimanche matin à jeun', '2020-11-05', null,
    'hebdomadaire', 8, 'Dr. Leblanc', in21days, 1, 'Ostéoporose - Prendre 30 min avant repas'
  ])

  // CLAUDE (74 ans) - insuffisance cardiaque + hypertension
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, 'Ramipril', '5 mg', '1 comprimé le matin', '2017-06-12', null,
    'quotidien', 40, 'Dr. Rousseau', in30days, 1, 'Hypertension + protection cardiaque'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, 'Furosémide (Lasilix)', '40 mg', '1 comprimé le matin', '2017-06-12', null,
    'quotidien', 30, 'Dr. Rousseau', in30days, 1, 'Diurétique - insuffisance cardiaque'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, 'Bisoprolol', '2.5 mg', '1 comprimé le matin', '2017-06-12', null,
    'quotidien', 45, 'Dr. Rousseau', in30days, 1, 'Bêta-bloquant pour le cœur'
  ])

  // FRANÇOISE (71 ans) - polyarthrite + glaucome
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, 'Méthotrexate', '15 mg', '1 fois par semaine (le lundi)', '2016-09-20', null,
    'hebdomadaire', 12, 'Dr. Rousseau', in30days, 1, 'Polyarthrite rhumatoïde - NE PAS doubler la dose'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, 'Acide folique', '5 mg', '1 comprimé le lendemain du méthotrexate (le mardi)', '2016-09-20', null,
    'hebdomadaire', 10, 'Dr. Rousseau', in30days, 1, 'Complément obligatoire du méthotrexate'
  ])
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, 'Xalatan (latanoprost) collyre', '0.005%', '1 goutte dans chaque œil le soir', '2019-05-15', null,
    'quotidien', 2, 'Dr. Durand (ophtalmo)', in7days, 1, 'Glaucome - STOCK FAIBLE!'
  ])

  // MARIE (38 ans) - allergies saisonnières
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    6, 'Aerius (desloratadine)', '5 mg', '1 comprimé par jour (mars à septembre)', '2024-03-01', '2024-09-30',
    'saisonnier', 35, 'Dr. Moreau', null, 1, 'Antihistaminique pour allergies pollens'
  ])

  // JEAN (40 ans) - occasionnel
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    5, 'Doliprane', '1000 mg', 'Si besoin (max 3/jour)', '2023-01-01', null,
    'si_besoin', 30, 'Dr. Moreau', in60days, 1, 'Douleurs et fièvre occasionnelles'
  ])

  // LUCAS (9 ans) - occasionnel
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    7, 'Doliprane enfant', '300 mg', 'Si fièvre >38.5°C (max 4/jour)', '2023-01-01', null,
    'si_besoin', 25, 'Dr. Bernard', in60days, 1, 'Selon le poids (32kg)'
  ])

  // EMMA (6 ans) - EpiPen pour allergie
  db.run(`INSERT INTO traitements (
    membre_id, nom_medicament, dosage, frequence, date_debut, date_fin,
    type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, 'EpiPen (adrénaline)', '0.15 mg', "En cas de réaction allergique grave (anaphylaxie)", '2023-06-10', null,
    'urgence', 2, 'Dr. Bernard', in90days, 1, 'TOUJOURS AVOIR SUR SOI - école prévenue'
  ])

  console.log('  ✅ 18 traitements créés')

  // ===== 4. VACCINS (20 vaccins réalistes) =====
  console.log('💉 Création des vaccins...')

  // ROBERT - vaccins seniors
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Grippe saisonnière 2024', '2024-10-15', '2025-10-15', 'GRIP2024-789', 'fait',
    'Pharmacie Centrale', 'Vaccin annuel recommandé >65 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'DTP (Rappel)', '2020-05-10', '2030-05-10', 'DTP2020-456', 'fait',
    'Dr. Leblanc', 'Diphtérie-Tétanos-Polio - Rappel tous les 10 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, 'Zona (Shingrix)', '2023-03-20', null, 'ZONA2023-123', 'fait',
    'Dr. Leblanc', 'Protection contre le zona - 2 doses effectuées'
  ])

  // MONIQUE - vaccins seniors
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, 'Grippe saisonnière 2024', '2024-10-15', '2025-10-15', 'GRIP2024-790', 'fait',
    'Pharmacie Centrale', 'Vaccin annuel recommandé >65 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, 'COVID-19 (rappel)', '2024-09-10', '2025-09-10', 'COV2024-567', 'fait',
    'Pharmacie Centrale', 'Rappel annuel'
  ])

  // CLAUDE - vaccins seniors + cardio
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, 'Grippe saisonnière 2024', '2024-10-12', '2025-10-12', 'GRIP2024-791', 'fait',
    'Dr. Rousseau', 'Prioritaire pour insuffisance cardiaque'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, 'Pneumocoque (Prevenar 13)', '2022-11-15', null, 'PNEU2022-345', 'fait',
    'Dr. Rousseau', 'Protection pneumonie - recommandé pour pathologie cardiaque'
  ])

  // FRANÇOISE - vaccins seniors
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, 'Grippe saisonnière 2024', '2024-10-12', '2025-10-12', 'GRIP2024-792', 'fait',
    'Dr. Rousseau', 'Vaccin annuel recommandé >65 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, 'DTP (Rappel)', '2024-03-25', '2034-03-25', 'DTP2024-678', 'fait',
    'Dr. Rousseau', 'Diphtérie-Tétanos-Polio - Rappel 70 ans'
  ])

  // JEAN (40 ans) - vaccins adulte
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    5, 'COVID-19 (rappel)', '2024-09-20', '2025-09-20', 'COV2024-893', 'fait',
    'Pharmacie', 'Dose de rappel annuelle'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    5, 'DTP (Rappel 45 ans)', null, '2030-03-15', null, 'à_faire',
    'Dr. Moreau', 'Prochain rappel DTP à 45 ans'
  ])

  // MARIE (38 ans) - vaccins adulte
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    6, 'COVID-19 (rappel)', '2024-09-20', '2025-09-20', 'COV2024-894', 'fait',
    'Pharmacie', 'Dose de rappel annuelle'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    6, 'Coqueluche (Rappel)', '2020-07-22', null, 'COQ2020-567', 'fait',
    'Dr. Moreau', 'Rappel effectué avant 40 ans (recommandé)'
  ])

  // LUCAS (9 ans) - vaccins enfant
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    7, 'ROR (Rougeole-Oreillons-Rubéole)', '2017-04-15', null, 'ROR2017-345', 'fait',
    'PMI', '2 doses effectuées - protection complète'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    7, 'DTP (Rappel 6 ans)', '2022-04-10', '2027-04-10', 'DTP2022-678', 'fait',
    'Dr. Bernard', 'Prochain rappel à 11-13 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    7, 'Méningocoque C', '2017-10-15', null, 'MEN2017-234', 'fait',
    'Dr. Bernard', 'Protection méningite C'
  ])

  // EMMA (6 ans) - vaccins enfant
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, 'ROR (Rougeole-Oreillons-Rubéole)', '2020-09-30', '2025-09-30', 'ROR2020-456', 'fait',
    'PMI', '2ème dose à prévoir à 6 ans'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, 'DTP (Rappel 6 ans)', '2025-09-28', '2030-09-28', 'DTP2025-789', 'à_faire',
    'Dr. Bernard', 'Rappel à faire à 6 ans (bientôt)'
  ])
  db.run(`INSERT INTO vaccins (
    membre_id, nom_vaccin, date_administration, date_rappel, lot, statut, medecin, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, 'Hépatite B', '2019-11-28', null, 'HEP2019-789', 'fait',
    'Maternité', 'Vaccination complète (3 doses)'
  ])

  console.log('  ✅ 20 vaccins créés')

  // ===== 5. RENDEZ-VOUS (12: 4 passés, 8 futurs) =====
  console.log('📅 Création des rendez-vous...')

  // PASSÉS
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, lastWeek, '10:30', 'Dr. Leblanc', 'Médecine générale',
    'Cabinet médical', 'Suivi', 'effectué', 'Contrôle glycémie et tension - RAS'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, yesterday, '16:30', 'Dr. Bernard', 'Pédiatrie',
    'Cabinet pédiatrique', 'Consultation', 'effectué', 'Contrôle croissance - tout va bien'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, '2024-10-20', '09:00', 'Dr. Rousseau', 'Cardiologie',
    'Clinique du Cœur', 'Suivi', 'effectué', 'Échographie cardiaque - insuffisance stable'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, '2024-10-18', '14:00', 'Dr. Durand', 'Ophtalmologie',
    'Centre Vision', 'Suivi', 'effectué', 'Contrôle glaucome - pression oculaire stable'
  ])

  // FUTURS
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, in7days, '11:00', 'Dr. Durand', 'Ophtalmologie',
    'Centre Vision', 'Urgence', 'à_venir', 'Renouvellement collyre glaucome (STOCK FAIBLE)'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, in14days, '09:30', 'Dr. Leblanc', 'Médecine générale',
    'Cabinet médical', 'Suivi', 'à_venir', 'Bilan sanguin ostéoporose + cholestérol'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    7, in21days, '15:30', 'Dr. Blanc', 'Dentiste',
    'Cabinet dentaire', 'Consultation', 'à_venir', 'Contrôle semestriel dentaire'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, in30days, '08:30', 'Laboratoire Biolab', 'Analyses',
    'Laboratoire Biolab', 'Examen', 'à_venir', 'Prise de sang: glycémie à jeun, HbA1c'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    5, in30days, '17:00', 'Dr. Moreau', 'Médecine générale',
    'Cabinet médical', 'Consultation', 'à_venir', 'Bilan de santé annuel - 40 ans'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    6, in30days, '14:00', 'Dr. Moreau', 'Médecine générale',
    'Cabinet médical', 'Consultation', 'à_venir', 'Renouvellement ordonnance Aerius'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    3, in60days, '10:00', 'Dr. Rousseau', 'Cardiologie',
    'Clinique du Cœur', 'Suivi', 'à_venir', 'Consultation cardiologique semestrielle'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    8, in60days, '16:00', 'Dr. Bernard', 'Pédiatrie',
    'Cabinet pédiatrique', 'Vaccination', 'à_venir', 'Rappel DTP à 6 ans + contrôle croissance'
  ])

  // RENDEZ-VOUS LONG TERME (6-12 mois) - Réaliste en France pour les spécialistes
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    2, in6months, '14:30', 'Dr. Lambert', 'Rhumatologie',
    'Centre Rhumatologie Paris', 'Première consultation', 'à_venir', 'Suivi ostéoporose - Délai d\'attente: 6 mois'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    5, in8months, '10:00', 'Dr. Petit', 'Dermatologie',
    'Clinique Dermatologique', 'Contrôle grains de beauté', 'à_venir', 'Dépistage mélanome - Délai: 8 mois'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    4, in8months, '15:00', 'Dr. Thomas', 'Rhumatologie',
    'Hôpital Saint-Antoine', 'Suivi polyarthrite', 'à_venir', 'Consultation spécialisée - Délai: 8 mois'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    6, in10months, '11:30', 'Dr. Martin', 'ORL',
    'Service ORL - Hôpital Cochin', 'Allergies ORL', 'à_venir', 'Bilan allergie complète - Délai: 10 mois'
  ])
  db.run(`INSERT INTO rendez_vous (
    membre_id, date_rdv, heure, medecin, specialite, lieu, motif, statut, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    1, in1year, '09:00', 'Dr. Garcia', 'Endocrinologie',
    'Service Endocrino - CHU', 'Suivi diabète complexe', 'à_venir', 'Consultation endocrinologue - Délai: 1 an'
  ])

  console.log('  ✅ 17 rendez-vous créés (4 passés + 8 courts termes + 5 longs termes)')

  console.log('✨ Famille de test créée avec succès!')
  console.log('📊 Résumé:')
  console.log('  👨‍👩‍👧‍👦 8 membres (3 générations)')
  console.log('    • Robert (72) & Monique (70) Dupont')
  console.log('    • Claude (74) & Françoise (71) Martin')
  console.log('    • Jean (40) & Marie (38) Dupont')
  console.log('    • Lucas (9) & Emma (6) Dupont')
  console.log('  🩺 5 allergies')
  console.log('  💊 18 traitements (adaptés par âge)')
  console.log('  💉 20 vaccins (calendrier vaccinal réaliste)')
  console.log('  📅 17 rendez-vous (4 passés + 8 courts termes + 5 longs termes)')
  console.log('    → Délais réalistes: 6-12 mois pour spécialistes')
}
