const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please tell us your name.'], trim: true, maxlength: 200 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    district: { type: String, trim: true, maxlength: 100, default: '' },
    subject: { type: String, trim: true, maxlength: 300, default: '' },
    message: {
      type: String,
      required: [true, 'Please write your message.'],
      trim: true,
      maxlength: 5000,
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

contactMessageSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
