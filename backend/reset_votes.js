const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://asksamadmin:AskSam2026@asksamcluster.4ls9pg0.mongodb.net/asksam?appName=AskSamCluster';

mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const result = await db.collection('answers').updateMany(
    {},
    { $set: { upvotes: 0, downvotes: 0, voters: [] } }
  );

  console.log(`Reset ${result.modifiedCount} answers — upvotes, downvotes and voters all cleared.`);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
