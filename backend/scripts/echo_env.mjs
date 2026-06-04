import 'dotenv/config';
console.log('MONGODB_URI=', process.env.MONGODB_URI ? '[REDACTED]' : 'NOT SET');
console.log('MONGODB_DB=', process.env.MONGODB_DB);
