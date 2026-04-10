import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    message: {
      type: String,
      default: 'Manual curriculum access required for mark submission.'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
export default AccessRequest;
