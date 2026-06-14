require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

// Adjust the path to your Invitation model based on where this script is run
const Invitation = require('../../packages/common/src/models/Invitation');

async function run() {
  const isDryRun = process.argv.includes('--dry-run');

  if (!process.env.DB_URI) {
    console.error('❌ DB_URI is missing in environment variables');
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.DB_URI);
    console.log(`✅ Connected to DB`);

    console.log(`\n🔍 Searching for duplicate pending invitations...`);
    
    // Aggregation to find duplicates
    const duplicates = await Invitation.aggregate([
      { $match: { status: 'pending' } },
      { 
        $group: {
          _id: { project: '$project', invitee: '$invitee' },
          count: { $sum: 1 },
          docs: { $push: '$_id' },
          latestId: { $last: '$_id' } // Assumes default sorting keeps the newest last, but we will slice safely
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length === 0) {
      console.log(`✨ No duplicate pending invitations found. Safe to apply index.`);
      process.exit(0);
    }

    console.log(`⚠️ Found ${duplicates.length} groups of duplicate pending invitations.`);
    
    let totalDeleted = 0;

    for (const group of duplicates) {
      // Keep the last one in the array (most recently pushed, usually latest inserted)
      const idsToDelete = group.docs.slice(0, group.docs.length - 1);
      
      console.log(`   - Group (Project: ${group._id.project}, Invitee: ${group._id.invitee}) has ${group.count} invites. Marking ${idsToDelete.length} for deletion.`);
      
      if (!isDryRun) {
        const result = await Invitation.deleteMany({ _id: { $in: idsToDelete } });
        totalDeleted += result.deletedCount;
      } else {
        totalDeleted += idsToDelete.length;
      }
    }

    if (isDryRun) {
      console.log(`\n🧪 DRY RUN COMPLETE. ${totalDeleted} invitations WOULD be deleted.`);
      console.log(`To actually delete, run the script without the --dry-run flag.`);
    } else {
      console.log(`\n✅ CLEANUP COMPLETE. ${totalDeleted} duplicate pending invitations were deleted.`);
      console.log(`It is now safe to let Mongoose build the unique partial index on invitationSchema.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error running cleanup:', err);
    process.exit(1);
  }
}

run();
