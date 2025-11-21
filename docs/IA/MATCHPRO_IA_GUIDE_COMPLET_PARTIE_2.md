# 🎯 MATCHPRO IA - GUIDE TECHNIQUE COMPLET (PARTIE 2)

## SUITE: BACKEND API & SERVICES

---

## 7. BACKEND API - SERVICES

### 📄 api/src/services/redis-cache.ts

```typescript
import Redis from 'ioredis';

// Connection Redis local
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('✅ Redis connecté');
});

redis.on('error', (err) => {
  console.error('❌ Redis erreur:', err.message);
  console.log('ℹ️  L\'app fonctionne sans cache (mode dégradé)');
});

// Helper avec fallback si Redis down
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  async set(key: string, value: any, ttlSeconds = 600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.warn('Cache set failed:', err);
    }
  },
  
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn('Cache del failed:', err);
    }
  },
  
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.warn('Cache delPattern failed:', err);
    }
  },
  
  async flush(): Promise<void> {
    try {
      await redis.flushdb();
    } catch (err) {
      console.warn('Cache flush failed:', err);
    }
  }
};

export default redis;
```

### 📄 api/src/services/encryption.ts

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}

const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');

export function encryptApiKey(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

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

### 📄 api/src/services/python-client.ts

```typescript
import axios, { AxiosInstance } from 'axios';

const PYTHON_SERVICES = {
  parser: `http://localhost:${process.env.PYTHON_PARSER_PORT || 8001}`,
  matching: `http://localhost:${process.env.PYTHON_MATCHING_PORT || 8002}`,
  predictive: `http://localhost:${process.env.PYTHON_PREDICTIVE_PORT || 8003}`
};

class PythonClient {
  private clients: Record<string, AxiosInstance>;
  
  constructor() {
    this.clients = {
      parser: axios.create({ baseURL: PYTHON_SERVICES.parser, timeout: 30000 }),
      matching: axios.create({ baseURL: PYTHON_SERVICES.matching, timeout: 60000 }),
      predictive: axios.create({ baseURL: PYTHON_SERVICES.predictive, timeout: 30000 })
    };
  }
  
  // ==========================================
  // CV PARSER
  // ==========================================
  
  async parseCV(params: {
    text: string;
    provider: string;
    api_key: string;
  }) {
    try {
      const response = await this.clients.parser.post('/parse', params);
      return response.data;
    } catch (error: any) {
      throw new Error(`Parser service error: ${error.message}`);
    }
  }
  
  async extractPDF(base64Data: string): Promise<string> {
    try {
      const response = await this.clients.parser.post('/extract/pdf', {
        data: base64Data
      });
      return response.data.text;
    } catch (error: any) {
      throw new Error(`PDF extraction error: ${error.message}`);
    }
  }
  
  async extractDOCX(base64Data: string): Promise<string> {
    try {
      const response = await this.clients.parser.post('/extract/docx', {
        data: base64Data
      });
      return response.data.text;
    } catch (error: any) {
      throw new Error(`DOCX extraction error: ${error.message}`);
    }
  }
  
  async ocr(base64Image: string): Promise<string> {
    try {
      const response = await this.clients.parser.post('/extract/ocr', {
        image: base64Image
      });
      return response.data.text;
    } catch (error: any) {
      throw new Error(`OCR error: ${error.message}`);
    }
  }
  
  // ==========================================
  // MATCHING
  // ==========================================
  
  async matchCandidates(params: {
    offre: any;
    candidats: any[];
  }) {
    try {
      const response = await this.clients.matching.post('/match', params);
      return response.data;
    } catch (error: any) {
      throw new Error(`Matching service error: ${error.message}`);
    }
  }
  
  // ==========================================
  // PREDICTIVE
  // ==========================================
  
  async predictSalary(profile: any) {
    try {
      const response = await this.clients.predictive.post('/predict-salary', profile);
      return response.data;
    } catch (error: any) {
      throw new Error(`Salary prediction error: ${error.message}`);
    }
  }
  
  async predictTurnover(profile: any) {
    try {
      const response = await this.clients.predictive.post('/predict-turnover', profile);
      return response.data;
    } catch (error: any) {
      throw new Error(`Turnover prediction error: ${error.message}`);
    }
  }
  
  // ==========================================
  // HEALTH CHECK
  // ==========================================
  
  async healthCheck(): Promise<{
    parser: boolean;
    matching: boolean;
    predictive: boolean;
  }> {
    const results = await Promise.allSettled([
      this.clients.parser.get('/health'),
      this.clients.matching.get('/health'),
      this.clients.predictive.get('/health')
    ]);
    
    return {
      parser: results[0].status === 'fulfilled',
      matching: results[1].status === 'fulfilled',
      predictive: results[2].status === 'fulfilled'
    };
  }
}

export const pythonClient = new PythonClient();
```

### 📄 api/src/services/ia-gateway.ts

```typescript
import { TRPCError } from '@trpc/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@repo/database';
import { encryptApiKey, decryptApiKey } from './encryption';

type Provider = 'openai' | 'anthropic' | 'gemini' | 'mistral';

export class IAGateway {
  
  // ==========================================
  // GESTION CLÉS API
  // ==========================================
  
  private async getApiKey(provider: Provider): Promise<string> {
    const apiKey = await db.apiKey.findFirst({
      where: { provider, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!apiKey) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: `Aucune clé API active pour ${provider}. Configurez vos clés dans Paramètres → API.`
      });
    }
    
    return decryptApiKey(apiKey.key);
  }
  
  private async trackUsage(params: {
    provider: string;
    model: string;
    tokens: number;
    endpoint: string;
  }) {
    try {
      const apiKey = await db.apiKey.findFirst({
        where: { provider: params.provider, isActive: true }
      });
      
      if (!apiKey) return;
      
      // Coûts estimés par 1K tokens (€)
      const costPer1kTokens: Record<string, number> = {
        'gpt-4o': 0.003,
        'gpt-4o-mini': 0.0001,
        'claude-sonnet-4-20250514': 0.003,
        'claude-haiku-20250320': 0.0008,
        'gemini-pro': 0.0005,
        'gemini-1.5-flash': 0.00025
      };
      
      const cost = (params.tokens / 1000) * (costPer1kTokens[params.model] || 0.001);
      
      await db.apiKeyUsage.create({
        data: {
          apiKeyId: apiKey.id,
          provider: params.provider,
          model: params.model,
          tokens: params.tokens,
          cost,
          endpoint: params.endpoint
        }
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }
  
  // ==========================================
  // PARSE CV
  // ==========================================
  
  async parseCV(cvText: string): Promise<any> {
    const providers: Provider[] = ['openai', 'anthropic', 'gemini'];
    
    for (const provider of providers) {
      try {
        const key = await this.getApiKey(provider);
        
        const prompt = `Extrait les informations du CV suivant en JSON structuré:

${cvText}

Format JSON attendu (réponds UNIQUEMENT avec le JSON, rien d'autre):
{
  "nom": "",
  "prenom": "",
  "email": "",
  "telephone": "",
  "dateNaissance": "YYYY-MM-DD ou null",
  "adresse": {
    "rue": "",
    "ville": "",
    "codePostal": "",
    "pays": "France"
  },
  "experiences": [
    {
      "poste": "",
      "entreprise": "",
      "dateDebut": "YYYY-MM",
      "dateFin": "YYYY-MM ou null si actuel",
      "missions": [""],
      "competences": [""],
      "secteur": ""
    }
  ],
  "competences": [
    {
      "nom": "",
      "categorie": "technique|soft|langue",
      "niveau": 1-5,
      "anneesPratique": 0,
      "derniereUtilisation": "YYYY-MM"
    }
  ],
  "formations": [
    {
      "diplome": "",
      "ecole": "",
      "annee": 2024,
      "niveau": "Bac|Bac+2|Bac+3|Bac+5|Doctorat",
      "specialite": ""
    }
  ],
  "langues": [
    {
      "langue": "",
      "niveau": "A1|A2|B1|B2|C1|C2"
    }
  ]
}`;
        
        if (provider === 'openai') {
          const openai = new OpenAI({ apiKey: key });
          
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1
          });
          
          const parsed = JSON.parse(completion.choices[0].message.content!);
          
          await this.trackUsage({
            provider: 'openai',
            model: 'gpt-4o',
            tokens: completion.usage?.total_tokens || 0,
            endpoint: 'parse_cv'
          });
          
          return parsed;
        }
        
        if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key });
          
          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.1,
            messages: [{ role: 'user', content: prompt }]
          });
          
          const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          
          await this.trackUsage({
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            tokens: message.usage.input_tokens + message.usage.output_tokens,
            endpoint: 'parse_cv'
          });
          
          return parsed;
        }
        
        if (provider === 'gemini') {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          
          await this.trackUsage({
            provider: 'gemini',
            model: 'gemini-pro',
            tokens: 1000,
            endpoint: 'parse_cv'
          });
          
          return parsed;
        }
        
      } catch (error) {
        console.error(`${provider} failed:`, error);
        continue;
      }
    }
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Tous les providers IA ont échoué. Vérifiez vos clés API.'
    });
  }
  
  // ==========================================
  // GÉNÉRER DESCRIPTION OFFRE
  // ==========================================
  
  async generateJobDescription(brief: string): Promise<string> {
    try {
      const key = await this.getApiKey('anthropic');
      const anthropic = new Anthropic({ apiKey: key });
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Rédige une offre d'emploi professionnelle et attractive basée sur ce brief:

${brief}

L'offre doit contenir:
- Titre accrocheur
- Présentation entreprise (2-3 phrases)
- Missions principales (5-7 points)
- Profil recherché (compétences techniques + soft skills)
- Avantages
- Process de recrutement

Ton: professionnel mais humain, inclusif, optimisé SEO. Max 500 mots.`
        }]
      });
      
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      
      await this.trackUsage({
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        tokens: message.usage.input_tokens + message.usage.output_tokens,
        endpoint: 'generate_job_description'
      });
      
      return text;
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erreur génération offre: ${error.message}`
      });
    }
  }
  
  // ==========================================
  // ANALYSER SENTIMENT
  // ==========================================
  
  async analyzeSentiment(text: string): Promise<'positif' | 'neutre' | 'negatif'> {
    try {
      const key = await this.getApiKey('openai');
      const openai = new OpenAI({ apiKey: key });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyse le sentiment de ce texte et réponds UNIQUEMENT par un mot: "positif", "neutre" ou "negatif"

Texte: ${text}`
        }],
        temperature: 0,
        max_tokens: 10
      });
      
      const sentiment = completion.choices[0].message.content?.toLowerCase().trim();
      
      if (sentiment === 'positif' || sentiment === 'neutre' || sentiment === 'negatif') {
        return sentiment;
      }
      
      return 'neutre';
    } catch {
      return 'neutre';
    }
  }
}

export const iaGateway = new IAGateway();
```

---

## 7. BACKEND API - ROUTERS

### 📄 api/src/routers/candidats.ts

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { iaGateway } from '../services/ia-gateway';
import { pythonClient } from '../services/python-client';
import { cache } from '../services/redis-cache';

export const candidatsRouter = router({
  
  // ==========================================
  // LISTE CANDIDATS
  // ==========================================
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      competences: z.array(z.string()).optional(),
      experienceMin: z.number().optional(),
      disponibiliteMax: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `candidats:list:${JSON.stringify(input)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      const where: any = {};
      
      if (input.search) {
        where.OR = [
          { nom: { contains: input.search, mode: 'insensitive' } },
          { prenom: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } }
        ];
      }
      
      if (input.disponibiliteMax) {
        where.disponibilite = { lte: input.disponibiliteMax };
      }
      
      const candidats = await ctx.db.candidat.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: { createdAt: 'desc' }
      });
      
      const enriched = candidats.map(c => ({
        ...c,
        adresse: JSON.parse(c.adresse),
        competences: JSON.parse(c.competences),
        experiences: JSON.parse(c.experiences),
        formations: JSON.parse(c.formations),
        scores: c.scores ? JSON.parse(c.scores) : null,
        dernier_poste: JSON.parse(c.experiences)[0]?.poste || null,
        annees_experience: calculateYearsExperience(JSON.parse(c.experiences))
      }));
      
      await cache.set(cacheKey, enriched, 300);
      return enriched;
    }),
  
  // ==========================================
  // DÉTAILS CANDIDAT
  // ==========================================
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const candidat = await ctx.db.candidat.findUnique({
        where: { id: input.id },
        include: {
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          matchings: {
            include: { 
              offre: { include: { entreprise: true } }
            },
            orderBy: { scoreTotal: 'desc' },
            take: 10
          },
          placements: {
            include: { entreprise: true },
            orderBy: { dateDebut: 'desc' }
          }
        }
      });
      
      if (!candidat) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return {
        ...candidat,
        adresse: JSON.parse(candidat.adresse),
        mobilite: JSON.parse(candidat.mobilite),
        experiences: JSON.parse(candidat.experiences),
        competences: JSON.parse(candidat.competences),
        formations: JSON.parse(candidat.formations),
        langues: candidat.langues ? JSON.parse(candidat.langues) : [],
        scores: candidat.scores ? JSON.parse(candidat.scores) : null,
        predictions: candidat.predictions ? JSON.parse(candidat.predictions) : null,
        preferences: candidat.preferences ? JSON.parse(candidat.preferences) : null,
        matchings: candidat.matchings.map(m => ({
          ...m,
          details: JSON.parse(m.details)
        }))
      };
    }),
  
  // ==========================================
  // PARSE CV
  // ==========================================
  parseCV: publicProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(),
      fileType: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      let cvText = '';
      
      // Extraction selon type
      if (input.fileType === 'application/pdf') {
        cvText = await pythonClient.extractPDF(input.fileData);
      } else if (input.fileType.includes('wordprocessingml')) {
        cvText = await pythonClient.extractDOCX(input.fileData);
      } else if (input.fileType.startsWith('image/')) {
        cvText = await pythonClient.ocr(input.fileData);
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Format non supporté'
        });
      }
      
      // Parse avec IA
      const parsed = await iaGateway.parseCV(cvText);
      
      // Check si existe
      const existing = await ctx.db.candidat.findUnique({
        where: { email: parsed.email }
      });
      
      if (existing) {
        await ctx.db.candidat.update({
          where: { id: existing.id },
          data: {
            cvParsed: JSON.stringify(parsed),
            experiences: JSON.stringify(parsed.experiences),
            competences: JSON.stringify(parsed.competences),
            formations: JSON.stringify(parsed.formations),
            updatedAt: new Date()
          }
        });
        
        return { success: true, candidatId: existing.id, action: 'updated' };
      }
      
      // Créer nouveau
      const candidat = await ctx.db.candidat.create({
        data: {
          nom: parsed.nom,
          prenom: parsed.prenom,
          email: parsed.email,
          telephone: parsed.telephone || '',
          dateNaissance: parsed.dateNaissance ? new Date(parsed.dateNaissance) : null,
          adresse: JSON.stringify(parsed.adresse || {}),
          mobilite: JSON.stringify([]),
          cvParsed: JSON.stringify(parsed),
          experiences: JSON.stringify(parsed.experiences || []),
          competences: JSON.stringify(parsed.competences || []),
          formations: JSON.stringify(parsed.formations || []),
          langues: JSON.stringify(parsed.langues || []),
          disponibilite: 30
        }
      });
      
      // Calculer scores async
      calculateScoresAsync(candidat.id).catch(console.error);
      
      await cache.delPattern('candidats:list:*');
      
      return { success: true, candidatId: candidat.id, action: 'created' };
    }),
  
  // ==========================================
  // CRÉER CANDIDAT
  // ==========================================
  create: publicProcedure
    .input(z.object({
      nom: z.string(),
      prenom: z.string(),
      email: z.string().email(),
      telephone: z.string(),
      adresse: z.object({
        ville: z.string(),
        codePostal: z.string().optional(),
        pays: z.string().default('France')
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.candidat.findUnique({
        where: { email: input.email }
      });
      
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email déjà utilisé' });
      }
      
      const candidat = await ctx.db.candidat.create({
        data: {
          ...input,
          adresse: JSON.stringify(input.adresse),
          mobilite: JSON.stringify([]),
          experiences: JSON.stringify([]),
          competences: JSON.stringify([]),
          formations: JSON.stringify([]),
          disponibilite: 30
        }
      });
      
      await cache.delPattern('candidats:list:*');
      return { success: true, candidatId: candidat.id };
    }),
  
  // ==========================================
  // METTRE À JOUR
  // ==========================================
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        nom: z.string().optional(),
        prenom: z.string().optional(),
        telephone: z.string().optional(),
        disponibilite: z.number().optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.candidat.update({
        where: { id: input.id },
        data: input.data
      });
      
      await cache.delPattern('candidats:*');
      return { success: true };
    }),
  
  // ==========================================
  // SUPPRIMER
  // ==========================================
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.candidat.delete({ where: { id: input.id } });
      await cache.delPattern('candidats:*');
      return { success: true };
    }),
  
  // ==========================================
  // AJOUTER INTERACTION
  // ==========================================
  addInteraction: publicProcedure
    .input(z.object({
      candidatId: z.string(),
      type: z.enum(['email', 'appel', 'sms', 'entretien', 'test', 'note']),
      sujet: z.string(),
      contenu: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const interaction = await ctx.db.interaction.create({
        data: input
      });
      
      if (input.contenu) {
        analyzeSentimentAsync(interaction.id, input.contenu).catch(console.error);
      }
      
      return { success: true, interactionId: interaction.id };
    })
});

// Helpers
function calculateYearsExperience(experiences: any[]): number {
  let totalMonths = 0;
  
  for (const exp of experiences) {
    const start = new Date(exp.dateDebut);
    const end = exp.dateFin ? new Date(exp.dateFin) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    totalMonths += Math.max(months, 0);
  }
  
  return Math.round((totalMonths / 12) * 10) / 10;
}

async function calculateScoresAsync(candidatId: string) {
  // Implementation similaire à avant
  // Calcul employabilité, stabilité, adaptabilité
}

async function analyzeSentimentAsync(interactionId: string, contenu: string) {
  // Implementation similaire à avant
}
```

**SUITE DU CODE DANS LA PARTIE 3...**

Continue ? 🚀
