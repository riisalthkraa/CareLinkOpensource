# Guide de Démarrage CareLink - Pour Débutants Complets

> Version 2.0.0 | Application de Gestion Connectée de la Santé Familiale

## Avant de Commencer

Ce guide est conçu pour quelqu'un qui n'a **JAMAIS** codé. Suivez chaque étape dans l'ordre.

**Documentation complète** : Voir [../README.md](../README.md) pour l'index de la documentation.

---

## Étape 1 : Installer Node.js (5 minutes)

Node.js est l'outil qui permet de faire fonctionner l'application.

### Sur Windows :

1. Allez sur https://nodejs.org/
2. Cliquez sur le gros bouton vert **"LTS"** (Long Term Support)
3. Téléchargez le fichier `.msi`
4. Double-cliquez sur le fichier téléchargé
5. Cliquez sur "Next" partout (gardez toutes les options par défaut)
6. Redémarrez votre ordinateur

### Vérifier que ça fonctionne :

1. Appuyez sur les touches **Windows + R**
2. Tapez `cmd` et appuyez sur Entrée
3. Dans la fenêtre noire qui s'ouvre, tapez :
   ```
   node --version
   ```
4. Vous devriez voir quelque chose comme `v20.10.0` s'afficher

✅ Si vous voyez un numéro de version, c'est bon !
❌ Si vous voyez une erreur, réinstallez Node.js

---

## Étape 2 : Ouvrir un Terminal dans le Dossier CareLink (2 minutes)

### Sur Windows (Méthode Simple) :

1. Ouvrez l'**Explorateur de fichiers**
2. Allez dans `C:\Users\RK\Desktop\CareLink`
3. Dans la barre d'adresse en haut, cliquez et tapez `cmd`
4. Appuyez sur Entrée
5. Une fenêtre noire s'ouvre : c'est le **terminal**

### Alternative :
1. Ouvrez l'Explorateur de fichiers
2. Allez dans le dossier CareLink
3. Maintenez **Shift** enfoncé et faites **clic droit** dans le dossier
4. Cliquez sur **"Ouvrir dans le terminal"** ou **"Ouvrir une fenêtre PowerShell ici"**

---

## Étape 3 : Installer les Dépendances (10-15 minutes)

Les "dépendances" sont tous les outils dont l'application a besoin pour fonctionner.

### Dans le terminal, tapez exactement :

```bash
npm install
```

puis appuyez sur **Entrée**.

### Ce qui va se passer :

- Beaucoup de texte va défiler
- C'est normal ! L'ordinateur télécharge les outils
- Cela prend **5 à 15 minutes** selon votre connexion internet
- À la fin, vous devriez voir un message de succès

⏳ **Pendant que ça charge, allez prendre un café !**

✅ Succès : Vous voyez un message sans erreur rouge
❌ Erreur : Si vous voyez beaucoup de rouge, vérifiez votre connexion internet et réessayez

---

## Étape 4 : Lancer l'Application (30 secondes)

### Dans le terminal, tapez :

```bash
npm start
```

puis appuyez sur **Entrée**.

### Ce qui va se passer :

1. Le terminal va afficher du texte pendant 5-10 secondes
2. Deux choses vont s'ouvrir :
   - Une fenêtre de navigateur (que vous pouvez ignorer)
   - **L'application CareLink** dans une fenêtre desktop

🎉 **Félicitations ! L'application fonctionne !**

---

## Étape 5 : Tester l'Application (5 minutes)

### Test 1 : Ajouter un membre

1. Cliquez sur le bouton **"➕ Ajouter un membre"**
2. Remplissez le formulaire :
   - Prénom : Marc
   - Nom : Dupont
   - Date de naissance : 01/01/1990
3. Cliquez sur **"Ajouter"**
4. Une carte devrait apparaître avec les informations

### Test 2 : Voir le profil

1. Cliquez sur la carte "Marc Dupont"
2. Vous devriez voir une page de profil détaillée

### Test 3 : Navigation

1. Cliquez sur les boutons dans le menu du haut :
   - 💉 Vaccins
   - 💊 Traitements
   - 📅 Rendez-vous
2. Ces pages montrent ce qui sera développé ensuite

---

## Étape 6 : Arrêter l'Application

### Pour fermer l'application :

1. Fermez la fenêtre CareLink (comme n'importe quelle application)
2. Dans le terminal, appuyez sur **Ctrl + C**
3. Le terminal redevient disponible

### Pour relancer l'application :

```bash
npm start
```

---

## 🎯 Commandes à Connaître

Voici les 3 commandes que vous utiliserez le plus souvent :

| Commande | Quand l'utiliser |
|----------|-----------------|
| `npm install` | Après avoir téléchargé le projet ou ajouté un package |
| `npm start` | Pour lancer l'application en mode développement |
| `npm run build` | Pour créer une version finale de l'application |

---

## 🗂️ Où Trouver les Fichiers Importants

```
CareLink/
├── src/                    ← Code de l'interface (ce que vous voyez)
│   ├── pages/             ← Les différentes pages
│   │   ├── Dashboard.tsx  ← Page d'accueil
│   │   ├── ProfilMembre.tsx
│   │   └── ...
│   ├── App.tsx            ← Fichier principal de l'interface
│   └── index.css          ← Styles (couleurs, positions)
│
├── electron/              ← Code de l'application desktop
│   ├── main.ts            ← Point de départ Electron
│   └── preload.ts         ← Sécurité
│
├── package.json           ← Liste des outils installés
└── README.md              ← Documentation complète
```

---

## 🛠️ Comment Modifier l'Application

### Changer une couleur :

1. Ouvrez `src/index.css` avec un éditeur de texte (Notepad++, VS Code, etc.)
2. Trouvez cette section :
   ```css
   :root {
     --primary-color: #4A90E2;
   ```
3. Changez `#4A90E2` par une autre couleur (ex: `#FF0000` pour rouge)
4. Sauvegardez le fichier
5. L'application se recharge automatiquement !

### Changer un texte :

1. Ouvrez `src/pages/Dashboard.tsx`
2. Trouvez `<h2>👨‍👩‍👧‍👦 Ma Famille</h2>`
3. Changez "Ma Famille" par ce que vous voulez
4. Sauvegardez
5. Le changement apparaît immédiatement !

---

## 💾 Où est stockée la Base de Données ?

Vos données sont enregistrées automatiquement dans :

**Windows** : `C:\Users\VotreNom\AppData\Roaming\carelink\carelink.db`

Vous pouvez ouvrir ce fichier avec [DB Browser for SQLite](https://sqlitebrowser.org/) pour voir vos données.

---

## 🆘 En Cas de Problème

### L'application ne démarre pas

1. Fermez tout
2. Dans le terminal :
   ```bash
   npm install
   npm start
   ```

### Erreur "Cannot find module"

```bash
npm install
```

### L'application affiche une page blanche

1. Appuyez sur **F12** dans l'application
2. Regardez les erreurs dans l'onglet "Console"
3. Cherchez l'erreur sur Google

### Tout casser et recommencer

```bash
# Supprimer les installations
rmdir /s node_modules
del package-lock.json

# Réinstaller
npm install
npm start
```

---

## 🎓 Prochaines Étapes pour Apprendre

### 1. Comprendre la structure (1 semaine)

- Ouvrez chaque fichier dans `src/pages/`
- Lisez le code et essayez de comprendre ce qu'il fait
- Faites de petites modifications pour voir ce qui change

### 2. Apprendre React (2-3 semaines)

- Suivez le tutoriel officiel : https://react.dev/learn
- Regardez des vidéos YouTube sur React pour débutants
- Pratiquez en créant de nouvelles pages simples

### 3. Apprendre TypeScript (1-2 semaines)

- Tutorial officiel : https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- C'est comme JavaScript mais avec des types

### 4. Comprendre Electron (1 semaine)

- Documentation : https://www.electronjs.org/docs/latest/tutorial/quick-start
- Regardez comment `electron/main.ts` fonctionne

---

## ✨ Conseils pour Bien Débuter

1. **Ne paniquez pas** : Tout le monde a été débutant
2. **Faites de petits changements** : Changez une chose à la fois
3. **Testez souvent** : Après chaque modification, vérifiez que ça marche
4. **Sauvegardez vos fichiers** : Faites des copies de sauvegarde régulièrement
5. **Google est votre ami** : Cherchez les erreurs sur Google
6. **Commentez votre code** : Expliquez ce que vous faites

### Exemple de bon commentaire :

```typescript
// Cette fonction calcule l'âge d'une personne
// à partir de sa date de naissance
const calculateAge = (birthDate: string) => {
  // Code...
}
```

---

## 🎯 Objectifs Recommandés

### Semaine 1 :
- ✅ Installer et lancer l'application
- ✅ Ajouter plusieurs membres de famille
- ✅ Explorer toutes les pages

### Semaine 2 :
- ✅ Changer les couleurs de l'application
- ✅ Modifier des textes
- ✅ Comprendre la structure des fichiers

### Semaine 3 :
- ✅ Créer une nouvelle page simple
- ✅ Ajouter un bouton dans le menu
- ✅ Comprendre comment fonctionne la base de données

### Mois 2-3 :
- ✅ Suivre le plan de développement
- ✅ Implémenter le module Vaccins
- ✅ Implémenter le module Traitements

---

**Vous êtes prêt ! Amusez-vous bien ! 🚀**

Si vous avez des questions, relisez ce guide étape par étape.
La plupart des problèmes viennent du fait qu'on a sauté une étape.

**Bonne chance ! 💪**
