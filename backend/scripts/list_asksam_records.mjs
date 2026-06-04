import 'dotenv/config';
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI missing');
  }
  const dbName = process.env.MONGODB_DB || 'asksam';
  const conn = await mongoose.connect(uri, { dbName });
  const db = conn.connection.db;
  const Faq = conn.model('Faq', new Schema({}, { strict: false }), 'faqs');
  const User = conn.model('User', new Schema({}, { strict: false }), 'users');
  const faqs = await Faq.find({}, { question: 1, category: 1, _id: 1 }).limit(20).lean();
  const users = await User.find({}, { username: 1, name: 1, email: 1, role: 1, studentId: 1, createdAt: 1 }).lean();
  console.log('DB:', dbName);
  console.log('FAQ count:', faqs.length);
  console.log('Sample FAQs:');
  faqs.forEach((faq) => console.log(`- ${faq._id}: ${faq.question} [${faq.category}]`));
  console.log('Users:');
  users.forEach((user) => console.log(`- ${user._id}: ${user.username} (${user.role}) ${user.studentId || ''}`));
  await conn.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
