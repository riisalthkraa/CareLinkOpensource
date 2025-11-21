/**
 * Setup Python Backend for Electron
 * ==================================
 *
 * Script Node.js pour copier l'exécutable Python compilé
 * dans le dossier resources de l'app Electron.
 *
 * Usage: node scripts/setup-python-backend.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setup Python Backend pour Electron');
console.log('='.repeat(60));

const ROOT_DIR = path.join(__dirname, '..');
const PYTHON_BACKEND_DIR = path.join(ROOT_DIR, 'python-backend');
const DIST_DIR = path.join(PYTHON_BACKEND_DIR, 'dist');
const RESOURCES_DIR = path.join(ROOT_DIR, 'resources');
const TARGET_DIR = path.join(RESOURCES_DIR, 'python-backend');

// Déterminer le nom de l'exécutable selon la plateforme
const exeName = process.platform === 'win32'
  ? 'carelink-backend.exe'
  : 'carelink-backend';

const sourceExe = path.join(DIST_DIR, exeName);
const targetExe = path.join(TARGET_DIR, exeName);

console.log('\n📁 Vérification des fichiers...');

// Vérifier que l'exécutable source existe
if (!fs.existsSync(sourceExe)) {
  console.error(`\n❌ Exécutable non trouvé: ${sourceExe}`);
  console.error('\n💡 Vous devez d\'abord compiler le backend Python:');
  console.error('   cd python-backend');
  console.error('   pip install pyinstaller');
  console.error('   python build_standalone.py');
  process.exit(1);
}

console.log(`✓ Source trouvée: ${sourceExe}`);

// Créer le dossier resources si nécessaire
if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  console.log(`✓ Créé: ${RESOURCES_DIR}`);
}

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`✓ Créé: ${TARGET_DIR}`);
}

// Copier l'exécutable
console.log('\n📦 Copie de l\'exécutable...');

try {
  fs.copyFileSync(sourceExe, targetExe);

  // Rendre exécutable sur Unix
  if (process.platform !== 'win32') {
    fs.chmodSync(targetExe, 0o755);
  }

  const stats = fs.statSync(targetExe);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  console.log(`✓ Copié vers: ${targetExe}`);
  console.log(`📏 Taille: ${sizeMB} MB`);

} catch (error) {
  console.error(`\n❌ Erreur lors de la copie: ${error.message}`);
  process.exit(1);
}

// Créer un fichier .gitignore dans resources
const gitignorePath = path.join(RESOURCES_DIR, '.gitignore');
const gitignoreContent = `# Backend Python compilé (sera rebuild à chaque build)\npython-backend/\n`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log(`✓ Créé: ${gitignorePath}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ Setup terminé avec succès !');
console.log('='.repeat(60));

console.log('\n📋 Prochaines étapes:');
console.log('1. Le backend Python est prêt dans: resources/python-backend/');
console.log('2. Il sera automatiquement lancé par Electron au démarrage');
console.log('3. Build l\'app: npm run build:electron');
console.log();
