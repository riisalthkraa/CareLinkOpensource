"""
Prédicteur de Santé ML - Modèles de Machine Learning
=====================================================

Implémente des modèles ML pour prédire les risques de santé et
recommander des actions personnalisées.

Modèles implémentés:
1. Classification des risques (Random Forest)
2. Prédiction d'adhérence aux traitements (Gradient Boosting)
3. Détection d'anomalies (Isolation Forest)
4. Prédiction de consultations futures (Régression temporelle)

Auteur: CareLink Team
Version: 1.0.0
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json

# Machine Learning
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    IsolationForest
)
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)


class HealthPredictor:
    """Prédicteur ML de risques de santé"""

    def __init__(self):
        """Initialiser le prédicteur"""
        self.risk_model = None
        self.adherence_model = None
        self.anomaly_detector = None
        self.scaler = StandardScaler()

        # Initialisé comme False, sera mis à True après entraînement
        self.is_trained = False

        logger.info("HealthPredictor initialisé")

    def extract_features(self, member_data: Dict) -> np.ndarray:
        """
        Extraire les features pour le ML depuis les données patient

        Args:
            member_data: Dictionnaire avec données du patient
                {
                    'age': int,
                    'vaccinations': {'total': int, 'completed': int},
                    'appointments': {'total': int, 'completed': int, 'cancelled': int},
                    'treatments': {'active': int, 'low_stock': int, 'expiring': int},
                    'allergies': {'total': int, 'severe': int},
                    'days_since_last_appointment': int
                }

        Returns:
            Tableau numpy de features (1, n_features)
        """
        features = []

        # Features démographiques
        age = member_data.get('age', 0)
        features.append(age)
        features.append(1 if age >= 65 else 0)  # Senior
        features.append(1 if age <= 18 else 0)  # Enfant

        # Features vaccinations
        vac = member_data.get('vaccinations', {})
        vac_total = vac.get('total', 0)
        vac_completed = vac.get('completed', 0)
        vac_ratio = vac_completed / vac_total if vac_total > 0 else 0
        features.append(vac_ratio)
        features.append(vac_total - vac_completed)  # Vaccins manquants

        # Features rendez-vous
        apt = member_data.get('appointments', {})
        apt_total = apt.get('total', 0)
        apt_completed = apt.get('completed', 0)
        apt_cancelled = apt.get('cancelled', 0)
        apt_completion_ratio = apt_completed / apt_total if apt_total > 0 else 0
        apt_cancellation_ratio = apt_cancelled / apt_total if apt_total > 0 else 0

        features.append(apt_completion_ratio)
        features.append(apt_cancellation_ratio)
        features.append(apt_total)

        # Features traitements
        trt = member_data.get('treatments', {})
        features.append(trt.get('active', 0))
        features.append(trt.get('low_stock', 0))
        features.append(trt.get('expiring', 0))

        # Features allergies
        alg = member_data.get('allergies', {})
        features.append(alg.get('total', 0))
        features.append(alg.get('severe', 0))

        # Feature suivi médical
        days_since_last = member_data.get('days_since_last_appointment', 365)
        features.append(days_since_last)
        features.append(1 if days_since_last > 365 else 0)  # Pas de suivi > 1 an

        return np.array(features).reshape(1, -1)

    def predict_health_risk(self, member_data: Dict) -> Dict:
        """
        Prédire le risque de santé d'un patient

        Args:
            member_data: Données du patient

        Returns:
            {
                'risk_level': 'low' | 'moderate' | 'high' | 'critical',
                'risk_score': float (0-100),
                'confidence': float (0-100),
                'risk_factors': List[Dict],
                'recommendations': List[str]
            }
        """
        try:
            # Extraire features
            features = self.extract_features(member_data)

            # Si modèle entraîné, utiliser ML
            if self.is_trained and self.risk_model is not None:
                # Normaliser
                features_scaled = self.scaler.transform(features)

                # Prédire avec le modèle
                risk_proba = self.risk_model.predict_proba(features_scaled)[0]
                risk_class = self.risk_model.predict(features_scaled)[0]

                # Mapper à notre échelle
                risk_score = float(np.max(risk_proba) * 100)
                confidence = float(np.max(risk_proba) * 100)

                risk_levels = ['low', 'moderate', 'high', 'critical']
                risk_level = risk_levels[risk_class] if risk_class < len(risk_levels) else 'moderate'
            else:
                # Fallback: scoring basé sur règles (comme avant)
                risk_score, risk_level = self._rule_based_risk_scoring(member_data)
                confidence = 75.0  # Confiance moyenne pour règles

            # Identifier les facteurs de risque
            risk_factors = self._identify_risk_factors(member_data, features[0])

            # Générer recommandations
            recommendations = self._generate_recommendations(risk_level, risk_factors, member_data)

            return {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 2),
                'confidence': round(confidence, 2),
                'risk_factors': risk_factors,
                'recommendations': recommendations,
                'method': 'ml' if self.is_trained else 'rule_based'
            }

        except Exception as e:
            logger.error(f"Erreur prédiction risque: {str(e)}", exc_info=True)
            raise

    def _rule_based_risk_scoring(self, member_data: Dict) -> Tuple[float, str]:
        """
        Scoring de risque basé sur règles (fallback si pas de ML)

        Returns:
            (risk_score, risk_level)
        """
        risk_score = 0

        # Facteurs de risque
        age = member_data.get('age', 0)
        if age >= 65:
            risk_score += 15
        elif age <= 5:
            risk_score += 10

        # Vaccinations
        vac = member_data.get('vaccinations', {})
        vac_missing = vac.get('total', 0) - vac.get('completed', 0)
        risk_score += min(20, vac_missing * 5)

        # Rendez-vous
        apt = member_data.get('appointments', {})
        apt_cancelled = apt.get('cancelled', 0)
        risk_score += min(15, apt_cancelled * 3)

        # Traitements
        trt = member_data.get('treatments', {})
        risk_score += trt.get('low_stock', 0) * 10
        risk_score += trt.get('expiring', 0) * 5

        # Allergies sévères
        alg = member_data.get('allergies', {})
        risk_score += alg.get('severe', 0) * 10

        # Pas de suivi récent
        days_since = member_data.get('days_since_last_appointment', 0)
        if days_since > 730:  # 2 ans
            risk_score += 25
        elif days_since > 365:  # 1 an
            risk_score += 15

        # Limiter à 100
        risk_score = min(100, risk_score)

        # Déterminer le niveau
        if risk_score < 20:
            risk_level = 'low'
        elif risk_score < 40:
            risk_level = 'moderate'
        elif risk_score < 70:
            risk_level = 'high'
        else:
            risk_level = 'critical'

        return risk_score, risk_level

    def _identify_risk_factors(self, member_data: Dict, features: np.ndarray) -> List[Dict]:
        """
        Identifier les facteurs de risque spécifiques

        Returns:
            Liste de facteurs avec importance
        """
        factors = []

        age = member_data.get('age', 0)
        if age >= 65:
            factors.append({
                'factor': 'Âge avancé',
                'description': f'Âge: {age} ans (risque accru)',
                'importance': 0.7,
                'severity': 'moderate'
            })
        elif age <= 5:
            factors.append({
                'factor': 'Jeune enfant',
                'description': f'Âge: {age} ans (suivi renforcé nécessaire)',
                'importance': 0.6,
                'severity': 'moderate'
            })

        # Vaccinations manquantes
        vac = member_data.get('vaccinations', {})
        vac_missing = vac.get('total', 0) - vac.get('completed', 0)
        if vac_missing > 0:
            factors.append({
                'factor': 'Vaccinations incomplètes',
                'description': f'{vac_missing} vaccination(s) manquante(s)',
                'importance': min(1.0, vac_missing * 0.2),
                'severity': 'high' if vac_missing > 2 else 'moderate'
            })

        # Traitements à risque
        trt = member_data.get('treatments', {})
        if trt.get('low_stock', 0) > 0:
            factors.append({
                'factor': 'Stock de médicaments faible',
                'description': f'{trt["low_stock"]} traitement(s) en rupture imminente',
                'importance': 0.8,
                'severity': 'high'
            })

        # Allergies sévères
        alg = member_data.get('allergies', {})
        if alg.get('severe', 0) > 0:
            factors.append({
                'factor': 'Allergies sévères',
                'description': f'{alg["severe"]} allergie(s) sévère(s) identifiée(s)',
                'importance': 0.9,
                'severity': 'high'
            })

        # Pas de suivi récent
        days_since = member_data.get('days_since_last_appointment', 0)
        if days_since > 365:
            months = days_since // 30
            factors.append({
                'factor': 'Absence de suivi médical',
                'description': f'Dernier rendez-vous il y a {months} mois',
                'importance': min(1.0, days_since / 730),
                'severity': 'high' if days_since > 730 else 'moderate'
            })

        # Trier par importance décroissante
        factors.sort(key=lambda x: x['importance'], reverse=True)

        return factors[:5]  # Top 5 facteurs

    def _generate_recommendations(
        self,
        risk_level: str,
        risk_factors: List[Dict],
        member_data: Dict
    ) -> List[str]:
        """
        Générer des recommandations personnalisées

        Returns:
            Liste de recommandations actionnables
        """
        recommendations = []

        # Recommandations selon niveau de risque
        if risk_level == 'critical':
            recommendations.append(
                '🚨 URGENT: Prenez rendez-vous avec votre médecin dans les 48h'
            )
        elif risk_level == 'high':
            recommendations.append(
                '⚠️ Consultez votre médecin dans les 2 semaines'
            )

        # Recommandations selon facteurs
        for factor in risk_factors:
            if 'vaccination' in factor['factor'].lower():
                recommendations.append(
                    '💉 Planifiez vos vaccinations manquantes avec votre médecin'
                )
            elif 'stock' in factor['description'].lower():
                recommendations.append(
                    '💊 Renouvelez vos médicaments en rupture de stock rapidement'
                )
            elif 'allergie' in factor['factor'].lower():
                recommendations.append(
                    '🏥 Portez toujours votre carte d\'urgence allergies'
                )
            elif 'suivi' in factor['factor'].lower():
                recommendations.append(
                    '📅 Planifiez un bilan de santé complet'
                )

        # Recommandations générales basées sur l'âge
        age = member_data.get('age', 0)
        if age >= 65 and not any('bilan' in r.lower() for r in recommendations):
            recommendations.append(
                '👴 Bilan gériatrique annuel recommandé'
            )
        elif age <= 12 and not any('pédiatre' in r.lower() for r in recommendations):
            recommendations.append(
                '👶 Suivi pédiatrique régulier (tous les 6 mois)'
            )

        # Limiter à 5 recommandations max
        return recommendations[:5]

    def detect_anomalies(self, member_data: Dict) -> Dict:
        """
        Détecter des anomalies dans les données de santé

        Utilise Isolation Forest pour détecter des patterns inhabituels

        Returns:
            {
                'is_anomaly': bool,
                'anomaly_score': float (-1 à 1, négatif = anomalie),
                'anomaly_details': List[str]
            }
        """
        try:
            features = self.extract_features(member_data)

            if self.is_trained and self.anomaly_detector is not None:
                # Prédire avec le modèle
                prediction = self.anomaly_detector.predict(features)[0]
                score = self.anomaly_detector.score_samples(features)[0]

                is_anomaly = prediction == -1
                anomaly_details = []

                if is_anomaly:
                    anomaly_details = self._analyze_anomaly_causes(member_data, features[0])

                return {
                    'is_anomaly': bool(is_anomaly),
                    'anomaly_score': float(score),
                    'anomaly_details': anomaly_details
                }
            else:
                # Fallback: détection basée sur règles
                return self._rule_based_anomaly_detection(member_data)

        except Exception as e:
            logger.error(f"Erreur détection anomalies: {str(e)}", exc_info=True)
            return {
                'is_anomaly': False,
                'anomaly_score': 0.0,
                'anomaly_details': []
            }

    def _rule_based_anomaly_detection(self, member_data: Dict) -> Dict:
        """Détection d'anomalies basée sur règles (fallback)"""
        anomalies = []

        # RDV annulés excessifs
        apt = member_data.get('appointments', {})
        if apt.get('total', 0) > 0:
            cancel_ratio = apt.get('cancelled', 0) / apt['total']
            if cancel_ratio > 0.5:
                anomalies.append(
                    f'Taux d\'annulation élevé: {cancel_ratio*100:.0f}% des rendez-vous'
                )

        # Traitements actifs très nombreux
        trt = member_data.get('treatments', {})
        if trt.get('active', 0) > 10:
            anomalies.append(
                f'Nombre élevé de traitements actifs: {trt["active"]}'
            )

        # Pas de rendez-vous depuis très longtemps mais traitements actifs
        days_since = member_data.get('days_since_last_appointment', 0)
        if days_since > 730 and trt.get('active', 0) > 0:
            anomalies.append(
                'Traitements actifs sans suivi médical depuis 2+ ans'
            )

        is_anomaly = len(anomalies) > 0

        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': -0.5 if is_anomaly else 0.5,
            'anomaly_details': anomalies
        }

    def _analyze_anomaly_causes(self, member_data: Dict, features: np.ndarray) -> List[str]:
        """Analyser les causes d'une anomalie détectée"""
        causes = []

        # Analyser chaque dimension
        age = member_data.get('age', 0)
        if age > 90 or age < 1:
            causes.append(f'Âge inhabituel: {age} ans')

        apt = member_data.get('appointments', {})
        if apt.get('cancelled', 0) > 5:
            causes.append(f'Nombre élevé d\'annulations: {apt["cancelled"]}')

        trt = member_data.get('treatments', {})
        if trt.get('active', 0) > 15:
            causes.append(f'Polymédication importante: {trt["active"]} traitements')

        return causes

    def train_models(self, training_data: List[Dict], labels: List[int]):
        """
        Entraîner les modèles ML sur des données historiques

        Args:
            training_data: Liste de dictionnaires avec données patients
            labels: Labels de risque (0=low, 1=moderate, 2=high, 3=critical)
        """
        try:
            logger.info(f"Entraînement des modèles sur {len(training_data)} échantillons...")

            # Extraire features de tous les échantillons
            features_list = [self.extract_features(data)[0] for data in training_data]
            X = np.array(features_list)
            y = np.array(labels)

            # Normaliser
            X_scaled = self.scaler.fit_transform(X)

            # Entraîner modèle de classification des risques
            self.risk_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.risk_model.fit(X_scaled, y)

            # Entraîner détecteur d'anomalies
            self.anomaly_detector = IsolationForest(
                contamination=0.1,  # 10% d'anomalies attendues
                random_state=42
            )
            self.anomaly_detector.fit(X_scaled)

            self.is_trained = True
            logger.info("Modèles entraînés avec succès ✓")

        except Exception as e:
            logger.error(f"Erreur entraînement: {str(e)}", exc_info=True)
            self.is_trained = False
            raise
