import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'asksam';

if (!uri) {
  console.error('MONGODB_URI is not set in environment!');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName });
  console.log('Connected to MongoDB:', dbName);

  const db = mongoose.connection.db;

  const faqsCollection = db.collection('faqs');
  
  const faqsPath = 'C:/Users/manos/OneDrive/Desktop/AskSam/faqData.json';
  
  if (fs.existsSync(faqsPath)) {
    const data = fs.readFileSync(faqsPath, 'utf8');
    const faqs = JSON.parse(data);
    
    // Some formats have an array, some have nested properties. Assuming it's an array of FAQ objects.
    const faqsArray = Array.isArray(faqs) ? faqs : (faqs.data || []);
    console.log(`Found ${faqsArray.length} FAQs in faqData.json`);
    
    if (faqsArray.length > 0) {
      // Convert string IDs or ensure they are properly mapped
      const docs = faqsArray.map(faq => ({
        ...faq,
        createdAt: new Date(faq.createdAt || Date.now()),
        updatedAt: new Date(faq.updatedAt || Date.now())
      }));
      
      // Clear existing FAQs
      await faqsCollection.deleteMany({});
      
      const result = await faqsCollection.insertMany(docs);
      console.log(`Inserted ${result.insertedCount} FAQs into the database.`);
    }
  } else {
    console.error(`faqData.json not found at ${faqsPath}`);
  }

  await mongoose.disconnect();
  console.log('Database FAQ seed completed successfully!');
}

run().catch(err => {
  console.error('Error during FAQ seed:', err);
  process.exit(1);
});
