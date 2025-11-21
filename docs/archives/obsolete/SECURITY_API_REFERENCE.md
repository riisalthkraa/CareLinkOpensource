# CareLink Security API Reference

Quick reference guide for using the new security features in CareLink.

---

## Authentication API (Bcrypt)

### Register New User
```typescript
const result = await window.electronAPI.authRegister(username, password);

if (result.success) {
  const userId = result.data.lastInsertRowid;
  console.log('User created with ID:', userId);
} else {
  console.error('Registration failed:', result.error);
}
```

### Login User
```typescript
const result = await window.electronAPI.authLogin(username, password);

if (result.success && result.data.length > 0) {
  const user = result.data[0];
  console.log('Login successful:', user);
} else {
  console.error('Login failed:', result.error);
}
```

### Change Password
```typescript
const result = await window.electronAPI.authChangePassword(
  userId,
  oldPassword,
  newPassword
);

if (result.success) {
  console.log('Password changed successfully');
} else {
  console.error('Password change failed:', result.error);
}
```

---

## Encryption API (AES-256-GCM)

### Encrypt Sensitive Text
```typescript
// For storing in database
const encrypted = encryptForDB("Sensitive medical note");
await window.electronAPI.dbRun(
  'UPDATE membres SET notes = ? WHERE id = ?',
  [encrypted, memberId]
);
```

### Decrypt Retrieved Data
```typescript
// When reading from database
const result = await window.electronAPI.dbQuery(
  'SELECT notes FROM membres WHERE id = ?',
  [memberId]
);

const plaintext = decryptFromDB(result.data[0].notes);
console.log('Decrypted note:', plaintext);
```

### Manual Encryption (via IPC)
```typescript
// Encrypt via IPC
const encrypted = await window.electronAPI.encryptText("Test data");
console.log('Encrypted:', encrypted.data);

// Decrypt via IPC
const decrypted = await window.electronAPI.decryptText(encrypted.data);
console.log('Decrypted:', decrypted.data);
```

---

## Backup API

### Create Manual Backup
```typescript
const result = await window.electronAPI.backupCreate();

if (result.success) {
  console.log('Backup created:', result.fileName);
  console.log('Location:', result.filePath);
} else {
  console.error('Backup failed:', result.error);
}
```

### List All Backups
```typescript
const result = await window.electronAPI.backupList();

if (result.success) {
  result.data.forEach(backup => {
    console.log(`${backup.fileName} - ${backup.date} (${backup.size} bytes)`);
  });
}
```

### Get Backup Status
```typescript
const result = await window.electronAPI.backupStatus();

if (result.success) {
  console.log('Last backup:', result.data.lastBackupDate);
  console.log('Total backups:', result.data.totalBackups);
  console.log('Backup folder:', result.data.backupsFolder);
}
```

### Restore Backup
```typescript
const result = await window.electronAPI.backupRestore('carelink_backup_2025-01-15_10-30-00.db');

if (result.success) {
  console.log('Backup restored from:', result.restoredFrom);
  console.log('Please restart the application');
} else {
  console.error('Restore failed:', result.error);
}
```

### Delete Backup
```typescript
const result = await window.electronAPI.backupDelete('carelink_backup_2025-01-15_10-30-00.db');

if (result.success) {
  console.log('Backup deleted successfully');
}
```

### Get Backup Folder Path
```typescript
const result = await window.electronAPI.backupGetFolder();

if (result.success) {
  console.log('Backups stored in:', result.data);
}
```

---

## Best Practices

### Password Handling
- Never log passwords to console
- Always use `authRegister` and `authLogin` handlers
- Validate password strength on frontend before submission
- Show password strength indicator to users

### Encryption
- Encrypt sensitive medical data before storing
- Use `encryptForDB()` and `decryptFromDB()` for seamless handling
- Sensitive fields to encrypt:
  - Medical notes
  - Allergy descriptions
  - Treatment notes
  - Side effects
  - Personal health information

### Backups
- Encourage users to create manual backups before major changes
- Display last backup date in UI
- Provide easy access to backup folder
- Warn users before restoration (data will be replaced)
- Automatic backups run every 24 hours (no user action needed)

---

## Error Handling

### Authentication Errors
```typescript
try {
  const result = await window.electronAPI.authLogin(username, password);
  if (!result.success) {
    // Handle specific errors
    if (result.error.includes('Utilisateur non trouvé')) {
      // User doesn't exist
    } else if (result.error.includes('Mot de passe incorrect')) {
      // Wrong password
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Encryption Errors
```typescript
try {
  const encrypted = await window.electronAPI.encryptText(data);
  if (!encrypted.success) {
    console.error('Encryption failed:', encrypted.error);
    // Handle encryption failure (may indicate key issue)
  }
} catch (error) {
  console.error('Unexpected encryption error:', error);
}
```

### Backup Errors
```typescript
try {
  const result = await window.electronAPI.backupCreate();
  if (!result.success) {
    if (result.error.includes('Database file not found')) {
      // Database doesn't exist yet
    } else if (result.error.includes('empty')) {
      // Backup file is corrupt/empty
    }
  }
} catch (error) {
  console.error('Unexpected backup error:', error);
}
```

---

## TypeScript Type Definitions

All API methods are fully typed. Here are the key interfaces:

```typescript
interface Window {
  electronAPI: {
    // Authentication
    authRegister: (username: string, password: string) =>
      Promise<{ success: boolean; data?: any; error?: string }>;
    authLogin: (username: string, password: string) =>
      Promise<{ success: boolean; data?: any; error?: string }>;
    authChangePassword: (userId: number, oldPassword: string, newPassword: string) =>
      Promise<{ success: boolean; error?: string }>;

    // Encryption
    encryptText: (plaintext: string) =>
      Promise<{ success: boolean; data?: string; error?: string }>;
    decryptText: (encryptedData: string) =>
      Promise<{ success: boolean; data?: string; error?: string }>;

    // Backup
    backupCreate: () =>
      Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }>;
    backupList: () =>
      Promise<{ success: boolean; data?: any[]; error?: string }>;
    backupStatus: () =>
      Promise<{ success: boolean; data?: any; error?: string }>;
    backupRestore: (backupFileName: string) =>
      Promise<{ success: boolean; error?: string; restoredFrom?: string }>;
    backupDelete: (backupFileName: string) =>
      Promise<{ success: boolean; error?: string }>;
    backupGetFolder: () =>
      Promise<{ success: boolean; data?: string; error?: string }>;
  };
}
```

---

## Security Checklist for Developers

When implementing features:

- [ ] Use `authRegister` for user creation (not direct DB insert)
- [ ] Use `authLogin` for authentication (not direct password comparison)
- [ ] Encrypt sensitive fields before DB storage using `encryptForDB()`
- [ ] Decrypt data when retrieving using `decryptFromDB()`
- [ ] Handle both encrypted and plain-text data (backward compatibility)
- [ ] Never log sensitive data (passwords, medical notes) to console
- [ ] Test with backup/restore to ensure data integrity
- [ ] Validate user input before passing to security APIs
- [ ] Handle errors gracefully (don't expose system details to users)
- [ ] Use TypeScript types for compile-time safety

---

## Migration Guide for Existing Code

### Old Authentication Code:
```typescript
// OLD - DON'T USE
const result = await window.electronAPI.dbRun(
  'INSERT INTO users (username, password) VALUES (?, ?)',
  [username, password]
);
```

### New Authentication Code:
```typescript
// NEW - USE THIS
const result = await window.electronAPI.authRegister(username, password);
```

### Old Login Code:
```typescript
// OLD - DON'T USE
const result = await window.electronAPI.dbQuery(
  'SELECT * FROM users WHERE username = ? AND password = ?',
  [username, password]
);
```

### New Login Code:
```typescript
// NEW - USE THIS
const result = await window.electronAPI.authLogin(username, password);
```

---

## Testing Your Implementation

### Test Password Hashing:
```typescript
// Create user
await window.electronAPI.authRegister('testuser', 'testpass123');

// Check database - password should start with $2b$
const users = await window.electronAPI.dbQuery('SELECT * FROM users');
console.log('Hashed password:', users.data[0].password);
// Should output: $2b$10$...
```

### Test Encryption:
```typescript
// Encrypt data
const encrypted = await window.electronAPI.encryptText('Secret note');
console.log('Encrypted:', encrypted.data);
// Should be JSON: {"encrypted":"...","iv":"...","authTag":"..."}

// Decrypt data
const decrypted = await window.electronAPI.decryptText(encrypted.data);
console.log('Decrypted:', decrypted.data);
// Should output: Secret note
```

### Test Backup:
```typescript
// Create backup
const backup = await window.electronAPI.backupCreate();
console.log('Backup created:', backup.fileName);

// List backups
const backups = await window.electronAPI.backupList();
console.log('Total backups:', backups.data.length);

// Get status
const status = await window.electronAPI.backupStatus();
console.log('Last backup:', status.data.lastBackupDate);
```

---

**Version:** 1.0
**Last Updated:** 2025-10-31
