# API IPC Electron

## Vue d'Ensemble

L'API IPC permet la communication entre le renderer (React) et le main process (Electron).

Toutes les méthodes sont accessibles via `window.electronAPI`.

## Base de Données

### dbQuery

Exécute une requête SELECT.

```typescript
const result = await window.electronAPI.dbQuery(sql: string, params?: any[])

// Retour
{
  success: boolean,
  data: any[],      // Résultats
  error?: string    // Message d'erreur si échec
}
```

**Exemple** :
```typescript
const result = await window.electronAPI.dbQuery(
  'SELECT * FROM membres WHERE famille_id = ?',
  [1]
);
if (result.success) {
  console.log(result.data); // [{id: 1, nom: 'Dupont', ...}]
}
```

### dbRun

Exécute une requête INSERT/UPDATE/DELETE.

```typescript
const result = await window.electronAPI.dbRun(sql: string, params?: any[])

// Retour
{
  success: boolean,
  data: { lastInsertRowid: number },
  error?: string
}
```

**Exemple** :
```typescript
const result = await window.electronAPI.dbRun(
  'INSERT INTO membres (famille_id, nom, prenom) VALUES (?, ?, ?)',
  [1, 'Dupont', 'Jean']
);
if (result.success) {
  console.log('ID:', result.data.lastInsertRowid);
}
```

## Authentification

### auth:register

Crée un nouvel utilisateur avec mot de passe hashé.

```typescript
const result = await window.electronAPI.authRegister(username: string, password: string)

// Retour
{
  success: boolean,
  data: { lastInsertRowid: number },
  error?: string
}
```

### auth:login

Vérifie les identifiants de connexion.

```typescript
const result = await window.electronAPI.authLogin(username: string, password: string)

// Retour succès
{
  success: true,
  data: [{ id, username, is_setup_complete, created_at }]
}

// Retour échec
{
  success: false,
  error: 'Utilisateur non trouvé' | 'Mot de passe incorrect'
}
```

### auth:change-password

Change le mot de passe d'un utilisateur.

```typescript
const result = await window.electronAPI.authChangePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
)

// Retour
{ success: boolean, error?: string }
```

## Chiffrement

### encrypt:text

Chiffre un texte avec AES-256.

```typescript
const result = await window.electronAPI.encryptText(plaintext: string)

// Retour
{
  success: boolean,
  data: string  // Texte chiffré format "ENC:iv:ciphertext:tag"
}
```

### decrypt:text

Déchiffre un texte.

```typescript
const result = await window.electronAPI.decryptText(encryptedData: string)

// Retour
{
  success: boolean,
  data: string  // Texte en clair
}
```

## Backups

### backup:create

Crée un backup manuel.

```typescript
const result = await window.electronAPI.backupCreate()

// Retour
{
  success: boolean,
  data: string  // Chemin du backup créé
}
```

### backup:list

Liste tous les backups disponibles.

```typescript
const result = await window.electronAPI.backupList()

// Retour
{
  success: boolean,
  data: Array<{
    filename: string,
    path: string,
    timestamp: number,    // Unix timestamp
    date: string,         // Date formatée
    size: number,         // Taille en bytes
    sizeFormatted: string,
    type: 'manual' | 'auto' | 'close'
  }>
}
```

### backup:restore

Restaure un backup.

```typescript
const result = await window.electronAPI.backupRestore(filename: string)

// Retour
{ success: boolean, error?: string }
```

### backup:delete

Supprime un backup.

```typescript
const result = await window.electronAPI.backupDelete(filename: string)

// Retour
{ success: boolean, error?: string }
```

### backup:status

Obtient le statut des backups.

```typescript
const result = await window.electronAPI.backupStatus()

// Retour
{
  success: boolean,
  data: {
    totalBackups: number,
    totalSize: number,
    totalSizeFormatted: string,
    lastBackup: {...} | null,
    backupFolder: string
  }
}
```

### backup:get-folder

Obtient le chemin du dossier des backups.

```typescript
const result = await window.electronAPI.backupGetFolder()

// Retour
{
  success: boolean,
  data: string  // Chemin absolu
}
```

## Stockage Sécurisé

### secure:save-config

Sauvegarde une clé API de manière sécurisée.

```typescript
const result = await window.electronAPI.secureSaveConfig(key: string, value: string)

// Retour
{ success: boolean, error?: string }
```

### secure:get-config

Récupère une clé API.

```typescript
const result = await window.electronAPI.secureGetConfig(key: string)

// Retour
{
  success: boolean,
  data: string | null
}
```

### secure:delete-config

Supprime une clé API.

```typescript
const result = await window.electronAPI.secureDeleteConfig(key: string)

// Retour
{ success: boolean, error?: string }
```

## Fichiers

### save-document

Sauvegarde un document (ordonnance, etc.).

```typescript
const result = await window.electronAPI.saveDocument(fileName: string, fileData: Buffer)

// Retour
{
  success: boolean,
  filePath: string  // Chemin du fichier sauvegardé
}
```

### save-to-downloads

Sauvegarde dans le dossier Téléchargements.

```typescript
const result = await window.electronAPI.saveToDownloads(
  fileName: string,
  content: string,
  encoding: 'utf8' | 'base64'
)

// Retour
{
  success: boolean,
  filePath: string
}
```

### get-app-path

Obtient le chemin du dossier userData.

```typescript
const path = await window.electronAPI.getAppPath()
// Retour: "C:\Users\xxx\AppData\Roaming\carelink"
```

## Backend Python

### python:backend-status

Vérifie l'état du backend Python.

```typescript
const result = await window.electronAPI.pythonBackendStatus()

// Retour
{
  success: boolean,
  data: {
    running: boolean,
    port: number,
    url: string
  }
}
```

### python:backend-restart

Redémarre le backend Python.

```typescript
const result = await window.electronAPI.pythonBackendRestart()

// Retour
{ success: boolean, message: string }
```

## Claude API

### claude:set-api-key

Configure la clé API Claude.

```typescript
const result = await window.electronAPI.claudeSetApiKey(apiKey: string)

// Retour
{ success: boolean, error?: string }
```

### claude:call-api

Appelle l'API Claude.

```typescript
const result = await window.electronAPI.claudeCallApi({
  systemPrompt: string,
  messages: Array<{ role: string, content: string }>,
  maxTokens?: number,
  temperature?: number
})

// Retour
{
  success: boolean,
  data: { content: string },
  error?: string
}
```
