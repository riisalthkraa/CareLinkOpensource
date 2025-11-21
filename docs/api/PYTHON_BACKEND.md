# Backend Python IA

## Vue d'Ensemble

Service FastAPI pour l'analyse médicale avec Machine Learning.

**Port** : 8003
**Fichier** : `services/ia-health/main.py`

## Démarrage

```bash
cd services/ia-health
pip install -r requirements.txt
python main.py
```

## Modèle ML

**Sentence-BERT** : `paraphrase-multilingual-mpnet-base-v2`

- Embeddings multilingues
- Analyse sémantique des symptômes
- Cache MD5 pour performance x10

## Endpoints

### GET /

Page d'accueil avec informations du service.

```json
{
  "service": "CareLink IA Health",
  "version": "1.0.0",
  "status": "running",
  "model": "paraphrase-multilingual-mpnet-base-v2",
  "endpoints": ["/analyze-symptoms", "/drug-interaction", "/predict-risk", "/health"]
}
```

### GET /health

Health check du service.

```json
{
  "status": "healthy",
  "service": "carelink-ia-health",
  "model": "paraphrase-multilingual-mpnet-base-v2",
  "model_loaded": true,
  "cache_size": 42,
  "conditions_count": 15,
  "timestamp": "2025-11-21T10:30:00"
}
```

### POST /analyze-symptoms

Analyse sémantique des symptômes.

**Request** :
```json
{
  "symptoms": "douleur thoracique intense, essoufflement",
  "context": {
    "age": 65,
    "antecedents": ["hypertension"]
  }
}
```

**Response** :
```json
{
  "success": true,
  "severity": "emergency",
  "similar_conditions": [
    {
      "name": "Infarctus du myocarde",
      "similarity": 0.87,
      "severity": "emergency",
      "category": "cardiovasculaire"
    }
  ],
  "recommendations": [
    "APPELEZ IMMÉDIATEMENT LE 15 (SAMU) ou 112",
    "Ne perdez pas de temps, consultez en urgence"
  ],
  "risk_score": 0.87,
  "context_analyzed": true
}
```

**Niveaux de Sévérité** :
- `emergency` : Urgence vitale (15/112)
- `urgent` : Consultation rapide (24h)
- `warning` : Surveillance
- `normal` : Pas d'urgence

### POST /drug-interaction

Vérifie les interactions médicamenteuses.

**Request** :
```json
{
  "drugs": ["Aspirine", "Ibuprofène"]
}
```

**Response** :
```json
{
  "success": true,
  "has_interaction": true,
  "interactions": [
    {
      "drug1": "Aspirine",
      "drug2": "Ibuprofène",
      "level": "moderate",
      "description": "Risque accru de saignement gastro-intestinal",
      "recommendation": "Évitez de prendre ensemble. Espacez de 8h minimum."
    }
  ],
  "severity": "moderate",
  "drugs_analyzed": ["Aspirine", "Ibuprofène"]
}
```

**Niveaux d'Interaction** :
- `severe` : Contre-indication absolue
- `moderate` : Précaution requise
- `none` : Pas d'interaction connue

### POST /predict-risk

Prédit les risques de santé basés sur le profil patient.

**Request** :
```json
{
  "patient_profile": {
    "age": 58,
    "imc": 31.5,
    "antecedents": ["hypertension", "diabete"]
  },
  "symptoms": "fatigue, essoufflement léger"
}
```

**Response** :
```json
{
  "success": true,
  "risks": {
    "cardiovasculaire": 0.75,
    "diabete": 0.90
  },
  "high_risk_factors": ["cardiovasculaire", "diabete"],
  "recommendations": [
    "Consultation médicale régulière recommandée"
  ]
}
```

### POST /clear-cache

Vide le cache d'embeddings.

**Response** :
```json
{
  "success": true,
  "message": "Cache vidé (42 entrées supprimées)"
}
```

## Base de Conditions Médicales

Le service inclut 15 conditions médicales prédéfinies :

| Condition | Catégorie | Sévérité |
|-----------|-----------|----------|
| Infarctus du myocarde | cardiovasculaire | emergency |
| Angine de poitrine | cardiovasculaire | urgent |
| Pneumonie | respiratoire | urgent |
| Bronchite aiguë | respiratoire | warning |
| Asthme | respiratoire | warning |
| Gastro-entérite | digestif | warning |
| Appendicite | digestif | emergency |
| Migraine | neurologique | warning |
| AVC | neurologique | emergency |
| Grippe | infectieux | normal |
| COVID-19 | infectieux | warning |
| Allergie respiratoire | allergique | normal |
| Anaphylaxie | allergique | emergency |
| Diabète décompensé | métabolique | urgent |
| Hypoglycémie | métabolique | urgent |

## Mode Fallback

Si Sentence-BERT n'est pas disponible, le service utilise une analyse par mots-clés :

```python
def fallback_symptom_analysis(symptoms: str, context: dict):
    if 'douleur thoracique' in symptoms:
        severity = "emergency"
        # ...
```

## Dépendances

```
fastapi>=0.100.0
uvicorn>=0.23.0
sentence-transformers>=2.2.0
torch>=2.0.0
numpy>=1.24.0
pydantic>=2.0.0
```

## Intégration Electron

Le backend Python est démarré automatiquement par Electron :

```typescript
// electron/python-backend-manager.ts
export async function startPythonBackend(): Promise<boolean>
export function stopPythonBackend(): void
export async function getBackendStatus(): Promise<BackendStatus>
export async function restartPythonBackend(): Promise<boolean>
```
