const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  resendEmailId: { 
    type: String, 
    index: true,
    sparse: true 
  },
  to: [{ type: String }],
  subject: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['queued', 'sent', 'delivered', 'bounced', 'complained', 'failed'],
    default: 'sent'
  },
  usingByok: { type: Boolean, default: false },
  templateUsed: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  sentAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for fast retrieval of a project's recent mail logs
mailLogSchema.index({ projectId: 1, sentAt: -1 });

module.exports = mongoose.model('MailLog', mailLogSchema);
