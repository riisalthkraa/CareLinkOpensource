"""
Extracteur NLP Médical - Extraction d'entités médicales
========================================================

Extrait les informations structurées depuis le texte brut d'une ordonnance:
- Médicaments et dosages
- Posologies (fréquence, durée)
- Dates (ordonnance, validité)
- Médecin et patient

Utilise des regex avancées + pattern matching médical français
"""

import re
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MedicalNLPExtractor:
    """Extracteur d'entités médicales depuis texte d'ordonnance"""

    def __init__(self):
        """Initialiser l'extracteur"""
        self._compile_patterns()
        logger.info("Extracteur NLP initialisé")

    def _compile_patterns(self):
        """Compiler les patterns regex pour performance"""

        # Patterns pour dosages
        self.dosage_patterns = [
            re.compile(r'(\d+(?:[.,]\d+)?)\s*(mg|g|ml|µg|UI|%)', re.IGNORECASE),
            re.compile(r'(\d+)\s*comprimés?', re.IGNORECASE),
        ]

        # Patterns pour posologie (fréquence)
        self.posologie_patterns = [
            re.compile(r'(\d+)\s*(?:fois?|x)\s*par\s*jour', re.IGNORECASE),
            re.compile(r'(\d+)\s*(?:comprimés?|gélules?|sachets?)\s*par\s*jour', re.IGNORECASE),
            re.compile(r'matin\s*et\s*soir', re.IGNORECASE),
            re.compile(r'au\s*(?:lever|coucher)', re.IGNORECASE),
            re.compile(r'(?:avant|après|pendant)\s*les?\s*repas?', re.IGNORECASE),
        ]

        # Patterns pour durée de traitement
        self.duree_patterns = [
            re.compile(r'(?:pendant|durant)\s*(\d+)\s*(jours?|semaines?|mois)', re.IGNORECASE),
            re.compile(r'(\d+)\s*(jours?|semaines?|mois)\s*de\s*traitement', re.IGNORECASE),
        ]

        # Patterns pour dates françaises
        self.date_patterns = [
            re.compile(r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})'),  # DD/MM/YYYY
            re.compile(r'(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})', re.IGNORECASE),
        ]

        # Mois français
        self.mois_fr = {
            'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
            'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
            'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
        }

        # Patterns pour médecin
        self.medecin_patterns = [
            re.compile(r'(?:Dr|Docteur|Pr|Professeur)[\s\.]+([\w\s\-]+?)(?:\n|,|$)', re.IGNORECASE),
        ]

        # Indicateurs de noms de médicaments (généralement en majuscules)
        self.medication_indicators = re.compile(r'^[A-Z][A-Z\s\-]+(?:\d+)?$')

    def extract_medical_entities(self, text: str) -> Dict:
        """
        Extraire toutes les entités médicales du texte

        Args:
            text: Texte brut extrait par OCR

        Returns:
            Dict contenant medicaments, dates, medecin, patient
        """
        logger.info("Extraction des entités médicales...")

        # Nettoyer le texte
        text = text.strip()

        # Extraire les différentes entités
        medicaments = self._extract_medications(text)
        date_ordonnance = self._extract_date(text)
        medecin = self._extract_doctor(text)

        # Calculer la date de validité (3 mois en France)
        date_validite = None
        if date_ordonnance:
            try:
                date_obj = datetime.fromisoformat(date_ordonnance)
                date_validite_obj = date_obj + timedelta(days=90)
                date_validite = date_validite_obj.strftime('%Y-%m-%d')
            except:
                pass

        result = {
            'medicaments': medicaments,
            'date_ordonnance': date_ordonnance,
            'date_validite': date_validite,
            'medecin': medecin,
            'patient': None  # TODO: Extraction patient si nécessaire
        }

        logger.info(f"Extraction terminée: {len(medicaments)} médicament(s)")
        return result

    def _extract_medications(self, text: str) -> List[Dict]:
        """
        Extraire les médicaments avec dosages et posologies

        Stratégie:
        1. Identifier les lignes qui ressemblent à des noms de médicaments
        2. Chercher dosage, posologie, durée dans les lignes suivantes
        3. Calculer un score de confiance
        """
        medications = []
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        # Mots-clés médicaux français courants
        medical_keywords = [
            'comprimé', 'gélule', 'sachet', 'ampoule', 'suppositoire',
            'sirop', 'crème', 'pommade', 'solution', 'spray',
            'mg', 'g', 'ml', 'fois', 'par jour'
        ]

        i = 0
        while i < len(lines):
            line = lines[i]

            # Détecter un nom de médicament potentiel
            if self._is_medication_name(line):
                medication = {
                    'nom': line.strip(),
                    'dosage': None,
                    'posologie': None,
                    'duree': None,
                    'confidence': 70.0  # Score de base
                }

                # Extraire dosage directement du nom si présent
                dosage_in_name = self._extract_dosage(line)
                if dosage_in_name:
                    medication['dosage'] = dosage_in_name
                    medication['confidence'] += 10

                # Analyser les 2-3 lignes suivantes pour infos complémentaires
                context_lines = '\n'.join(lines[i:min(i+4, len(lines))])

                # Chercher posologie
                posologie = self._extract_posology(context_lines)
                if posologie:
                    medication['posologie'] = posologie
                    medication['confidence'] += 10

                # Chercher durée
                duree = self._extract_duration(context_lines)
                if duree:
                    medication['duree'] = duree
                    medication['confidence'] += 5

                # Vérifier si la ligne contient des mots-clés médicaux
                if any(keyword in line.lower() for keyword in medical_keywords):
                    medication['confidence'] += 5

                medications.append(medication)

            i += 1

        return medications

    def _is_medication_name(self, line: str) -> bool:
        """
        Déterminer si une ligne ressemble à un nom de médicament

        Critères:
        - Commence par une majuscule
        - Longueur raisonnable (3-50 caractères)
        - Pas un mot commun (Dr, Patient, etc.)
        - Peut contenir des chiffres (pour dosage)
        """
        # Ignorer les lignes trop courtes ou trop longues
        if len(line) < 3 or len(line) > 50:
            return False

        # Ignorer les mots-clés non-médicaments
        excluded_words = [
            'docteur', 'patient', 'ordonnance', 'monsieur', 'madame',
            'date', 'signature', 'cachet', 'note', 'observation'
        ]
        if any(word in line.lower() for word in excluded_words):
            return False

        # Doit commencer par une majuscule ou un chiffre
        if not (line[0].isupper() or line[0].isdigit()):
            return False

        # Si tout en majuscules et sans chiffres, c'est probablement un médicament
        if self.medication_indicators.match(line):
            return True

        # Si contient des dosages typiques, c'est probablement un médicament
        if re.search(r'\d+\s*(?:mg|g|ml|%)', line, re.IGNORECASE):
            return True

        # Par défaut, considérer comme médicament si commence par majuscule
        return line[0].isupper()

    def _extract_dosage(self, text: str) -> Optional[str]:
        """Extraire le dosage (ex: 500 mg, 1 g)"""
        for pattern in self.dosage_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0)
        return None

    def _extract_posology(self, text: str) -> Optional[str]:
        """Extraire la posologie (ex: 2 fois par jour, matin et soir)"""
        for pattern in self.posologie_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0)
        return None

    def _extract_duration(self, text: str) -> Optional[str]:
        """Extraire la durée du traitement (ex: pendant 7 jours)"""
        for pattern in self.duree_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0)
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        """
        Extraire la date de l'ordonnance

        Returns:
            Date au format ISO (YYYY-MM-DD) ou None
        """
        # Pattern numérique: DD/MM/YYYY
        for pattern in self.date_patterns[:1]:
            match = pattern.search(text)
            if match:
                day, month, year = match.groups()
                try:
                    # Valider et formater
                    date_obj = datetime(int(year), int(month), int(day))
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue

        # Pattern textuel: DD mois YYYY
        for pattern in self.date_patterns[1:]:
            match = pattern.search(text)
            if match:
                day, month_name, year = match.groups()
                month = self.mois_fr.get(month_name.lower())
                if month:
                    try:
                        date_obj = datetime(int(year), month, int(day))
                        return date_obj.strftime('%Y-%m-%d')
                    except ValueError:
                        continue

        return None

    def _extract_doctor(self, text: str) -> Optional[str]:
        """Extraire le nom du médecin"""
        for pattern in self.medecin_patterns:
            match = pattern.search(text)
            if match:
                return match.group(1).strip()
        return None
