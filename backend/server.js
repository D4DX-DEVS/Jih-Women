require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');

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

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'WES backend', adminPanel: '/admin' });
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
