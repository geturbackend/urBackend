const mongoose = require('mongoose');

const mailTemplateSchema = new mongoose.Schema(
  {
    // null => global template
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },

    // Optional stable identifier ("tag") used by API/SDK.
    key: { type: String, default: '' },
    keyLower: { type: String, default: '' },

    // Human readable name (also acceptable in templateName lookups)
    name: { type: String, required: true },
    nameLower: { type: String, required: true },

    subject: { type: String, default: '' },
    html: { type: String, default: '' },
    text: { type: String, default: '' },

    // System/global templates are read-only from dashboard UI.
    isSystem: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

mailTemplateSchema.pre('validate', function preValidate(next) {
  if (typeof this.key === 'string') {
    this.key = this.key.trim();
    this.keyLower = this.key.toLowerCase();
  } else {
    this.key = '';
    this.keyLower = '';
  }

  this.name = String(this.name || '').trim();
  this.nameLower = this.name.toLowerCase();

  next();
});

// Uniqueness: per project + global.
mailTemplateSchema.index(
  { projectId: 1, nameLower: 1 },
  { unique: true, name: 'uniq_project_nameLower' },
);

mailTemplateSchema.index(
  { projectId: 1, keyLower: 1 },
  {
    unique: true,
    name: 'uniq_project_keyLower',
    partialFilterExpression: { keyLower: { $type: 'string', $ne: '' } },
  },
);

module.exports = mongoose.model('MailTemplate', mailTemplateSchema);
