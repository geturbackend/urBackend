const mongoose = require("mongoose");

const resourceConfigSchema = new mongoose.Schema(
  {
    encrypted: { type: String, select: false },
    iv: { type: String, select: false },
    tag: { type: String, select: false },
  },
  { _id: false }
);

const eventConfigSchema = new mongoose.Schema(
  {
    insert: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    recover: { type: Boolean, default: false },
  },
  { _id: false }
);

const webhookSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    secret: {
      type: resourceConfigSchema,
      required: true,
    },
    events: {
      type: Map,
      of: eventConfigSchema,
      default: {},
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

webhookSchema.index({ projectId: 1, enabled: 1 });

module.exports = mongoose.model("Webhook", webhookSchema);
