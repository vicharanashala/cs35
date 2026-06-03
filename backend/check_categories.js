const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://asksamadmin:AskSam2026@asksamcluster.4ls9pg0.mongodb.net/asksam?appName=AskSamCluster';

mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const count = await db.collection('categories').countDocuments();
  console.log('Categories count in DB:', count);

  const list = await db.collection('categories').find().toArray();
  console.log('Categories list:', list);

  mongoose.connection.close();
});
