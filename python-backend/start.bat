@echo off
REM Script de démarrage du backend Python pour CareLink
REM ====================================================

echo.
echo ========================================
echo  Démarrage Backend Python CareLink
echo ========================================
echo.

REM Vérifier que l'environnement virtuel existe
if not exist venv (
    echo [ERREUR] Environnement virtuel non trouvé
    echo Veuillez d'abord lancer install.bat
    pause
    exit /b 1
)

REM Activer l'environnement virtuel
echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

REM Démarrer le serveur
echo.
echo Démarrage du serveur OCR...
echo Serveur accessible sur : http://127.0.0.1:8000
echo Documentation API : http://127.0.0.1:8000/docs
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

python main.py
