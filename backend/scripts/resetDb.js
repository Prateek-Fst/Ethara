require('dotenv').config();
const mongoose = require('mongoose');

const CONFIRM = process.argv.includes('--yes') || process.env.RESET_CONFIRM === 'yes';

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }
  if (!CONFIRM) {
    console.error('Refusing to wipe DB without confirmation.');
    console.error('Re-run with: npm run db:reset -- --yes');
    console.error('Or set env: RESET_CONFIRM=yes npm run db:reset');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log(`Database "${dbName}" has no collections. Nothing to clear.`);
    } else {
      console.log(`Clearing ${collections.length} collection(s) in "${dbName}":`);
      for (const c of collections) {
        const result = await db.collection(c.name).deleteMany({});
        console.log(`  - ${c.name}: removed ${result.deletedCount} document(s)`);
      }
      console.log('Done. All collections are now empty.');
    }
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
