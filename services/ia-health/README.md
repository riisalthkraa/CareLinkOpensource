# 🏥 CareLink IA Health Service

Backend Python ML pour analyse médicale avec Sentence-BERT.

## 🚀 Installation

```bash
# 1. Créer environnement virtuel
python -m venv venv

# 2. Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt
```

## ▶️ Démarrage

```bash
# Option 1 : Direct
python main.py

# Option 2 : Avec uvicorn
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

Le service sera disponible sur **http://localhost:8003**

## 📚 Endpoints

### GET /health
Health check du service

**Réponse :**
```json
{
  "status": "healthy",
  "model": "paraphrase-multilingual-mpnet-base-v2",
  "cache_size": 42,
  "conditions_count": 15
}
```

### POST /analyze-symptoms
Analyse sémantique des symptômes

**Requête :**
```json
{
  "symptoms": "douleur thoracique et essoufflement",
  "context": {
    "age": 55,
    "antecedents": ["hypertension", "diabete"]
  }
}
```

**Réponse :**
```json
{
  "severity": "emergency",
  "similar_conditions": [
    {
      "name": "Infarctus du myocarde",
      "similarity": 0.87,
      "severity": "emergency"
    }
  ],
  "recommendations": [
    "🚨 APPELEZ IMMÉDIATEMENT LE 15"
  ],
  "risk_score": 0.87
}
```

### POST /drug-interaction
Détecte les interactions médicamenteuses

**Requête :**
```json
{
  "drugs": ["Aspirine", "Ibuprofène"]
}
```

**Réponse :**
```json
{
  "has_interaction": true,
  "interactions": [
    {
      "drug1": "Aspirine",
      "drug2": "Ibuprofène",
      "level": "moderate",
      "description": "Risque accru de saignement"
    }
  ]
}
```

### POST /predict-risk
Prédiction des risques santé

**Requête :**
```json
{
  "patient_profile": {
    "age": 60,
    "antecedents": ["hypertension", "diabete"],
    "imc": 32
  }
}
```

**Réponse :**
```json
{
  "risks": {
    "cardiovasculaire": 0.75,
    "diabete": 0.9
  },
  "high_risk_factors": ["cardiovasculaire", "diabete"]
}
```

## 🔥 Performance

**Sans cache** : ~2-3 secondes par analyse
**Avec cache MD5** : ~0.2 secondes (**x10 plus rapide !**)

Le cache stocke les embeddings calculés. Pour vider le cache :

```bash
curl -X POST http://localhost:8003/clear-cache
```

## 🧪 Tests

```bash
# Test health check
curl http://localhost:8003/health

# Test analyse symptômes
curl -X POST http://localhost:8003/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"mal de tête et fièvre"}'
```

## 📊 Modèle ML

**Sentence-BERT** : `paraphrase-multilingual-mpnet-base-v2`
- Support 50+ langues
- 768 dimensions embeddings
- Similarité cosinus 0-1

## 🔧 Configuration

Variables d'environnement :

```bash
PORT=8003  # Port du service (défaut: 8003)
```

## 🏗️ Architecture

```
services/ia-health/
├── main.py              # Service FastAPI principal
├── requirements.txt     # Dépendances Python
└── README.md           # Documentation
```

## 📝 Notes

- Le modèle est chargé **lazy** (au premier appel)
- 15 conditions médicales en base (extensible)
- Fallback sans ML si sentence-transformers absent
- Cache persistant pendant la session

## 🎯 Intégration CareLink

Le service est appelé par `src/services/PythonHealthService.ts` depuis Electron.

**Exemple :**
```typescript
const response = await fetch('http://localhost:8003/analyze-symptoms', {
  method: 'POST',
  body: JSON.stringify({ symptoms: userMessage })
});
```
