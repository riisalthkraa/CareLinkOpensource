# Sécurité CareLink

## Vue d'Ensemble

CareLink implémente plusieurs couches de sécurité pour protéger les données médicales sensibles.

## Authentification

### Hashage des Mots de Passe

Les mots de passe sont hashés avec **bcrypt** :

```typescript
const BCRYPT_SALT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
```

**Caractéristiques** :
- Salt rounds : 10 (équilibre sécurité/performance)
- Migration automatique des mots de passe legacy (non hashés)
- Comparaison sécurisée avec `bcrypt.compare()`

### Flux d'Authentification

```
1. Utilisateur saisit username/password
2. IPC 'auth:login' envoyé au main process
3. Récupération user en base
4. bcrypt.compare(password, hash)
5. Retour success/error
```

## Chiffrement des Données

### Données Chiffrées (AES-256)

Les champs suivants sont chiffrés :
- `membres.notes` - Notes médicales
- `allergies.nom_allergie` - Descriptions d'allergies
- `traitements.notes` - Notes de traitement
- `traitements.effets_secondaires`
- `vaccins.notes`
- `rendez_vous.notes`

### Format de Stockage

```
ENC:base64(IV):base64(ciphertext):base64(authTag)
```

### Fonctions de Chiffrement

```typescript
// encryption.ts
export function encryptForDB(plaintext: string): string
export function decryptFromDB(encryptedData: string): string
export function migrateToEncrypted(data: string): string
```

## Stockage Sécurisé des Clés API

### Electron safeStorage

Les clés API (Claude, Ollama) sont stockées avec le chiffrement natif de l'OS :

```typescript
// Windows: DPAPI
// macOS: Keychain
// Linux: Secret Service

const encrypted = safeStorage.encryptString(apiKey);
fs.writeFileSync(SECURE_KEYS_FILE, encrypted, { mode: 0o600 });
```

**Fichier** : `%APPDATA%/carelink/secure-keys.dat`

### API IPC

```typescript
// Sauvegarder une clé
await window.electronAPI.secureStorage.save('claude-api-key', apiKey);

// Récupérer une clé
const key = await window.electronAPI.secureStorage.get('claude-api-key');

// Supprimer une clé
await window.electronAPI.secureStorage.delete('claude-api-key');
```

## Isolation des Processus

### Configuration Electron

```typescript
// main.ts
mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // Désactivé
    contextIsolation: true,       // Activé
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### Context Bridge

Seules les méthodes exposées via `contextBridge` sont accessibles :

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  // Autres méthodes sécurisées...
});
```

## Bonnes Pratiques

### 1. Validation des Entrées

```typescript
// Toujours utiliser des paramètres préparés
const result = await window.electronAPI.dbQuery(
  'SELECT * FROM membres WHERE id = ?',
  [memberId]  // Paramètre sécurisé
);
```

### 2. Ne Jamais Logger de Données Sensibles

```typescript
// NON
console.log('Password:', password);

// OUI
console.log('Authentication attempt for:', username);
```

### 3. Clés API

- Ne jamais stocker en clair dans le code
- Utiliser `safeStorage` pour le stockage
- Masquer dans les logs (`***configurée***`)

## Backups Sécurisés

### Compression et Intégrité

```typescript
const archive = archiver('zip', { zlib: { level: 9 } });
archive.file(this.databasePath, { name: 'database.db' });
archive.append(JSON.stringify(metadata), { name: 'metadata.json' });
```

### Rotation Automatique

Les backups de plus de 30 jours sont automatiquement supprimés.

### Backup de Sécurité

Avant restauration, un backup de sécurité de la BD actuelle est créé :

```typescript
const securityBackupPath = path.join(
  this.backupDir,
  `carelink_security_backup_${Date.now()}.db`
);
fs.copyFileSync(this.databasePath, securityBackupPath);
```

## Recommandations Utilisateur

1. **Mot de passe fort** : minimum 8 caractères, mixte
2. **Backups réguliers** : exporter vers stockage externe
3. **Mises à jour** : installer les nouvelles versions
4. **Accès physique** : protéger l'accès à la machine
