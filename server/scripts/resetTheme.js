import 'dotenv/config';
import mongoose from 'mongoose';
import SystemSettings from '../models/SystemSettings.js';
import connectDB from '../config/db.js';

const resetSettings = async () => {
    try {
        await connectDB();
        
        const existingSettings = await SystemSettings.findOne();
        const updateData = {
            lightModeBgColor: '#FFFFFF',
            darkModeBgColor: '#020617',
            lightModeSurfaceColor: '#F8FAFC',
            darkModeSurfaceColor: '#0F172A',
            lightModePrimaryText: '#0F172A',
            darkModePrimaryText: '#F8FAFC',
            lightModeSecondaryText: '#475569',
            darkModeSecondaryText: '#94A3B8',
            accentColor: '#10B981'
        };

        if (existingSettings) {
            console.log('Existing settings found. Updating to pure white/blue theme...');
            await SystemSettings.updateOne({}, { $set: updateData });
            console.log('Settings updated successfully.');
        } else {
            console.log('No settings found. Initializing with pure white/blue theme...');
            await SystemSettings.create(updateData);
            console.log('Settings initialized successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed to reset settings:', err);
        process.exit(1);
    }
};

resetSettings();
