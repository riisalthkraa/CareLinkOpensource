"""
Service Python ML pour CareLink
Backend IA avec Sentence-BERT pour analyse sémantique médicale

Features:
- Analyse sémantique des symptômes
- Détection interactions médicamenteuses
- Prédiction risques santé
- Cache MD5 pour performance x10

Port: 8003
Author: VIEY David
Date: 2025-11-19
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import hashlib
import json
import os
from datetime import datetime

app = FastAPI(
    title="CareLink IA Health Service",
    description="Service d'analyse médicale ML avec Sentence-BERT",
    version="1.0.0"
)

# CORS pour permettre requêtes depuis Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODÈLES DE DONNÉES
# ============================================================================

class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    context: Optional[Dict[str, Any]] = None

class DrugInteractionRequest(BaseModel):
    drugs: List[str]

class RiskPredictionRequest(BaseModel):
    patient_profile: Dict[str, Any]
    symptoms: Optional[str] = None

# ============================================================================
# CACHE GLOBAL
# ============================================================================

embeddings_cache: Dict[str, Any] = {}
conditions_cache: List[Dict[str, Any]] = []

# ============================================================================
# SENTENCE-BERT (chargement lazy)
# ============================================================================

model = None
model_name = 'paraphrase-multilingual-mpnet-base-v2'

def load_model():
    """Charge le modèle Sentence-BERT (lazy loading)"""
    global model
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer
            import torch

            print(f"🔄 Chargement du modèle {model_name}...")
            model = SentenceTransformer(model_name)
            print(f"✅ Modèle chargé avec succès")

            # Charger la base de conditions médicales
            load_medical_conditions()

        except ImportError:
            print("⚠️  sentence-transformers non installé. Mode fallback activé.")
            return None
        except Exception as e:
            print(f"❌ Erreur chargement modèle: {e}")
            return None
    return model

def load_medical_conditions():
    """Charge la base de données de conditions médicales"""
    global conditions_cache

    # Base de conditions médicales courantes
    # En production, charger depuis une vraie base de données
    conditions_cache = [
        {
            "name": "Infarctus du myocarde",
            "symptoms": "douleur thoracique intense, oppression poitrine, essoufflement, nausées, sueurs froides",
            "severity": "emergency",
            "category": "cardiovasculaire"
        },
        {
            "name": "Angine de poitrine",
            "symptoms": "douleur thoracique à l'effort, oppression, essoufflement modéré",
            "severity": "urgent",
            "category": "cardiovasculaire"
        },
        {
            "name": "Pneumonie",
            "symptoms": "fièvre élevée, toux productive, douleur thoracique, essoufflement, fatigue",
            "severity": "urgent",
            "category": "respiratoire"
        },
        {
            "name": "Bronchite aiguë",
            "symptoms": "toux persistante, fièvre modérée, fatigue, douleur thoracique légère",
            "severity": "warning",
            "category": "respiratoire"
        },
        {
            "name": "Asthme",
            "symptoms": "essoufflement, sifflement respiratoire, oppression thoracique, toux sèche",
            "severity": "warning",
            "category": "respiratoire"
        },
        {
            "name": "Gastro-entérite",
            "symptoms": "diarrhée, vomissements, douleurs abdominales, fièvre modérée, fatigue",
            "severity": "warning",
            "category": "digestif"
        },
        {
            "name": "Appendicite",
            "symptoms": "douleur abdominale intense fosse iliaque droite, nausées, vomissements, fièvre",
            "severity": "emergency",
            "category": "digestif"
        },
        {
            "name": "Migraine",
            "symptoms": "douleur intense tête unilatérale, nausées, sensibilité lumière, troubles visuels",
            "severity": "warning",
            "category": "neurologique"
        },
        {
            "name": "AVC (Accident Vasculaire Cérébral)",
            "symptoms": "faiblesse visage asymétrique, difficulté parler, paralysie bras jambe, confusion",
            "severity": "emergency",
            "category": "neurologique"
        },
        {
            "name": "Grippe",
            "symptoms": "fièvre élevée, frissons, courbatures, fatigue intense, maux tête, toux",
            "severity": "normal",
            "category": "infectieux"
        },
        {
            "name": "COVID-19",
            "symptoms": "fièvre, toux sèche, fatigue, perte goût odorat, essoufflement, courbatures",
            "severity": "warning",
            "category": "infectieux"
        },
        {
            "name": "Allergie respiratoire",
            "symptoms": "éternuements, nez qui coule, yeux qui piquent, toux légère",
            "severity": "normal",
            "category": "allergique"
        },
        {
            "name": "Anaphylaxie",
            "symptoms": "difficultés respiratoires, gonflement visage gorge, urticaire généralisée, chute tension",
            "severity": "emergency",
            "category": "allergique"
        },
        {
            "name": "Diabète décompensé",
            "symptoms": "soif intense, urines fréquentes, fatigue extrême, vision floue, perte poids",
            "severity": "urgent",
            "category": "métabolique"
        },
        {
            "name": "Hypoglycémie",
            "symptoms": "tremblements, sueurs, confusion, faiblesse, palpitations, faim intense",
            "severity": "urgent",
            "category": "métabolique"
        }
    ]

    print(f"✅ {len(conditions_cache)} conditions médicales chargées")

def get_embedding(text: str) -> Any:
    """Récupère l'embedding d'un texte (avec cache)"""
    # Hash MD5 pour le cache
    cache_key = hashlib.md5(text.encode()).hexdigest()

    if cache_key in embeddings_cache:
        return embeddings_cache[cache_key]

    # Calculer l'embedding
    model_instance = load_model()
    if model_instance is None:
        return None

    embedding = model_instance.encode(text)
    embeddings_cache[cache_key] = embedding

    return embedding

def cosine_similarity(a, b):
    """Calcule la similarité cosinus entre deux vecteurs"""
    import numpy as np
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Page d'accueil"""
    return {
        "service": "CareLink IA Health",
        "version": "1.0.0",
        "status": "running",
        "model": model_name,
        "endpoints": ["/analyze-symptoms", "/drug-interaction", "/predict-risk", "/health"]
    }

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "service": "carelink-ia-health",
        "model": model_name,
        "model_loaded": model is not None,
        "cache_size": len(embeddings_cache),
        "conditions_count": len(conditions_cache),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze-symptoms")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """
    Analyse sémantique des symptômes

    Retourne :
    - severity: emergency|urgent|warning|normal
    - similar_conditions: Conditions similaires avec scores
    - recommendations: Recommandations
    - risk_score: Score de risque 0-1
    """

    try:
        symptoms_text = request.symptoms.lower()
        context = request.context or {}

        # Mode fallback sans ML
        if model is None:
            return fallback_symptom_analysis(symptoms_text, context)

        # Obtenir l'embedding des symptômes
        symptoms_embedding = get_embedding(symptoms_text)

        if symptoms_embedding is None:
            return fallback_symptom_analysis(symptoms_text, context)

        # Calculer similarité avec chaque condition
        results = []
        for condition in conditions_cache:
            condition_embedding = get_embedding(condition['symptoms'])

            if condition_embedding is not None:
                similarity = cosine_similarity(symptoms_embedding, condition_embedding)

                results.append({
                    "name": condition['name'],
                    "similarity": float(similarity),
                    "severity": condition['severity'],
                    "category": condition['category']
                })

        # Trier par similarité
        results.sort(key=lambda x: x['similarity'], reverse=True)

        # Déterminer la gravité globale
        top_match = results[0] if results else None
        severity = "normal"

        if top_match:
            if top_match['similarity'] > 0.75 and top_match['severity'] == 'emergency':
                severity = "emergency"
            elif top_match['similarity'] > 0.65 and top_match['severity'] in ['emergency', 'urgent']:
                severity = "urgent"
            elif top_match['similarity'] > 0.5:
                severity = "warning"

        # Générer recommandations
        recommendations = generate_recommendations(results[:3], context, severity)

        return {
            "success": True,
            "severity": severity,
            "similar_conditions": results[:5],
            "recommendations": recommendations,
            "risk_score": top_match['similarity'] if top_match else 0.0,
            "context_analyzed": bool(context)
        }

    except Exception as e:
        print(f"❌ Erreur analyse symptômes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def fallback_symptom_analysis(symptoms: str, context: dict):
    """Analyse basique sans ML (fallback)"""

    severity = "normal"
    conditions = []

    # Détection par mots-clés
    if any(word in symptoms for word in ['douleur thoracique', 'oppression', 'palpitations']):
        severity = "emergency"
        conditions.append({"name": "Symptômes cardiaques", "similarity": 0.8, "severity": "emergency"})

    elif any(word in symptoms for word in ['difficultés respiratoires', 'essoufflement sévère']):
        severity = "urgent"
        conditions.append({"name": "Difficultés respiratoires", "similarity": 0.7, "severity": "urgent"})

    elif any(word in symptoms for word in ['fièvre', 'température']):
        severity = "warning"
        conditions.append({"name": "Fièvre", "similarity": 0.6, "severity": "warning"})

    return {
        "success": True,
        "severity": severity,
        "similar_conditions": conditions,
        "recommendations": ["Consultez un médecin si les symptômes persistent"],
        "risk_score": conditions[0]['similarity'] if conditions else 0.3,
        "fallback_mode": True
    }

def generate_recommendations(top_conditions, context, severity):
    """Génère des recommandations basées sur l'analyse"""

    recommendations = []

    if severity == "emergency":
        recommendations.append("🚨 APPELEZ IMMÉDIATEMENT LE 15 (SAMU) ou 112")
        recommendations.append("Ne perdez pas de temps, consultez en urgence")
        return recommendations

    if severity == "urgent":
        recommendations.append("⚠️ Consultez rapidement un médecin (sous 24h)")
        recommendations.append("Surveillez l'évolution des symptômes")

    if top_conditions:
        top = top_conditions[0]
        category = top.get('category', '')

        if category == 'cardiovasculaire':
            recommendations.append("Repos allongé, évitez tout effort")
            recommendations.append("Notez l'heure de début des symptômes")

        elif category == 'respiratoire':
            recommendations.append("Restez au calme, respirez lentement")
            recommendations.append("Évitez les irritants (fumée, allergènes)")

        elif category == 'digestif':
            recommendations.append("Évitez de manger, hydratez-vous par petites gorgées")
            recommendations.append("Notez les aliments consommés récemment")

    if context.get('age', 0) > 65:
        recommendations.append("Âge > 65 ans : Consultez plutôt rapidement")

    recommendations.append("Utilisez CareLink pour suivre l'évolution")

    return recommendations

@app.post("/drug-interaction")
async def check_drug_interaction(request: DrugInteractionRequest):
    """
    Vérifie les interactions entre médicaments
    """

    drugs = request.drugs

    # Base simplifiée d'interactions connues
    # En production, utiliser une vraie base de données
    interactions = []

    # Exemples d'interactions courantes
    drug_names = [d.lower() for d in drugs]

    if 'aspirine' in drug_names and 'ibuprofène' in drug_names:
        interactions.append({
            "drug1": "Aspirine",
            "drug2": "Ibuprofène",
            "level": "moderate",
            "description": "Risque accru de saignement gastro-intestinal",
            "recommendation": "Évitez de prendre ensemble. Espacez de 8h minimum."
        })

    if 'paracétamol' in drug_names and 'doliprane' in drug_names:
        interactions.append({
            "drug1": "Paracétamol",
            "drug2": "Doliprane",
            "level": "severe",
            "description": "Même molécule ! Risque de surdosage hépatotoxique",
            "recommendation": "⚠️ NE PAS PRENDRE ENSEMBLE - C'est le même médicament"
        })

    return {
        "success": True,
        "has_interaction": len(interactions) > 0,
        "interactions": interactions,
        "severity": "severe" if any(i['level'] == 'severe' for i in interactions) else "moderate" if interactions else "none",
        "drugs_analyzed": drugs
    }

@app.post("/predict-risk")
async def predict_risk(request: RiskPredictionRequest):
    """
    Prédit les risques de santé basés sur le profil patient
    """

    profile = request.patient_profile
    symptoms = request.symptoms

    # Analyse simple de facteurs de risque
    risks = {}

    age = profile.get('age', 0)
    antecedents = profile.get('antecedents', [])

    # Risque cardiovasculaire
    cv_risk = 0.0
    if age > 50: cv_risk += 0.2
    if age > 65: cv_risk += 0.3
    if 'hypertension' in antecedents: cv_risk += 0.25
    if 'diabete' in antecedents: cv_risk += 0.2
    if 'cholesterol' in antecedents: cv_risk += 0.15

    risks['cardiovasculaire'] = min(cv_risk, 1.0)

    # Risque diabète
    diabetes_risk = 0.0
    if age > 45: diabetes_risk += 0.2
    if profile.get('imc', 0) > 30: diabetes_risk += 0.3
    if 'diabete' in [a.lower() for a in antecedents]: diabetes_risk = 0.9

    risks['diabete'] = min(diabetes_risk, 1.0)

    return {
        "success": True,
        "risks": risks,
        "high_risk_factors": [k for k, v in risks.items() if v > 0.6],
        "recommendations": [
            "Consultation médicale régulière recommandée" if any(v > 0.6 for v in risks.values()) else "Maintenez un mode de vie sain"
        ]
    }

@app.post("/clear-cache")
async def clear_cache():
    """Vide le cache d'embeddings"""
    global embeddings_cache
    old_size = len(embeddings_cache)
    embeddings_cache = {}

    return {
        "success": True,
        "message": f"Cache vidé ({old_size} entrées supprimées)"
    }

# ============================================================================
# DÉMARRAGE
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8003))

    print("=" * 60)
    print("🏥 CareLink IA Health Service")
    print("=" * 60)
    print(f"Port: {port}")
    print(f"Modèle: {model_name}")
    print(f"Endpoints: /analyze-symptoms, /drug-interaction, /predict-risk")
    print("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
