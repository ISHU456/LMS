import mongoose from 'mongoose';

const aiCreditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['ask', 'analyze', 'generate-quiz'],
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    remainingCredits: {
        type: Number,
        required: true
    },
    contentSummary: {
        type: String // Snippet of the prompt or file name
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const AiCreditLog = mongoose.model('AiCreditLog', aiCreditLogSchema);
export default AiCreditLog;
