"""
Build Standalone Python Backend
================================

Compile le backend Python en un exécutable standalone (.exe sur Windows)
qui sera intégré dans l'app Electron.

Utilise PyInstaller pour créer un bundle autonome avec :
- Python runtime
- Toutes les dépendances (FastAPI, EasyOCR, scikit-learn, etc.)
- Modèles EasyOCR (téléchargés automatiquement)

Output: dist/carelink-backend.exe (Windows) ou carelink-backend (Mac/Linux)

Usage:
    python build_standalone.py
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

print("🔨 CareLink - Build Standalone Python Backend")
print("=" * 60)

# Vérifier que PyInstaller est installé
try:
    import PyInstaller
    print("✓ PyInstaller trouvé")
except ImportError:
    print("❌ PyInstaller non installé")
    print("Installation: pip install pyinstaller")
    sys.exit(1)

# Répertoires
BACKEND_DIR = Path(__file__).parent
DIST_DIR = BACKEND_DIR / "dist"
BUILD_DIR = BACKEND_DIR / "build"

# Nettoyer les builds précédents
print("\n📁 Nettoyage des builds précédents...")
if DIST_DIR.exists():
    shutil.rmtree(DIST_DIR)
if BUILD_DIR.exists():
    shutil.rmtree(BUILD_DIR)
print("✓ Nettoyé")

# Configuration PyInstaller
print("\n⚙️  Configuration PyInstaller...")

# Fichiers de données à inclure (modèles, etc.)
# EasyOCR téléchargera les modèles au premier lancement

# Commande PyInstaller
pyinstaller_cmd = [
    "pyinstaller",
    "--name=carelink-backend",           # Nom de l'exécutable
    "--onefile",                          # Un seul fichier exe
    "--clean",                            # Nettoyage avant build
    "--noconfirm",                        # Pas de confirmation

    # Optimisations
    "--optimize=2",                       # Optimisation Python

    # Pas de console (background service)
    "--noconsole",                        # Pas de fenêtre console (Windows)

    # Hidden imports (modules chargés dynamiquement)
    "--hidden-import=uvicorn.logging",
    "--hidden-import=uvicorn.loops",
    "--hidden-import=uvicorn.loops.auto",
    "--hidden-import=uvicorn.protocols",
    "--hidden-import=uvicorn.protocols.http",
    "--hidden-import=uvicorn.protocols.http.auto",
    "--hidden-import=uvicorn.protocols.websockets",
    "--hidden-import=uvicorn.protocols.websockets.auto",
    "--hidden-import=uvicorn.lifespan",
    "--hidden-import=uvicorn.lifespan.on",
    "--hidden-import=easyocr",
    "--hidden-import=sklearn.utils._cython_blas",
    "--hidden-import=sklearn.neighbors.typedefs",
    "--hidden-import=sklearn.neighbors.quad_tree",
    "--hidden-import=sklearn.tree._utils",

    # Collections (requis par certaines dépendances)
    "--collect-all=easyocr",

    # Fichier principal
    "main.py"
]

print(f"Command: {' '.join(pyinstaller_cmd)}")

# Exécuter PyInstaller
print("\n🔨 Compilation en cours...")
print("Cela peut prendre plusieurs minutes...")

result = subprocess.run(
    pyinstaller_cmd,
    cwd=BACKEND_DIR,
    capture_output=False
)

if result.returncode != 0:
    print("\n❌ Erreur lors de la compilation")
    sys.exit(1)

# Vérifier que l'exécutable a été créé
exe_name = "carelink-backend.exe" if sys.platform == "win32" else "carelink-backend"
exe_path = DIST_DIR / exe_name

if not exe_path.exists():
    print(f"\n❌ Exécutable non trouvé: {exe_path}")
    sys.exit(1)

# Succès
print("\n" + "=" * 60)
print("✅ Build réussi !")
print("=" * 60)
print(f"\n📦 Exécutable: {exe_path}")
print(f"📏 Taille: {exe_path.stat().st_size / (1024*1024):.1f} MB")

print("\n📋 Prochaines étapes:")
print("1. Tester l'exécutable: dist/carelink-backend.exe")
print("2. Copier vers le dossier Electron: ../resources/python-backend/")
print("3. Modifier electron/main.ts pour lancer automatiquement")
print("\n💡 Commande de test:")
print(f"   {exe_path}")
print("   Puis visiter: http://127.0.0.1:8000/health")
print()
