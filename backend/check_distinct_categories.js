const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://asksamadmin:AskSam2026@asksamcluster.4ls9pg0.mongodb.net/asksam?appName=AskSamCluster';

mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const faqs = await db.collection('faqs').distinct('category');
  const questions = await db.collection('questions').distinct('category');
  console.log('FAQs categories:', faqs);
  console.log('Questions categories:', questions);

  mongoose.connection.close();
});
