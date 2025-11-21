"""
Script de compilation PyInstaller pour le backend ML CareLink
Compile main.py en exécutable standalone

Usage:
    python build.py
"""

import PyInstaller.__main__
import os
import shutil
import sys

def main():
    print("🚀 Compilation du backend Python ML pour CareLink...")
    print("=" * 60)

    # Nettoyer les anciens builds
    for folder in ['build', 'dist', '__pycache__']:
        if os.path.exists(folder):
            print(f"🧹 Nettoyage: {folder}/")
            shutil.rmtree(folder)

    # Options PyInstaller
    pyinstaller_args = [
        'main.py',                          # Fichier principal
        '--onefile',                        # Un seul exécutable
        '--name=main',                      # Nom de l'exécutable
        '--clean',                          # Nettoyer avant build
        '--noconfirm',                      # Pas de confirmation

        # Cacher la console Windows
        '--windowed' if sys.platform == 'win32' else '--console',

        # Dépendances cachées (ML models)
        '--hidden-import=sentence_transformers',
        '--hidden-import=torch',
        '--hidden-import=transformers',
        '--hidden-import=numpy',
        '--hidden-import=sklearn',
        '--hidden-import=uvicorn',
        '--hidden-import=fastapi',
        '--hidden-import=pydantic',

        # Inclure le dossier cache (si existe)
        '--add-data=cache;cache' if sys.platform == 'win32' else '--add-data=cache:cache',

        # Options de performance
        '--optimize=2',                     # Optimisation Python
    ]

    print("\n📦 Options PyInstaller:")
    for arg in pyinstaller_args:
        print(f"   {arg}")

    print("\n⏳ Compilation en cours (cela peut prendre 5-10 minutes)...")
    print("   - Téléchargement des dépendances...")
    print("   - Compilation du code Python...")
    print("   - Empaquetage des modèles ML...")

    try:
        # Lancer PyInstaller
        PyInstaller.__main__.run(pyinstaller_args)

        print("\n" + "=" * 60)
        print("✅ Compilation réussie!")
        print(f"📁 Exécutable: dist/main{'exe' if sys.platform == 'win32' else ''}")

        # Taille du fichier
        exe_path = os.path.join('dist', 'main.exe' if sys.platform == 'win32' else 'main')
        if os.path.exists(exe_path):
            size_mb = os.path.getsize(exe_path) / (1024 * 1024)
            print(f"📊 Taille: {size_mb:.1f} MB")

        print("\n🎯 Prochaines étapes:")
        print("   1. Tester: python -c \"import http.client; http.client.HTTPConnection('localhost', 8003).request('GET', '/health')\"")
        print("   2. Intégrer dans Electron: Ajouter dans package.json extraResources")
        print("=" * 60)

    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ Erreur lors de la compilation:")
        print(f"   {str(e)}")
        print("\n💡 Solutions possibles:")
        print("   - Installer PyInstaller: pip install pyinstaller")
        print("   - Vérifier que toutes les dépendances sont installées: pip install -r requirements.txt")
        print("   - Essayer avec Python 3.9-3.11 (plus stable avec PyInstaller)")
        print("=" * 60)
        sys.exit(1)

if __name__ == '__main__':
    main()
