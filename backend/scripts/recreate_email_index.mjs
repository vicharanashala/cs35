import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'asksam';
  if (!uri) throw new Error('MONGODB_URI missing');

  const conn = await mongoose.connect(uri, { dbName });
  const collection = conn.connection.db.collection('users');
  console.log('Connected to', dbName);

  try {
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    // Drop the email_1 index if it exists
    const idxName = indexes.find(i => i.name === 'email_1')?.name;
    if (idxName) {
      console.log('Dropping index:', idxName);
      await collection.dropIndex(idxName);
    } else {
      console.log('No email_1 index found');
    }

    // Create sparse unique index on email
    console.log('Creating sparse unique index on email');
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });

    console.log('Index recreated successfully');
  } catch (err) {
    console.error('Error while recreating index:', err);
    process.exitCode = 1;
  } finally {
    await conn.disconnect();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
