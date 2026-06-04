import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  const srcDbName = 'test';
  const tgtDbName = process.env.MONGODB_DB || 'asksam';

  console.log('Connecting to source DB (test) and target DB (' + tgtDbName + ')...');
  const srcConn = await mongoose.createConnection(uri, { dbName: srcDbName });
  const tgtConn = await mongoose.createConnection(uri, { dbName: tgtDbName });

  const schema = new mongoose.Schema({}, { strict: false });
  const SrcUser = srcConn.model('User', schema, 'users');
  const TgtUser = tgtConn.model('User', schema, 'users');

  const srcCount = await SrcUser.countDocuments();
  const tgtCountBefore = await TgtUser.countDocuments();
  console.log('Source users count:', srcCount);
  console.log('Target users count before:', tgtCountBefore);

  const users = await SrcUser.find({}).lean();
  let inserted = 0;
  for (const u of users) {
    try {
      const exists = await TgtUser.findOne({ $or: [{ username: u.username }, { studentId: u.studentId }] }).exec();
      if (exists) continue;
      // preserve _id if present
      await TgtUser.create(u);
      inserted++;
    } catch (e) {
      console.error('Failed to insert user', u.username, e.message);
    }
  }

  const tgtCountAfter = await TgtUser.countDocuments();
  console.log('Inserted into target:', inserted);
  console.log('Target users count after:', tgtCountAfter);

  await srcConn.close();
  await tgtConn.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
