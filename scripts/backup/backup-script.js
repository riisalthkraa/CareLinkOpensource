const fs = require('fs');
const path = require('path');

const src = 'C:/Users/RK/Desktop/CareLink';
const dest = 'C:/Users/RK/Desktop/CareLink_Backup_Phase2_2025-11-03';

function copyDir(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  fs.readdirSync(source).forEach(file => {
    const srcPath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(srcPath).isDirectory()) {
      // Skip node_modules, dist, .git
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('🔄 Creation du backup...');
copyDir(src, dest);
console.log('✅ Backup complet cree:', dest);
console.log('📁 Fichiers sauvegardes (sans node_modules, dist, .git)');
