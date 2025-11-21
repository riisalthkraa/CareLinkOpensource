"""
Script de test de l'API OCR
============================

Teste les différents endpoints de l'API pour vérifier le bon fonctionnement.
"""

import requests
import sys
import os
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"


def test_health():
    """Test du endpoint /health"""
    print("\n1️⃣  Test /health")
    print("-" * 50)

    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Serveur: {data['status']}")
            print(f"   Services: {data['services']}")
            return True
        else:
            print(f"❌ Erreur: Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        print("   Vérifiez que le serveur est démarré : python main.py")
        return False
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return False


def test_validate_medication():
    """Test du endpoint /validate-medication"""
    print("\n2️⃣  Test /validate-medication")
    print("-" * 50)

    medications_to_test = [
        ("DOLIPRANE", True),
        ("PARACETAMOL", True),
        ("MEDICAMENT_INEXISTANT", False),
        ("DOLI", False),  # Devrait suggérer DOLIPRANE
    ]

    all_passed = True

    for med_name, should_be_valid in medications_to_test:
        try:
            response = requests.post(
                f"{BASE_URL}/validate-medication",
                json={"nom": med_name}
            )

            if response.status_code == 200:
                data = response.json()
                is_valid = data['is_valid']

                if is_valid == should_be_valid:
                    status = "✅"
                else:
                    status = "⚠️"
                    all_passed = False

                print(f"{status} {med_name}: ", end="")

                if is_valid:
                    print(f"Validé (DCI: {data.get('dci', 'N/A')})")
                else:
                    suggestions = data.get('suggestions', [])
                    if suggestions:
                        print(f"Non validé - Suggestions: {', '.join(suggestions[:3])}")
                    else:
                        print("Non validé - Aucune suggestion")
            else:
                print(f"❌ {med_name}: Erreur HTTP {response.status_code}")
                all_passed = False

        except Exception as e:
            print(f"❌ {med_name}: Erreur - {str(e)}")
            all_passed = False

    return all_passed


def test_ocr_extract():
    """Test du endpoint /ocr/extract avec une image de test"""
    print("\n3️⃣  Test /ocr/extract")
    print("-" * 50)

    # Chercher une image de test
    test_image_path = None
    possible_paths = [
        "test_ordonnance.jpg",
        "test_ordonnance.png",
        "../test_ordonnance.jpg",
        "../assets/test_ordonnance.jpg"
    ]

    for path in possible_paths:
        if os.path.exists(path):
            test_image_path = path
            break

    if not test_image_path:
        print("⚠️  Aucune image de test trouvée")
        print("   Pour tester l'OCR, placez une image nommée 'test_ordonnance.jpg'")
        print("   dans le dossier python-backend/")
        return None

    print(f"📄 Utilisation de l'image: {test_image_path}")

    try:
        with open(test_image_path, 'rb') as f:
            files = {'file': (test_image_path, f, 'image/jpeg')}
            response = requests.post(
                f"{BASE_URL}/ocr/extract",
                files=files
            )

        if response.status_code == 200:
            data = response.json()

            print(f"✅ Extraction réussie")
            print(f"   Qualité: {data['qualite']}")
            print(f"   Confiance: {data['confidence_globale']:.1f}%")
            print(f"   Médicaments trouvés: {len(data['medicaments'])}")

            if data['medecin']:
                print(f"   Médecin: {data['medecin']}")

            if data['date_ordonnance']:
                print(f"   Date: {data['date_ordonnance']}")

            # Afficher les médicaments
            if data['medicaments']:
                print("\n   📋 Médicaments détectés:")
                for i, med in enumerate(data['medicaments'], 1):
                    validated = "✓" if med['is_validated'] else "⚠️"
                    print(f"      {i}. {validated} {med['nom']}")
                    if med.get('dosage'):
                        print(f"         Dosage: {med['dosage']}")
                    if med.get('posologie'):
                        print(f"         Posologie: {med['posologie']}")
                    print(f"         Confiance: {med['confidence']:.1f}%")

            # Afficher les warnings
            if data.get('warnings'):
                print("\n   ⚠️  Avertissements:")
                for warning in data['warnings']:
                    print(f"      - {warning}")

            return True
        else:
            error_detail = response.json().get('detail', 'Erreur inconnue')
            print(f"❌ Erreur: {error_detail}")
            return False

    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return False


def main():
    """Exécuter tous les tests"""
    print("\n" + "=" * 50)
    print("    Tests de l'API CareLink Medical OCR")
    print("=" * 50)

    results = []

    # Test 1: Health check
    results.append(("Health Check", test_health()))

    # Si le serveur ne répond pas, arrêter
    if not results[0][1]:
        print("\n❌ Le serveur ne répond pas. Tests interrompus.")
        sys.exit(1)

    # Test 2: Validation de médicaments
    results.append(("Validation Médicaments", test_validate_medication()))

    # Test 3: OCR Extract
    ocr_result = test_ocr_extract()
    if ocr_result is not None:
        results.append(("OCR Extract", ocr_result))

    # Résumé
    print("\n" + "=" * 50)
    print("    Résumé des Tests")
    print("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nRésultat: {passed}/{total} tests réussis")

    if passed == total:
        print("\n🎉 Tous les tests sont passés avec succès !")
        sys.exit(0)
    else:
        print("\n⚠️  Certains tests ont échoué")
        sys.exit(1)


if __name__ == "__main__":
    main()
