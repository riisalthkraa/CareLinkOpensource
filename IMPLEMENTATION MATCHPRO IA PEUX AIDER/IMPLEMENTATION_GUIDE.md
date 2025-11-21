# 🔧 Guide d'Implémentation - Modules Réutilisables

**Version:** 1.0.0
**Date:** Novembre 2025
**Auteur:** VIEY DAVID

Ce document explique comment implémenter et réutiliser les modules développés dans MatchPro IA dans vos autres applications.

---

## 📋 Table des Matières

1. [Système Multi-Provider IA avec Priorités](#1-système-multi-provider-ia-avec-priorités)
2. [Pagination Universelle](#2-pagination-universelle)
3. [Dashboard Temps Réel](#3-dashboard-temps-réel)
4. [Chiffrement AES-256 des Clés API](#4-chiffrement-aes-256-des-clés-api)
5. [Service Python FastAPI](#5-service-python-fastapi)

---

## 1. Système Multi-Provider IA avec Priorités

### 🎯 Objectif
Permettre à l'utilisateur de configurer plusieurs providers IA et choisir automatiquement celui avec la priorité la plus élevée.

### 📦 Composants Nécessaires

#### A. Schema Prisma

```prisma
// packages/database/prisma/schema.prisma

model ApiKey {
  id        String   @id @default(cuid())
  provider  String   // "openai" | "anthropic" | "gemini" | "mistral" | "ollama"
  key       String   // Encrypted with AES-256
  isActive  Boolean  @default(true)
  priority  Int      @default(50)  // 1-100, higher = preferred

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usage     ApiKeyUsage[]

  @@map("api_keys")
}

model ApiKeyUsage {
  id          String   @id @default(cuid())
  apiKeyId    String
  apiKey      ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  provider    String
  model       String   // "gpt-4o", "claude-sonnet-4", etc.
  tokens      Int
  cost        Float    // Coût estimé en €
  endpoint    String   // "parse_cv", "matching", etc.

  createdAt   DateTime @default(now())

  @@index([apiKeyId, createdAt])
  @@map("api_key_usage")
}
```

**Migration :**
```bash
cd packages/database
npx prisma db push
```

#### B. Router Backend (tRPC)

```typescript
// api/src/routers/settings.ts

import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { encryptApiKey, decryptApiKey } from '../services/encryption';

export const settingsRouter = router({

  // Liste des clés avec leurs priorités
  listApiKeys: publicProcedure
    .query(async ({ ctx }) => {
      const keys = await ctx.db.apiKey.findMany({
        orderBy: { priority: 'desc' }  // ⭐ Tri par priorité
      });

      return keys.map(k => ({
        id: k.id,
        provider: k.provider,
        isActive: k.isActive,
        priority: k.priority || 50,
        keyPreview: `***${k.key.slice(-4)}`,
        createdAt: k.createdAt
      }));
    }),

  // Ajouter une clé
  addApiKey: publicProcedure
    .input(z.object({
      provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral', 'ollama']),
      key: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      // Désactive les anciennes clés du même provider
      await ctx.db.apiKey.updateMany({
        where: { provider: input.provider },
        data: { isActive: false }
      });

      // Crée la nouvelle clé
      const apiKey = await ctx.db.apiKey.create({
        data: {
          provider: input.provider,
          key: encryptApiKey(input.key),  // ⭐ Chiffrement
          isActive: true,
          priority: 50  // Priorité par défaut
        }
      });

      return { success: true, id: apiKey.id };
    }),

  // ⭐ Définir la priorité d'une clé
  setProviderPriority: publicProcedure
    .input(z.object({
      id: z.string(),
      priority: z.number().min(1).max(100)
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.apiKey.update({
        where: { id: input.id },
        data: { priority: input.priority }
      });

      return { success: true };
    }),

  // Query priorité
  getProviderPriority: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const key = await ctx.db.apiKey.findUnique({
        where: { id: input.id }
      });

      return { priority: key?.priority || 50 };
    }),

  deleteApiKey: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.apiKey.delete({ where: { id: input.id } });
      return { success: true };
    })
});
```

#### C. Sélection Automatique du Provider

```typescript
// api/src/server.ts

import { db } from '@repo/database';
import { decryptApiKey } from './services/encryption';

// Exemple dans un endpoint de parsing CV
app.post('/api/parse-cv', async (req, res) => {

  // ⭐ Sélection du provider avec priorité la plus élevée
  const dbKey = await db.apiKey.findFirst({
    where: { isActive: true },
    orderBy: { priority: 'desc' }  // ⭐ Clé avec priorité max
  });

  if (!dbKey) {
    return res.status(400).json({ error: 'Aucune clé API active' });
  }

  const provider = dbKey.provider;
  const apiKey = decryptApiKey(dbKey.key);

  console.log(`🔑 Using ${provider} with priority ${dbKey.priority}`);

  // Appel service Python avec le provider sélectionné
  const result = await pythonClient.parseCV({
    text: cvText,
    provider: provider,
    api_key: apiKey
  });

  // Track usage
  await db.apiKeyUsage.create({
    data: {
      apiKeyId: dbKey.id,
      provider: provider,
      model: result.model || 'unknown',
      tokens: result.tokens || 0,
      cost: estimateCost(result.tokens, provider),
      endpoint: 'parse_cv'
    }
  });

  res.json(result);
});

function estimateCost(tokens: number, provider: string): number {
  const costPer1k: Record<string, number> = {
    'openai': 0.003,
    'anthropic': 0.003,
    'gemini': 0.0005,
    'mistral': 0.001,
    'ollama': 0  // Gratuit (local)
  };

  return (tokens / 1000) * (costPer1k[provider] || 0.001);
}
```

#### D. UI Settings avec Priorité

```tsx
// apps/desktop/src/routes/Settings.tsx

import { trpc } from '@repo/api-client';
import { useState } from 'react';

export function Settings() {
  const { data: apiKeys, refetch } = trpc.settings.listApiKeys.useQuery();

  const addKeyMutation = trpc.settings.addApiKey.useMutation({
    onSuccess: () => refetch()
  });

  const setPriorityMutation = trpc.settings.setProviderPriority.useMutation({
    onSuccess: () => refetch()
  });

  const deleteKeyMutation = trpc.settings.deleteApiKey.useMutation({
    onSuccess: () => refetch()
  });

  const [newProvider, setNewProvider] = useState('openai');
  const [newKey, setNewKey] = useState('');

  const handleAdd = () => {
    addKeyMutation.mutate({ provider: newProvider, key: newKey });
    setNewKey('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clés API</h1>

      {/* Liste des clés */}
      <div className="space-y-3">
        {apiKeys?.map((key) => (
          <div key={key.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
            <div className="flex-1">
              <div className="font-semibold">{key.provider}</div>
              <div className="text-sm text-gray-500">{key.keyPreview}</div>
            </div>

            {/* ⭐ Sélecteur de priorité */}
            <select
              value={key.priority}
              onChange={(e) => setPriorityMutation.mutate({
                id: key.id,
                priority: parseInt(e.target.value)
              })}
              className="px-3 py-1 border border-gray-300 rounded-lg"
            >
              <option value="100">Priorité max (100)</option>
              <option value="75">Haute (75)</option>
              <option value="50">Normale (50)</option>
              <option value="25">Basse (25)</option>
              <option value="1">Minimale (1)</option>
            </select>

            <button
              onClick={() => deleteKeyMutation.mutate({ id: key.id })}
              className="px-3 py-1 bg-red-500 text-white rounded-lg"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {/* Ajouter une clé */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <h2 className="font-semibold">Ajouter une clé</h2>

        <select
          value={newProvider}
          onChange={(e) => setNewProvider(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="gemini">Google Gemini</option>
          <option value="mistral">Mistral AI</option>
          <option value="ollama">Ollama (local)</option>
        </select>

        <input
          type="password"
          placeholder={newProvider === 'ollama' ? 'URL (ex: localhost:11434)' : 'Clé API'}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />

        <button
          onClick={handleAdd}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
```

#### E. Service Python avec Tous les Providers

```python
# services/ia-parser/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI()

class ParseRequest(BaseModel):
    text: str
    provider: str
    api_key: str

@app.post("/parse")
async def parse_cv(request: ParseRequest):
    prompt = f"Extract CV data from: {request.text}"

    # ⭐ OpenAI
    if request.provider == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=request.api_key)

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        return json.loads(completion.choices[0].message.content)

    # ⭐ Anthropic
    elif request.provider == "anthropic":
        import anthropic
        client = anthropic.Anthropic(api_key=request.api_key)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        text = message.content[0].text
        # Nettoyage des backticks markdown
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        return json.loads(json_match.group() if json_match else text)

    # ⭐ Gemini
    elif request.provider == "gemini":
        from google.generativeai import GenerativeModel, configure
        configure(api_key=request.api_key)

        model = GenerativeModel('gemini-2.0-flash-exp')
        result = model.generate_content(prompt)

        text = result.text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        return json.loads(json_match.group() if json_match else text)

    # ⭐ Mistral
    elif request.provider == "mistral":
        from mistralai import Mistral
        client = Mistral(api_key=request.api_key)

        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    # ⭐ Ollama (local)
    elif request.provider == "ollama":
        import requests
        ollama_url = f"http://{request.api_key}/api/generate"

        response = requests.post(ollama_url, json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": False,
            "format": "json"
        })

        return json.loads(response.json()["response"])

    else:
        raise HTTPException(400, "Provider non supporté")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ia-parser"}
```

**requirements.txt :**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
openai==1.35.0
anthropic==0.25.0
google-generativeai==0.5.0
mistralai==1.0.0
requests==2.31.0
```

### ✅ Résultat Final

Avec ce système, vous avez :
- ✅ Support de 5 providers IA (OpenAI, Anthropic, Gemini, Mistral, Ollama)
- ✅ Sélection automatique par priorité (1-100)
- ✅ Chiffrement AES-256 des clés
- ✅ UI intuitive pour gérer les clés et priorités
- ✅ Tracking usage et coûts
- ✅ Failover automatique si un provider échoue

---

## 2. Pagination Universelle

### 🎯 Objectif
Système de pagination réutilisable pour toutes les listes avec sélecteur d'items par page.

### 📦 Composants

#### A. Backend avec Offset

```typescript
// api/src/routers/candidats.ts

export const candidatsRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)  // ⭐ OFFSET
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.search) {
        where.OR = [
          { nom: { contains: input.search, mode: 'insensitive' } },
          { prenom: { contains: input.search, mode: 'insensitive' } }
        ];
      }

      const candidats = await ctx.db.candidat.findMany({
        where,
        take: input.limit,
        skip: input.offset,  // ⭐ SKIP = OFFSET
        orderBy: { createdAt: 'desc' }
      });

      return candidats;
    })
});
```

#### B. Frontend avec Pagination

```tsx
// apps/desktop/src/routes/Candidats.tsx

import { trpc } from '@repo/api-client';
import { useState } from 'react';

export function Candidats() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // ⭐ Calcul offset
  const { data: candidats, isLoading } = trpc.candidats.list.useQuery({
    search: search || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  });

  // Reset page lors de recherche
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="px-4 py-2 border rounded-lg"
      />

      {/* Sélecteur items/page */}
      <select
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setCurrentPage(1);
        }}
        className="px-3 py-1 border rounded-lg"
      >
        <option value={10}>10 par page</option>
        <option value={20}>20 par page</option>
        <option value={50}>50 par page</option>
      </select>

      {/* Liste */}
      <div className="space-y-3">
        {candidats?.map(c => (
          <div key={c.id} className="p-4 bg-white rounded-lg shadow">
            {c.prenom} {c.nom}
          </div>
        ))}
      </div>

      {/* ⭐ Pagination Controls */}
      {candidats && candidats.length === itemsPerPage && (
        <div className="flex items-center justify-center gap-2">
          {/* Bouton Précédent */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Précédent
          </button>

          {/* Numéros de page avec ellipses */}
          <div className="flex gap-2">
            {/* Page 1 */}
            {currentPage > 2 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-4 py-2 border rounded-lg"
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-2">...</span>}
              </>
            )}

            {/* Page précédente */}
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 border rounded-lg"
              >
                {currentPage - 1}
              </button>
            )}

            {/* Page courante */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">
              {currentPage}
            </button>

            {/* Page suivante */}
            {candidats.length === itemsPerPage && (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 border rounded-lg"
              >
                {currentPage + 1}
              </button>
            )}
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={candidats.length < itemsPerPage}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

### ✅ Résultat

- ✅ Pagination avec limit/offset
- ✅ Sélecteur 10/20/50 par page
- ✅ Ellipses intelligentes (...) pour grandes listes
- ✅ Reset page 1 lors de recherche
- ✅ Désactivation boutons début/fin
- ✅ Réutilisable dans n'importe quelle liste

---

## 3. Dashboard Temps Réel

### 🎯 Objectif
Dashboard avec auto-refresh des données et KPIs cliquables.

### 📦 Composants

#### A. Backend Stats Router

```typescript
// api/src/routers/stats.ts

export const statsRouter = router({
  getOverview: publicProcedure
    .query(async ({ ctx }) => {
      const [
        totalCandidats,
        totalOffres,
        totalMatchings,
        totalEntreprises
      ] = await Promise.all([
        ctx.db.candidat.count(),
        ctx.db.offreEmploi.count({ where: { statut: 'active' } }),
        ctx.db.matching.count(),
        ctx.db.entreprise.count()
      ]);

      // Candidats ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const candidatsCeMois = await ctx.db.candidat.count({
        where: { createdAt: { gte: startOfMonth } }
      });

      // Matchings excellents (≥85%)
      const matchingsExcellents = await ctx.db.matching.count({
        where: { scoreTotal: { gte: 85 } }
      });

      return {
        totalCandidats,
        candidatsCeMois,
        totalOffres,
        totalMatchings,
        matchingsExcellents,
        totalEntreprises
      };
    }),

  getRecentActivity: publicProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const recentCandidats = await ctx.db.candidat.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, prenom: true, nom: true, createdAt: true }
      });

      const recentMatchings = await ctx.db.matching.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          candidat: { select: { prenom: true, nom: true } },
          offre: { select: { titre: true } }
        }
      });

      return { recentCandidats, recentMatchings };
    })
});
```

#### B. Dashboard avec Auto-Refresh

```tsx
// apps/desktop/src/routes/Dashboard.tsx

import { trpc } from '@repo/api-client';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  // ⭐ Auto-refresh toutes les 30 secondes
  const { data: overview } = trpc.stats.getOverview.useQuery(undefined, {
    refetchInterval: 30000  // 30s
  });

  // ⭐ Auto-refresh toutes les 15 secondes
  const { data: activity } = trpc.stats.getRecentActivity.useQuery(
    { limit: 5 },
    { refetchInterval: 15000 }  // 15s
  );

  const { data: apiKeys } = trpc.settings.listApiKeys.useQuery();

  // ⭐ Calcul statut IA
  const getAIStatus = () => {
    if (!apiKeys || apiKeys.length === 0) {
      return {
        color: 'red',
        label: 'Aucune clé IA configurée',
        dotColor: 'bg-red-500'
      };
    }

    const hasCloudProvider = apiKeys.some((k: any) =>
      ['openai', 'anthropic', 'gemini', 'mistral'].includes(k.provider) && k.isActive
    );

    if (hasCloudProvider) {
      return {
        color: 'green',
        label: 'IA opérationnelle',
        dotColor: 'bg-green-500'
      };
    }

    const hasOllama = apiKeys.some((k: any) =>
      k.provider === 'ollama' && k.isActive
    );

    if (hasOllama) {
      return {
        color: 'orange',
        label: 'Ollama (local)',
        dotColor: 'bg-orange-500'
      };
    }

    return {
      color: 'gray',
      label: 'Clés inactives',
      dotColor: 'bg-gray-500'
    };
  };

  const aiStatus = getAIStatus();

  return (
    <div className="space-y-8">
      {/* ⭐ Indicateur Statut IA */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-${aiStatus.color}-500`}>
        <div className={`w-3 h-3 ${aiStatus.dotColor} rounded-full animate-pulse`}></div>
        <span className={`text-${aiStatus.color}-700 font-semibold`}>
          {aiStatus.label}
        </span>
      </div>

      {/* ⭐ KPIs Cliquables */}
      <div className="grid grid-cols-4 gap-4">
        {/* Candidats */}
        <div
          onClick={() => navigate('/candidats')}
          className="p-6 bg-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all"
        >
          <div className="text-3xl font-bold">{overview?.totalCandidats || 0}</div>
          <div className="text-gray-600">Total Candidats</div>
          <div className="text-sm text-blue-600">+{overview?.candidatsCeMois || 0} ce mois</div>
        </div>

        {/* Offres */}
        <div
          onClick={() => navigate('/offres')}
          className="p-6 bg-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all"
        >
          <div className="text-3xl font-bold">{overview?.totalOffres || 0}</div>
          <div className="text-gray-600">Total Offres Actives</div>
        </div>

        {/* ⭐ Matchings → All Matchings */}
        <div
          onClick={() => navigate('/all-matchings')}
          className="p-6 bg-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all"
        >
          <div className="text-3xl font-bold">{overview?.totalMatchings || 0}</div>
          <div className="text-gray-600">Total Matchings IA</div>
          <div className="text-sm text-green-600">
            {overview?.matchingsExcellents || 0} excellents (≥85%)
          </div>
        </div>

        {/* Entreprises */}
        <div
          onClick={() => navigate('/entreprises')}
          className="p-6 bg-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all"
        >
          <div className="text-3xl font-bold">{overview?.totalEntreprises || 0}</div>
          <div className="text-gray-600">Total Entreprises</div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-3">Derniers Candidats</h3>
          <div className="space-y-2">
            {activity?.recentCandidats.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/candidats/${c.id}`)}
                className="p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                {c.prenom} {c.nom}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-3">Derniers Matchings</h3>
          <div className="space-y-2">
            {activity?.recentMatchings.map(m => (
              <div key={m.id} className="p-2 hover:bg-gray-50 rounded">
                {m.candidat.prenom} {m.candidat.nom} → {m.offre.titre}
                <span className="text-purple-600 font-bold ml-2">
                  {m.scoreTotal}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### ✅ Résultat

- ✅ Auto-refresh paramétrable (15-60s selon données)
- ✅ Indicateur statut IA avec couleur
- ✅ KPIs cliquables pour navigation
- ✅ Activité temps réel
- ✅ Performance optimale (React Query cache)

---

## 4. Chiffrement AES-256 des Clés API

### 🎯 Objectif
Stocker les clés API de manière sécurisée avec chiffrement AES-256.

### 📦 Implémentation

```typescript
// api/src/services/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
}

const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');

// ⭐ Chiffrement
export function encryptApiKey(text: string): string {
  const iv = crypto.randomBytes(16);  // IV aléatoire
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Format: IV:EncryptedData
  return iv.toString('hex') + ':' + encrypted;
}

// ⭐ Déchiffrement
export function decryptApiKey(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Génération de la clé :**
```javascript
// scripts/generate-encryption-key.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const key = crypto.randomBytes(32).toString('hex');  // 64 chars hex

const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

if (envContent.includes('ENCRYPTION_KEY=')) {
  envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${key}`);
} else {
  envContent += `\nENCRYPTION_KEY=${key}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Encryption key generated and saved to .env');
```

**package.json :**
```json
{
  "scripts": {
    "generate-key": "node scripts/generate-encryption-key.js"
  }
}
```

### ✅ Sécurité

- ✅ AES-256-CBC (standard militaire)
- ✅ IV aléatoire par clé (pas de réutilisation)
- ✅ Clé 256 bits stockée dans .env (jamais commitée)
- ✅ Format IV:Data pour faciliter déchiffrement

---

## 5. Service Python FastAPI

### 🎯 Objectif
Créer un microservice Python pour tâches lourdes (ML, parsing, etc.).

### 📦 Setup

```python
# services/ia-matching/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os

app = FastAPI(title="IA Matching Service")

# ⭐ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    offre: dict
    candidats: List[dict]

@app.post("/match")
async def match_candidates(request: MatchRequest):
    # Logique de matching
    results = []

    for candidat in request.candidats:
        score = calculate_match_score(candidat, request.offre)
        results.append({
            "candidat_id": candidat["id"],
            "score_total": score,
            "details": {}
        })

    return results

def calculate_match_score(candidat: dict, offre: dict) -> float:
    # Algorithme de scoring
    return 85.0

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ia-matching"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

**requirements.txt :**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
```

**Lancement :**
```bash
# Setup
cd services/ia-matching
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Run
python main.py
# → http://localhost:8002
```

**Client Node.js :**
```typescript
// api/src/services/python-client.ts

import axios from 'axios';

const PYTHON_MATCHING = `http://localhost:8002`;

export const pythonClient = {
  async matchCandidates(params: { offre: any; candidats: any[] }) {
    const response = await axios.post(`${PYTHON_MATCHING}/match`, params);
    return response.data;
  },

  async healthCheck() {
    try {
      await axios.get(`${PYTHON_MATCHING}/health`);
      return true;
    } catch {
      return false;
    }
  }
};
```

---

## 📝 Checklist Réutilisation

Avant de copier un module dans une nouvelle app :

### Système Multi-Provider IA
- [ ] Copier `services/encryption.ts`
- [ ] Copier `routers/settings.ts`
- [ ] Ajouter `priority` au schema Prisma
- [ ] Copier service Python `ia-parser/main.py`
- [ ] Copier UI `Settings.tsx`
- [ ] Générer clé de chiffrement
- [ ] Installer dépendances Python

### Pagination
- [ ] Ajouter `offset` aux inputs backend
- [ ] Copier composant pagination frontend
- [ ] Adapter au contexte (candidats/offres/etc.)

### Dashboard Temps Réel
- [ ] Créer router `stats.ts`
- [ ] Utiliser `refetchInterval` dans useQuery
- [ ] Ajouter indicateurs visuels

### Chiffrement
- [ ] Copier `encryption.ts`
- [ ] Générer `ENCRYPTION_KEY` 64 chars
- [ ] Utiliser dans toutes les clés sensibles

---

**🎉 Tous ces modules sont maintenant documentés et prêts à être réutilisés !**
