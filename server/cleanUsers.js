import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const cleanUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find();
    for (const u of users) {
      if (u.email !== u.email.trim().toLowerCase()) {
        const oldEmail = u.email;
        u.email = u.email.trim().toLowerCase();
        await u.save();
        console.log(`Updated email: "${oldEmail}" -> "${u.email}"`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Clean failed:', err);
    process.exit(1);
  }
};

cleanUsers();
