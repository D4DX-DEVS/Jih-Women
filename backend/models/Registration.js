const mongoose = require('mongoose');

const INDUSTRY_OPTIONS = [
  'Manufacturing',
  'Services',
  'Retail/Wholesale',
  'Technology/Digital',
  'Food',
  'Hospitality',
  'Agriculture',
  'Clothing',
  'Others',
];

const BUSINESS_STAGE_OPTIONS = [
  'Ideation (Concept only)',
  'Startup (0-1 year)',
  'Established (1+ years)',
  'Looking to Scale/Expand',
];

const BUSINESS_SCALE_OPTIONS = ['Home based', 'Small scale', 'Large scale'];

const REGISTRATION_TYPE_OPTIONS = ['Women', 'Child (5-12)', 'Child (0-5)'];

const registrationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
      maxlength: 120,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: 10,
      max: 120,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp Number is required'],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, 'Email Address is required'],
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      maxlength: 100,
    },
    paymentScreenshot: {
      type: String,
      required: false,
      trim: true,
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    entryPassGenerated: {
      type: Boolean,
      default: false,
    },
    entryPassId: {
      type: String,
      trim: true,
      sparse: true,
    },
    entryPassUrl: {
      type: String,
      trim: true,
    },
    entryPassSentAt: {
      type: Date,
    },
    ventureName: {
      type: String,
      required: [true, 'Name of Venture/Business is required'],
      trim: true,
      maxlength: 200,
      default: 'N/A',
    },
    industry: {
      type: String,
      required: [true, 'Industry/Sector is required'],
      enum: INDUSTRY_OPTIONS,
    },
    businessStage: {
      type: String,
      required: [true, 'Business Stage is required'],
      enum: BUSINESS_STAGE_OPTIONS,
    },
    businessScale: {
      type: String,
      required: [true, 'Business Scale is required'],
      enum: BUSINESS_SCALE_OPTIONS,
    },
    registrationType: {
      type: String,
      enum: REGISTRATION_TYPE_OPTIONS,
      default: 'Women',
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

registrationSchema.index({
  fullName: 'text',
  email: 'text',
  whatsappNumber: 'text',
  ventureName: 'text',
  district: 'text',
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
module.exports.INDUSTRY_OPTIONS = INDUSTRY_OPTIONS;
module.exports.BUSINESS_STAGE_OPTIONS = BUSINESS_STAGE_OPTIONS;
module.exports.BUSINESS_SCALE_OPTIONS = BUSINESS_SCALE_OPTIONS;
module.exports.REGISTRATION_TYPE_OPTIONS = REGISTRATION_TYPE_OPTIONS;
