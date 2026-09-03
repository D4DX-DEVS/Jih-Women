const dns = require('dns');
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment');
  }

  // mongodb+srv:// needs SRV DNS lookup; local 127.0.0.1 resolver often fails on Windows
  if (uri.startsWith('mongodb+srv://')) {
    const servers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    dns.setServers(servers);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('[db] Connected to MongoDB');
}

module.exports = connectDB;
