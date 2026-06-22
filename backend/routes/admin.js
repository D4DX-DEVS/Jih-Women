const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const Registration = require('../models/Registration');
const PaymentQR = require('../models/PaymentQR');
const Settings = require('../models/Settings');
const GalleryImage = require('../models/GalleryImage');
const { getSettings } = require('../models/Settings');
const { requireAdmin } = require('../middleware/auth');
const { qrImageUpload, galleryUpload, uploadBuffer, getCdnUrl, deleteFile, keyFromUrl, s3 } = require('../config/spaces');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { generateEntryPass, generatePassId } = require('../utils/entryPassGenerator');
const { sendWhatsAppImage } = require('../config/dxing');


const router = express.Router();

router.use(requireAdmin);

const SORTABLE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'fullName',
  'age',
  'email',
  'district',
  'industry',
  'businessStage',
  'businessScale',
  'ventureName',
]);

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/registrations', async (req, res) => {
  try {
    const {
      search = '',
      industry,
      businessStage,
      businessScale,
      district,
      hasAccompanying,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search && String(search).trim().length > 0) {
      const re = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [
        { fullName: re },
        { email: re },
        { whatsappNumber: re },
        { ventureName: re },
        { district: re },
      ];
    }

    if (industry) query.industry = industry;
    if (businessStage) query.businessStage = businessStage;
    if (businessScale) query.businessScale = businessScale;
    if (district) query.district = new RegExp('^' + escapeRegex(String(district)) + '$', 'i');

    if (hasAccompanying === 'companions') {
      query.accompanyingCompanions = { $gt: 0 };
    } else if (hasAccompanying === 'children') {
      query.accompanyingChildren = { $gt: 0 };
    } else if (hasAccompanying === 'infants') {
      query.accompanyingInfants = { $gt: 0 };
    } else if (hasAccompanying === 'any') {
      const anyAccompanyingOr = [
        { accompanyingCompanions: { $gt: 0 } },
        { accompanyingChildren: { $gt: 0 } },
        { accompanyingInfants: { $gt: 0 } },
      ];
      if (query.$or) {
        // Combine search $or and accompanying $or with $and to avoid conflict
        query.$and = [{ $or: query.$or }, { $or: anyAccompanyingOr }];
        delete query.$or;
      } else {
        query.$or = anyAccompanyingOr;
      }
    }

    const sortField = SORTABLE_FIELDS.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortDirection = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Registration.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('[admin] list error:', err);
    res.status(500).json({ error: 'Failed to load registrations' });
  }
});

router.get('/registrations/stats', async (_req, res) => {
  try {
    const [total, byIndustry, byStage, byScale, infantStats, childrenStats, companionStats] = await Promise.all([
      Registration.countDocuments({}),
      Registration.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Registration.aggregate([
        { $group: { _id: '$businessStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Registration.aggregate([
        { $group: { _id: '$businessScale', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Registration.aggregate([{ $group: { _id: null, total: { $sum: '$accompanyingInfants' } } }]),
      Registration.aggregate([{ $group: { _id: null, total: { $sum: '$accompanyingChildren' } } }]),
      Registration.aggregate([{ $group: { _id: null, total: { $sum: '$accompanyingCompanions' } } }]),
    ]);
    res.json({
      total,
      byIndustry,
      byStage,
      byScale,
      totalInfants: infantStats[0]?.total ?? 0,
      totalChildren: childrenStats[0]?.total ?? 0,
      totalCompanions: companionStats[0]?.total ?? 0,
    });
  } catch (err) {
    console.error('[admin] stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/registrations/export', async (req, res) => {
  try {
    const items = await Registration.find({}).sort({ createdAt: -1 }).lean();

    const fields = [
      ['createdAt',          'Submitted At'],
      ['fullName',           'Full Name'],
      ['age',                'Age'],
      ['whatsappNumber',     'WhatsApp Number'],
      ['email',              'Email'],
      ['district',           'District'],
      ['ventureName',        'Venture / Business Name'],
      ['industry',           'Industry / Sector'],
      ['businessStage',      'Business Stage'],
      ['businessScale',      'Business Scale'],
      ['accompanyingInfants',    'Accompanying Infants (0-5, Free)'],
      ['accompanyingChildren',   'Accompanying Children (5-12, 50%)'],
      ['accompanyingCompanions', 'Accompanying Companions (12+, Full fee)'],
      ['paymentVerified',    'Payment Verified'],
      ['entryPassGenerated', 'Entry Pass Generated'],
      ['entryPassId',        'Entry Pass ID'],
      ['entryPassUrl',       'Entry Pass URL'],
      ['entryPassSentAt',    'Entry Pass Sent At'],
      ['checkedIn',          'Checked In'],
      ['checkedInAt',        'Checked In At'],
      ['checkedInBy',        'Checked In By'],
      ['updatedAt',          'Last Updated At'],
    ];

    const toValue = (key, val) => {
      if (val === null || val === undefined) return '';
      if (key === 'createdAt' || key === 'updatedAt' || key === 'entryPassSentAt' || key === 'checkedInAt') {
        return val ? new Date(val).toISOString() : '';
      }
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return val;
    };

    const rows = items.map((it) => {
      const row = {};
      fields.forEach(([key, label]) => {
        row[label] = toValue(key, it[key]);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: fields.map(([, label]) => label),
    });

    // Auto-fit column widths
    const colWidths = fields.map(([, label]) => {
      const maxLen = Math.max(
        label.length,
        ...rows.map((r) => String(r[label] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 60) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `wes-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('[admin] export error:', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

router.get('/registrations/:id', async (req, res) => {
  try {
    const doc = await Registration.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

router.delete('/registrations/:id', async (req, res) => {
  try {
    const doc = await Registration.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Edit a registration's core fields (admin only)
router.patch('/registrations/:id', async (req, res) => {
  try {
    const {
      INDUSTRY_OPTIONS,
      BUSINESS_STAGE_OPTIONS,
      BUSINESS_SCALE_OPTIONS,
    } = require('../models/Registration');

    const KERALA_DISTRICTS = [
      'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
      'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
      'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
    ];

    const allowed = {
      fullName: req.body.fullName,
      age: req.body.age,
      whatsappNumber: req.body.whatsappNumber,
      email: req.body.email,
      district: req.body.district,
      ventureName: req.body.ventureName,
      industry: req.body.industry,
      businessStage: req.body.businessStage,
      businessScale: req.body.businessScale,
      accompanyingInfants: req.body.accompanyingInfants,
      accompanyingChildren: req.body.accompanyingChildren,
      accompanyingCompanions: req.body.accompanyingCompanions,
    };

    // Build sanitised update object — only include provided fields
    const update = {};

    if (allowed.fullName !== undefined) {
      const v = String(allowed.fullName).trim();
      if (!v || v.length > 120) return res.status(400).json({ error: 'Invalid fullName' });
      update.fullName = v;
    }
    if (allowed.age !== undefined) {
      const v = Number(allowed.age);
      if (!Number.isInteger(v) || v < 10 || v > 120) return res.status(400).json({ error: 'Invalid age' });
      update.age = v;
    }
    if (allowed.whatsappNumber !== undefined) {
      const v = String(allowed.whatsappNumber).trim();
      if (!v || v.length > 20) return res.status(400).json({ error: 'Invalid whatsappNumber' });
      update.whatsappNumber = v;
    }
    if (allowed.email !== undefined) {
      const v = String(allowed.email).trim().toLowerCase();
      if (!v || v.length > 200) return res.status(400).json({ error: 'Invalid email' });
      update.email = v;
    }
    if (allowed.district !== undefined) {
      const v = String(allowed.district).trim();
      if (!KERALA_DISTRICTS.includes(v)) return res.status(400).json({ error: 'Invalid district' });
      update.district = v;
    }
    if (allowed.ventureName !== undefined) {
      const v = String(allowed.ventureName).trim();
      update.ventureName = v.length > 0 ? v : 'N/A';
    }
    if (allowed.industry !== undefined) {
      if (!INDUSTRY_OPTIONS.includes(allowed.industry)) return res.status(400).json({ error: 'Invalid industry' });
      update.industry = allowed.industry;
    }
    if (allowed.businessStage !== undefined) {
      if (!BUSINESS_STAGE_OPTIONS.includes(allowed.businessStage)) return res.status(400).json({ error: 'Invalid businessStage' });
      update.businessStage = allowed.businessStage;
    }
    if (allowed.businessScale !== undefined) {
      if (!BUSINESS_SCALE_OPTIONS.includes(allowed.businessScale)) return res.status(400).json({ error: 'Invalid businessScale' });
      update.businessScale = allowed.businessScale;
    }
    if (allowed.accompanyingInfants !== undefined) {
      const v = Math.max(0, parseInt(allowed.accompanyingInfants, 10) || 0);
      update.accompanyingInfants = v;
    }
    if (allowed.accompanyingChildren !== undefined) {
      const v = Math.max(0, parseInt(allowed.accompanyingChildren, 10) || 0);
      update.accompanyingChildren = v;
    }
    if (allowed.accompanyingCompanions !== undefined) {
      const v = Math.max(0, parseInt(allowed.accompanyingCompanions, 10) || 0);
      update.accompanyingCompanions = v;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const doc = await Registration.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error('[admin] edit registration error:', err);
    res.status(400).json({ error: err.message || 'Failed to update registration' });
  }
});

/* ===================== PAYMENT QR MANAGEMENT ===================== */

// List all payment QR configs
router.get('/payment-qr', async (_req, res) => {
  try {
    const items = await PaymentQR.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (err) {
    console.error('[admin] payment-qr list error:', err);
    res.status(500).json({ error: 'Failed to load payment QR configs' });
  }
});

// Create a new payment QR config
router.post('/payment-qr', (req, res) => {
  const upload = qrImageUpload.single('qrImage');

  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      const msg = uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5MB.'
        : uploadErr.message || 'File upload failed';
      return res.status(400).json({ error: msg });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'QR image is required' });
    }

    try {
      const { upiId, amount, label } = req.body || {};
      if (!upiId || !amount) {
        return res.status(400).json({ error: 'UPI ID and amount are required' });
      }

      const qrImageUrl = getCdnUrl(req.file.key);

      const doc = await PaymentQR.create({
        qrImage: qrImageUrl,
        upiId: String(upiId).trim(),
        amount: Number(amount),
        label: label ? String(label).trim() : '',
        isActive: false,
      });

      res.status(201).json({ ok: true, item: doc });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const fields = {};
        for (const key of Object.keys(err.errors)) {
          fields[key] = err.errors[key].message;
        }
        return res.status(400).json({ error: 'Validation failed', fields });
      }
      console.error('[admin] payment-qr create error:', err);
      res.status(500).json({ error: 'Failed to create payment QR' });
    }
  });
});

// Edit a payment QR config (upiId, amount, label; optionally replace image)
router.patch('/payment-qr/:id', (req, res) => {
  const upload = qrImageUpload.single('qrImage');

  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      const msg = uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5MB.'
        : uploadErr.message || 'File upload failed';
      return res.status(400).json({ error: msg });
    }

    try {
      const doc = await PaymentQR.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });

      const { upiId, amount, label } = req.body || {};

      if (upiId !== undefined) doc.upiId = String(upiId).trim();
      if (amount !== undefined) doc.amount = Number(amount);
      if (label !== undefined) doc.label = String(label).trim();

      if (req.file) {
        // Delete old image from Spaces
        const oldKey = keyFromUrl(doc.qrImage);
        if (oldKey) await deleteFile(oldKey).catch(() => {});

        doc.qrImage = getCdnUrl(req.file.key);
      }

      await doc.save();
      res.json({ ok: true, item: doc });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const fields = {};
        for (const key of Object.keys(err.errors)) {
          fields[key] = err.errors[key].message;
        }
        return res.status(400).json({ error: 'Validation failed', fields });
      }
      console.error('[admin] payment-qr edit error:', err);
      res.status(500).json({ error: 'Failed to update payment QR' });
    }
  });
});

// Activate a payment QR (auto-deactivates others via model hook)
router.patch('/payment-qr/:id/activate', async (req, res) => {
  try {
    const doc = await PaymentQR.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    doc.isActive = true;
    await doc.save(); // triggers pre-save hook to deactivate others
    res.json({ ok: true, item: doc });
  } catch (err) {
    console.error('[admin] payment-qr activate error:', err);
    res.status(400).json({ error: 'Failed to activate' });
  }
});

// Deactivate a payment QR
router.patch('/payment-qr/:id/deactivate', async (req, res) => {
  try {
    const doc = await PaymentQR.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, item: doc });
  } catch (err) {
    console.error('[admin] payment-qr deactivate error:', err);
    res.status(400).json({ error: 'Failed to deactivate' });
  }
});

// Delete a payment QR config
router.delete('/payment-qr/:id', async (req, res) => {
  try {
    const doc = await PaymentQR.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Delete image from Spaces
    const key = keyFromUrl(doc.qrImage);
    if (key) await deleteFile(key);

    res.json({ ok: true });
  } catch (err) {
    console.error('[admin] payment-qr delete error:', err);
    res.status(400).json({ error: 'Failed to delete' });
  }
});

/* ===================== PAYMENT VERIFICATION ===================== */

router.patch('/registrations/:id/verify-payment', async (req, res) => {
  try {
    const doc = await Registration.findByIdAndUpdate(
      req.params.id,
      { paymentVerified: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, item: doc });
  } catch (err) {
    console.error('[admin] verify-payment error:', err);
    res.status(400).json({ error: 'Failed to verify payment' });
  }
});

/* ===================== ENTRY PASS GENERATION ===================== */

router.post('/registrations/:id/generate-pass', async (req, res) => {
  try {
    const doc = await Registration.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (!doc.paymentVerified) {
      return res.status(400).json({ error: 'Payment must be verified before generating pass' });
    }

    // Generate pass ID and image
    const passId = doc.entryPassId || generatePassId();
    const imageBuffer = await generateEntryPass({
      fullName: doc.fullName,
      passId,
    });

    // Upload to DO Spaces
    const folder = process.env.DO_SPACES_FOLDER ? `${process.env.DO_SPACES_FOLDER}/` : '';
    const key = `${folder}entry-passes/${passId}.png`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        ACL: 'public-read',
      })
    );

    const passUrl = getCdnUrl(key);

    doc.entryPassId = passId;
    doc.entryPassUrl = passUrl;
    doc.entryPassGenerated = true;
    await doc.save();

    res.json({ ok: true, passId, passUrl, item: doc });
  } catch (err) {
    console.error('[admin] generate-pass error:', err);
    res.status(500).json({ error: 'Failed to generate entry pass' });
  }
});

/* ===================== SEND ENTRY PASS VIA WHATSAPP ===================== */

router.post('/registrations/:id/send-pass', async (req, res) => {
  try {
    const doc = await Registration.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (!doc.entryPassGenerated || !doc.entryPassUrl) {
      return res.status(400).json({ error: 'Entry pass must be generated first' });
    }

    const caption = `🎟️ *WOMEN ENTREPRENEURS SUMMIT 2026*\n\nDear *${doc.fullName}*,\n\nYour entry pass has been confirmed! ✅\n\n📅 Date: 20 June 2026\n📍 Venue: KPM TRIPENTA HOTEL, Calicut\n🆔 Pass ID: *${doc.entryPassId}*\n\nPlease show this pass at the entrance for check-in.\n\n📲 Join our WhatsApp group for more information:\nhttps://chat.whatsapp.com/I98QTYi7ZxO4albqjXwSTj\n\nSee you at the summit! 🌟`;

    await sendWhatsAppImage(doc.whatsappNumber, doc.entryPassUrl, caption);

    doc.entryPassSentAt = new Date();
    await doc.save();

    res.json({ ok: true, sentAt: doc.entryPassSentAt });
  } catch (err) {
    console.error('[admin] send-pass error:', err);
    res.status(500).json({ error: 'Failed to send entry pass: ' + err.message });
  }
});

/* ===================== CHECK-IN (QR SCANNING) ===================== */

// Scan / check-in by passId
router.post('/check-in/:passId', async (req, res) => {
  try {
    const passId = String(req.params.passId).trim().toUpperCase();
    if (!passId) return res.status(400).json({ error: 'Pass ID is required' });

    const doc = await Registration.findOne({ entryPassId: passId });
    if (!doc) {
      return res.status(404).json({ error: 'Invalid pass', passId });
    }

    if (doc.checkedIn) {
      return res.status(409).json({
        error: 'Already checked in',
        passId,
        fullName: doc.fullName,
        checkedInAt: doc.checkedInAt,
        checkedInBy: doc.checkedInBy,
      });
    }

    doc.checkedIn = true;
    doc.checkedInAt = new Date();
    doc.checkedInBy = req.admin?.username || 'admin';
    await doc.save();

    res.json({
      ok: true,
      passId,
      fullName: doc.fullName,
      ventureName: doc.ventureName,
      district: doc.district,
      checkedInAt: doc.checkedInAt,
      accompanyingInfants: doc.accompanyingInfants ?? 0,
      accompanyingChildren: doc.accompanyingChildren ?? 0,
      accompanyingCompanions: doc.accompanyingCompanions ?? 0,
    });
  } catch (err) {
    console.error('[admin] check-in error:', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// List checked-in attendees
router.get('/check-ins', async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'checkedInAt',
      sortDir = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { checkedIn: true };

    if (search && String(search).trim().length > 0) {
      const re = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [
        { fullName: re },
        { entryPassId: re },
        { ventureName: re },
        { district: re },
      ];
    }

    const allowedSort = new Set(['checkedInAt', 'fullName', 'district', 'ventureName']);
    const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'checkedInAt';
    const sortDirection = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Registration.find(query)
        .select('fullName age email whatsappNumber district ventureName industry businessStage businessScale entryPassId accompanyingInfants accompanyingChildren accompanyingCompanions checkedInAt checkedInBy checkedOutAt checkedOutBy')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('[admin] check-ins list error:', err);
    res.status(500).json({ error: 'Failed to load check-ins' });
  }
});

// Check-in stats
router.get('/check-ins/stats', async (_req, res) => {
  try {
    const [totalCheckedIn, totalWithPass] = await Promise.all([
      Registration.countDocuments({ checkedIn: true }),
      Registration.countDocuments({ entryPassGenerated: true }),
    ]);

    res.json({
      totalCheckedIn,
      totalWithPass,
      percentage: totalWithPass > 0 ? Math.round((totalCheckedIn / totalWithPass) * 100) : 0,
    });
  } catch (err) {
    console.error('[admin] check-in stats error:', err);
    res.status(500).json({ error: 'Failed to load check-in stats' });
  }
});

// Export checked-in attendees as CSV
router.get('/check-ins/export', async (_req, res) => {
  try {
    const items = await Registration.find({ checkedIn: true })
      .sort({ checkedInAt: -1 })
      .lean();

    const fields = [
      ['checkedInAt', 'Checked In At'],
      ['fullName', 'Full Name'],
      ['whatsappNumber', 'WhatsApp'],
      ['district', 'District'],
      ['ventureName', 'Venture/Business'],
      ['entryPassId', 'Pass ID'],
      ['checkedInBy', 'Checked In By'],
    ];

    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const header = fields.map(([, label]) => label).join(',');
    const rows = items
      .map((it) =>
        fields
          .map(([key]) => {
            const v = it[key];
            if (key === 'checkedInAt' && v) return new Date(v).toISOString();
            return escape(v);
          })
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="check-ins.csv"');
    res.send(header + '\n' + rows);
  } catch (err) {
    console.error('[admin] check-ins export error:', err);
    res.status(500).json({ error: 'Failed to export check-ins' });
  }
});

// List not-checked-in attendees (have entry pass but not yet checked in)
router.get('/check-ins/not-checked-in', async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'fullName',
      sortDir = 'asc',
      page = 1,
      limit = 200,
    } = req.query;

    const query = { entryPassGenerated: true, checkedIn: { $ne: true } };

    if (search && String(search).trim().length > 0) {
      const re = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [
        { fullName: re },
        { entryPassId: re },
        { ventureName: re },
        { district: re },
      ];
    }

    const allowedSort = new Set(['fullName', 'district', 'ventureName', 'createdAt']);
    const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'fullName';
    const sortDirection = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Registration.find(query)
        .select('fullName age email whatsappNumber district ventureName industry businessStage businessScale entryPassId accompanyingInfants accompanyingChildren accompanyingCompanions createdAt')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('[admin] not-checked-in list error:', err);
    res.status(500).json({ error: 'Failed to load not-checked-in list' });
  }
});

/* ===================== CHECK-OUT (QR SCANNING) ===================== */

// Scan / check-out by passId
router.post('/check-out/:passId', async (req, res) => {
  try {
    const passId = String(req.params.passId).trim().toUpperCase();
    if (!passId) return res.status(400).json({ error: 'Pass ID is required' });

    const doc = await Registration.findOne({ entryPassId: passId });
    if (!doc) {
      return res.status(404).json({ error: 'Invalid pass', passId });
    }

    if (!doc.checkedIn) {
      return res.status(422).json({
        error: 'Not checked in — cannot check out',
        passId,
        fullName: doc.fullName,
      });
    }

    if (doc.checkedOut) {
      return res.status(409).json({
        error: 'Already checked out',
        passId,
        fullName: doc.fullName,
        checkedOutAt: doc.checkedOutAt,
        checkedOutBy: doc.checkedOutBy,
      });
    }

    doc.checkedOut = true;
    doc.checkedOutAt = new Date();
    doc.checkedOutBy = req.admin?.username || 'admin';
    await doc.save();

    res.json({
      ok: true,
      passId,
      fullName: doc.fullName,
      ventureName: doc.ventureName,
      district: doc.district,
      checkedOutAt: doc.checkedOutAt,
      accompanyingInfants: doc.accompanyingInfants ?? 0,
      accompanyingChildren: doc.accompanyingChildren ?? 0,
      accompanyingCompanions: doc.accompanyingCompanions ?? 0,
    });
  } catch (err) {
    console.error('[admin] check-out error:', err);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// List checked-out attendees
router.get('/check-outs', async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'checkedOutAt',
      sortDir = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { checkedOut: true };

    if (search && String(search).trim().length > 0) {
      const re = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [
        { fullName: re },
        { entryPassId: re },
        { ventureName: re },
        { district: re },
      ];
    }

    const allowedSort = new Set(['checkedOutAt', 'fullName', 'district', 'ventureName']);
    const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'checkedOutAt';
    const sortDirection = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Registration.find(query)
        .select('fullName age email whatsappNumber district ventureName industry businessStage businessScale entryPassId accompanyingInfants accompanyingChildren accompanyingCompanions checkedInAt checkedInBy checkedOutAt checkedOutBy')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('[admin] check-outs list error:', err);
    res.status(500).json({ error: 'Failed to load check-outs' });
  }
});

// Check-out stats
router.get('/check-outs/stats', async (_req, res) => {
  try {
    const [totalCheckedOut, totalCheckedIn] = await Promise.all([
      Registration.countDocuments({ checkedOut: true }),
      Registration.countDocuments({ checkedIn: true }),
    ]);

    res.json({
      totalCheckedOut,
      totalCheckedIn,
      percentage: totalCheckedIn > 0 ? Math.round((totalCheckedOut / totalCheckedIn) * 100) : 0,
    });
  } catch (err) {
    console.error('[admin] check-out stats error:', err);
    res.status(500).json({ error: 'Failed to load check-out stats' });
  }
});

/* ===================== SETTINGS ===================== */

// Get current settings
router.get('/settings', async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ registrationEnabled: settings.registrationEnabled });
  } catch (err) {
    console.error('[admin] get settings error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Update settings
router.patch('/settings', async (req, res) => {
  try {
    const { registrationEnabled } = req.body;
    if (typeof registrationEnabled !== 'boolean') {
      return res.status(400).json({ error: 'registrationEnabled must be a boolean' });
    }
    let doc = await Settings.findOne();
    if (!doc) {
      doc = await Settings.create({ registrationEnabled });
    } else {
      doc.registrationEnabled = registrationEnabled;
      await doc.save();
    }
    res.json({ registrationEnabled: doc.registrationEnabled });
  } catch (err) {
    console.error('[admin] patch settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ─── Gallery ─────────────────────────────────────────────────────────────────

// GET /api/admin/gallery — list all images sorted by order, createdAt
router.get('/gallery', async (_req, res) => {
  try {
    const images = await GalleryImage.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ images });
  } catch (err) {
    console.error('[admin] gallery list error:', err);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// POST /api/admin/gallery — upload images (multipart, field name "images")
// For each file: compress with sharp → upload full + thumbnail → save to DB
router.post('/gallery', (req, res) => {
  const upload = galleryUpload.array('images', 20);
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const folder = process.env.DO_SPACES_FOLDER
      ? `${process.env.DO_SPACES_FOLDER}/`
      : '';

    const created = [];

    try {
      for (const file of req.files) {
        const uid = crypto.randomUUID();
        const isVideo = file.mimetype.startsWith('video/');

        if (isVideo) {
          // Upload video directly — no compression (sharp only handles images)
          const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
          const videoKey = `${folder}gallery/videos/${uid}${ext}`;
          const videoUrl = await uploadBuffer(file.buffer, videoKey, file.mimetype);

          const doc = await GalleryImage.create({
            imageUrl: videoUrl,
            thumbnailUrl: videoUrl, // frontend uses <video> element for preview
            caption: '',
            order: 0,
            type: 'video',
          });
          created.push(doc);
        } else {
          // Image: compress with sharp
          const fullBuffer = await sharp(file.buffer)
            .rotate() // auto-rotate from EXIF
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

          const thumbBuffer = await sharp(file.buffer)
            .rotate()
            .resize({ width: 600, withoutEnlargement: true })
            .webp({ quality: 72 })
            .toBuffer();

          const fullKey = `${folder}gallery/${uid}.webp`;
          const thumbKey = `${folder}gallery/thumb/${uid}.webp`;

          const [imageUrl, thumbnailUrl] = await Promise.all([
            uploadBuffer(fullBuffer, fullKey, 'image/webp'),
            uploadBuffer(thumbBuffer, thumbKey, 'image/webp'),
          ]);

          const doc = await GalleryImage.create({
            imageUrl,
            thumbnailUrl,
            caption: '',
            order: 0,
            type: 'image',
          });
          created.push(doc);
        }
      }

      res.status(201).json({ images: created });
    } catch (err) {
      console.error('[admin] gallery upload error:', err);
      res.status(500).json({ error: 'Failed to upload gallery images' });
    }
  });
});

// PATCH /api/admin/gallery/:id — update caption or order
router.patch('/gallery/:id', async (req, res) => {
  try {
    const { caption, order } = req.body;
    const update = {};
    if (caption !== undefined) update.caption = String(caption).slice(0, 300);
    if (order !== undefined) update.order = Number(order);

    const doc = await GalleryImage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Image not found' });
    res.json({ image: doc });
  } catch (err) {
    console.error('[admin] gallery patch error:', err);
    res.status(500).json({ error: 'Failed to update gallery image' });
  }
});

// DELETE /api/admin/gallery/:id — delete doc + both Spaces objects
router.delete('/gallery/:id', async (req, res) => {
  try {
    const doc = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Image not found' });

    // Clean up Spaces objects (best-effort)
    const fullKey = keyFromUrl(doc.imageUrl);
    const thumbKey = keyFromUrl(doc.thumbnailUrl);
    await Promise.all([
      fullKey ? deleteFile(fullKey) : Promise.resolve(),
      thumbKey ? deleteFile(thumbKey) : Promise.resolve(),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('[admin] gallery delete error:', err);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
});

module.exports = router;
