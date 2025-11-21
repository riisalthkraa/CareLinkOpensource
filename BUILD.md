# 🏗️ BUILD CARELINK - Guide Complet

Ce document explique comment compiler CareLink en **version distribuable** avec le **backend Python ML inclus**.

---

## 📋 PRÉREQUIS

### 1. Node.js et npm
```bash
node --version  # v18+ recommandé
npm --version   # v9+ recommandé
```

### 2. Python
```bash
python --version  # v3.9-3.11 recommandé (PyInstaller plus stable)
```

### 3. Dépendances installées

**Node.js:**
```bash
cd "C:\Users\RK\Desktop\CareLink DEV\CareLink"
npm install
```

**Python:**
```bash
cd services/ia-health
pip install -r requirements.txt
```

---

## 🎯 BUILD COMPLET (RECOMMANDÉ)

### Option 1: Build automatique (tout-en-un)

```bash
npm run build:full
```

Cette commande fait **automatiquement**:
1. ✅ Compile le backend Python ML en `.exe` (via PyInstaller)
2. ✅ Compile l'app Electron + React
3. ✅ Package tout en installateur Windows/Mac/Linux
4. ✅ Inclut le backend ML dans le package final

**Résultat:** `release/CareLink Setup.exe` (~700 MB)

---

### Option 2: Build étape par étape (pour debug)

#### Étape 1: Compiler le backend Python

```bash
cd services/ia-health
python build.py
```

**Vérification:**
```bash
dir dist\main.exe  # Windows
# Le fichier doit exister (~500 MB)
```

**Test du backend compilé:**
```bash
# Lancer le backend
cd dist
main.exe

# Dans un autre terminal, tester
curl http://localhost:8003/health
# Doit retourner: {"status":"healthy"}
```

#### Étape 2: Compiler l'app Electron

```bash
cd "C:\Users\RK\Desktop\CareLink DEV\CareLink"
npm run build:electron
```

**Résultat:** `release/CareLink Setup.exe`

---

## 📦 CE QUI EST INCLUS DANS LE BUILD

### Fichiers automatiquement embarqués:

```
CareLink Setup.exe (installateur)
└─ Installe dans C:\Program Files\CareLink\
   ├─ CareLink.exe                    # Application Electron
   ├─ resources\
   │  ├─ app.asar                     # Code React/TypeScript compilé
   │  └─ python-backend\
   │     └─ main.exe                  # ⭐ Backend Python ML (~500 MB)
   ├─ assets\                         # Icônes, images
   └─ node_modules\ (minifiés)
```

### Contenu du backend ML (`main.exe`):

- ✅ Python 3.x runtime embarqué
- ✅ FastAPI + Uvicorn
- ✅ Sentence-BERT (paraphrase-multilingual-mpnet-base-v2)
- ✅ PyTorch + NumPy + scikit-learn
- ✅ Cache MD5 pour performance x10
- ✅ Base de données médicale (15 conditions)
- ✅ Toutes les dépendances Python

**Aucune installation Python requise par l'utilisateur final !**

---

## 🚀 LANCEMENT AUTOMATIQUE DU BACKEND

Le backend Python démarre **automatiquement** quand l'utilisateur lance CareLink.

### Code dans `electron/main.ts` (ligne 613-624):

```typescript
// Démarrer le backend Python en arrière-plan
console.log('🚀 Démarrage de CareLink...');
startPythonBackend().then((success) => {
  if (success) {
    console.log('✅ Backend Python activé - Mode Enhanced');
  } else {
    console.log('⚠️  Mode Standard - Fallback vers analyse basique');
  }
});
```

### Fonctionnement:

1. **CareLink démarre**
2. **Electron cherche:** `resources/python-backend/main.exe`
3. **Lance le process:** `spawn(main.exe)`
4. **Attend le health check:** `http://localhost:8003/health`
5. **Si OK:** Mode ML activé ✅
6. **Si échec:** Fallback automatique ⚠️

---

## 🔧 SCRIPTS NPM DISPONIBLES

```bash
# Développement
npm run start              # Lancer en mode dev (avec Vite hot-reload)

# Build backend Python seul
npm run build:python       # Compile main.py → main.exe

# Build Electron seul
npm run build:electron     # Compile app (sans recompiler Python)

# Build complet (recommandé)
npm run build:full         # Python + Electron + Package

# Nettoyage
npm run clean              # Supprime dist/
```

---

## 🐛 DÉPANNAGE

### Problème 1: PyInstaller échoue

**Erreur:**
```
ModuleNotFoundError: No module named 'sentence_transformers'
```

**Solution:**
```bash
cd services/ia-health
pip install -r requirements.txt --force-reinstall
pip install pyinstaller==6.3.0
```

---

### Problème 2: Backend ne démarre pas dans le build

**Symptômes:**
- CareLink démarre mais le backend ML ne fonctionne pas
- Console dit "Mode fallback activé"

**Vérification:**
1. Ouvrir l'installateur CareLink avec 7-Zip
2. Vérifier que `resources/python-backend/main.exe` existe
3. Taille du fichier: ~500 MB

**Si absent:**
```bash
# Vérifier que le build Python a réussi
dir services\ia-health\dist\main.exe

# Recompiler si nécessaire
cd services\ia-health
python build.py

# Rebuild Electron
npm run build:electron
```

---

### Problème 3: Build très long (>20 min)

**Normal pour la première fois:**
- PyInstaller télécharge PyTorch (~1.5 GB)
- Empaquetage du modèle Sentence-BERT (~500 MB)
- Builds suivants: ~5-10 min (cache PyInstaller)

**Accélérer:**
```bash
# Conserver le cache PyInstaller
# Ne pas supprimer services/ia-health/build/
```

---

### Problème 4: electron-builder échoue sur extraResources

**Erreur:**
```
Error: File not found: services/ia-health/dist/main.exe
```

**Solution:**
Compiler le backend Python AVANT electron-builder:
```bash
npm run build:python
npm run build:electron
```

Ou utiliser:
```bash
npm run build:full  # Fait tout dans le bon ordre
```

---

## 📊 TAILLE DES BUILDS

| Version | Taille | Contenu |
|---------|--------|---------|
| **Sans Python ML** | ~200 MB | Electron + React + Fallback basique |
| **Avec Python ML** | ~700 MB | + Backend ML + Sentence-BERT + PyTorch |
| **Backend ML seul** | ~500 MB | main.exe (standalone) |

---

## ✅ VÉRIFICATION DU BUILD FINAL

### Test 1: Installer CareLink

```bash
cd release
.\CareLink Setup.exe
# → Installer dans C:\Program Files\CareLink\
```

### Test 2: Vérifier le backend

```bash
# Lancer CareLink
# Ouvrir DevTools (F12)
# Regarder la console:

# Doit afficher:
# "🚀 Démarrage de CareLink..."
# "📦 Exécutable trouvé: C:\...\resources\python-backend\main.exe"
# "✅ Backend Python prêt"
# "✅ Backend Python activé - Mode Enhanced"
```

### Test 3: Tester le ML

```bash
# Dans CareLink, aller dans ChatDoctor
# Taper: "J'ai une douleur thoracique et essoufflement"

# Backend ML doit:
# ✅ Analyser sémantiquement les symptômes
# ✅ Détecter severity = "emergency"
# ✅ Retourner conditions similaires avec score
# ✅ Recommander "🚨 APPELEZ LE 15"
```

### Test 4: Mode Fallback

```bash
# Tuer le backend manuellement (Task Manager)
# CareLink doit:
# ⚠️  Basculer en mode fallback automatiquement
# ⚠️  Continuer de fonctionner (analyse mots-clés)
# ⚠️  Afficher "Service ML indisponible"
```

---

## 🎯 DISTRIBUTION FINALE

### Fichiers à distribuer:

```
release/
├─ CareLink Setup.exe              # Windows (recommandé)
├─ CareLink-2.0.0.exe              # Portable Windows (optionnel)
├─ CareLink-2.0.0.dmg              # macOS
└─ CareLink-2.0.0.AppImage         # Linux
```

### Tester avant distribution:

1. ✅ Installer sur machine **sans Python installé**
2. ✅ Vérifier backend ML démarre automatiquement
3. ✅ Tester analyse symptômes avec Sentence-BERT
4. ✅ Vérifier fallback si backend absent
5. ✅ Tester multi-provider (Gemini, Claude, Ollama)

---

## 💡 RECOMMANDATION

### Pour une distribution optimale:

**Version 1: Build complet (recommandé)**
```bash
npm run build:full
```
- ✅ Tout inclus
- ✅ Zéro installation utilisateur
- ✅ ML Sentence-BERT fonctionnel
- ⚠️  ~700 MB

**Version 2: Build sans ML (alternative légère)**
```bash
# Ne pas compiler le backend Python
npm run build:electron
```
- ✅ Léger (~200 MB)
- ✅ Fonctionne avec fallback basique
- ⚠️  Pas de Sentence-BERT
- ⚠️  Analyse mots-clés seulement

---

## 📝 CHECKLIST BUILD PRODUCTION

Avant de distribuer:

- [ ] Tests unitaires passent (`npm test`)
- [ ] Backend Python compile sans erreur
- [ ] Electron builder réussit
- [ ] Backend ML démarre dans le build
- [ ] Test sur machine propre (sans Node.js/Python)
- [ ] Multi-provider fonctionne
- [ ] Chiffrement AES-256 actif
- [ ] Dashboard temps réel fonctionne
- [ ] Tracking API enregistre les appels
- [ ] Fallback automatique testé

---

## 🆘 SUPPORT

En cas de problème:

1. **Vérifier les logs:**
```bash
# Logs Electron (DevTools F12)
# Logs Python: services/ia-health/logs/ (si activé)
```

2. **Recompiler proprement:**
```bash
npm run clean
rimraf services/ia-health/dist
rimraf services/ia-health/build
npm run build:full
```

3. **Tester les composants séparément:**
```bash
# Tester backend ML seul
cd services/ia-health/dist
main.exe

# Tester Electron seul (sans backend)
npm run start
```

---

## ✨ RÉSULTAT FINAL

**L'utilisateur final:**
1. ✅ Télécharge `CareLink Setup.exe` (~700 MB)
2. ✅ Double-clic pour installer
3. ✅ Lance CareLink
4. ✅ **Tout fonctionne immédiatement**
   - Backend ML Sentence-BERT actif
   - Multi-provider avec priorités
   - Chiffrement AES-256
   - Dashboard temps réel
   - Tracking coûts API

**ZÉRO installation supplémentaire requise ! 🎉**
