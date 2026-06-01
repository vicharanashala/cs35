import 'dotenv/config';
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  const dbName = process.env.MONGODB_DB || 'asksam';
  const conn = await mongoose.connect(uri, { dbName });
  const db = conn.connection.db;
  const cols = await db.listCollections().toArray();
  console.log('dbName', db.databaseName);
  console.log('collections', cols.map(c => c.name));
  const Faq = conn.model('Faq', new Schema({}, { strict: false }), 'faqs');
  const User = conn.model('User', new Schema({}, { strict: false }), 'users');
  console.log('faqs', await Faq.countDocuments());
  console.log('users', await User.countDocuments());
  const sample = await User.findOne({ role: 'student' }).lean();
  console.log('sample student', JSON.stringify(sample, null, 2));
  await conn.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
