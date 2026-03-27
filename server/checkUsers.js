import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find().select('name email role');
    console.log(`Users found: ${users.length}`);
    users.forEach(u => console.log(` - ${u.name} | ${u.email} | ${u.role}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
};

checkUsers();
