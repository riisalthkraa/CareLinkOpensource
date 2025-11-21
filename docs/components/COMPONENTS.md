# Composants React

## Vue d'Ensemble

Les composants réutilisables sont dans `src/components/`.

## Layout

### Sidebar

Menu de navigation latéral.

**Fichier** : `src/components/Sidebar.tsx`

```typescript
interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Fonctionnalités** :
- Navigation entre pages
- Affichage nom utilisateur
- Bouton déconnexion
- Responsive (overlay sur mobile)

### TopBar

Barre supérieure avec titre et actions.

**Fichier** : `src/components/TopBar.tsx`

```typescript
interface TopBarProps {
  userName: string;
  currentPage: Page;
  onToggleSidebar: () => void;
}
```

**Fonctionnalités** :
- Titre de la page courante
- Menu hamburger (mobile)
- Infos utilisateur

---

## Feedback

### ToastContainer

Conteneur pour les notifications toast.

**Fichier** : `src/components/ToastContainer.tsx`

**Utilisation** :
```typescript
import { useNotification } from '../contexts/NotificationContext';

const { addNotification } = useNotification();

addNotification({
  type: 'success',  // 'success' | 'error' | 'warning' | 'info'
  title: 'Succès',
  message: 'Action réussie!',
  duration: 4000    // ms
});
```

### Alert

Composant d'alerte inline.

**Fichier** : `src/components/Alert.tsx`

```typescript
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}
```

### ConfirmModal

Modal de confirmation.

**Fichier** : `src/components/ConfirmModal.tsx`

```typescript
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}
```

**Exemple** :
```tsx
<ConfirmModal
  isOpen={showDelete}
  title="Supprimer le membre"
  message="Cette action est irréversible."
  confirmLabel="Supprimer"
  danger={true}
  onConfirm={handleDelete}
  onCancel={() => setShowDelete(false)}
/>
```

---

## Affichage

### StatCard

Carte de statistique.

**Fichier** : `src/components/StatCard.tsx`

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}
```

**Exemple** :
```tsx
<StatCard
  title="Rendez-vous"
  value={5}
  icon="📅"
  color="#4A90E2"
  trend="up"
  subtitle="Ce mois"
/>
```

### SkeletonLoader

Placeholder de chargement.

**Fichier** : `src/components/SkeletonLoader.tsx`

```typescript
interface SkeletonLoaderProps {
  type: 'text' | 'card' | 'avatar' | 'list';
  count?: number;
}
```

### DocumentPreview

Prévisualisation de documents.

**Fichier** : `src/components/DocumentPreview.tsx`

**Fonctionnalités** :
- Affichage images
- Zoom
- Téléchargement

---

## Médical

### InteractionAlert

Affiche les alertes d'interactions médicamenteuses.

**Fichier** : `src/components/InteractionAlert.tsx`

```typescript
interface InteractionAlertProps {
  result: ResultatVerificationInteraction;
  onDismiss: () => void;
}
```

### AIStatusBadge

Badge indiquant le statut de l'IA.

**Fichier** : `src/components/AIStatusBadge.tsx`

```typescript
interface AIStatusBadgeProps {
  provider: 'claude' | 'ollama' | 'python';
  status: 'connected' | 'disconnected' | 'loading';
}
```

### OllamaSetup

Assistant de configuration Ollama.

**Fichier** : `src/components/OllamaSetup.tsx`

**Fonctionnalités** :
- Détection installation
- Configuration URL
- Test de connexion

---

## Utilitaires

### ErrorBoundary

Capture les erreurs React.

**Fichier** : `src/components/ErrorBoundary.tsx`

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}
```

**Utilisation** :
```tsx
<ErrorBoundary fallbackMessage="Une erreur est survenue">
  <MonComposant />
</ErrorBoundary>
```

---

## Contexts

### ThemeContext

Gestion des thèmes de l'application.

**Fichier** : `src/contexts/ThemeContext.tsx`

```typescript
const { theme, setTheme, themes } = useTheme();

// 20+ thèmes disponibles
setTheme('dark');
setTheme('ocean');
setTheme('forest');
```

### NotificationContext

Système de notifications global.

**Fichier** : `src/contexts/NotificationContext.tsx`

```typescript
const { notifications, addNotification, removeNotification } = useNotification();

addNotification({
  type: 'success',
  title: 'Titre',
  message: 'Message',
  duration: 5000
});
```
