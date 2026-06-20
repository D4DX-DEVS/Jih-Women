const mongoose = require('mongoose');

const RECOMMEND_OPTIONS = ['Yes', 'No', 'Maybe'];

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: '',
    },
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: 1,
      max: 5,
    },
    sessionQuality: {
      type: Number,
      required: [true, 'Session quality rating is required'],
      min: 1,
      max: 5,
    },
    venueRating: {
      type: Number,
      required: [true, 'Venue rating is required'],
      min: 1,
      max: 5,
    },
    liked: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    improvements: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    recommend: {
      type: String,
      required: [true, 'Recommendation answer is required'],
      enum: RECOMMEND_OPTIONS,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
