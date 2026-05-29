const mongoose = require('mongoose');
const { readFileSync } = require('fs');
const { fileURLToPath } = require('url');
const { dirname, join } = require('path');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const faqData = JSON.parse(readFileSync(join(__dirname, '..', '..', 'faqData.json'), 'utf-8'));

const FAQ_SCHEMA = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  isAnswered: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const FAQ = mongoose.model('Faq', FAQ_SCHEMA);

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/asksam';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected. Seeding FAQs...');

  await FAQ.deleteMany({});
  const docs = faqData.map((item) => ({
    question: item.question,
    answer: item.answer,
    category: item.category,
    tags: item.tags || [],
    views: 0,
    isAnswered: true,
  }));

  await FAQ.insertMany(docs);
  console.log(`Seeded ${docs.length} FAQs.`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
