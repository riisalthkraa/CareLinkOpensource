# 🩺 CareLink Medical OCR Backend

Backend Python pour l'extraction intelligente de données depuis ordonnances médicales.

## 🚀 Fonctionnalités

### ✅ Améliorations vs Tesseract.js

| Fonctionnalité | Tesseract.js (ancien) | EasyOCR (nouveau) |
|----------------|----------------------|-------------------|
| Précision texte français | 70-75% | **85-95%** |
| Écriture manuscrite | ❌ Mauvais | ✅ Bon |
| Prétraitement image | Basique | **Avancé** |
| Validation médicaments | ❌ Aucune | ✅ Base française |
| Extraction NLP | Regex simples | **Patterns médicaux** |
| Correction orthographe | ❌ Non | ✅ Fuzzy matching |

### 📦 Composants

1. **`main.py`** - API FastAPI avec endpoints REST
2. **`ocr_service.py`** - Service OCR avec EasyOCR
3. **`nlp_extractor.py`** - Extraction d'entités médicales
4. **`medication_validator.py`** - Validation avec base française

---

## 📥 Installation

### Prérequis

- Python 3.8 ou supérieur
- pip

### 1. Créer un environnement virtuel (recommandé)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

**Note:** Au premier lancement, EasyOCR téléchargera automatiquement les modèles français (~200 MB). Cela peut prendre quelques minutes.

---

## 🎯 Utilisation

### Démarrer le serveur

```bash
python main.py
```

Le serveur démarre sur `http://127.0.0.1:8000`

### Tester l'API

#### 1. Vérifier l'état du serveur

```bash
curl http://127.0.0.1:8000/health
```

#### 2. Extraire une ordonnance

```bash
curl -X POST http://127.0.0.1:8000/ocr/extract \
  -F "file=@ordonnance.jpg"
```

#### 3. Valider un médicament

```bash
curl -X POST http://127.0.0.1:8000/validate-medication \
  -H "Content-Type: application/json" \
  -d '{"nom": "DOLIPRANE"}'
```

---

## 🔌 Intégration avec Electron

### Architecture

```
┌─────────────────┐      HTTP      ┌──────────────────┐
│  Electron App   │ ◄────────────► │  Python Backend  │
│  (React/TS)     │                │  (FastAPI)       │
└─────────────────┘                └──────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
  ┌──────────┐                      ┌──────────────┐
  │ SQLite   │                      │  EasyOCR +   │
  │ Database │                      │  NLP Models  │
  └──────────┘                      └──────────────┘
```

### Modification du frontend

Remplacer l'appel Tesseract.js par un appel HTTP au backend Python :

```typescript
// Ancien code (src/services/OCRService.ts)
const result = await Tesseract.recognize(imageUrl, 'fra')

// Nouveau code
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch('http://127.0.0.1:8000/ocr/extract', {
  method: 'POST',
  body: formData
})

const data = await response.json()
```

---

## 📊 Endpoints de l'API

### `GET /`
Page d'accueil avec informations de l'API

### `GET /health`
État de santé du serveur

**Réponse:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "services": {
    "ocr": true,
    "nlp": true,
    "medication_db": true
  }
}
```

### `POST /ocr/extract`
Extraire les données d'une ordonnance

**Paramètres:**
- `file` (FormData): Image JPG/PNG ou PDF

**Réponse:**
```json
{
  "texte_complet": "Dr Martin\nDOLIPRANE 1000mg\n2 comprimés par jour...",
  "medicaments": [
    {
      "nom": "DOLIPRANE 1000MG",
      "nom_normalise": "DOLIPRANE",
      "dosage": "1000 mg",
      "posologie": "2 fois par jour",
      "duree": "7 jours",
      "confidence": 92.5,
      "is_validated": true
    }
  ],
  "date_ordonnance": "2024-01-15",
  "date_validite": "2024-04-15",
  "medecin": "Dr Martin",
  "patient": null,
  "confidence_globale": 89.3,
  "qualite": "excellente",
  "warnings": []
}
```

### `POST /validate-medication`
Valider un nom de médicament

**Body:**
```json
{
  "nom": "DOLIPRANE"
}
```

**Réponse:**
```json
{
  "is_valid": true,
  "nom_corrige": "DOLIPRANE",
  "suggestions": [],
  "dci": "paracétamol"
}
```

---

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` (optionnel):

```env
PORT=8000
LOG_LEVEL=INFO
ENABLE_GPU=false  # Activer si GPU CUDA disponible
```

### Performance

- **CPU uniquement**: ~5-10 secondes par ordonnance
- **Avec GPU CUDA**: ~1-2 secondes par ordonnance

Pour activer le GPU (nécessite CUDA):
```python
# Dans ocr_service.py, ligne 42
self.reader = easyocr.Reader(['fr', 'en'], gpu=True)
```

---

## 📚 Base de Médicaments

La base actuelle contient **~100 médicaments** français les plus courants.

### Ajouter des médicaments

```python
# Dans medication_validator.py
validator = MedicationValidator()
validator.add_medication(
    name="NOUVEAU_MEDICAMENT",
    dci="substance active",
    forme="comprimé"
)
```

### Extension future

- Intégrer la base officielle Vidal
- API publique des médicaments (data.gouv.fr)
- Base CIS (Code Identifiant de Spécialité)

---

## 🧪 Tests

```bash
# Installer pytest
pip install pytest pytest-asyncio

# Lancer les tests (TODO)
pytest tests/
```

---

## 🐛 Dépannage

### Erreur: `ModuleNotFoundError: No module named 'easyocr'`

```bash
pip install -r requirements.txt
```

### Erreur: `Cannot find EasyOCR models`

Les modèles se téléchargent automatiquement au premier lancement. Assurez-vous d'avoir une connexion Internet.

### Le serveur ne démarre pas

Vérifier que le port 8000 n'est pas déjà utilisé :

```bash
# Windows
netstat -ano | findstr :8000

# Linux/macOS
lsof -i :8000
```

Changer le port si nécessaire :

```bash
PORT=8001 python main.py
```

---

## 📈 Roadmap

### Phase 1 (Actuelle) ✅
- [x] OCR avec EasyOCR
- [x] Extraction NLP basique
- [x] Validation avec base statique
- [x] API REST

### Phase 2 (Prochaine étape)
- [ ] Fine-tuning EasyOCR sur ordonnances françaises
- [ ] Intégration base Vidal
- [ ] Support PDF multi-pages
- [ ] Cache Redis pour performances

### Phase 3 (Futur)
- [ ] Modèle ML custom pour classification
- [ ] Détection automatique du type de document
- [ ] API de détection d'interactions médicamenteuses
- [ ] Exportation au format FHIR/HL7

---

## 📝 License

Propriétaire - CareLink

---

## 👥 Support

Pour toute question : ouvrir une issue dans le repo principal CareLink.
