# 🚀 QUICK START - CareLink

Guide ultra-rapide pour démarrer avec les nouvelles fonctionnalités.

---

## ⚡ Pour les Impatients

### Build Production (tout automatique)

```bash
# 1. Installer dépendances Python (une seule fois)
cd python-backend
pip install -r requirements.txt
pip install pyinstaller

# 2. Compiler et build l'app complète
cd ..
python python-backend/build_standalone.py
node scripts/setup-python-backend.js
npm run build:electron

# 3. Installer et tester
# → release/CareLink Setup.exe
```

**C'est tout !** 🎉

---

## 🔧 Pour le Développement

### Démarrer en mode dev

```bash
# Terminal 1 : Backend Python manuel (optionnel)
cd python-backend
python main.py

# Terminal 2 : Electron
npm run dev
```

### Tester les API Python

```bash
cd python-backend
python test_api.py
```

### Tester l'OCR

Ouvrir http://127.0.0.1:8000/docs dans le navigateur et tester `/ocr/extract`

---

## 📋 Commandes Utiles

### Backend Python

```bash
# Installer dépendances
pip install -r python-backend/requirements.txt

# Compiler en .exe
python python-backend/build_standalone.py

# Tester l'exe compilé
python-backend/dist/carelink-backend.exe

# Tests automatisés
python python-backend/test_api.py
```

### Build Electron

```bash
# Setup backend dans Electron
node scripts/setup-python-backend.js

# Build production
npm run build:electron

# Dev mode
npm run dev
```

---

## ✅ Checklist Avant Build

- [ ] Python installé (3.8+)
- [ ] `pip install -r python-backend/requirements.txt` OK
- [ ] `pip install pyinstaller` OK
- [ ] `python python-backend/build_standalone.py` OK
- [ ] `node scripts/setup-python-backend.js` OK
- [ ] `npm run build:electron` OK

---

## 🎯 Vérifications Post-Build

### Test 1 : Backend Python fonctionne

```bash
cd python-backend/dist
./carelink-backend.exe
# → Navigateur: http://127.0.0.1:8000/health
# → Doit afficher {"status": "healthy"}
```

### Test 2 : App complète

```bash
# Installer l'exe généré
release/CareLink Setup.exe

# Lancer CareLink
# → Doit démarrer sans erreur
# → Console Electron doit afficher:
#    "✅ Backend Python activé - Mode Enhanced"
```

### Test 3 : OCR amélioré

```
1. Ouvrir CareLink
2. Aller sur Scanner d'Ordonnance
3. Upload une image de test
4. → Doit utiliser Python OCR (qualité "excellente/bonne")
```

---

## 🐛 Résolution Problèmes Rapide

### "Backend Python non trouvé"

```bash
# Vérifier que l'exe existe
ls python-backend/dist/carelink-backend.exe

# Si non → Recompiler
python python-backend/build_standalone.py
```

### "Module not found: easyocr"

```bash
# Réinstaller dépendances
cd python-backend
pip install -r requirements.txt
```

### "Port 8000 already in use"

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### "PyInstaller not found"

```bash
pip install pyinstaller
```

---

## 📚 Documentation Complète

- **`INTEGRATION_PYTHON_GUIDE.md`** - Guide intégration Electron (détaillé)
- **`OCR_AMELIORATIONS.md`** - Améliorations OCR
- **`ML_PREDICTIONS_GUIDE.md`** - Machine Learning
- **`RECAPITULATIF_COMPLET.md`** - Résumé global
- **`QUICK_START.md`** - Ce fichier

---

## 💡 Tips

### Mode Enhanced vs Standard

**Enhanced** (avec Python) :
- OCR 90% précision
- ML prédictions
- Validation médicaments

**Standard** (fallback) :
- OCR 70% précision (Tesseract.js)
- Règles basiques
- Pas de ML

→ L'app détecte automatiquement le mode disponible

### Forcer le mode Standard (dev)

```typescript
// src/services/PythonOCRService.ts
// Commenter cette ligne:
// const isBackendUp = await checkPythonBackend();
// Remplacer par:
const isBackendUp = false; // Force fallback
```

---

## 🎯 Workflow Recommandé

### Développement quotidien

```bash
# Lancer juste Electron (Python optionnel)
npm run dev
```

### Avant de commit

```bash
# Tester les 2 modes
npm run dev  # Mode Enhanced
# → Tester fonctionnalités

# Désactiver Python
# → Tester mode Standard (fallback)
```

### Avant release

```bash
# Build complet
python python-backend/build_standalone.py
node scripts/setup-python-backend.js
npm run build:electron

# Test sur machine vierge
# → Installer l'exe
# → Vérifier tout fonctionne
```

---

## ✅ C'est Tout !

**3 commandes pour tout builder** :

```bash
python python-backend/build_standalone.py  # Compile Python
node scripts/setup-python-backend.js        # Setup Electron
npm run build:electron                      # Build app
```

**Résultat** : `release/CareLink Setup.exe` prêt à distribuer ! 🚀

---

**Besoin d'aide ?** → Consulte les guides détaillés dans le dossier.

**Date** : 2025-01-02
**Version** : 1.0.0
