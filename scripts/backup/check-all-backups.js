const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const backupsDir = 'C:\\Users\\RK\\AppData\\Roaming\\Electron\\backups';
const backupFiles = [
  'carelink_backup_2025-11-03_18-28-38.db',
  'carelink_backup_2025-11-03_06-58-27.db',
  'carelink_backup_2025-11-02_17-00-25.db',
  'carelink_backup_2025-11-02_15-52-30.db',
  'carelink_backup_2025-11-02_15-17-12.db'
];

async function checkAllBackups() {
  const SQL = await initSqlJs();

  for (const file of backupFiles) {
    const backupPath = path.join(backupsDir, file);

    if (!fs.existsSync(backupPath)) {
      console.log(`❌ ${file} - n'existe pas\n`);
      continue;
    }

    console.log(`\n📦 ${file}`);
    console.log('='.repeat(60));

    const buffer = fs.readFileSync(backupPath);
    const db = new SQL.Database(buffer);

    const antecedents = db.exec('SELECT COUNT(*) as count FROM antecedents_medicaux');
    const diagnostics = db.exec('SELECT COUNT(*) as count FROM diagnostics');
    const bilans = db.exec('SELECT COUNT(*) as count FROM bilans_medicaux');
    const consultations = db.exec('SELECT COUNT(*) as count FROM consultations_specialisees');

    console.log(`  Antécédents: ${antecedents[0]?.values[0][0] || 0}`);
    console.log(`  Diagnostics: ${diagnostics[0]?.values[0][0] || 0}`);
    console.log(`  Bilans: ${bilans[0]?.values[0][0] || 0}`);
    console.log(`  Consultations: ${consultations[0]?.values[0][0] || 0}`);

    const total = (antecedents[0]?.values[0][0] || 0) +
                  (diagnostics[0]?.values[0][0] || 0) +
                  (bilans[0]?.values[0][0] || 0) +
                  (consultations[0]?.values[0][0] || 0);

    if (total > 0) {
      console.log(`  ✅ TOTAL: ${total} entrées de dossier médical trouvées!`);
    }
  }
}

checkAllBackups().catch(console.error);
