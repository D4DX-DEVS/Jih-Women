const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrgEvent',
      required: true,
      index: true,
    },
    name: { type: String, required: [true, 'Please enter your name.'], trim: true, maxlength: 200 },
    phone: { type: String, required: [true, 'Please enter a phone number we can reach you on.'], trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    district: { type: String, trim: true, maxlength: 100, default: '' },
    place: { type: String, trim: true, maxlength: 200, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
