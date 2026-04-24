const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Developer, connectDB } = require('../../packages/common');

async function backfill() {
  try {
    console.log('🚀 Starting Developer Plan Backfill...');
    await connectDB();

    const result = await Developer.updateMany(
      { plan: { $exists: false } },
      { $set: { plan: 'free' } }
    );

    console.log(`✅ Success! Updated ${result.modifiedCount} developer documents.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  }
}

backfill();
