const express = require('express');
const XLSX = require('xlsx');
const Registration = require('../models/Registration');
const PaymentQR = require('../models/PaymentQR');
const { requireAdmin } = require('../middleware/auth');
const { qrImageUpload, getCdnUrl, deleteFile, keyFromUrl, s3 } = require('../config/spaces');
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
      registrationType,
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
    if (registrationType) {
      if (registrationType === 'Women') {
        // Old records without the field should also be treated as Women
        query.registrationType = { $in: [null, 'Women'] };
      } else {
        query.registrationType = registrationType;
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
    const [total, byIndustry, byStage, byScale, byType] = await Promise.all([
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
      Registration.aggregate([
        { $group: { _id: '$registrationType', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    res.json({ total, byIndustry, byStage, byScale, byType });
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
      ['registrationType',   'Registration Type'],
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
        .select('fullName ventureName district entryPassId checkedInAt checkedInBy whatsappNumber')
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

module.exports = router;
