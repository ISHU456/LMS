import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  title: { type: String, default: 'Unlabeled Session' },
  messages: [messageSchema],
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
