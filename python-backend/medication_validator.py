"""
Validateur de Médicaments - Base de données française
======================================================

Valide les noms de médicaments extraits par OCR en les comparant
à une base de données de médicaments français.

Fonctionnalités:
- Validation exacte et fuzzy matching
- Suggestions de corrections
- Normalisation des noms
- DCI (Dénomination Commune Internationale)

Base de données: Médicaments français les plus courants (extensible)
"""

import logging
from typing import Dict, List, Optional
from difflib import get_close_matches
import json
import os

logger = logging.getLogger(__name__)


class MedicationValidator:
    """Validateur de médicaments avec base française"""

    def __init__(self):
        """Initialiser le validateur avec la base de médicaments"""
        self.medications_db = {}
        self.medications_lower = {}  # Pour recherche insensible à la casse
        self._load_medications_database()

    def _load_medications_database(self):
        """
        Charger la base de données de médicaments

        Pour l'instant: base statique des médicaments les plus courants
        TODO: Intégrer base officielle (Vidal, CIS, etc.)
        """
        logger.info("Chargement de la base de médicaments...")

        # Base de données des médicaments français les plus courants
        # Format: {"NOM_COMMERCIAL": {"dci": "substance active", "forme": "comprimé"}}
        self.medications_db = {
            # Antalgiques / Anti-inflammatoires
            "DOLIPRANE": {"dci": "paracétamol", "forme": "comprimé"},
            "PARACETAMOL": {"dci": "paracétamol", "forme": "comprimé"},
            "EFFERALGAN": {"dci": "paracétamol", "forme": "comprimé effervescent"},
            "DAFALGAN": {"dci": "paracétamol", "forme": "comprimé"},
            "IBUPROFENE": {"dci": "ibuprofène", "forme": "comprimé"},
            "ADVIL": {"dci": "ibuprofène", "forme": "comprimé"},
            "NUROFEN": {"dci": "ibuprofène", "forme": "comprimé"},
            "SPIFEN": {"dci": "ibuprofène", "forme": "comprimé"},
            "ASPIRINE": {"dci": "acide acétylsalicylique", "forme": "comprimé"},
            "KARDEGIC": {"dci": "acide acétylsalicylique", "forme": "sachet"},
            "VOLTARENE": {"dci": "diclofénac", "forme": "comprimé"},
            "KETOPROFENE": {"dci": "kétoprofène", "forme": "comprimé"},
            "TRAMADOL": {"dci": "tramadol", "forme": "comprimé"},
            "CODEINE": {"dci": "codéine", "forme": "comprimé"},

            # Antibiotiques
            "AMOXICILLINE": {"dci": "amoxicilline", "forme": "gélule"},
            "AUGMENTIN": {"dci": "amoxicilline + acide clavulanique", "forme": "comprimé"},
            "CLAMOXYL": {"dci": "amoxicilline", "forme": "gélule"},
            "AZITHROMYCINE": {"dci": "azithromycine", "forme": "comprimé"},
            "ZITHROMAX": {"dci": "azithromycine", "forme": "comprimé"},
            "CIPROFLOXACINE": {"dci": "ciprofloxacine", "forme": "comprimé"},
            "OFLOXACINE": {"dci": "ofloxacine", "forme": "comprimé"},

            # Cardiovasculaires
            "AMLODIPINE": {"dci": "amlodipine", "forme": "comprimé"},
            "ATENOLOL": {"dci": "aténolol", "forme": "comprimé"},
            "BISOPROLOL": {"dci": "bisoprolol", "forme": "comprimé"},
            "RAMIPRIL": {"dci": "ramipril", "forme": "comprimé"},
            "ENALAPRIL": {"dci": "énalapril", "forme": "comprimé"},
            "LISINOPRIL": {"dci": "lisinopril", "forme": "comprimé"},
            "ATORVASTATINE": {"dci": "atorvastatine", "forme": "comprimé"},
            "SIMVASTATINE": {"dci": "simvastatine", "forme": "comprimé"},
            "TAHOR": {"dci": "atorvastatine", "forme": "comprimé"},
            "CRESTOR": {"dci": "rosuvastatine", "forme": "comprimé"},
            "PLAVIX": {"dci": "clopidogrel", "forme": "comprimé"},
            "PREVISCAN": {"dci": "fluindione", "forme": "comprimé"},
            "COUMADINE": {"dci": "warfarine", "forme": "comprimé"},

            # Diabète
            "METFORMINE": {"dci": "metformine", "forme": "comprimé"},
            "GLUCOPHAGE": {"dci": "metformine", "forme": "comprimé"},
            "DIAMICRON": {"dci": "gliclazide", "forme": "comprimé"},
            "LANTUS": {"dci": "insuline glargine", "forme": "injectable"},
            "NOVORAPID": {"dci": "insuline aspart", "forme": "injectable"},

            # Gastro-intestinal
            "OMEPRAZOLE": {"dci": "oméprazole", "forme": "gélule"},
            "MOPRAL": {"dci": "oméprazole", "forme": "gélule"},
            "INEXIUM": {"dci": "ésoméprazole", "forme": "comprimé"},
            "ESOMEPRAZOLE": {"dci": "ésoméprazole", "forme": "comprimé"},
            "GAVISCON": {"dci": "alginate de sodium", "forme": "suspension buvable"},
            "SMECTA": {"dci": "diosmectite", "forme": "sachet"},
            "IMODIUM": {"dci": "lopéramide", "forme": "gélule"},
            "MOTILIUM": {"dci": "dompéridone", "forme": "comprimé"},
            "SPASFON": {"dci": "phloroglucinol", "forme": "comprimé"},

            # Antihistaminiques / Allergies
            "CETIRIZINE": {"dci": "cétirizine", "forme": "comprimé"},
            "ZYRTEC": {"dci": "cétirizine", "forme": "comprimé"},
            "AERIUS": {"dci": "desloratadine", "forme": "comprimé"},
            "CLARITYNE": {"dci": "loratadine", "forme": "comprimé"},
            "LORATADINE": {"dci": "loratadine", "forme": "comprimé"},
            "POLARAMINE": {"dci": "dexchlorphéniramine", "forme": "comprimé"},

            # Respiratoire
            "VENTOLINE": {"dci": "salbutamol", "forme": "aérosol"},
            "SALBUTAMOL": {"dci": "salbutamol", "forme": "aérosol"},
            "SERETIDE": {"dci": "salmétérol + fluticasone", "forme": "aérosol"},
            "SYMBICORT": {"dci": "budésonide + formotérol", "forme": "aérosol"},
            "TOPLEXIL": {"dci": "oxomémazine", "forme": "sirop"},
            "HEXAPNEUMINE": {"dci": "hélicidine", "forme": "sirop"},

            # Psychiatrie / Neurologie
            "SEROPLEX": {"dci": "escitalopram", "forme": "comprimé"},
            "DEROXAT": {"dci": "paroxétine", "forme": "comprimé"},
            "PROZAC": {"dci": "fluoxétine", "forme": "gélule"},
            "XANAX": {"dci": "alprazolam", "forme": "comprimé"},
            "ALPRAZOLAM": {"dci": "alprazolam", "forme": "comprimé"},
            "LEXOMIL": {"dci": "bromazépam", "forme": "comprimé"},
            "TEMESTA": {"dci": "lorazépam", "forme": "comprimé"},
            "STILNOX": {"dci": "zolpidem", "forme": "comprimé"},
            "LYRICA": {"dci": "prégabaline", "forme": "gélule"},
            "NEURONTIN": {"dci": "gabapentine", "forme": "gélule"},

            # Vitamines / Compléments
            "TARDYFERON": {"dci": "fer", "forme": "comprimé"},
            "SPECIAFOLDINE": {"dci": "acide folique", "forme": "comprimé"},
            "UVESTEROL": {"dci": "vitamine D", "forme": "gouttes"},
            "ZYMAD": {"dci": "vitamine D", "forme": "gouttes"},
            "MAGNESIUM": {"dci": "magnésium", "forme": "comprimé"},
            "CALCIUM": {"dci": "calcium", "forme": "comprimé"},

            # Dermatologie
            "DIPROSONE": {"dci": "bétaméthasone", "forme": "crème"},
            "DAIVOBET": {"dci": "calcipotriol + bétaméthasone", "forme": "gel"},
            "CUTACNYL": {"dci": "peroxyde de benzoyle", "forme": "gel"},
            "DIFFERINE": {"dci": "adapalène", "forme": "gel"},

            # Ophtalmologie
            "MAXIDEX": {"dci": "dexaméthasone", "forme": "collyre"},
            "AZYTER": {"dci": "azithromycine", "forme": "collyre"},
            "TOBREX": {"dci": "tobramycine", "forme": "collyre"},

            # Autres
            "LEVOTHYROX": {"dci": "lévothyroxine", "forme": "comprimé"},
            "L-THYROXINE": {"dci": "lévothyroxine", "forme": "comprimé"},
            "COLCHICINE": {"dci": "colchicine", "forme": "comprimé"},
            "ALLOPURINOL": {"dci": "allopurinol", "forme": "comprimé"},
        }

        # Créer un index en minuscules pour recherche insensible à la casse
        self.medications_lower = {
            name.lower(): {"original_name": name, **data}
            for name, data in self.medications_db.items()
        }

        logger.info(f"Base de médicaments chargée: {len(self.medications_db)} médicaments")

    def validate_medication(self, medication_name: str) -> Dict:
        """
        Valider un nom de médicament

        Args:
            medication_name: Nom du médicament à valider

        Returns:
            Dict contenant:
                - is_valid: True si trouvé dans la base
                - nom_corrige: Nom normalisé si trouvé
                - suggestions: Liste de suggestions si pas trouvé
                - dci: Substance active si disponible
        """
        if not medication_name or len(medication_name) < 2:
            return {
                'is_valid': False,
                'nom_corrige': None,
                'suggestions': [],
                'dci': None
            }

        # Nettoyer le nom
        cleaned_name = medication_name.strip().upper()

        # 1. Recherche exacte
        if cleaned_name in self.medications_db:
            return {
                'is_valid': True,
                'nom_corrige': cleaned_name,
                'suggestions': [],
                'dci': self.medications_db[cleaned_name].get('dci')
            }

        # 2. Recherche insensible à la casse
        lower_name = cleaned_name.lower()
        if lower_name in self.medications_lower:
            original = self.medications_lower[lower_name]['original_name']
            return {
                'is_valid': True,
                'nom_corrige': original,
                'suggestions': [],
                'dci': self.medications_lower[lower_name].get('dci')
            }

        # 3. Recherche fuzzy (similarité)
        suggestions = self._find_similar_medications(cleaned_name)

        return {
            'is_valid': False,
            'nom_corrige': suggestions[0] if suggestions else None,
            'suggestions': suggestions[:5],  # Top 5 suggestions
            'dci': None
        }

    def _find_similar_medications(self, medication_name: str, cutoff: float = 0.6) -> List[str]:
        """
        Trouver des médicaments similaires (fuzzy matching)

        Args:
            medication_name: Nom à rechercher
            cutoff: Seuil de similarité (0-1)

        Returns:
            Liste de suggestions ordonnée par similarité
        """
        all_names = list(self.medications_db.keys())

        # Utiliser difflib pour trouver les correspondances proches
        matches = get_close_matches(
            medication_name.upper(),
            all_names,
            n=10,  # Nombre max de résultats
            cutoff=cutoff  # Seuil de similarité
        )

        return matches

    def add_medication(self, name: str, dci: str = None, forme: str = None):
        """
        Ajouter un médicament à la base (pour extension future)

        Args:
            name: Nom commercial
            dci: Substance active
            forme: Forme galénique
        """
        name_upper = name.upper()
        self.medications_db[name_upper] = {
            'dci': dci,
            'forme': forme
        }
        self.medications_lower[name_upper.lower()] = {
            'original_name': name_upper,
            'dci': dci,
            'forme': forme
        }
        logger.info(f"Médicament ajouté: {name_upper}")

    def get_medication_info(self, name: str) -> Optional[Dict]:
        """
        Obtenir les informations d'un médicament

        Args:
            name: Nom du médicament

        Returns:
            Dict avec DCI et forme, ou None si non trouvé
        """
        name_upper = name.upper()
        if name_upper in self.medications_db:
            return self.medications_db[name_upper]

        name_lower = name.lower()
        if name_lower in self.medications_lower:
            return {
                'dci': self.medications_lower[name_lower].get('dci'),
                'forme': self.medications_lower[name_lower].get('forme')
            }

        return None
