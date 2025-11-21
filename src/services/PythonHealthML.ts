/**
 * Python Health ML Service - Interface avec backend Sentence-BERT
 * ================================================================
 *
 * Service pour appeler le nouveau backend ML avec analyse sémantique
 *
 * @module PythonHealthML
 */

import { log } from '../utils/logger';

const ML_BACKEND_URL = 'http://127.0.0.1:8003';

/**
 * Résultat d'analyse de symptômes
 */
export interface SymptomAnalysisResult {
  success: boolean;
  severity: 'emergency' | 'urgent' | 'warning' | 'normal';
  similar_conditions: Array<{
    name: string;
    similarity: number;
    severity: string;
    category: string;
  }>;
  recommendations: string[];
  risk_score: number;
  context_analyzed: boolean;
  fallback_mode?: boolean;
}

/**
 * Résultat de vérification d'interactions médicamenteuses
 */
export interface DrugInteractionResult {
  success: boolean;
  has_interaction: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    level: 'severe' | 'moderate' | 'minor';
    description: string;
    recommendation: string;
  }>;
  severity: 'severe' | 'moderate' | 'none';
  drugs_analyzed: string[];
}

/**
 * Résultat de prédiction de risques
 */
export interface RiskPredictionResult {
  success: boolean;
  risks: {
    [key: string]: number; // 0-1
  };
  high_risk_factors: string[];
  recommendations: string[];
}

/**
 * Service Python Health ML
 */
class PythonHealthMLService {
  private baseUrl: string = ML_BACKEND_URL;

  /**
   * Vérifie si le backend ML est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET'
      });

      if (!response.ok) return false;

      const data = await response.json();
      log.info('PythonHealthML', `Backend status: ${data.status}, model loaded: ${data.model_loaded}`);

      return data.status === 'healthy';
    } catch (error) {
      log.warn('PythonHealthML', 'Backend not available');
      return false;
    }
  }

  /**
   * Analyse sémantique des symptômes
   *
   * @param symptoms - Description des symptômes
   * @param context - Contexte patient (âge, antécédents, etc.)
   * @returns Analyse avec conditions similaires et recommandations
   *
   * @example
   * const result = await mlService.analyzeSymptoms(
   *   "douleur thoracique et essoufflement",
   *   { age: 55, antecedents: ["hypertension"] }
   * );
   *
   * if (result.severity === 'emergency') {
   *   alert("🚨 URGENCE - APPELEZ LE 15");
   * }
   */
  async analyzeSymptoms(
    symptoms: string,
    context?: any
  ): Promise<SymptomAnalysisResult> {
    try {
      log.debug('PythonHealthML', `Analyzing symptoms: ${symptoms.substring(0, 50)}...`);

      const response = await fetch(`${this.baseUrl}/analyze-symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symptoms,
          context: context || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur backend ML');
      }

      const result: SymptomAnalysisResult = await response.json();

      log.info('PythonHealthML', `Symptom analysis complete. Severity: ${result.severity}, Risk: ${result.risk_score}`);

      return result;

    } catch (error: any) {
      log.error('PythonHealthML', 'Symptom analysis failed', { error: error.message });

      // Fallback basique
      return {
        success: false,
        severity: 'normal',
        similar_conditions: [],
        recommendations: ['Service ML indisponible. Consultez un médecin si symptômes persistent.'],
        risk_score: 0,
        context_analyzed: false,
        fallback_mode: true
      };
    }
  }

  /**
   * Vérifie les interactions entre médicaments
   *
   * @param drugs - Liste de noms de médicaments
   * @returns Détails des interactions trouvées
   *
   * @example
   * const result = await mlService.checkDrugInteraction(["Aspirine", "Ibuprofène"]);
   *
   * if (result.has_interaction) {
   *   console.log("⚠️ Interactions détectées:", result.interactions);
   * }
   */
  async checkDrugInteraction(drugs: string[]): Promise<DrugInteractionResult> {
    try {
      log.debug('PythonHealthML', `Checking drug interactions: ${drugs.join(', ')}`);

      const response = await fetch(`${this.baseUrl}/drug-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ drugs })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur backend ML');
      }

      const result: DrugInteractionResult = await response.json();

      if (result.has_interaction) {
        log.warn('PythonHealthML', `Drug interactions found: ${result.severity}`);
      } else {
        log.info('PythonHealthML', 'No drug interactions found');
      }

      return result;

    } catch (error: any) {
      log.error('PythonHealthML', 'Drug interaction check failed', { error: error.message });

      return {
        success: false,
        has_interaction: false,
        interactions: [],
        severity: 'none',
        drugs_analyzed: drugs
      };
    }
  }

  /**
   * Prédit les risques de santé
   *
   * @param patientProfile - Profil du patient (âge, antécédents, IMC, etc.)
   * @param symptoms - Symptômes actuels (optionnel)
   * @returns Prédiction de risques avec recommandations
   *
   * @example
   * const result = await mlService.predictRisk({
   *   age: 60,
   *   antecedents: ["hypertension", "diabete"],
   *   imc: 32
   * });
   *
   * console.log("Risque cardiovasculaire:", result.risks.cardiovasculaire);
   */
  async predictRisk(
    patientProfile: any,
    symptoms?: string
  ): Promise<RiskPredictionResult> {
    try {
      log.debug('PythonHealthML', 'Predicting health risks');

      const response = await fetch(`${this.baseUrl}/predict-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_profile: patientProfile,
          symptoms: symptoms || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur backend ML');
      }

      const result: RiskPredictionResult = await response.json();

      if (result.high_risk_factors.length > 0) {
        log.warn('PythonHealthML', `High risk factors detected: ${result.high_risk_factors.join(', ')}`);
      }

      return result;

    } catch (error: any) {
      log.error('PythonHealthML', 'Risk prediction failed', { error: error.message });

      return {
        success: false,
        risks: {},
        high_risk_factors: [],
        recommendations: ['Service ML indisponible.']
      };
    }
  }

  /**
   * Vide le cache d'embeddings
   */
  async clearCache(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/clear-cache`, {
        method: 'POST'
      });

      if (response.ok) {
        log.info('PythonHealthML', 'Cache cleared successfully');
      }
    } catch (error) {
      log.warn('PythonHealthML', 'Failed to clear cache');
    }
  }
}

// Export singleton
export const pythonHealthML = new PythonHealthMLService();
export default pythonHealthML;
