"""
CareLink Medical OCR Backend - API FastAPI
===========================================

Serveur Python pour améliorer l'OCR des ordonnances médicales.
Utilise EasyOCR + NLP médical pour extraction précise.

Endpoints:
- POST /ocr/extract - Extraire texte et données d'une ordonnance
- GET /health - Vérifier l'état du serveur
- POST /validate-medication - Valider un nom de médicament

Auteur: CareLink Team
Version: 1.0.0
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
import os
import secrets
from datetime import datetime

# Import des modules métier
from ocr_service import MedicalOCRService
from nlp_extractor import MedicalNLPExtractor
from medication_validator import MedicationValidator
from health_predictor import HealthPredictor

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialisation de FastAPI
app = FastAPI(
    title="CareLink Medical OCR API",
    description="API d'extraction intelligente de données médicales depuis ordonnances",
    version="1.0.0"
)

# Configuration CORS restreinte pour plus de sécurité
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server uniquement
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Seulement les méthodes nécessaires
    allow_headers=["Content-Type", "Authorization"],  # Headers nécessaires uniquement
)

# Génération d'un secret partagé pour l'authentification
# En production, ceci devrait être configuré via variable d'environnement
SHARED_SECRET = os.getenv("CARELINK_SECRET", secrets.token_urlsafe(32))
if not os.getenv("CARELINK_SECRET"):
    logger.warning(f"⚠️ Secret généré automatiquement: {SHARED_SECRET}")
    logger.warning("⚠️ Définissez CARELINK_SECRET dans les variables d'environnement pour la production")

security = HTTPBearer()

async def verify_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifie l'authentification via Bearer token"""
    if credentials.credentials != SHARED_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Authentification invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials

# Initialisation des services (lazy loading pour économiser la RAM)
ocr_service: Optional[MedicalOCRService] = None
nlp_extractor: Optional[MedicalNLPExtractor] = None
medication_validator: Optional[MedicationValidator] = None
health_predictor: Optional[HealthPredictor] = None


def get_ocr_service() -> MedicalOCRService:
    """Initialise le service OCR à la première utilisation"""
    global ocr_service
    if ocr_service is None:
        logger.info("Initialisation du service OCR...")
        ocr_service = MedicalOCRService()
        logger.info("Service OCR prêt ✓")
    return ocr_service


def get_nlp_extractor() -> MedicalNLPExtractor:
    """Initialise l'extracteur NLP à la première utilisation"""
    global nlp_extractor
    if nlp_extractor is None:
        logger.info("Initialisation de l'extracteur NLP...")
        nlp_extractor = MedicalNLPExtractor()
        logger.info("Extracteur NLP prêt ✓")
    return nlp_extractor


def get_medication_validator() -> MedicationValidator:
    """Initialise le validateur de médicaments à la première utilisation"""
    global medication_validator
    if medication_validator is None:
        logger.info("Chargement de la base de médicaments...")
        medication_validator = MedicationValidator()
        logger.info("Validateur de médicaments prêt ✓")
    return medication_validator


def get_health_predictor() -> HealthPredictor:
    """Initialise le prédicteur de santé à la première utilisation"""
    global health_predictor
    if health_predictor is None:
        logger.info("Initialisation du prédicteur de santé ML...")
        health_predictor = HealthPredictor()
        logger.info("Prédicteur de santé prêt ✓")
    return health_predictor


# ============================================================================
# Modèles de données (Pydantic)
# ============================================================================

class MedicationExtracted(BaseModel):
    """Médicament extrait d'une ordonnance"""
    nom: str
    nom_normalise: Optional[str] = None  # Nom corrigé depuis la base
    dosage: Optional[str] = None
    posologie: Optional[str] = None
    duree: Optional[str] = None
    confidence: float  # 0-100
    is_validated: bool = False  # Trouvé dans la base de médicaments


class PrescriptionData(BaseModel):
    """Données extraites d'une ordonnance"""
    texte_complet: str
    medicaments: List[MedicationExtracted]
    date_ordonnance: Optional[str] = None
    date_validite: Optional[str] = None
    medecin: Optional[str] = None
    patient: Optional[str] = None
    confidence_globale: float  # 0-100
    qualite: str  # 'excellente', 'bonne', 'moyenne', 'faible'
    warnings: List[str] = []  # Avertissements éventuels


class MedicationValidationRequest(BaseModel):
    """Requête de validation d'un médicament"""
    nom: str


class MedicationValidationResponse(BaseModel):
    """Réponse de validation d'un médicament"""
    is_valid: bool
    nom_corrige: Optional[str] = None
    suggestions: List[str] = []
    dci: Optional[str] = None  # Dénomination Commune Internationale


class MemberHealthData(BaseModel):
    """Données de santé d'un membre pour prédiction"""
    age: int
    vaccinations: Dict[str, int]  # {'total': X, 'completed': Y}
    appointments: Dict[str, int]  # {'total': X, 'completed': Y, 'cancelled': Z}
    treatments: Dict[str, int]  # {'active': X, 'low_stock': Y, 'expiring': Z}
    allergies: Dict[str, int]  # {'total': X, 'severe': Y}
    days_since_last_appointment: int


class HealthRiskPrediction(BaseModel):
    """Prédiction de risque de santé"""
    risk_level: str  # 'low', 'moderate', 'high', 'critical'
    risk_score: float  # 0-100
    confidence: float  # 0-100
    risk_factors: List[Dict]
    recommendations: List[str]
    method: str  # 'ml' ou 'rule_based'


class AnomalyDetectionResult(BaseModel):
    """Résultat de détection d'anomalies"""
    is_anomaly: bool
    anomaly_score: float
    anomaly_details: List[str]


# ============================================================================
# Routes de l'API
# ============================================================================

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "service": "CareLink Medical OCR API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "ocr_extract": "POST /ocr/extract",
            "validate_medication": "POST /validate-medication",
            "predict_health_risk": "POST /predict-health-risk",
            "detect_anomalies": "POST /detect-anomalies"
        }
    }


@app.get("/health")
async def health_check():
    """Vérifier l'état de santé du serveur"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "ocr": ocr_service is not None,
            "nlp": nlp_extractor is not None,
            "medication_db": medication_validator is not None,
            "health_predictor": health_predictor is not None,
            "ml_trained": health_predictor.is_trained if health_predictor else False
        }
    }


@app.post("/ocr/extract", response_model=PrescriptionData)
async def extract_prescription(
    file: UploadFile = File(...),
    auth: HTTPAuthorizationCredentials = Depends(verify_auth)
):
    """
    Extraire les données d'une ordonnance médicale

    Args:
        file: Image de l'ordonnance (JPG, PNG, PDF)

    Returns:
        PrescriptionData: Données extraites et structurées

    Raises:
        HTTPException: Si l'extraction échoue
    """
    try:
        logger.info(f"Réception d'une ordonnance: {file.filename}")

        # Vérifier le type de fichier
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Type de fichier non supporté: {file.content_type}. "
                       f"Formats acceptés: JPG, PNG, PDF"
            )

        # Lire le fichier
        image_bytes = await file.read()
        logger.info(f"Taille du fichier: {len(image_bytes)} octets")

        # Étape 1: OCR - Extraire le texte brut
        logger.info("Étape 1/3: Extraction OCR...")
        ocr = get_ocr_service()
        ocr_result = ocr.extract_text(image_bytes)

        if not ocr_result['text'] or len(ocr_result['text'].strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Impossible de lire le texte. Vérifiez la qualité de l'image."
            )

        logger.info(f"OCR réussi - Confiance: {ocr_result['confidence']:.1f}%")

        # Étape 2: NLP - Extraire les entités médicales
        logger.info("Étape 2/3: Extraction NLP des entités médicales...")
        nlp = get_nlp_extractor()
        extracted_data = nlp.extract_medical_entities(ocr_result['text'])

        logger.info(f"{len(extracted_data['medicaments'])} médicament(s) détecté(s)")

        # Étape 3: Validation - Corriger les noms de médicaments
        logger.info("Étape 3/3: Validation avec la base de médicaments...")
        validator = get_medication_validator()

        validated_medications = []
        for med in extracted_data['medicaments']:
            validation = validator.validate_medication(med['nom'])

            validated_med = MedicationExtracted(
                nom=med['nom'],
                nom_normalise=validation.get('nom_corrige'),
                dosage=med.get('dosage'),
                posologie=med.get('posologie'),
                duree=med.get('duree'),
                confidence=med.get('confidence', 75.0),
                is_validated=validation['is_valid']
            )
            validated_medications.append(validated_med)

        # Calculer la qualité globale
        qualite = _calculate_quality(ocr_result['confidence'], validated_medications)

        # Générer des warnings si nécessaire
        warnings = []
        if ocr_result['confidence'] < 70:
            warnings.append("Qualité OCR moyenne - Vérifiez attentivement les données")

        unvalidated_count = sum(1 for m in validated_medications if not m.is_validated)
        if unvalidated_count > 0:
            warnings.append(
                f"{unvalidated_count} médicament(s) non trouvé(s) dans la base - "
                "Vérifiez l'orthographe"
            )

        # Construire la réponse
        response = PrescriptionData(
            texte_complet=ocr_result['text'],
            medicaments=validated_medications,
            date_ordonnance=extracted_data.get('date_ordonnance'),
            date_validite=extracted_data.get('date_validite'),
            medecin=extracted_data.get('medecin'),
            patient=extracted_data.get('patient'),
            confidence_globale=ocr_result['confidence'],
            qualite=qualite,
            warnings=warnings
        )

        logger.info(f"Extraction terminée avec succès - Qualité: {qualite}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur interne: {str(e)}"
        )


@app.post("/validate-medication", response_model=MedicationValidationResponse)
async def validate_medication(
    request: MedicationValidationRequest,
    auth: HTTPAuthorizationCredentials = Depends(verify_auth)
):
    """
    Valider un nom de médicament et obtenir des suggestions

    Args:
        request: Nom du médicament à valider

    Returns:
        MedicationValidationResponse: Résultat de la validation
    """
    try:
        validator = get_medication_validator()
        result = validator.validate_medication(request.nom)

        return MedicationValidationResponse(
            is_valid=result['is_valid'],
            nom_corrige=result.get('nom_corrige'),
            suggestions=result.get('suggestions', []),
            dci=result.get('dci')
        )
    except Exception as e:
        logger.error(f"Erreur validation médicament: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-health-risk", response_model=HealthRiskPrediction)
async def predict_health_risk(
    member_data: MemberHealthData,
    auth: HTTPAuthorizationCredentials = Depends(verify_auth)
):
    """
    Prédire les risques de santé d'un membre avec ML

    Args:
        member_data: Données de santé du membre

    Returns:
        HealthRiskPrediction: Prédiction de risque avec recommandations

    Example request:
        {
            "age": 45,
            "vaccinations": {"total": 8, "completed": 6},
            "appointments": {"total": 12, "completed": 10, "cancelled": 2},
            "treatments": {"active": 2, "low_stock": 1, "expiring": 0},
            "allergies": {"total": 1, "severe": 0},
            "days_since_last_appointment": 90
        }
    """
    try:
        logger.info(f"Prédiction de risque pour membre âgé de {member_data.age} ans")

        predictor = get_health_predictor()

        # Convertir en dict pour le prédicteur
        data_dict = member_data.dict()

        # Prédire
        prediction = predictor.predict_health_risk(data_dict)

        logger.info(
            f"Prédiction terminée - Risque: {prediction['risk_level']} "
            f"(score: {prediction['risk_score']:.1f})"
        )

        return HealthRiskPrediction(**prediction)

    except Exception as e:
        logger.error(f"Erreur prédiction risque: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la prédiction: {str(e)}"
        )


@app.post("/detect-anomalies", response_model=AnomalyDetectionResult)
async def detect_anomalies(
    member_data: MemberHealthData,
    auth: HTTPAuthorizationCredentials = Depends(verify_auth)
):
    """
    Détecter des anomalies dans les données de santé

    Utilise Isolation Forest pour identifier des patterns inhabituels
    qui pourraient nécessiter une attention particulière.

    Args:
        member_data: Données de santé du membre

    Returns:
        AnomalyDetectionResult: Résultat de la détection d'anomalies

    Example request:
        {
            "age": 75,
            "vaccinations": {"total": 5, "completed": 5},
            "appointments": {"total": 20, "completed": 8, "cancelled": 12},
            "treatments": {"active": 15, "low_stock": 5, "expiring": 3},
            "allergies": {"total": 3, "severe": 2},
            "days_since_last_appointment": 850
        }
    """
    try:
        logger.info("Détection d'anomalies...")

        predictor = get_health_predictor()

        # Convertir en dict
        data_dict = member_data.dict()

        # Détecter anomalies
        result = predictor.detect_anomalies(data_dict)

        if result['is_anomaly']:
            logger.warning(
                f"Anomalie détectée ! Score: {result['anomaly_score']:.2f}"
            )
        else:
            logger.info("Aucune anomalie détectée")

        return AnomalyDetectionResult(**result)

    except Exception as e:
        logger.error(f"Erreur détection anomalies: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la détection: {str(e)}"
        )


# ============================================================================
# Fonctions utilitaires
# ============================================================================

def _calculate_quality(confidence: float, medications: List[MedicationExtracted]) -> str:
    """
    Calculer la qualité globale de l'extraction

    Args:
        confidence: Score de confiance OCR (0-100)
        medications: Liste des médicaments extraits

    Returns:
        str: 'excellente', 'bonne', 'moyenne', ou 'faible'
    """
    # Nombre de médicaments validés
    validated_count = sum(1 for m in medications if m.is_validated)
    validation_ratio = validated_count / len(medications) if medications else 0

    # Score composite
    score = (confidence * 0.6) + (validation_ratio * 100 * 0.4)

    if score >= 85:
        return 'excellente'
    elif score >= 70:
        return 'bonne'
    elif score >= 50:
        return 'moyenne'
    else:
        return 'faible'


# ============================================================================
# Point d'entrée
# ============================================================================

if __name__ == "__main__":
    # Démarrer le serveur
    logger.info("🚀 Démarrage du serveur CareLink Medical OCR...")

    # Port par défaut: 8000
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Localhost uniquement (sécurité)
        port=port,
        reload=True,  # Auto-reload en développement
        log_level="info"
    )
