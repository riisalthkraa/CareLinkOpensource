-- =============================================
-- SCRIPT DE RÉINITIALISATION DE LA BASE DE DONNÉES
-- MODE DISTRIBUTION - BASE VIDE
-- =============================================
-- Ce script supprime toutes les données de démonstration
-- pour préparer l'application à la distribution
--
-- UTILISATION:
-- Exécuter ce script avant de créer un installeur pour distribution
-- La base de données sera vide et prête pour les vrais utilisateurs
-- =============================================

-- =============================================
-- SUPPRESSION DE TOUTES LES DONNÉES DE DÉMONSTRATION
-- =============================================

-- Désactiver les contraintes de clés étrangères temporairement
PRAGMA foreign_keys = OFF;

-- Supprimer toutes les données dans l'ordre inverse des dépendances

-- Tables du dossier médical
DELETE FROM consultations_specialisees;
DELETE FROM bilans_medicaux;
DELETE FROM diagnostics;
DELETE FROM antecedents_medicaux;

-- Tables médicales de base
DELETE FROM rendez_vous;
DELETE FROM traitements;
DELETE FROM vaccins;
DELETE FROM allergies;
DELETE FROM documents;

-- Table des membres (supprimera aussi toutes les données liées par CASCADE)
DELETE FROM membres;

-- Table des utilisateurs (garder le compte admin de base)
-- Ne supprimer QUE les utilisateurs de démo (id > 1)
DELETE FROM users WHERE id > 1;

-- Réinitialiser les compteurs d'auto-incrémentation
DELETE FROM sqlite_sequence WHERE name IN (
  'membres',
  'allergies',
  'vaccins',
  'traitements',
  'rendez_vous',
  'documents',
  'antecedents_medicaux',
  'diagnostics',
  'bilans_medicaux',
  'consultations_specialisees',
  'users'
);

-- Réactiver les contraintes de clés étrangères
PRAGMA foreign_keys = ON;

-- =============================================
-- VÉRIFICATION: Compter les enregistrements restants
-- =============================================
-- Ces requêtes doivent toutes renvoyer 0 (sauf users qui doit renvoyer 1)

SELECT 'Membres restants:' as Info, COUNT(*) as Count FROM membres;
SELECT 'Allergies restantes:' as Info, COUNT(*) as Count FROM allergies;
SELECT 'Vaccins restants:' as Info, COUNT(*) as Count FROM vaccins;
SELECT 'Traitements restants:' as Info, COUNT(*) as Count FROM traitements;
SELECT 'Rendez-vous restants:' as Info, COUNT(*) as Count FROM rendez_vous;
SELECT 'Documents restants:' as Info, COUNT(*) as Count FROM documents;
SELECT 'Antécédents restants:' as Info, COUNT(*) as Count FROM antecedents_medicaux;
SELECT 'Diagnostics restants:' as Info, COUNT(*) as Count FROM diagnostics;
SELECT 'Bilans restants:' as Info, COUNT(*) as Count FROM bilans_medicaux;
SELECT 'Consultations restantes:' as Info, COUNT(*) as Count FROM consultations_specialisees;
SELECT 'Utilisateurs restants:' as Info, COUNT(*) as Count FROM users;

-- =============================================
-- FIN DU SCRIPT DE RÉINITIALISATION
-- =============================================
-- ✅ La base de données est maintenant vide et prête pour la distribution
-- ✅ L'utilisateur admin (id=1) est conservé
-- ✅ Toutes les tables sont vides
-- ✅ Les compteurs d'auto-incrémentation sont réinitialisés
-- =============================================
