# 🎯 MATCHPRO IA - GUIDE TECHNIQUE COMPLET (PARTIE 3 FINALE)

## SUITE: ROUTERS, PYTHON, UI & SCRIPTS

---

## 7. BACKEND API - ROUTERS (SUITE)

### 📄 api/src/routers/entreprises.ts

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { cache } from '../services/redis-cache';

export const entreprisesRouter = router({
  
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      secteur: z.string().optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      
      if (input.search) {
        where.OR = [
          { nom: { contains: input.search, mode: 'insensitive' } },
          { siret: { contains: input.search } }
        ];
      }
      
      if (input.secteur) where.secteur = input.secteur;
      
      const entreprises = await ctx.db.entreprise.findMany({
        where,
        take: input.limit,
        include: {
          contacts: { where: { principal: true } },
          offres: { where: { statut: 'active' } },
          _count: { select: { offres: true, placements: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return entreprises.map(e => ({
        ...e,
        adresse: JSON.parse(e.adresse)
      }));
    }),
  
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entreprise = await ctx.db.entreprise.findUnique({
        where: { id: input.id },
        include: {
          contacts: true,
          offres: { orderBy: { createdAt: 'desc' } },
          placements: {
            include: { candidat: true },
            orderBy: { dateDebut: 'desc' }
          }
        }
      });
      
      if (!entreprise) throw new TRPCError({ code: 'NOT_FOUND' });
      
      return {
        ...entreprise,
        adresse: JSON.parse(entreprise.adresse)
      };
    }),
  
  create: publicProcedure
    .input(z.object({
      nom: z.string(),
      siret: z.string().regex(/^\d{14}$/),
      secteur: z.string(),
      adresse: z.object({
        rue: z.string(),
        ville: z.string(),
        codePostal: z.string(),
        pays: z.string().default('France')
      }),
      contacts: z.array(z.object({
        nom: z.string(),
        prenom: z.string(),
        email: z.string().email(),
        poste: z.string()
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.entreprise.findUnique({
        where: { siret: input.siret }
      });
      
      if (existing) throw new TRPCError({ code: 'CONFLICT' });
      
      const entreprise = await ctx.db.entreprise.create({
        data: {
          nom: input.nom,
          siret: input.siret,
          secteur: input.secteur,
          adresse: JSON.stringify(input.adresse),
          contacts: input.contacts ? { create: input.contacts } : undefined
        }
      });
      
      return { success: true, entrepriseId: entreprise.id };
    }),
  
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.entreprise.delete({ where: { id: input.id } });
      return { success: true };
    })
});
```

### 📄 api/src/routers/offres.ts

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { iaGateway } from '../services/ia-gateway';
import { cache } from '../services/redis-cache';

export const offresRouter = router({
  
  list: publicProcedure
    .input(z.object({
      entrepriseId: z.string().optional(),
      statut: z.string().optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.entrepriseId) where.entrepriseId = input.entrepriseId;
      if (input.statut) where.statut = input.statut;
      
      const offres = await ctx.db.offreEmploi.findMany({
        where,
        take: input.limit,
        include: { entreprise: true },
        orderBy: { createdAt: 'desc' }
      });
      
      return offres.map(o => ({
        ...o,
        localisation: JSON.parse(o.localisation),
        salaire: JSON.parse(o.salaire),
        competences: JSON.parse(o.competences)
      }));
    }),
  
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const offre = await ctx.db.offreEmploi.findUnique({
        where: { id: input.id },
        include: {
          entreprise: { include: { contacts: true } },
          matchings: {
            include: { candidat: true },
            orderBy: { scoreTotal: 'desc' },
            take: 10
          }
        }
      });
      
      if (!offre) throw new TRPCError({ code: 'NOT_FOUND' });
      
      return {
        ...offre,
        localisation: JSON.parse(offre.localisation),
        salaire: JSON.parse(offre.salaire),
        competences: JSON.parse(offre.competences)
      };
    }),
  
  create: publicProcedure
    .input(z.object({
      entrepriseId: z.string(),
      titre: z.string(),
      description: z.string(),
      type: z.string(),
      localisation: z.object({
        ville: z.string(),
        teletravail: z.enum(['non', 'partiel', 'full'])
      }),
      salaire: z.object({
        min: z.number(),
        max: z.number()
      }),
      competences: z.array(z.object({
        nom: z.string(),
        niveau_requis: z.number().min(1).max(5),
        obligatoire: z.boolean(),
        poids: z.number().default(1)
      })),
      experienceMin: z.number(),
      experienceIdeale: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const offre = await ctx.db.offreEmploi.create({
        data: {
          ...input,
          localisation: JSON.stringify(input.localisation),
          salaire: JSON.stringify(input.salaire),
          competences: JSON.stringify(input.competences),
          niveauEtudes: 'Bac+3'
        }
      });
      
      return { success: true, offreId: offre.id };
    }),
  
  generateDescription: publicProcedure
    .input(z.object({
      brief: z.string()
    }))
    .mutation(async ({ input }) => {
      const description = await iaGateway.generateJobDescription(input.brief);
      return { description };
    }),
  
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.offreEmploi.delete({ where: { id: input.id } });
      return { success: true };
    })
});
```

### 📄 api/src/routers/matching.ts

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { pythonClient } from '../services/python-client';
import { cache } from '../services/redis-cache';

export const matchingRouter = router({
  
  matchCandidates: publicProcedure
    .input(z.object({
      offreId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Get offre
      const offre = await ctx.db.offreEmploi.findUnique({
        where: { id: input.offreId }
      });
      
      if (!offre) throw new TRPCError({ code: 'NOT_FOUND' });
      
      // Get all candidats
      const candidats = await ctx.db.candidat.findMany();
      
      // Prépare données pour Python
      const offreFormatted = {
        id: offre.id,
        titre: offre.titre,
        description: offre.description,
        competences: JSON.parse(offre.competences),
        experience_min: offre.experienceMin,
        experience_ideale: offre.experienceIdeale,
        secteur: offre.entreprise?.secteur || '',
        localisation: JSON.parse(offre.localisation)
      };
      
      const candidatsFormatted = candidats.map(c => ({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        annees_experience: calculateYearsExp(JSON.parse(c.experiences)),
        competences: JSON.parse(c.competences),
        experiences: JSON.parse(c.experiences),
        localisation: JSON.parse(c.adresse),
        disponibilite_jours: c.disponibilite || 30,
        scores: c.scores ? JSON.parse(c.scores) : { stabilite: 50, employabilite: 50 }
      }));
      
      // Appel Python matching
      const results = await pythonClient.matchCandidates({
        offre: offreFormatted,
        candidats: candidatsFormatted
      });
      
      // Sauvegarder matchings en DB
      for (const result of results) {
        await ctx.db.matching.upsert({
          where: {
            candidatId_offreId: {
              candidatId: result.candidat_id,
              offreId: input.offreId
            }
          },
          create: {
            candidatId: result.candidat_id,
            offreId: input.offreId,
            scoreTotal: result.score_total,
            scoreSemantic: result.score_semantic,
            scoreRules: result.score_rules,
            scoreML: result.score_ml,
            details: JSON.stringify(result.details),
            statut: 'nouveau'
          },
          update: {
            scoreTotal: result.score_total,
            scoreSemantic: result.score_semantic,
            scoreRules: result.score_rules,
            scoreML: result.score_ml,
            details: JSON.stringify(result.details),
            updatedAt: new Date()
          }
        });
      }
      
      return { success: true, matchCount: results.length };
    }),
  
  getMatchings: publicProcedure
    .input(z.object({
      offreId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const matchings = await ctx.db.matching.findMany({
        where: { offreId: input.offreId },
        include: { candidat: true },
        orderBy: { scoreTotal: 'desc' },
        take: 20
      });
      
      return matchings.map(m => ({
        ...m,
        details: JSON.parse(m.details),
        candidat: {
          ...m.candidat,
          competences: JSON.parse(m.candidat.competences),
          experiences: JSON.parse(m.candidat.experiences)
        }
      }));
    })
});

function calculateYearsExp(exps: any[]): number {
  let total = 0;
  for (const exp of exps) {
    const start = new Date(exp.dateDebut);
    const end = exp.dateFin ? new Date(exp.dateFin) : new Date();
    total += (end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000);
  }
  return Math.round(total * 10) / 10;
}
```

### 📄 api/src/routers/settings.ts

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { encryptApiKey, decryptApiKey } from '../services/encryption';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export const settingsRouter = router({
  
  listApiKeys: publicProcedure
    .query(async ({ ctx }) => {
      const keys = await ctx.db.apiKey.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return keys.map(k => ({
        id: k.id,
        provider: k.provider,
        isActive: k.isActive,
        keyPreview: `***${k.key.slice(-4)}`,
        createdAt: k.createdAt
      }));
    }),
  
  addApiKey: publicProcedure
    .input(z.object({
      provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral']),
      key: z.string().min(20)
    }))
    .mutation(async ({ ctx, input }) => {
      // Test validité
      const isValid = await testApiKey(input.provider, input.key);
      if (!isValid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Clé API invalide' });
      }
      
      // Désactive anciennes clés
      await ctx.db.apiKey.updateMany({
        where: { provider: input.provider },
        data: { isActive: false }
      });
      
      // Enregistre nouvelle clé
      const apiKey = await ctx.db.apiKey.create({
        data: {
          provider: input.provider,
          key: encryptApiKey(input.key),
          isActive: true
        }
      });
      
      return { success: true, id: apiKey.id };
    }),
  
  deleteApiKey: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.apiKey.delete({ where: { id: input.id } });
      return { success: true };
    }),
  
  getUsageStats: publicProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      const usage = await ctx.db.apiKeyUsage.groupBy({
        by: ['provider', 'model'],
        where: {
          createdAt: { gte: input.startDate, lte: input.endDate }
        },
        _sum: { tokens: true, cost: true },
        _count: true
      });
      
      return usage.map(u => ({
        provider: u.provider,
        model: u.model,
        requests: u._count,
        tokens: u._sum.tokens || 0,
        estimatedCost: u._sum.cost || 0
      }));
    })
});

async function testApiKey(provider: string, key: string): Promise<boolean> {
  try {
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: key });
      await openai.models.list();
      return true;
    }
    if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: key });
      await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
```

---

## 8. SERVICES PYTHON

### 📄 services/ia-parser/requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
openai==1.35.0
anthropic==0.25.0
google-generativeai==0.5.0
pypdf==4.0.1
python-docx==1.1.0
pytesseract==0.3.10
Pillow==10.2.0
python-multipart==0.0.9
```

### 📄 services/ia-parser/main.py

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import io
import os

# Parsers
from pypdf import PdfReader
from docx import Document
from PIL import Image
import pytesseract

app = FastAPI(title="MatchPro - CV Parser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParseRequest(BaseModel):
    text: str
    provider: str = "openai"
    api_key: str

class ExtractRequest(BaseModel):
    data: str  # base64

@app.post("/parse")
async def parse_cv(request: ParseRequest):
    """Parse CV avec IA configurée"""
    if request.provider == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=request.api_key)
        
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": f"Extrait ce CV en JSON: {request.text}"
            }],
            response_format={"type": "json_object"}
        )
        
        import json
        return json.loads(completion.choices[0].message.content)
    
    raise HTTPException(400, "Provider non supporté")

@app.post("/extract/pdf")
async def extract_pdf(request: ExtractRequest):
    """Extrait texte d'un PDF"""
    try:
        pdf_bytes = base64.b64decode(request.data)
        pdf_file = io.BytesIO(pdf_bytes)
        
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        
        return {"text": text}
    except Exception as e:
        raise HTTPException(500, f"Erreur extraction PDF: {str(e)}")

@app.post("/extract/docx")
async def extract_docx(request: ExtractRequest):
    """Extrait texte d'un DOCX"""
    try:
        docx_bytes = base64.b64decode(request.data)
        docx_file = io.BytesIO(docx_bytes)
        
        doc = Document(docx_file)
        text = "\n\n".join([para.text for para in doc.paragraphs])
        
        return {"text": text}
    except Exception as e:
        raise HTTPException(500, f"Erreur extraction DOCX: {str(e)}")

@app.post("/extract/ocr")
async def extract_ocr(request: ExtractRequest):
    """OCR sur image"""
    try:
        image_bytes = base64.b64decode(request.data)
        image = Image.open(io.BytesIO(image_bytes))
        
        text = pytesseract.image_to_string(image, lang='fra')
        
        return {"text": text}
    except Exception as e:
        raise HTTPException(500, f"Erreur OCR: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cv-parser"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 📄 services/ia-matching/requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
sentence-transformers==2.3.1
scikit-learn==1.4.0
numpy==1.26.3
xgboost==2.0.3
```

### 📄 services/ia-matching/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI(title="MatchPro - Matching Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
print("🔄 Loading model...")
model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
print("✅ Model loaded")

class Competence(BaseModel):
    nom: str
    niveau_requis: int
    obligatoire: bool = False
    poids: float = 1.0

class Offre(BaseModel):
    id: str
    titre: str
    description: str
    competences: List[Competence]
    experience_min: int
    experience_ideale: int

class CandidatComp(BaseModel):
    nom: str
    niveau: int

class Candidat(BaseModel):
    id: str
    nom: str
    prenom: str
    annees_experience: float
    competences: List[CandidatComp]
    experiences: List[Dict]
    scores: Dict[str, float]

class MatchRequest(BaseModel):
    offre: Offre
    candidats: List[Candidat]

@app.post("/match")
async def match_candidates(request: MatchRequest):
    results = []
    offre = request.offre
    
    # Embedding offre
    offre_text = f"{offre.titre}. {offre.description}"
    offre_emb = model.encode(offre_text)
    
    for candidat in request.candidats:
        # Filter expérience min
        if candidat.annees_experience < offre.experience_min:
            continue
        
        # Embedding candidat
        cand_text = f"{candidat.annees_experience} ans. " + ", ".join([c.nom for c in candidat.competences])
        cand_emb = model.encode(cand_text)
        
        # Score sémantique
        semantic = float(cosine_similarity([offre_emb], [cand_emb])[0][0])
        
        # Score règles
        rules = calculate_rules_score(candidat, offre)
        
        # Score final
        final = (semantic * 0.5 + rules * 0.5) * 100
        
        results.append({
            "candidat_id": candidat.id,
            "score_total": round(final, 1),
            "score_semantic": round(semantic * 100, 1),
            "score_rules": round(rules * 100, 1),
            "score_ml": 0,
            "details": {
                "points_forts": [f"✅ {c.nom}" for c in candidat.competences[:3]],
                "points_faibles": [],
                "risques": [],
                "opportunites": []
            }
        })
    
    results.sort(key=lambda x: x["score_total"], reverse=True)
    return results

def calculate_rules_score(candidat: Candidat, offre: Offre) -> float:
    score = 0.0
    
    # Expérience
    exp_ratio = min(candidat.annees_experience / offre.experience_ideale, 1.5)
    score += min(exp_ratio * 0.3, 0.3)
    
    # Compétences
    comp_map = {c.nom.lower(): c for c in candidat.competences}
    comp_match = 0.0
    total_poids = sum(c.poids for c in offre.competences)
    
    for comp_offre in offre.competences:
        comp_cand = comp_map.get(comp_offre.nom.lower())
        if comp_cand:
            niveau_match = min(comp_cand.niveau / comp_offre.niveau_requis, 1.0)
            comp_match += niveau_match * comp_offre.poids
    
    score += (comp_match / total_poids) * 0.7 if total_poids > 0 else 0
    
    return score

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "matching"}
```

---

## 10. SCRIPTS & AUTOMATION

### 📄 scripts/check-python.js

```javascript
const { execSync } = require('child_process');

console.log('🔍 Vérification Python...');

try {
  const version = execSync('python --version', { encoding: 'utf8' });
  console.log(`✅ Python trouvé: ${version.trim()}`);
  
  const match = version.match(/Python (\d+)\.(\d+)/);
  if (match) {
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    
    if (major < 3 || (major === 3 && minor < 9)) {
      console.error('❌ Python 3.9+ requis');
      process.exit(1);
    }
  }
  
  console.log('✅ Version compatible\n');
} catch (error) {
  console.error('❌ Python non trouvé !');
  console.error('📥 Installe Python 3.9+ : https://www.python.org/downloads/');
  process.exit(1);
}
```

### 📄 scripts/setup-python.js

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const services = ['ia-parser', 'ia-matching', 'ia-predictive'];

console.log('🐍 Configuration Python...\n');

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', 'services', service);
  const venvPath = path.join(servicePath, 'venv');
  
  console.log(`📦 Setup ${service}...`);
  
  if (!fs.existsSync(venvPath)) {
    console.log(`  Création venv...`);
    execSync('python -m venv venv', { cwd: servicePath, stdio: 'inherit' });
  }
  
  console.log(`  Installation dépendances...`);
  
  const isWindows = process.platform === 'win32';
  const pipPath = isWindows 
    ? path.join(venvPath, 'Scripts', 'pip')
    : path.join(venvPath, 'bin', 'pip');
  
  try {
    execSync(`"${pipPath}" install -r requirements.txt`, {
      cwd: servicePath,
      stdio: 'inherit'
    });
    console.log(`  ✅ ${service} prêt\n`);
  } catch (error) {
    console.error(`  ❌ Erreur ${service}`);
  }
});

console.log('✅ Configuration terminée!\n');
```

### 📄 scripts/start-python-services.js

```javascript
const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'ia-parser', port: 8001 },
  { name: 'ia-matching', port: 8002 },
  { name: 'ia-predictive', port: 8003 }
];

console.log('🐍 Démarrage services Python...\n');

const processes = [];

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', 'services', service.name);
  const isWindows = process.platform === 'win32';
  
  const pythonPath = isWindows
    ? path.join(servicePath, 'venv', 'Scripts', 'python.exe')
    : path.join(servicePath, 'venv', 'bin', 'python');
  
  console.log(`🚀 ${service.name} (port ${service.port})...`);
  
  const proc = spawn(pythonPath, ['-m', 'uvicorn', 'main:app', '--port', service.port.toString()], {
    cwd: servicePath,
    stdio: 'inherit'
  });
  
  processes.push(proc);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt services...');
  processes.forEach(proc => proc.kill());
  process.exit(0);
});
```

### 📄 scripts/generate-encryption-key.js

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const key = crypto.randomBytes(32).toString('hex');

const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

if (envContent.includes('ENCRYPTION_KEY=')) {
  envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${key}`);
} else {
  envContent += `\nENCRYPTION_KEY=${key}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Clé d\'encryption générée et sauvegardée dans .env');
```

---

## 11. GUIDE DÉVELOPPEMENT

### 🚀 Commandes Essentielles

```bash
# Démarrage complet
npm run dev

# Démarrage API seule
npm run dev:api

# Démarrage Python seul
npm run dev:python

# Démarrage Desktop seul
npm run dev:desktop

# Database
npm run db:studio      # Interface visuelle
npm run db:migrate     # Créer migration
npm run db:reset       # Reset complet
npm run db:seed        # Données de test

# Build
npm run build          # Build tout
npm run build:desktop  # Build desktop uniquement

# Tests
npm run test
npm run lint
```

### 🐛 Troubleshooting

**Python non trouvé:**
```bash
python --version  # Vérifier installation
npm run setup:python  # Réinstaller
```

**Service Python ne démarre pas:**
```bash
cd services/ia-parser
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
pip install -r requirements.txt
python main.py
```

**Port déjà utilisé:**
```bash
# Changer dans .env
API_PORT=3002
PYTHON_PARSER_PORT=9001
```

**Database corrompue:**
```bash
npm run db:reset
npm run db:seed
```

---

## 12. DÉPLOIEMENT

### 🖥️ Desktop (Electron)

```bash
cd apps/desktop
npm run build

# Génère installeurs dans dist/
# - Windows: .exe
# - Mac: .dmg
# - Linux: .AppImage
```

### 🌐 Web (Next.js)

```bash
cd apps/web
npm run build
# Deploy sur Vercel, Netlify, etc.
```

### 🐳 Production (Docker - optionnel)

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## ✅ CHECKLIST FINALE

Avant de démarrer le développement avec Claude Code:

- [ ] Node.js 20+ installé
- [ ] Python 3.9+ installé (avec PATH)
- [ ] Redis installé (optionnel)
- [ ] Git configuré
- [ ] `npm install` exécuté avec succès
- [ ] `.env` configuré
- [ ] Database migrée (`npm run db:migrate`)
- [ ] Services Python fonctionnels (`npm run dev:python`)
- [ ] API démarre (`npm run dev:api`)
- [ ] Desktop s'ouvre (`npm run dev:desktop`)

**🎉 TOUT EST PRÊT POUR CODER !**

---

**Donne ce guide à Claude Code et c'est parti ! 🚀**
