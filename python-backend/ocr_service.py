"""
Service OCR Médical - Extraction de texte d'ordonnances
========================================================

Utilise EasyOCR pour une reconnaissance optimale du texte médical français.
Inclut des prétraitements d'image avancés pour améliorer la précision.

Améliorations vs Tesseract.js:
- Meilleure reconnaissance du français médical
- Support des écritures manuscrites
- Prétraitement d'image intelligent
- Scores de confiance précis par mot
"""

import io
import logging
from typing import Dict, List, Tuple
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import cv2

logger = logging.getLogger(__name__)


class MedicalOCRService:
    """Service d'OCR optimisé pour les ordonnances médicales"""

    def __init__(self):
        """Initialiser le service OCR"""
        self.reader = None
        self._initialize_ocr()

    def _initialize_ocr(self):
        """Initialiser EasyOCR avec le modèle français"""
        try:
            import easyocr
            logger.info("Chargement du modèle EasyOCR français...")

            # Initialiser avec français et anglais (beaucoup de termes médicaux en anglais)
            self.reader = easyocr.Reader(
                ['fr', 'en'],
                gpu=False,  # CPU par défaut (GPU si disponible)
                verbose=False
            )
            logger.info("Modèle EasyOCR chargé avec succès ✓")

        except ImportError:
            logger.error("EasyOCR n'est pas installé. Installation requise: pip install easyocr")
            raise
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation d'EasyOCR: {str(e)}")
            raise

    def extract_text(self, image_bytes: bytes) -> Dict:
        """
        Extraire le texte d'une image d'ordonnance

        Args:
            image_bytes: Image en bytes

        Returns:
            Dict contenant:
                - text: Texte extrait
                - confidence: Score de confiance global (0-100)
                - words: Liste des mots avec positions et confiances
        """
        try:
            # Charger l'image
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Image chargée: {image.size[0]}x{image.size[1]} pixels")

            # Prétraiter l'image pour améliorer l'OCR
            processed_image = self._preprocess_image(image)

            # Convertir PIL Image en numpy array pour EasyOCR
            image_array = np.array(processed_image)

            # Exécuter l'OCR
            logger.info("Exécution de l'OCR...")
            results = self.reader.readtext(image_array)

            # Parser les résultats
            text_parts = []
            confidences = []
            words_data = []

            for detection in results:
                bbox, text, confidence = detection
                text_parts.append(text)
                confidences.append(confidence)

                words_data.append({
                    'text': text,
                    'confidence': confidence * 100,  # Convertir en pourcentage
                    'bbox': bbox
                })

            # Combiner le texte
            full_text = '\n'.join(text_parts)

            # Calculer la confiance globale
            avg_confidence = (sum(confidences) / len(confidences) * 100) if confidences else 0

            logger.info(f"OCR terminé: {len(text_parts)} blocs de texte, confiance {avg_confidence:.1f}%")

            return {
                'text': full_text,
                'confidence': round(avg_confidence, 2),
                'words': words_data
            }

        except Exception as e:
            logger.error(f"Erreur lors de l'extraction OCR: {str(e)}", exc_info=True)
            raise

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Prétraiter l'image pour améliorer la qualité de l'OCR

        Améliorations:
        - Redimensionnement optimal
        - Conversion en niveaux de gris
        - Amélioration du contraste
        - Réduction du bruit
        - Binarisation adaptative
        - Correction de l'inclinaison (deskew)

        Args:
            image: Image PIL originale

        Returns:
            Image PIL prétraitée
        """
        try:
            # 1. Redimensionner si nécessaire (optimal: 2000-3000px de large)
            max_width = 2500
            if image.width > max_width:
                ratio = max_width / image.width
                new_size = (max_width, int(image.height * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.debug(f"Image redimensionnée à {new_size}")

            # 2. Convertir en niveaux de gris
            if image.mode != 'L':
                image = image.convert('L')

            # 3. Améliorer le contraste
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)

            # 4. Augmenter la netteté
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.3)

            # 5. Réduire le bruit avec un filtre médian
            image = image.filter(ImageFilter.MedianFilter(size=3))

            # 6. Binarisation adaptative avec OpenCV (meilleur résultat)
            image_array = np.array(image)
            binary = cv2.adaptiveThreshold(
                image_array,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,  # Taille du bloc
                2    # Constante soustraite
            )

            # 7. Correction de l'inclinaison (deskew)
            binary = self._deskew(binary)

            # Convertir retour en PIL Image
            processed_image = Image.fromarray(binary)

            logger.debug("Prétraitement d'image terminé")
            return processed_image

        except Exception as e:
            logger.warning(f"Erreur lors du prétraitement, utilisation de l'image originale: {str(e)}")
            return image

    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """
        Corriger l'inclinaison de l'image

        Args:
            image: Image en numpy array

        Returns:
            Image redressée
        """
        try:
            # Détecter l'angle d'inclinaison
            coords = np.column_stack(np.where(image > 0))
            if len(coords) == 0:
                return image

            angle = cv2.minAreaRect(coords)[-1]

            # Corriger l'angle
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle

            # Rotation seulement si l'angle est significatif
            if abs(angle) > 0.5:
                (h, w) = image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(
                    image,
                    M,
                    (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )
                logger.debug(f"Image redressée de {angle:.2f}°")
                return rotated

            return image

        except Exception as e:
            logger.debug(f"Deskew échoué: {str(e)}")
            return image
