// Script pour réinitialiser complètement la base de données
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(app.getPath('userData'), 'carelink.db');

console.log('🗑️  Suppression de la base de données...');
console.log('Chemin:', dbPath);

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Base supprimée avec succès');
} else {
  console.log('⚠️  Aucune base trouvée');
}

app.quit();
