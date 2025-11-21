@echo off
REM Script d'installation du backend Python pour CareLink
REM ======================================================

echo.
echo ========================================
echo  Installation Backend Python CareLink
echo ========================================
echo.

REM Vérifier que Python est installé
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installé ou pas dans le PATH
    echo Veuillez installer Python 3.8+ depuis https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python détecté
python --version

REM Créer un environnement virtuel
echo.
echo [1/4] Création de l'environnement virtuel...
if exist venv (
    echo Environnement virtuel déjà existant
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERREUR] Échec de création de l'environnement virtuel
        pause
        exit /b 1
    )
    echo [OK] Environnement virtuel créé
)

REM Activer l'environnement virtuel
echo.
echo [2/4] Activation de l'environnement virtuel...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERREUR] Échec d'activation de l'environnement virtuel
    pause
    exit /b 1
)
echo [OK] Environnement virtuel activé

REM Mettre à jour pip
echo.
echo [3/4] Mise à jour de pip...
python -m pip install --upgrade pip
echo [OK] pip mis à jour

REM Installer les dépendances
echo.
echo [4/4] Installation des dépendances...
echo Cela peut prendre plusieurs minutes (téléchargement d'EasyOCR ~200 MB)...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERREUR] Échec d'installation des dépendances
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Installation terminée avec succès !
echo ========================================
echo.
echo Pour démarrer le serveur :
echo   1. venv\Scripts\activate
echo   2. python main.py
echo.
echo Le serveur sera accessible sur http://127.0.0.1:8000
echo.

pause
