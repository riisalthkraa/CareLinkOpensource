# 🚀 Guide de Déploiement CareLink

Guide complet pour construire, packager et distribuer CareLink sur Windows, macOS et Linux.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Build de Production](#build-de-production)
3. [Packaging Multi-Plateformes](#packaging-multi-plateformes)
4. [Code Signing](#code-signing)
5. [Distribution](#distribution)
6. [CI/CD](#cicd)
7. [Auto-Update](#auto-update)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

### Pour Tous

- **Node.js** 18+ LTS
- **npm** ou **yarn**
- **Git**
- Compte GitHub (pour releases)

### Par Plateforme

#### Windows
- **Windows 10/11**
- **Visual Studio Build Tools** (pour bcrypt, sharp)
- **WiX Toolset** (optionnel, pour MSI)

#### macOS
- **macOS 10.14+**
- **Xcode Command Line Tools**
- **Apple Developer Account** (pour code signing)

#### Linux
- **Ubuntu 20.04+** ou équivalent
- `rpm-build` (pour RPM)
- `fakeroot` (pour DEB)

---

## 🏗️ Build de Production

### 1. Vérifier l'Application

Avant de build:

```bash
# Tests
npm test

# Vérifier compilation
npm run compile:electron

# Lancer en dev
npm start
```

### 2. Mettre à Jour la Version

```bash
# package.json
{
  "version": "2.0.0"
}
```

### 3. Build React

```bash
npm run build
```

Cela crée le dossier `dist/` avec l'application React optimisée.

**Vérifie:**
- ✅ Minification du code
- ✅ Tree shaking
- ✅ Optimisation des images
- ✅ CSS inline

### 4. Compiler Electron

```bash
npm run compile:electron
```

Compile TypeScript → JavaScript dans `dist/`.

---

## 📦 Packaging Multi-Plateformes

CareLink utilise **electron-builder** pour créer les installateurs.

### Configuration (`package.json`)

```json
{
  "build": {
    "appId": "com.carelink.app",
    "productName": "CareLink",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns",
      "category": "public.app-category.healthcare-fitness"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Utility"
    }
  }
}
```

### Build Windows

Sur Windows ou avec Wine:

```bash
npm run build:electron
```

**Sortie:** `release/CareLink-Setup-2.0.0.exe`

**Formats Windows:**
- **NSIS** (recommandé): Installateur moderne
- **Portable**: Executable sans installation
- **MSI**: Pour entreprises

```bash
# NSIS (par défaut)
npm run build:electron

# Portable
electron-builder --win portable

# MSI
electron-builder --win msi
```

### Build macOS

Sur macOS uniquement:

```bash
npm run build:electron
```

**Sortie:** `release/CareLink-2.0.0.dmg`

**Formats macOS:**
- **DMG**: Image disque (recommandé)
- **PKG**: Package installateur
- **ZIP**: Archive simple

```bash
# DMG (par défaut)
npm run build:electron

# PKG
electron-builder --mac pkg

# ZIP
electron-builder --mac zip
```

### Build Linux

Sur Linux ou avec Docker:

```bash
npm run build:electron
```

**Sortie:**
- `release/CareLink-2.0.0.AppImage`
- `release/carelink_2.0.0_amd64.deb`

**Formats Linux:**
- **AppImage**: Universal (recommandé)
- **DEB**: Debian/Ubuntu
- **RPM**: Fedora/RedHat
- **Snap**: Snapcraft
- **tar.gz**: Archive

```bash
# AppImage + DEB (par défaut)
npm run build:electron

# RPM
electron-builder --linux rpm

# Snap
electron-builder --linux snap

# Tous
electron-builder --linux AppImage deb rpm
```

---

## 🔐 Code Signing

⚠️ **Obligatoire pour distribution publique**

### Windows

**Besoin:**
- Certificat Code Signing (EV ou OV)
- De Sectigo, DigiCert, GlobalSign...

#### Obtenir un Certificat

1. Acheter certificat EV (~300€/an)
2. Validation identité (2-7 jours)
3. Recevoir token USB ou fichier .pfx

#### Configuration

```json
// package.json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "STRONG_PASSWORD",
      "signingHashAlgorithms": ["sha256"],
      "rfc3161TimeStampServer": "http://timestamp.sectigo.com"
    }
  }
}
```

**Variables d'environnement:**

```bash
# .env (NE PAS COMMIT)
WIN_CSC_LINK=path/to/cert.pfx
WIN_CSC_KEY_PASSWORD=your_password
```

#### Signer

```bash
electron-builder --win --publish never
```

### macOS

**Besoin:**
- Apple Developer Account (99$/an)
- Developer ID Application Certificate

#### Obtenir un Certificat

1. S'inscrire sur [developer.apple.com](https://developer.apple.com)
2. Générer CSR depuis Keychain Access
3. Créer certificat Developer ID Application
4. Télécharger et installer dans Keychain

#### Configuration

```json
// package.json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (XXXXXXXXXX)",
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "gatekeeperAssess": false
    }
  }
}
```

#### Entitlements (`build/entitlements.mac.plist`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

#### Signer et Notariser

```bash
# Signer
electron-builder --mac

# Notariser (automatique si configuré)
# Nécessite Apple ID et mot de passe app-specific
```

**Configuration Notarization:**

```json
{
  "build": {
    "mac": {
      "notarize": {
        "teamId": "XXXXXXXXXX"
      }
    }
  }
}
```

```bash
# .env
APPLE_ID=your@email.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Linux

Pas de code signing requis pour Linux.

---

## 📤 Distribution

### 1. GitHub Releases

#### Création Manuelle

1. Build tous les installateurs
2. Aller sur GitHub → Releases → New Release
3. Tag: `v2.0.0`
4. Title: `CareLink v2.0.0`
5. Upload tous les installateurs
6. Publish release

#### Automatique avec Scripts

```bash
# scripts/release.sh
#!/bin/bash

VERSION="2.0.0"

echo "Building all platforms..."
npm run build:electron

echo "Creating GitHub release..."
gh release create v$VERSION \
  --title "CareLink v$VERSION" \
  --notes "See CHANGELOG.md for details" \
  release/CareLink-Setup-$VERSION.exe \
  release/CareLink-$VERSION.dmg \
  release/CareLink-$VERSION.AppImage \
  release/carelink_${VERSION}_amd64.deb

echo "✅ Release published!"
```

### 2. Site Web

Créer une page de téléchargement:

```html
<!-- download.html -->
<div class="download-section">
  <h2>Télécharger CareLink v2.0.0</h2>

  <a href="releases/CareLink-Setup-2.0.0.exe" class="btn-windows">
    🪟 Windows (64-bit)
  </a>

  <a href="releases/CareLink-2.0.0.dmg" class="btn-mac">
    🍎 macOS (Intel & Apple Silicon)
  </a>

  <a href="releases/CareLink-2.0.0.AppImage" class="btn-linux">
    🐧 Linux (AppImage)
  </a>

  <a href="releases/carelink_2.0.0_amd64.deb" class="btn-linux">
    📦 Linux (DEB)
  </a>
</div>
```

### 3. Package Managers

#### Homebrew (macOS)

Créer un tap:

```ruby
# Formula/carelink.rb
class Carelink < Formula
  desc "Gestion de Santé Familiale"
  homepage "https://carelink.app"
  url "https://github.com/user/carelink/releases/download/v2.0.0/CareLink-2.0.0.dmg"
  sha256 "..."
  version "2.0.0"

  def install
    prefix.install "CareLink.app"
  end
end
```

#### Chocolatey (Windows)

```xml
<!-- carelink.nuspec -->
<?xml version="1.0"?>
<package>
  <metadata>
    <id>carelink</id>
    <version>2.0.0</version>
    <title>CareLink</title>
    <authors>VIEY David</authors>
    <description>Gestion de Santé Familiale</description>
  </metadata>
</package>
```

#### Snapcraft (Linux)

```yaml
# snap/snapcraft.yaml
name: carelink
version: '2.0.0'
summary: Gestion de Santé Familiale
description: Application desktop complète pour gérer la santé familiale
```

---

## 🔄 CI/CD

### GitHub Actions

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build:electron

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/*

      - name: Create Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: release/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Secrets à Configurer

GitHub Settings → Secrets → Actions:

- `WIN_CSC_LINK`: Certificat Windows (base64)
- `WIN_CSC_KEY_PASSWORD`: Mot de passe
- `APPLE_ID`: Apple ID
- `APPLE_APP_SPECIFIC_PASSWORD`: Mot de passe app
- `APPLE_TEAM_ID`: Team ID Apple

---

## 🔄 Auto-Update

### Configuration

```typescript
// electron/main.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // Notifier l'utilisateur
});

autoUpdater.on('update-downloaded', () => {
  // Proposer de redémarrer
});
```

### Serveur de Mise à Jour

**Option 1: GitHub Releases** (Gratuit)

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "carelink"
  }
}
```

**Option 2: Serveur Custom**

```json
{
  "publish": {
    "provider": "generic",
    "url": "https://updates.carelink.app"
  }
}
```

Structure serveur:

```
updates.carelink.app/
├── latest.yml           # Windows
├── latest-mac.yml       # macOS
├── latest-linux.yml     # Linux
├── CareLink-Setup-2.0.0.exe
├── CareLink-2.0.0.dmg
└── CareLink-2.0.0.AppImage
```

---

## 🐛 Troubleshooting

### Build Fails

**Problème**: `electron-builder` échoue

**Solutions:**
```bash
# Nettoyer
npm run clean
rm -rf node_modules package-lock.json
npm install

# Rebuild natives
npm rebuild
```

### Code Signing Fails (Windows)

**Problème**: "Certificate not found"

**Solutions:**
- Vérifier le chemin du certificat
- Vérifier le mot de passe
- Utiliser variables d'environnement

### Notarization Fails (macOS)

**Problème**: Apple rejette l'app

**Solutions:**
- Vérifier entitlements
- Vérifier Hardened Runtime
- Vérifier Apple ID et mot de passe
- Attendre (peut prendre 5-30 min)

### Large Bundle Size

**Problème**: Installateur trop gros

**Solutions:**
```json
{
  "build": {
    "asar": true,
    "compression": "maximum",
    "files": [
      "!**/node_modules/**/*",
      "dist/**/*"
    ]
  }
}
```

---

## 📊 Checklist de Release

- [ ] Tests passent (npm test)
- [ ] Version mise à jour (package.json)
- [ ] CHANGELOG mis à jour
- [ ] Build local testé
- [ ] Certificats valides
- [ ] Builds Windows/Mac/Linux OK
- [ ] Installateurs testés manuellement
- [ ] GitHub Release créé
- [ ] Site web mis à jour
- [ ] Annonce utilisateurs
- [ ] Monitoring activé

---

## 📚 Ressources

- [electron-builder Docs](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Auto-Update](https://www.electron.build/auto-update)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Mainteneur**: VIEY David
**License**: MIT
**Version**: 2.0.0

**Bon déploiement! 🚀**
