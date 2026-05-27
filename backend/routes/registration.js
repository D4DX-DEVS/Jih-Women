const express = require('express');
const rateLimit = require('express-rate-limit');
const Registration = require('../models/Registration');
const PaymentQR = require('../models/PaymentQR');
const {
  INDUSTRY_OPTIONS,
  BUSINESS_STAGE_OPTIONS,
  BUSINESS_SCALE_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
} = require('../models/Registration');
const { paymentScreenshotUpload, getCdnUrl } = require('../config/spaces');
const { sendWhatsAppText } = require('../config/dxing');

const SUPPORT_NUMBER = process.env.SUPPORT_WHATSAPP || '+91 ⁠7306057972';

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP. Please try again later.' },
});

router.get('/options', (_req, res) => {
  res.json({
    industry: INDUSTRY_OPTIONS,
    businessStage: BUSINESS_STAGE_OPTIONS,
    businessScale: BUSINESS_SCALE_OPTIONS,
  });
});

// Public endpoint: get the currently active payment QR
router.get('/active-qr', async (_req, res) => {
  try {
    const qr = await PaymentQR.findOne({ isActive: true }).lean();
    if (!qr) {
      return res.status(404).json({ error: 'No active payment QR configured' });
    }
    res.json({
      qrImage: qr.qrImage,
      upiId: qr.upiId,
      amount: qr.amount,
    });
  } catch (err) {
    console.error('[registration] active-qr error:', err);
    res.status(500).json({ error: 'Failed to load payment info' });
  }
});

router.post('/', submitLimiter, (req, res) => {
  const upload = paymentScreenshotUpload.single('paymentScreenshot');

  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      const msg = uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5MB.'
        : uploadErr.message || 'File upload failed';
      return res.status(400).json({ error: msg });
    }

    const resolvedType = REGISTRATION_TYPE_OPTIONS.includes(req.body?.registrationType)
      ? req.body.registrationType
      : 'Women';
    const isFreeEntry = resolvedType === 'Child (0-5)';

    if (!isFreeEntry && !req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    try {
      const {
        fullName,
        age,
        whatsappNumber,
        email,
        district,
        ventureName,
        industry,
        businessStage,
        businessScale,
      } = req.body || {};

      const ageNum = Number(age);
      const screenshotUrl = req.file ? getCdnUrl(req.file.key) : null;

      const doc = await Registration.create({
        fullName: typeof fullName === 'string' ? fullName.trim() : fullName,
        age: ageNum,
        whatsappNumber: typeof whatsappNumber === 'string' ? whatsappNumber.trim() : whatsappNumber,
        email: typeof email === 'string' ? email.trim().toLowerCase() : email,
        district: typeof district === 'string' ? district.trim() : district,
        ...(screenshotUrl ? { paymentScreenshot: screenshotUrl } : {}),
        ventureName:
          typeof ventureName === 'string' && ventureName.trim().length > 0
            ? ventureName.trim()
            : 'N/A',
        industry,
        businessStage,
        businessScale,
        registrationType: resolvedType,
      });

      // Fire-and-forget: send confirmation WhatsApp message
      const confirmationMsg =
        `Hello ${doc.fullName}! 🎉\n\n` +
        `Thank you for registering for the *Women Entrepreneurs Summit 2026*!\n\n` +
        `Your registration is currently in process. We have received your payment screenshot and it will be verified shortly.\n\n` +
        `✅ *Payment:* Received & under review\n` +
        `📅 *Event Date:* 20 June 2026\n` +
        `📍 *Venue:* KPM TRIPENTA HOTEL, Calicut\n\n` +
        `We will review your payment and send your entry pass within *24 hours*.\n\n` +
        `If you don't receive an update within 24 hours, please contact us for support:\n` +
        `📞 ${SUPPORT_NUMBER}\n\n` +
        `— Team WES`;

      sendWhatsAppText(doc.whatsappNumber, confirmationMsg).catch((err) => {
        console.error('[registration] Failed to send confirmation WhatsApp to', doc.whatsappNumber, err.message);
      });

      return res.status(201).json({
        ok: true,
        id: doc._id,
        message: 'Registration submitted successfully',
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const fields = {};
        for (const key of Object.keys(err.errors)) {
          fields[key] = err.errors[key].message;
        }
        return res.status(400).json({ error: 'Validation failed', fields });
      }
      console.error('[registration] error:', err);
      return res.status(500).json({ error: 'Failed to submit registration' });
    }
  });
});

module.exports = router;
