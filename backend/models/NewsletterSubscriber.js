const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please enter your email address.'],
      trim: true,
      lowercase: true,
      maxlength: 200,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'That does not look like a valid email address.'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
