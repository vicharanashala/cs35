const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/asksam');
const db = mongoose.connection;
db.once('open', async () => {
  const Question = mongoose.model('Question', new mongoose.Schema({}, { strict: false }));
  const q = await Question.findOne().sort({ createdAt: -1 }).lean();
  console.log('Latest Question:', JSON.stringify(q, null, 2));
  process.exit(0);
});
