const mongoose = require('mongoose');
const uri = 'mongodb+srv://asksamadmin:AskSam2026@asksamcluster.4ls9pg0.mongodb.net/asksam?appName=AskSamCluster';

async function migrate() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');
  
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const questionsColl = db.collection('questions');
  const answersColl = db.collection('answers');
  
  const users = await usersColl.find({}).toArray();
  let migratedQ = 0;
  let migratedA = 0;
  
  for (const user of users) {
    if (user.questionsAsked && user.questionsAsked.length > 0) {
      const res = await questionsColl.updateMany(
        { _id: { $in: user.questionsAsked } },
        { $set: { contributorId: user._id, contributorName: user.name } }
      );
      migratedQ += res.modifiedCount;
    }
    
    // Attempt to backfill answers by contributor name
    const resA = await answersColl.updateMany(
      { contributorName: user.name, contributorId: { $exists: false } },
      { $set: { contributorId: user._id } }
    );
    migratedA += resA.modifiedCount;
    
    // Clean up old arrays (except questionsBookmarked which we restored)
    await usersColl.updateOne(
      { _id: user._id },
      { $unset: { questionsAsked: '', questionsAnswered: '' } }
    );
  }
  
  console.log('Migration complete. Updated ' + migratedQ + ' questions and ' + migratedA + ' answers.');
  process.exit(0);
}

migrate().catch(console.error);
