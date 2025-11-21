# Pages de l'Application

## Vue d'Ensemble

Les pages sont dans `src/pages/`. Chaque page représente une fonctionnalité majeure.

## Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `dashboard` | Tableau de bord principal |
| ProfilMembre | `profil` | Profil détaillé d'un membre |
| Vaccins | `vaccins` | Gestion des vaccinations |
| Traitements | `traitements` | Gestion des médicaments |
| RendezVous | `rendez-vous` | Calendrier des RDV |
| Config | `config` | Paramètres utilisateur |
| CarteUrgence | `carte-urgence` | Génération carte d'urgence |
| ScannerOrdonnance | `scanner` | OCR d'ordonnances |
| Analytics | `analytics` | Analyses de santé |
| DossierMedical | `dossier-medical` | Dossier médical complet |
| ModeUrgence | `mode-urgence` | Mode urgence |
| AssistantSante | `assistant-sante` | Assistant IA CareAI |
| ChatDoctor | `chatdoctor` | Chat avec IA médicale |
| Timeline3D | `timeline3d` | Vue chronologique |
| Backup | `backup` | Gestion des sauvegardes |

---

## Dashboard

**Fichier** : `src/pages/Dashboard.tsx`

Page d'accueil avec vue d'ensemble de la famille.

**Props** :
```typescript
interface DashboardProps {
  onNavigate: (page: Page) => void;
  onSelectMembre: (id: number) => void;
}
```

**Fonctionnalités** :
- Liste des membres de la famille
- Ajout de nouveaux membres
- Statistiques globales
- Prochains rendez-vous
- Alertes actives

---

## ProfilMembre

**Fichier** : `src/pages/ProfilMembre.tsx`

Profil détaillé d'un membre sélectionné.

**Props** :
```typescript
interface ProfilMembreProps {
  membreId: number | null;
  onBack: () => void;
  onNavigate: (page: Page) => void;
}
```

**Fonctionnalités** :
- Informations personnelles
- Photo de profil
- Contacts d'urgence
- Médecin traitant
- Allergies
- Édition du profil

---

## Vaccins

**Fichier** : `src/pages/Vaccins.tsx`

Gestion du carnet de vaccination.

**Props** :
```typescript
interface VaccinsProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Liste des vaccins
- Calendrier vaccinal français
- Statuts : fait, à faire, rappel, expiré
- Ajout/modification de vaccins
- Alertes rappels

---

## Traitements

**Fichier** : `src/pages/Traitements.tsx`

Gestion des médicaments et traitements.

**Props** :
```typescript
interface TraitementsProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Traitements actifs/terminés
- Dosages et fréquences
- Gestion du stock
- Renouvellement ordonnances
- Vérification interactions
- Alertes stock faible

---

## RendezVous

**Fichier** : `src/pages/RendezVous.tsx`

Calendrier des consultations médicales.

**Props** :
```typescript
interface RendezVousProps {
  onBack: () => void;
}
```

**Fonctionnalités** :
- Vue calendrier
- Tous les membres de la famille
- Filtrage par membre/spécialité
- Ajout/modification RDV
- Rappels configurables

---

## Analytics

**Fichier** : `src/pages/Analytics.tsx`

Analyses et statistiques de santé.

**Props** :
```typescript
interface AnalyticsProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Score de santé global
- Tendances RDV
- Adhérence traitements
- Prédiction risques
- Graphiques interactifs

---

## DossierMedical

**Fichier** : `src/pages/DossierMedical.tsx`

Dossier médical complet.

**Props** :
```typescript
interface DossierMedicalProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Sections** :
- Antécédents médicaux
- Diagnostics actifs
- Bilans médicaux
- Consultations spécialisées
- Documents

---

## ChatDoctor

**Fichier** : `src/pages/ChatDoctor.tsx`

Assistant médical conversationnel IA.

**Props** :
```typescript
interface ChatDoctorProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Chat avec Claude/Ollama
- Contexte médical du membre
- Historique conversations
- Analyse symptômes
- Recommandations

---

## ScannerOrdonnance

**Fichier** : `src/pages/ScannerOrdonnance.tsx`

Scanner OCR pour ordonnances.

**Props** :
```typescript
interface ScannerOrdonnanceProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Upload d'image
- Reconnaissance OCR (Tesseract.js / Python)
- Extraction médicaments
- Import automatique traitements

---

## CarteUrgence

**Fichier** : `src/pages/CarteUrgence.tsx`

Génération de carte d'urgence médicale.

**Props** :
```typescript
interface CarteUrgenceProps {
  membreId: number | null;
  onBack: () => void;
}
```

**Fonctionnalités** :
- Informations vitales
- Allergies
- Traitements critiques
- Contacts d'urgence
- QR code
- Export PDF/Image

---

## Backup

**Fichier** : `src/pages/Backup.tsx`

Gestion des sauvegardes.

**Props** :
```typescript
interface BackupProps {
  onBack: () => void;
}
```

**Fonctionnalités** :
- Création backup manuel
- Liste des backups
- Restauration
- Suppression
- Export externe
- Statut backups automatiques

---

## Config

**Fichier** : `src/pages/Config.tsx`

Paramètres de l'application.

**Props** :
```typescript
interface ConfigProps {
  userId: number;
}
```

**Sections** :
- Profil utilisateur
- Changement mot de passe
- Thème (20+ options)
- Configuration IA (Claude/Ollama)
- Backups automatiques
- À propos

---

## Login

**Fichier** : `src/pages/Login.tsx`

Page de connexion/inscription.

**Props** :
```typescript
interface LoginProps {
  onLogin: (userId: number) => void;
}
```

**Fonctionnalités** :
- Connexion existant
- Création compte
- Validation formulaires
- Animation d'entrée
