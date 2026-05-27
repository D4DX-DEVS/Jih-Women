import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './admin.css';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'wes_admin_token';

type ScanResult = {
  status: 'success' | 'duplicate' | 'invalid' | 'error';
  passId?: string;
  fullName?: string;
  ventureName?: string;
  district?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  accompanyingInfants?: number;
  accompanyingChildren?: number;
  message: string;
};

type CheckIn = {
  _id: string;
  fullName?: string;
  ventureName?: string;
  district?: string;
  entryPassId?: string;
  checkedInAt?: string;
  checkedInBy?: string;
};

type CheckInStats = {
  totalCheckedIn: number;
  totalWithPass: number;
  percentage: number;
};

async function apiRequest(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<Response> {
  if (!API_URL) throw new Error('Server URL not configured');
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  return fetch(`${API_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

async function apiJson<T>(
  path: string,
  opts: Parameters<typeof apiRequest>[1] = {}
): Promise<T> {
  const res = await apiRequest(path, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error(data.error || 'Session expired');
    (err as Error & { code?: number }).code = 401;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

function formatTime(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Scanner() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const handleLogin = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
    <div className="admin-shell">
      {token ? (
        <ScannerDashboard token={token} onLogout={handleLogout} />
      ) : (
        <ScannerLogin onSuccess={handleLogin} />
      )}
    </div>
  );
}

function ScannerLogin({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      onSuccess(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-strong w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="admin-display text-3xl font-bold tracking-tight">Gate Scanner</div>
          <div className="text-foreground/60 text-sm mt-2">Sign in to scan entry passes</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-2">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              className="input"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-2">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button type="submit" className="pill pill-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}

function ScannerDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [processing, setProcessing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resultTimeoutRef = useRef<number | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiJson<CheckInStats>('/api/admin/check-ins/stats', { token });
      setStats(data);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) onLogout();
    }
  }, [token, onLogout]);

  const loadRecentCheckIns = useCallback(async () => {
    try {
      const data = await apiJson<{ items: CheckIn[] }>('/api/admin/check-ins?limit=20&sortBy=checkedInAt&sortDir=desc', { token });
      setRecentCheckIns(data.items);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) onLogout();
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadStats();
    loadRecentCheckIns();
  }, [loadStats, loadRecentCheckIns]);

  const handleScan = useCallback(async (passId: string) => {
    if (processing) return;
    setProcessing(true);

    // Stop scanner temporarily to prevent double scans
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.pause(true); } catch { /* ignore */ }
    }

    try {
      const res = await apiRequest(`/api/admin/check-in/${encodeURIComponent(passId)}`, {
        method: 'POST',
        token,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        onLogout();
        return;
      }

      if (res.ok) {
        setScanResult({
          status: 'success',
          passId: data.passId,
          fullName: data.fullName,
          ventureName: data.ventureName,
          district: data.district,
          checkedInAt: data.checkedInAt,
          accompanyingInfants: data.accompanyingInfants ?? 0,
          accompanyingChildren: data.accompanyingChildren ?? 0,
          message: `Welcome, ${data.fullName}!`,
        });
        // Vibrate on success
        if (navigator.vibrate) navigator.vibrate(200);
        // Refresh data
        loadStats();
        loadRecentCheckIns();
      } else if (res.status === 409) {
        setScanResult({
          status: 'duplicate',
          passId: data.passId,
          fullName: data.fullName,
          checkedInAt: data.checkedInAt,
          checkedInBy: data.checkedInBy,
          message: `Already checked in at ${formatTime(data.checkedInAt)}`,
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else if (res.status === 404) {
        setScanResult({
          status: 'invalid',
          passId,
          message: 'Invalid pass — not found in system',
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
      } else {
        setScanResult({
          status: 'error',
          passId,
          message: data.error || 'Something went wrong',
        });
      }
    } catch {
      setScanResult({
        status: 'error',
        passId,
        message: 'Network error — check connection',
      });
    } finally {
      setProcessing(false);

      // Auto-dismiss result and resume scanning after 3 seconds
      if (resultTimeoutRef.current) window.clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = window.setTimeout(() => {
        setScanResult(null);
        if (scannerRef.current?.getState() === 3) { // PAUSED state
          try { scannerRef.current.resume(); } catch { /* ignore */ }
        }
      }, 3000);
    }
  }, [token, onLogout, processing, loadStats, loadRecentCheckIns]);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode('scanner-viewfinder');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // QR code not detected in this frame — ignore
        }
      );
      setScanning(true);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera. Please allow camera permissions.'
      );
    }
  }, [handleScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      if (resultTimeoutRef.current) window.clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const resultColors = {
    success: { bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-700', icon: '✅' },
    duplicate: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-700', icon: '❌' },
    invalid: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-700', icon: '⚠️' },
    error: { bg: 'bg-gray-500/15', border: 'border-gray-500/40', text: 'text-gray-700', icon: '⚠️' },
  };

  return (
    <section className="min-h-screen">
      {/* Header */}
      <header className="border-b border-black/10 backdrop-blur-md bg-white/85 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="admin-display text-lg font-bold tracking-tight">Gate Scanner</div>
            <div className="text-xs text-foreground/50">
              {stats
                ? `${stats.totalCheckedIn} / ${stats.totalWithPass} checked in (${stats.percentage}%)`
                : 'Loading…'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin" className="pill pill-outline text-xs px-3 py-2">
              Admin
            </a>
            <button onClick={onLogout} className="pill pill-outline text-xs px-3 py-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Scanner Area */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-foreground/50 font-medium">Camera Scanner</div>
            {!scanning ? (
              <button onClick={startScanner} className="pill pill-primary text-xs px-4 py-2">
                Start Scanner
              </button>
            ) : (
              <button onClick={stopScanner} className="pill pill-outline text-xs px-4 py-2">
                Stop Scanner
              </button>
            )}
          </div>

          {cameraError && (
            <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-3">
              {cameraError}
            </div>
          )}

          <div
            ref={scannerContainerRef}
            className="relative rounded-xl overflow-hidden bg-black/5"
            style={{ minHeight: scanning ? 300 : 200 }}
          >
            <div id="scanner-viewfinder" className="w-full" />

            {!scanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-foreground/40">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Tap "Start Scanner" to begin</div>
                </div>
              </div>
            )}
          </div>

          {/* Scan Result Overlay */}
          {scanResult && (
            <div
              className={`mt-3 rounded-xl border-2 ${resultColors[scanResult.status].border} ${resultColors[scanResult.status].bg} p-5 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{resultColors[scanResult.status].icon}</div>
                <div className="flex-1">
                  <div className={`text-lg font-bold ${resultColors[scanResult.status].text}`}>
                    {scanResult.message}
                  </div>
                  {scanResult.passId && (
                    <div className="text-xs text-foreground/50 font-mono mt-1">
                      Pass: {scanResult.passId}
                    </div>
                  )}
                  {scanResult.status === 'success' && scanResult.ventureName && scanResult.ventureName !== 'N/A' && (
                    <div className="text-sm text-foreground/60 mt-1">{scanResult.ventureName}</div>
                  )}
                  {scanResult.status === 'success' && scanResult.district && (
                    <div className="text-sm text-foreground/60">{scanResult.district}</div>
                  )}
                  {scanResult.status === 'success' && ((scanResult.accompanyingInfants ?? 0) > 0 || (scanResult.accompanyingChildren ?? 0) > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(scanResult.accompanyingInfants ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          🍼 Infants: {scanResult.accompanyingInfants}
                        </span>
                      )}
                      {(scanResult.accompanyingChildren ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          🧒 Children: {scanResult.accompanyingChildren}
                        </span>
                      )}
                    </div>
                  )}
                  {scanResult.status === 'duplicate' && scanResult.fullName && (
                    <div className="text-sm text-foreground/60 mt-1">
                      {scanResult.fullName} — already entered
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {processing && (
            <div className="mt-3 text-center py-3">
              <span className="spinner" />
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-foreground/50 font-medium">
              Recent Check-ins
            </div>
            <button
              onClick={() => { loadRecentCheckIns(); loadStats(); }}
              className="pill pill-outline text-xs px-3 py-1.5"
            >
              Refresh
            </button>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-6 text-foreground/40 text-sm">
              No check-ins yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentCheckIns.map((ci) => (
                <div
                  key={ci._id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-black/8 bg-white/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{ci.fullName || '—'}</div>
                    <div className="text-xs text-foreground/50 truncate">
                      {[ci.ventureName !== 'N/A' ? ci.ventureName : null, ci.district]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-xs font-mono text-foreground/60">{ci.entryPassId || '—'}</div>
                    <div className="text-xs text-foreground/40">{formatDateTime(ci.checkedInAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
