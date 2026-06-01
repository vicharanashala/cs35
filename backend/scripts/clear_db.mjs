import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

  // Let's get list of all collections to confirm names
  const collections = await db.listCollections().toArray();
  const colNames = collections.map(c => c.name);
  console.log('Available collections in database:', colNames);

  // Define collections to clear
  const targets = ['questions', 'answers', 'notifications', 'searchanalytics', 'search-analytics', 'usertests', 'users'];

  for (const target of targets) {
    if (colNames.includes(target)) {
      console.log(`Clearing collection: ${target}...`);
      const result = await db.collection(target).deleteMany({});
      console.log(`Cleared ${result.deletedCount} documents from ${target}.`);
    } else {
      console.log(`Collection ${target} does not exist, skipping.`);
    }
  }

  // Double check faqs collection
  if (colNames.includes('faqs')) {
    const faqCount = await db.collection('faqs').countDocuments({});
    console.log(`Found ${faqCount} FAQs in database. Keeping intact.`);
  } else {
    console.log('WARNING: faqs collection does not exist in database!');
  }

  // Create clean admin user
  console.log('Creating clean admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminDoc = {
    username: 'admin',
    email: 'admin@asksam.com',
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    reputation: 100,
    name: 'Admin User',
    questionsAsked: [],
    questionsAnswered: [],
    questionsBookmarked: [],
    following: [],
    followers: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const usersCollection = db.collection('users');
  const result = await usersCollection.insertOne(adminDoc);
  console.log('Admin user inserted with ID:', result.insertedId);

  // Setup email index (unique and sparse) on the users collection
  try {
    console.log('Setting up indexes for users collection...');
    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true, sparse: true });
    console.log('Indexes set up successfully.');
  } catch (indexErr) {
    console.warn('Could not set up unique indexes (might already exist):', indexErr.message);
  }

  await mongoose.disconnect();
  console.log('Database cleanup & admin seed completed successfully!');
}

run().catch(err => {
  console.error('Error during database cleanup:', err);
  process.exit(1);
});
