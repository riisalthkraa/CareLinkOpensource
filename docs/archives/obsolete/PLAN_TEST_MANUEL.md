# 📋 Plan de Test Manuel - CareLink v0.1

**Date :** 29/10/2025
**Version :** 0.1.0 (MVP en développement)
**Testeur :** RK

---

## 🎯 Objectif

Tester systématiquement toutes les fonctionnalités implémentées et identifier les bugs/améliorations nécessaires.

---

## ✅ Checklist de Test

### 1. Démarrage de l'Application

| Test | Résultat | Notes |
|------|----------|-------|
| L'application se lance sans erreur | ⬜ À tester | |
| La fenêtre s'affiche correctement | ⬜ À tester | Taille : 1200x800 |
| Le menu de navigation est visible | ⬜ À tester | Accueil, Vaccins, Traitements, RDV |
| Le logo "🏥 CareLink" s'affiche | ⬜ À tester | |
| Aucune erreur dans la console (F12) | ⬜ À tester | |

---

### 2. Dashboard (Page d'Accueil)

| Test | Résultat | Notes |
|------|----------|-------|
| Le titre "Ma Famille" s'affiche | ⬜ À tester | |
| Le bouton "+ Ajouter un membre" est visible | ⬜ À tester | |
| Message "Aucun membre" si liste vide | ⬜ À tester | |
| Les widgets (RDV, Traitements, Alertes) s'affichent | ⬜ À tester | |

---

### 3. Ajout d'un Membre

| Test | Résultat | Notes |
|------|----------|-------|
| Cliquer sur "+ Ajouter un membre" | ⬜ À tester | Le formulaire doit s'ouvrir |
| Le formulaire contient : Prénom, Nom, Date de naissance | ⬜ À tester | |
| Les champs sont obligatoires (astérisque) | ⬜ À tester | |
| Ajouter un membre : Marc Dupont, né le 01/01/1990 | ⬜ À tester | |
| Une notification de succès s'affiche | ⬜ À tester | |
| La carte du membre apparaît dans la liste | ⬜ À tester | |
| L'âge est calculé correctement | ⬜ À tester | Devrait afficher "35 ans" |
| L'avatar contient la première lettre du prénom | ⬜ À tester | Devrait afficher "M" |
| Le formulaire se ferme après ajout | ⬜ À tester | |
| Le bouton "Annuler" ferme le formulaire | ⬜ À tester | |

**Test avec plusieurs membres :**
| Test | Résultat | Notes |
|------|----------|-------|
| Ajouter 3-4 membres différents | ⬜ À tester | Vérifier disposition en grille |
| Les cartes s'affichent correctement en grille | ⬜ À tester | |

---

### 4. Profil d'un Membre

| Test | Résultat | Notes |
|------|----------|-------|
| Cliquer sur une carte membre | ⬜ À tester | Devrait ouvrir le profil |
| Le bouton "← Retour" est visible | ⬜ À tester | |
| L'avatar large s'affiche (première lettre) | ⬜ À tester | |
| Le nom complet s'affiche correctement | ⬜ À tester | |
| L'âge s'affiche correctement | ⬜ À tester | |
| La date de naissance est formatée (JJ/MM/AAAA) | ⬜ À tester | |
| Le groupe sanguin affiche "Non renseigné" | ⬜ À tester | |
| Les sections Allergies, Vaccins, Traitements s'affichent | ⬜ À tester | Avec message "Aucun..." |
| Le bouton "← Retour" ramène au dashboard | ⬜ À tester | |

---

### 5. Navigation Entre les Pages

| Test | Résultat | Notes |
|------|----------|-------|
| Cliquer sur "🏠 Accueil" depuis n'importe où | ⬜ À tester | Retour au dashboard |
| Cliquer sur "💉 Vaccins" | ⬜ À tester | Page vaccins s'affiche |
| Cliquer sur "💊 Traitements" | ⬜ À tester | Page traitements s'affiche |
| Cliquer sur "📅 Rendez-vous" | ⬜ À tester | Page RDV s'affiche |
| Le bouton actif est surligné en bleu | ⬜ À tester | |
| Le survol des boutons change le fond | ⬜ À tester | Effet hover |

---

### 6. Pages Fonctionnalités (En Développement)

| Test | Résultat | Notes |
|------|----------|-------|
| Page Vaccins affiche le titre et la liste des fonctionnalités à venir | ⬜ À tester | |
| Page Traitements affiche le titre et la liste | ⬜ À tester | |
| Page RDV affiche le titre et la liste | ⬜ À tester | |
| Le bouton "← Retour" fonctionne sur ces pages | ⬜ À tester | |

---

### 7. Base de Données

| Test | Résultat | Notes |
|------|----------|-------|
| Les membres ajoutés persistent après redémarrage | ⬜ À tester | Fermer et rouvrir l'app |
| Le fichier carelink.db existe dans AppData | ⬜ À tester | Chemin : C:\Users\RK\AppData\Roaming\Electron\ |
| Ajouter 5 membres et vérifier la sauvegarde | ⬜ À tester | |

**Localisation de la DB :**
```
Windows : C:\Users\RK\AppData\Roaming\Electron\carelink.db
```

---

### 8. Interface Utilisateur (UI/UX)

| Test | Résultat | Notes |
|------|----------|-------|
| Les couleurs sont cohérentes (bleu, blanc, gris) | ⬜ À tester | |
| Les boutons ont un effet hover | ⬜ À tester | |
| Les animations de carte (fadeIn) fonctionnent | ⬜ À tester | |
| Les formulaires sont bien espacés | ⬜ À tester | |
| La police est lisible | ⬜ À tester | |
| Les icônes (émojis) s'affichent correctement | ⬜ À tester | |

---

### 9. Responsive Design

| Test | Résultat | Notes |
|------|----------|-------|
| Réduire la taille de la fenêtre | ⬜ À tester | Vérifier que ça reste lisible |
| Agrandir la fenêtre | ⬜ À tester | Vérifier l'adaptation |

---

### 10. Performance

| Test | Résultat | Notes |
|------|----------|-------|
| L'application se charge en moins de 3 secondes | ⬜ À tester | |
| Les interactions sont fluides (pas de lag) | ⬜ À tester | |
| La mémoire utilisée est raisonnable | ⬜ À tester | Vérifier dans le Task Manager |

---

### 11. Console Développeur (F12)

| Test | Résultat | Notes |
|------|----------|-------|
| Ouvrir la console (F12) | ⬜ À tester | |
| Vérifier qu'il n'y a pas d'erreurs rouges | ⬜ À tester | |
| Les logs de base de données s'affichent | ⬜ À tester | "Base de données sauvegardée" |

---

## 🐛 Bugs Identifiés

| # | Description | Sévérité | Status |
|---|-------------|----------|--------|
| 1 | _À remplir pendant les tests_ | | |
| 2 | | | |
| 3 | | | |

**Légende Sévérité :**
- 🔴 **Critique** : Bloque l'utilisation
- 🟠 **Haute** : Fonctionnalité importante cassée
- 🟡 **Moyenne** : Problème d'UX/UI
- 🟢 **Faible** : Amélioration mineure

---

## 💡 Améliorations Suggérées

| # | Description | Priorité | Effort |
|---|-------------|----------|--------|
| 1 | _À remplir pendant les tests_ | | |
| 2 | | | |
| 3 | | | |

**Priorité :** P0 (Urgent), P1 (Haute), P2 (Moyenne), P3 (Basse)
**Effort :** S (Small), M (Medium), L (Large)

---

## 📸 Captures d'Écran

**TODO :** Prendre des captures d'écran de :
1. Dashboard vide
2. Dashboard avec 3-4 membres
3. Profil d'un membre
4. Formulaire d'ajout
5. Pages Vaccins/Traitements/RDV

---

## 🎯 Prochaines Étapes Après Tests

1. ✅ Corriger tous les bugs critiques (🔴)
2. ✅ Corriger les bugs haute priorité (🟠)
3. ✅ Implémenter les améliorations P0
4. ✅ Passer au développement du module Vaccins (Phase 1)

---

## 📝 Notes du Testeur

_Espace libre pour noter vos observations pendant les tests :_

```
[À remplir]







```

---

**Testé par :** RK
**Date du test :** __/__/____
**Durée du test :** ___ minutes
**Résultat global :** ⬜ Succès | ⬜ Échec | ⬜ Partiel
