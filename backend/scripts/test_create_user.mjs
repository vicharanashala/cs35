import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'asksam';
    if (!uri) {
      console.error('MONGODB_URI not set');
      process.exit(1);
    }
    await mongoose.connect(uri, { dbName });
    console.log('Connected to Mongo');

    const UserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      name: String,
      role: String,
      isActive: Boolean,
      studentId: String,
    }, { timestamps: true });

    const User = mongoose.model('UserTest', UserSchema, 'users');

    const hashed = await bcrypt.hash('password123', 10);
    const doc = await User.create({ username: 'test_insert_' + Date.now(), email: '', password: hashed, name: 'Test Insert', role: 'student', isActive: true, studentId: 'STU-99999' });
    console.log('Inserted user id:', doc._id.toString());

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error inserting user:', err);
    process.exit(1);
  }
})();
