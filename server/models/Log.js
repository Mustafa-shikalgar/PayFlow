const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['webhook', 'admin', 'system', 'auth', 'payment'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'error', 'info'],
      default: 'info',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
logSchema.index({ type: 1, createdAt: -1 });
logSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);