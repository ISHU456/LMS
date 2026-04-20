import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    institutionName: { type: String, default: 'Digital Nexus Academy' },
    academicYear: { type: String, default: '2025-26' },
    currentSemester: { type: Number, default: 1 },
    maintenanceMode: { type: Boolean, default: false },
    registrationOpen: { type: Boolean, default: true },
    allowSelfRegistration: { type: Boolean, default: true },
    aiDailyCredits: { type: Number, default: 10 },
    globalAlert: { type: String, default: '' },
    lightModeBgColor: { type: String, default: '#FFFFFF' },
    darkModeBgColor: { type: String, default: '#0B1120' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
