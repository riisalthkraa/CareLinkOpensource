-- Nettoyage
DELETE FROM rendez_vous;
DELETE FROM traitements;
DELETE FROM vaccins;
DELETE FROM allergies;
DELETE FROM membres;

-- Famille Dupont (4 membres)
INSERT INTO membres (famille_id, nom, prenom, date_naissance, sexe, groupe_sanguin, rhesus, poids, taille, telephone, email, numero_securite_sociale, medecin_traitant, telephone_medecin, contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation, notes)
VALUES
(1, 'Dupont', 'Jean', '1985-03-15', 'M', 'A', '+', 78.5, 178, '06 12 34 56 78', 'jean.dupont@email.fr', '1 85 03 75 123 456 78', 'Dr. Martin', '01 45 67 89 12', 'Marie Dupont', '06 98 76 54 32', 'Épouse', 'Légère hypertension'),
(1, 'Dupont', 'Marie', '1987-07-22', 'F', 'O', '+', 62.0, 165, '06 98 76 54 32', 'marie.dupont@email.fr', '2 87 07 75 123 456 89', 'Dr. Martin', '01 45 67 89 12', 'Jean Dupont', '06 12 34 56 78', 'Époux', 'Asthme léger'),
(1, 'Dupont', 'Lucas', '2015-04-10', 'M', 'A', '+', 28.5, 130, NULL, NULL, '1 15 04 75 123 456 90', 'Dr. Petit', '01 23 45 67 89', 'Marie Dupont', '06 98 76 54 32', 'Mère', 'Bon état de santé général'),
(1, 'Dupont', 'Emma', '2018-09-28', 'F', 'O', '+', 18.0, 105, NULL, NULL, '2 18 09 75 123 456 91', 'Dr. Petit', '01 23 45 67 89', 'Jean Dupont', '06 12 34 56 78', 'Père', 'Allergies alimentaires (arachides)');

-- Allergies (4)
INSERT INTO allergies (membre_id, substance, severite, date_decouverte, notes)
VALUES
(2, 'Pénicilline', 'Élevée', '2010-05-12', 'Réaction anaphylactique'),
(4, 'Arachides', 'Élevée', '2022-03-20', 'Éviter tout contact'),
(4, 'Pollen', 'Modérée', '2023-04-15', 'Rhume des foins au printemps'),
(3, 'Poils de chat', 'Modérée', '2020-08-10', 'Éternuements, yeux rouges');

-- Traitements actifs (7)
INSERT INTO traitements (membre_id, nom_medicament, dosage, frequence, date_debut, date_fin, type, stock_restant, medecin_prescripteur, renouvellement_ordonnance, actif, notes)
VALUES
-- Jean
(1, 'Lisinopril', '10 mg', '1 fois par jour le matin', '2023-01-15', NULL, 'quotidien', 90, 'Dr. Martin', date('now', '+30 days'), 1, 'Pour hypertension'),
(1, 'Doliprane', '1000 mg', 'Si besoin (max 3/jour)', '2023-01-01', NULL, 'si_besoin', 45, 'Dr. Martin', date('now', '+60 days'), 1, 'Douleurs et fièvre'),
-- Marie
(2, 'Ventoline', '100 µg/dose', '2 bouffées si besoin', '2020-06-10', NULL, 'si_besoin', 1, 'Dr. Martin', date('now', '+7 days'), 1, 'Asthme - STOCK FAIBLE!'),
(2, 'Fer', '80 mg', '1 comprimé par jour', '2024-09-01', '2024-12-01', 'quotidien', 30, 'Dr. Martin', NULL, 1, 'Cure de 3 mois'),
-- Lucas
(3, 'Doliprane Enfant', '250 mg', 'Si fièvre (max 4/jour)', '2023-01-01', NULL, 'si_besoin', 20, 'Dr. Petit', date('now', '+60 days'), 1, 'Selon poids'),
-- Emma
(4, 'Aerius', '0.5 mg/ml', '5 ml par jour', '2024-03-15', '2024-06-15', 'quotidien', 10, 'Dr. Petit', NULL, 1, 'Antihistaminique pour allergie pollen'),
(4, 'Amoxicilline', '250 mg', '3 fois par jour', '2024-10-20', '2024-10-27', 'quotidien', 15, 'Dr. Petit', NULL, 0, 'Otite - TRAITEMENT TERMINÉ');

-- Vaccins (8)
INSERT INTO vaccins (membre_id, nom_vaccin, date_injection, date_rappel, numero_lot, lieu_injection, medecin, notes)
VALUES
-- Jean
(1, 'COVID-19', '2024-09-15', '2025-09-15', 'COV2024-789', 'Pharmacie', 'Dr. Martin', 'Dose de rappel annuelle'),
(1, 'Tétanos', '2020-05-10', '2030-05-10', 'TET2020-456', 'Cabinet Dr. Martin', 'Dr. Martin', 'Rappel tous les 10 ans'),
-- Marie
(2, 'COVID-19', '2024-09-15', '2025-09-15', 'COV2024-790', 'Pharmacie', 'Dr. Martin', 'Dose de rappel annuelle'),
(2, 'Grippe', '2023-10-20', '2024-10-20', 'FLU2023-123', 'Pharmacie', 'Dr. Martin', 'EXPIRE BIENTÔT!'),
-- Lucas
(3, 'ROR', '2016-04-15', NULL, 'ROR2016-345', 'PMI', 'Dr. Petit', 'Rougeole-Oreillons-Rubéole'),
(3, 'DTP', '2023-04-10', '2028-04-10', 'DTP2023-678', 'Cabinet Dr. Petit', 'Dr. Petit', 'Diphtérie-Tétanos-Polio'),
-- Emma
(4, 'ROR', '2019-09-30', NULL, 'ROR2019-456', 'PMI', 'Dr. Petit', 'Rougeole-Oreillons-Rubéole'),
(4, 'Hépatite B', '2018-11-28', NULL, 'HEP2018-789', 'Maternité', 'Dr. Petit', 'Vaccination complète');

-- Rendez-vous (6: 2 passés, 4 futurs)
INSERT INTO rendez_vous (membre_id, date_rendez_vous, heure, type, medecin, specialite, lieu, statut, notes)
VALUES
-- Passés
(1, date('now', '-1 day'), '09:30', 'Consultation', 'Dr. Martin', 'Médecine générale', 'Cabinet médical', 'termine', 'Bilan de santé annuel - RAS'),
(4, '2024-10-20', '14:00', 'Consultation', 'Dr. Petit', 'Pédiatrie', 'Cabinet pédiatrique', 'termine', 'Otite - Antibiotiques prescrits'),
-- Futurs
(2, date('now', '+7 days'), '10:00', 'Suivi', 'Dr. Dubois', 'Pneumologie', 'Hôpital Saint-Joseph', 'planifie', 'Suivi asthme annuel'),
(3, date('now', '+30 days'), '15:30', 'Dentiste', 'Dr. Blanc', 'Dentiste', 'Cabinet dentaire', 'planifie', 'Contrôle semestriel'),
(1, date('now', '+30 days'), '11:00', 'Examen', 'Dr. Martin', 'Médecine générale', 'Laboratoire d''analyses', 'planifie', 'Bilan sanguin de contrôle'),
(4, date('now', '+60 days'), '16:00', 'Vaccination', 'Dr. Petit', 'Pédiatrie', 'Cabinet pédiatrique', 'planifie', 'Rappel DTP');
