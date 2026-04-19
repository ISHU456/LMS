
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';

dotenv.config();

const giveCoins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to Hive...");

        const user = await User.findOne({ name: { $regex: /Ansh Patel/i } });
        if (!user) {
            console.log("User 'Ansh Patel' not found.");
            process.exit(1);
        }

        console.log(`Found User: ${user.name} (${user._id})`);
        console.log(`Current Coins: ${user.coins}`);

        user.coins = (user.coins || 0) + 1000;
        await user.save();

        console.log(`Update Successful. New Balance: ${user.coins}`);
        process.exit(0);
    } catch (error) {
        console.error("Error grants coins:", error);
        process.exit(1);
    }
};

giveCoins();
