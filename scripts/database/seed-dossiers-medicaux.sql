-- =============================================
-- SCRIPT DE DONNÉES MÉDICALES COHÉRENTES POUR LES MEMBRES DE DÉMO
-- =============================================
-- Ce script crée des dossiers médicaux complets et cohérents pour expliquer
-- POURQUOI chaque membre prend ses traitements actuels
--
-- Membres de démonstration:
-- 1. Jean Dupont (53 ans) - Hypertension, diabète type 2
-- 2. Marie Dupont (50 ans) - Hypothyroïdie, cholestérol
-- 3. Emma Dupont (6 ans) - Allergie grave aux arachides -> épinéphrine
-- 4. Lucas Dupont (10 ans) - Asthme -> traitement inhalateur
-- =============================================

-- =============================================
-- JEAN DUPONT (ID 1) - 53 ans
-- Diagnostics: Hypertension artérielle, Diabète type 2
-- Traitements: Amlodipine 5mg, Metformine 850mg
-- =============================================

-- Antécédents médicaux de Jean
INSERT INTO antecedents_medicaux (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes) VALUES
(1, 'maladie', 'Hypertension familiale', 'Historique familial d''hypertension (père et mère)', '2005-01-01', NULL, 1, 'modérée', 'Dr. Martin', NULL, 'Surveillance régulière nécessaire'),
(1, 'operation', 'Appendicectomie', 'Ablation de l''appendice suite à une appendicite aiguë', '1995-06-15', '1995-06-20', 0, 'modérée', 'Dr. Rousseau', 'CHU Nantes', 'Convalescence de 2 semaines'),
(1, 'hospitalisation', 'Surmenage professionnel', 'Hospitalisation de 3 jours suite à un épuisement', '2018-03-10', '2018-03-13', 0, 'légère', 'Dr. Leblanc', 'Clinique Saint-Joseph', 'Repos prescrit pendant 1 mois');

-- Diagnostics actifs de Jean
INSERT INTO diagnostics (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, traitement_lie, notes) VALUES
(1, 'Hypertension artérielle essentielle', 'I10', '2015-09-20', 'Dr. Martin', 'Médecine générale', 'modérée', 'actif', NULL, 'Tension contrôlée par médicament. HTA découverte lors d''un bilan systématique. Traitement par Amlodipine depuis 2015.'),
(1, 'Diabète de type 2', 'E11', '2020-01-15', 'Dr. Petit', 'Endocrinologie', 'modérée', 'actif', NULL, 'Diabète découvert avec HbA1c à 7.8%. Traité par Metformine 850mg 2x/jour. Régime alimentaire et exercice recommandés.');

-- Bilans médicaux de Jean
INSERT INTO bilans_medicaux (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire, resultat_global, valeurs_principales, interpretation, fichier_resultat, notes) VALUES
(1, 'analyse_sang', 'Bilan lipidique complet', '2024-09-15', 'Dr. Martin', 'Laboratoire Biopath', 'anormal', 'Cholestérol total: 2.15 g/L, LDL: 1.45 g/L, HDL: 0.55 g/L, Triglycérides: 1.10 g/L', 'Légère hypercholestérolémie. Surveillance et régime alimentaire recommandés.', NULL, 'Contrôle dans 6 mois'),
(1, 'analyse_sang', 'Glycémie à jeun + HbA1c', '2024-10-01', 'Dr. Petit', 'Laboratoire Biopath', 'anormal', 'Glycémie: 1.28 g/L, HbA1c: 6.9%', 'Diabète stabilisé sous traitement. Bon contrôle glycémique.', NULL, 'Prochain contrôle dans 3 mois'),
(1, 'electro', 'Électrocardiogramme (ECG)', '2024-08-20', 'Dr. Cardio', 'Cabinet médical', 'normal', 'Rythme sinusal régulier, FC: 72 bpm', 'ECG normal. Pas de signe d''hypertrophie ventriculaire.', NULL, 'Contrôle annuel recommandé');

-- Consultations spécialisées de Jean
INSERT INTO consultations_specialisees (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation, diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande, prochain_rdv, compte_rendu, notes) VALUES
(1, '2024-01-15', 'Endocrinologie', 'Dr. Petit', 'Cabinet d''endocrinologie - 12 rue Victor Hugo', 'Suivi diabète type 2', 'Diabète de type 2 équilibré', 'Glycémie à jeun, HbA1c trimestrielle', 'Poursuite Metformine 850mg 2x/jour', 'Consultation tous les 3 mois', '2024-04-15', 'Patient diabétique depuis 2020. Traitement par Metformine bien toléré. HbA1c actuelle: 6.9% (objectif < 7%). Bonne observance thérapeutique et diététique. Encourager à maintenir l''activité physique régulière.', NULL),
(1, '2024-06-10', 'Cardiologie', 'Dr. Cardio', 'Centre cardiologique', 'Suivi hypertension', 'HTA bien contrôlée sous traitement', 'ECG, échographie cardiaque dans 1 an', 'Poursuite Amlodipine 5mg/jour', 'Consultation annuelle', '2025-06-10', 'Hypertension diagnostiquée en 2015. Actuellement bien contrôlée sous Amlodipine 5mg. TA: 135/85 mmHg. ECG normal. Pas de signe de cardiopathie hypertensive. Encourager perte de poids (objectif -5kg) et réduction du sel.', NULL);

-- =============================================
-- MARIE DUPONT (ID 2) - 50 ans
-- Diagnostics: Hypothyroïdie, Hypercholestérolémie
-- Traitements: Levothyrox 75µg
-- =============================================

-- Antécédents médicaux de Marie
INSERT INTO antecedents_medicaux (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes) VALUES
(2, 'maladie', 'Hypothyroïdie auto-immune', 'Thyroïdite de Hashimoto diagnostiquée', '2018-03-01', NULL, 1, 'modérée', 'Dr. Endocrino', NULL, 'Traitement à vie par Levothyrox'),
(2, 'operation', 'Césarienne Emma', 'Césarienne pour naissance d''Emma', '2018-05-10', '2018-05-15', 0, 'légère', 'Dr. Durand', 'Maternité Saint-Anne', 'Accouchement sans complications'),
(2, 'operation', 'Césarienne Lucas', 'Césarienne pour naissance de Lucas', '2014-02-20', '2014-02-24', 0, 'légère', 'Dr. Legrand', 'Maternité Saint-Anne', 'Accouchement sans complications');

-- Diagnostics actifs de Marie
INSERT INTO diagnostics (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, traitement_lie, notes) VALUES
(2, 'Hypothyroïdie auto-immune (Hashimoto)', 'E06.3', '2018-03-15', 'Dr. Endocrino', 'Endocrinologie', 'modérée', 'actif', NULL, 'Thyroïdite de Hashimoto avec TSH initialement à 12 mUI/L. Traitée par Levothyrox 75µg/jour. TSH actuellement normalisée entre 1-2 mUI/L.'),
(2, 'Hypercholestérolémie familiale', 'E78.0', '2022-11-10', 'Dr. Martin', 'Médecine générale', 'légère', 'stabilisé', NULL, 'Cholestérol total à 2.45 g/L. Traitement par régime alimentaire. Actuellement stabilisé sans médicament.');

-- Bilans médicaux de Marie
INSERT INTO bilans_medicaux (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire, resultat_global, valeurs_principales, interpretation, fichier_resultat, notes) VALUES
(2, 'analyse_sang', 'Bilan thyroïdien complet', '2024-09-20', 'Dr. Endocrino', 'Laboratoire Biopath', 'normal', 'TSH: 1.8 mUI/L, T4 libre: 14 pmol/L, Anticorps anti-TPO: 450 UI/mL', 'Hypothyroïdie bien équilibrée sous Levothyrox 75µg. TSH dans la cible.', NULL, 'Prochain contrôle dans 6 mois'),
(2, 'analyse_sang', 'Bilan lipidique', '2024-10-05', 'Dr. Martin', 'Laboratoire Biopath', 'normal', 'Cholestérol total: 2.05 g/L, LDL: 1.25 g/L, HDL: 0.65 g/L', 'Amélioration depuis régime. Cholestérol normalisé sans médicament.', NULL, 'Contrôle dans 1 an'),
(2, 'imagerie', 'Échographie thyroïdienne', '2024-06-15', 'Dr. Endocrino', 'Centre d''imagerie médicale', 'anormal', 'Glande thyroïde hétérogène, nodule 5mm lobe droit', 'Aspect typique de thyroïdite de Hashimoto. Nodule bénin à surveiller.', NULL, 'Contrôle échographie dans 1 an');

-- Consultations spécialisées de Marie
INSERT INTO consultations_specialisees (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation, diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande, prochain_rdv, compte_rendu, notes) VALUES
(2, '2024-09-25', 'Endocrinologie', 'Dr. Endocrino', 'Cabinet d''endocrinologie', 'Suivi hypothyroïdie', 'Hypothyroïdie de Hashimoto bien équilibrée', 'TSH tous les 6 mois', 'Poursuite Levothyrox 75µg/jour', 'Consultation annuelle', '2025-09-25', 'Patiente suivie depuis 2018 pour thyroïdite de Hashimoto. Traitement par Levothyrox 75µg/jour. Dernière TSH à 1.8 mUI/L (cible 1-2). Excellente observance. Aucun signe de sur ou sous-dosage. Maintenir le traitement actuel.', NULL);

-- =============================================
-- EMMA DUPONT (ID 3) - 6 ans
-- Diagnostic: Allergie grave aux arachides (anaphylaxie)
-- Traitements: Épinéphrine auto-injecteur (EpiPen)
-- =============================================

-- Antécédents médicaux d'Emma
INSERT INTO antecedents_medicaux (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes) VALUES
(3, 'maladie', 'Première réaction allergique arachides', 'Choc anaphylactique après ingestion de beurre de cacahuètes', '2022-03-15', '2022-03-15', 1, 'grave', 'Dr. Allergo', 'Urgences CHU', 'Hospitalisation 24h. Diagnostic d''allergie IgE médiée confirmée par tests cutanés.'),
(3, 'hospitalisation', 'Choc anaphylactique arachides', 'Urgence vitale - injection d''adrénaline et hospitalisation', '2022-03-15', '2022-03-16', 0, 'critique', 'Dr. Urgentiste', 'CHU Urgences pédiatriques', 'Œdème de Quincke + urticaire généralisée. Traitement: adrénaline IM + corticoïdes IV.');

-- Diagnostics actifs d'Emma
INSERT INTO diagnostics (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, traitement_lie, notes) VALUES
(3, 'Allergie aux arachides avec risque anaphylactique', 'T78.0', '2022-03-20', 'Dr. Allergo', 'Allergologie pédiatrique', 'critique', 'actif', NULL, 'Allergie IgE médiée aux arachides confirmée par prick-tests positifs et dosage IgE spécifiques élevés (classe 5). Risque vital en cas d''exposition. PRESCRIPTION D''ÉPINÉPHRINE AUTO-INJECTABLE (EpiPen Jr 0.15mg) OBLIGATOIRE EN PERMANENCE. PAI (Projet d''Accueil Individualisé) mis en place à l''école.');

-- Bilans médicaux d'Emma
INSERT INTO bilans_medicaux (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire, resultat_global, valeurs_principales, interpretation, fichier_resultat, notes) VALUES
(3, 'analyse_sang', 'Dosage IgE spécifiques arachides', '2022-03-18', 'Dr. Allergo', 'Laboratoire d''allergologie', 'pathologique', 'IgE totales: 450 UI/mL, IgE arachides: 85 kU/L (classe 5), IgE Ara h2: 45 kU/L', 'Allergie IgE médiée sévère aux arachides confirmée. Risque anaphylactique élevé.', NULL, 'Éviction stricte des arachides et fruits à coque'),
(3, 'autre', 'Tests cutanés (prick-tests) allergènes alimentaires', '2022-03-19', 'Dr. Allergo', 'Cabinet allergologie', 'pathologique', 'Arachide: positif ++++ (papule 12mm), Noisette: positif + (papule 4mm), Autres fruits à coque: négatifs', 'Allergie confirmée arachides (majeure) et noisettes (mineure à surveiller).', NULL, 'Éviction arachides stricte + surveillance noisettes');

-- Consultations spécialisées d'Emma
INSERT INTO consultations_specialisees (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation, diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande, prochain_rdv, compte_rendu, notes) VALUES
(3, '2022-03-20', 'Allergologie pédiatrique', 'Dr. Allergo', 'Service d''allergologie CHU', 'Bilan post-anaphylaxie', 'Allergie IgE médiée aux arachides sévère', 'IgE spécifiques, prick-tests', 'Épinéphrine auto-injectable (EpiPen Jr 0.15mg) x2 stylos, Antihistaminique (Aerius), Corticoïdes (Celestene)', 'Consultation tous les 6 mois', '2024-11-20', 'Patiente de 6 ans ayant présenté un choc anaphylactique grade III après ingestion de beurre de cacahuètes. Diagnostic confirmé par tests cutanés (papule 12mm) et IgE spécifiques très élevées (85 kU/L classe 5). RISQUE VITAL. Prescription: EpiPen Jr 0.15mg x2 (un à la maison + un à l''école). Formation des parents à l''injection réalisée. PAI établi avec l''école. Éviction STRICTE des arachides et dérivés. Lecture systématique des étiquettes alimentaires. Port de la trousse d''urgence OBLIGATOIRE en permanence.', 'Parents formés EpiPen - Carte allergie remise'),
(3, '2024-05-15', 'Allergologie pédiatrique', 'Dr. Allergo', 'Service d''allergologie CHU', 'Suivi allergie arachides', 'Allergie persistante - pas de tolérance acquise', 'Contrôle IgE dans 1 an', 'Renouvellement EpiPen Jr x2, Antihistaminique', 'Consultation tous les 6 mois', '2024-11-15', 'Suivi à 6 ans. Aucun incident depuis diagnostic. Excellente observance de l''éviction. IgE toujours élevées (80 kU/L). Pas d''indication à désensibilisation pour l''instant. Maintien éviction stricte. Renouvellement ordonnance EpiPen Jr. Parents rappelés sur conduite à tenir en cas d''urgence.', NULL);

-- =============================================
-- LUCAS DUPONT (ID 4) - 10 ans
-- Diagnostic: Asthme allergique persistant modéré
-- Traitements: Ventoline (salbutamol), Symbicort (corticoïde inhalé)
-- =============================================

-- Antécédents médicaux de Lucas
INSERT INTO antecedents_medicaux (membre_id, type_antecedent, titre, description, date_debut, date_fin, actif, severite, medecin, hopital, notes) VALUES
(4, 'maladie', 'Bronchiolites répétées (nourrisson)', 'Épisodes de bronchiolites entre 6 mois et 2 ans', '2014-11-01', '2016-03-01', 0, 'modérée', 'Dr. Pédiatre', NULL, 'Facteur de risque pour développement ultérieur d''asthme'),
(4, 'hospitalisation', 'Crise d''asthme sévère', 'Première crise d''asthme aiguë nécessitant hospitalisation', '2020-04-10', '2020-04-12', 0, 'grave', 'Dr. Pneumo', 'Service pédiatrie CHU', 'Crise déclenchée par infection virale. Traitement: ventilation + corticoïdes IV.'),
(4, 'maladie', 'Rhinite allergique', 'Rhinite allergique saisonnière (pollens de graminées)', '2021-05-01', NULL, 1, 'légère', 'Dr. Allergo', NULL, 'Traitement antihistaminique au printemps');

-- Diagnostics actifs de Lucas
INSERT INTO diagnostics (membre_id, pathologie, code_cim10, date_diagnostic, medecin_diagnostic, specialite, severite, statut, traitement_lie, notes) VALUES
(4, 'Asthme allergique persistant modéré', 'J45.0', '2020-04-15', 'Dr. Pneumo', 'Pneumologie pédiatrique', 'modérée', 'actif', NULL, 'Asthme diagnostiqué à 6 ans après crise sévère. Asthme persistant modéré avec sensibilisation aux acariens et pollens. TRAITEMENT DE FOND: Symbicort 100/6µg (2 inhalations matin et soir). TRAITEMENT DE CRISE: Ventoline (salbutamol) à la demande. Bon contrôle sous traitement avec 1-2 crises/an.'),
(4, 'Allergie aux acariens et pollens', 'J30.1', '2020-05-20', 'Dr. Allergo', 'Allergologie', 'modérée', 'actif', NULL, 'Sensibilisation confirmée par tests cutanés: acariens ++, pollens de graminées ++. Facteur déclenchant de l''asthme. Mesures d''éviction recommandées.');

-- Bilans médicaux de Lucas
INSERT INTO bilans_medicaux (membre_id, type_bilan, nom_examen, date_examen, medecin_prescripteur, laboratoire, resultat_global, valeurs_principales, interpretation, fichier_resultat, notes) VALUES
(4, 'spirometrie', 'Exploration fonctionnelle respiratoire (EFR)', '2024-09-10', 'Dr. Pneumo', 'Laboratoire d''explorations fonctionnelles', 'anormal', 'VEMS: 85% prédit, CVF: 92% prédit, Rapport VEMS/CVF: 78%, Test de réversibilité: +18% après bronchodilatateur', 'Syndrome obstructif réversible confirmant l''asthme. Bon contrôle sous traitement de fond.', NULL, 'Prochain contrôle dans 1 an'),
(4, 'analyse_sang', 'Dosage IgE spécifiques pneumallergènes', '2020-05-18', 'Dr. Allergo', 'Laboratoire allergologie', 'pathologique', 'IgE totales: 850 UI/mL, IgE acariens (Dermatophagoides): 45 kU/L, IgE pollens graminées: 35 kU/L', 'Sensibilisation allergique confirmée aux acariens et pollens de graminées.', NULL, 'Mesures d''éviction + traitement de fond'),
(4, 'autre', 'Tests cutanés (prick-tests) pneumallergènes', '2020-05-15', 'Dr. Allergo', 'Cabinet allergologie', 'pathologique', 'Acariens D. pteronyssinus: positif +++ (papule 8mm), Pollens graminées: positif ++ (papule 6mm), Pollens bouleau: positif + (papule 3mm)', 'Polysensibilisation aux pneumallergènes confirmée.', NULL, 'Facteurs déclenchants identifiés');

-- Consultations spécialisées de Lucas
INSERT INTO consultations_specialisees (membre_id, date_consultation, specialite, medecin_nom, hopital_cabinet, motif_consultation, diagnostic_pose, examens_prescrits, traitements_prescrits, suivi_recommande, prochain_rdv, compte_rendu, notes) VALUES
(4, '2020-04-15', 'Pneumologie pédiatrique', 'Dr. Pneumo', 'Service de pneumologie pédiatrique CHU', 'Bilan post-crise asthme sévère', 'Asthme allergique persistant modéré', 'EFR, tests allergologiques, radiographie thorax', 'Symbicort 100/6µg (2 inhal. x2/j), Ventoline à la demande, Antihistaminique', 'Consultation tous les 3 mois puis tous les 6 mois', '2024-11-15', 'Patient de 10 ans hospitalisé pour crise d''asthme sévère (SpO2 88% à l''admission). ATCD de bronchiolites répétées nourrisson. Diagnostic: Asthme allergique persistant modéré. EFR: VEMS 82%, réversibilité +20% post-BD. Sensibilisation acariens et pollens confirmée. Traitement de fond: Symbicort 100/6µg matin et soir. Traitement de crise: Ventoline. Plan d''action écrit remis. Formation à la technique d''inhalation. Mesures d''éviction: housses anti-acariens, aération quotidienne, éviter peluches. Suivi régulier indispensable.', 'Plan d''action asthme remis aux parents'),
(4, '2024-09-12', 'Pneumologie pédiatrique', 'Dr. Pneumo', 'Consultation pneumologie', 'Suivi asthme', 'Asthme bien contrôlé', 'EFR de contrôle', 'Poursuite Symbicort 100/6µg x2/j, Ventoline si besoin', 'Consultation tous les 6 mois', '2025-03-12', 'Suivi à 10 ans. Asthme bien contrôlé depuis 4 ans. 1 seule crise légère cette année (au printemps, pollens). Bonne observance du traitement de fond. Technique d''inhalation correcte vérifiée. EFR: VEMS 85% (amélioration). Maintien traitement de fond Symbicort. Encourager sport (natation recommandée). Renouvellement ordonnance Ventoline pour école et domicile.', NULL);

-- =============================================
-- FIN DU SCRIPT
-- =============================================
