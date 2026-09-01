require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const galleryRoutes = require('./routes/gallery');
const siteRoutes = require('./routes/site');
const cmsRoutes = require('./routes/cms');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);

// CMS documents carry rich-text bodies, so the JSON body limit is larger than
// the 100kb the registration API needed.
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);

// WES event module
app.use('/api/registrations', registrationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/gallery', galleryRoutes);

// Organisation website module — mounted before /api/admin so the shared
// requireAdmin guard runs once per request.
app.use('/api/site', siteRoutes);
app.use('/api/admin/cms', cmsRoutes);

app.use('/api/admin', adminRoutes);

app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'Women\'s Wing backend',
    modules: ['wes', 'org-site'],
    adminPanel: '/admin',
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[server] error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`);
      console.log(`[server] Admin dashboard: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('[server] Startup failed:', err);
    process.exit(1);
  }
})();
