import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './admin.css';

const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'wes_admin_token';

type Registration = {
  _id: string;
  fullName?: string;
  age?: number;
  whatsappNumber?: string;
  email?: string;
  district?: string;
  paymentScreenshot?: string;
  paymentVerified?: boolean;
  entryPassGenerated?: boolean;
  entryPassId?: string;
  entryPassUrl?: string;
  entryPassSentAt?: string;
  ventureName?: string;
  industry?: string;
  businessStage?: string;
  businessScale?: string;
  accompanyingInfants?: number;
  accompanyingChildren?: number;
  accompanyingCompanions?: number;
  createdAt?: string;
};

type PaymentQRItem = {
  _id: string;
  qrImage: string;
  upiId: string;
  amount: number;
  label?: string;
  isActive: boolean;
  createdAt?: string;
};

type ListResponse = {
  items: Registration[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type StatsResponse = {
  total: number;
  byIndustry: { _id: string; count: number }[];
  byStage: { _id: string; count: number }[];
  byScale: { _id: string; count: number }[];
  totalInfants: number;
  totalChildren: number;
  totalCompanions: number;
};

type OptionsResponse = {
  industry: string[];
  businessStage: string[];
  businessScale: string[];
};

type Filters = {
  search: string;
  industry: string;
  businessStage: string;
  businessScale: string;
  district: string;
  hasAccompanying: string;
};

type Toast = { id: number; message: string; kind: 'success' | 'error' };

type ConfirmTone = 'default' | 'danger';

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
};

function formatDate(s?: string, full = false) {
  if (!s) return '—';
  const d = new Date(s);
  if (full) return d.toLocaleString();
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

async function apiRequest(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null; raw?: boolean; formData?: FormData } = {}
): Promise<Response> {
  if (!API_URL) throw new Error('Server URL not configured');
  const headers: Record<string, string> = {};
  if (opts.body !== undefined && !opts.formData) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.formData ? opts.formData : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return res;
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

const DEFAULT_FILTERS: Filters = {
  search: '',
  industry: '',
  businessStage: '',
  businessScale: '',
  district: '',
  hasAccompanying: '',
};

const SORT_FIELDS: { value: string; label: string }[] = [
  { value: 'createdAt', label: 'Submitted At' },
  { value: 'fullName', label: 'Full Name' },
  { value: 'age', label: 'Age' },
  { value: 'email', label: 'Email' },
  { value: 'district', label: 'District' },
  { value: 'industry', label: 'Industry' },
  { value: 'businessStage', label: 'Stage' },
  { value: 'businessScale', label: 'Scale' },
  { value: 'ventureName', label: 'Venture' },
];

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleLogin = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="admin-shell">
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} onToast={showToast} />
      ) : (
        <Login onSuccess={handleLogin} />
      )}
      {toast && (
        <div className={`toast ${toast.kind}`} key={toast.id}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ----------------- LOGIN ----------------- */

function Login({ onSuccess }: { onSuccess: (token: string) => void }) {
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
          <div className="admin-display text-3xl font-bold tracking-tight">WES Admin</div>
          <div className="text-foreground/60 text-sm mt-2">Sign in to manage registrations</div>
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

/* ----------------- DASHBOARD ----------------- */

function Dashboard({
  token,
  onLogout,
  onToast,
}: {
  token: string;
  onLogout: () => void;
  onToast: (message: string, kind?: 'success' | 'error') => void;
}) {
  const [activeTab, setActiveTab] = useState<'registrations' | 'payment-qr' | 'check-ins' | 'check-outs' | 'settings' | 'feedback'>('registrations');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [filtersBarVersion, setFiltersBarVersion] = useState(0);
  const [limit, setLimit] = useState(20);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [options, setOptions] = useState<OptionsResponse>({
    industry: [],
    businessStage: [],
    businessScale: [],
  });
  const [list, setList] = useState<ListResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Registration | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const handleAuthError = useCallback(
    (err: unknown) => {
      const e = err as Error & { code?: number };
      if (e?.code === 401) {
        onLogout();
        return true;
      }
      return false;
    },
    [onLogout]
  );

  // load stats + options once
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiJson<OptionsResponse>('/api/registrations/options');
        if (active) setOptions(data);
      } catch {
        // non-fatal
      }
    })();
    (async () => {
      try {
        const data = await apiJson<StatsResponse>('/api/admin/registrations/stats', { token });
        if (active) setStats(data);
      } catch (err) {
        if (!handleAuthError(err)) onToast((err as Error).message, 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [token, handleAuthError, onToast]);

  // load list whenever query state changes
  useEffect(() => {
    let active = true;
    setListLoading(true);
    setListError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
    });
    (Object.entries(filters) as [keyof Filters, string][]).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    (async () => {
      try {
        const data = await apiJson<ListResponse>(
          `/api/admin/registrations?${params.toString()}`,
          { token }
        );
        if (!active) return;
        setList(data);
      } catch (err) {
        if (!active) return;
        if (handleAuthError(err)) return;
        setListError((err as Error).message);
      } finally {
        if (active) setListLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filters, sortBy, sortDir, page, limit, token, handleAuthError]);

  // debounce text filters (search + district) — modify state via local input then commit
  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    try {
      const requests: Promise<unknown>[] = [
        apiJson<StatsResponse>('/api/admin/registrations/stats', { token }),
        apiJson<ListResponse>(
          `/api/admin/registrations?${new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sortBy,
            sortDir,
            ...Object.fromEntries(
              Object.entries(filters).filter(([, v]) => Boolean(v))
            ),
          }).toString()}`,
          { token }
        ),
      ];

      if (detailId) {
        requests.push(apiJson<Registration>(`/api/admin/registrations/${detailId}`, { token }));
      }

      const [s, l, nextDetail] = await Promise.all(requests) as [
        StatsResponse,
        ListResponse,
        Registration | undefined,
      ];

      setStats(s);
      setList(l);
      if (detailId) {
        setDetail(nextDetail ?? null);
      }
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    }
  }, [token, page, limit, sortBy, sortDir, filters, detailId, handleAuthError, onToast]);

  // open detail
  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await apiJson<Registration>(`/api/admin/registrations/${detailId}`, { token });
        if (active) setDetail(data);
      } catch (err) {
        if (active) {
          if (!handleAuthError(err)) onToast((err as Error).message, 'error');
          setDetailId(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [detailId, token, handleAuthError, onToast]);

  const onColumnSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setFiltersBarVersion((current) => current + 1);
    setSortBy('createdAt');
    setSortDir('desc');
    setLimit(20);
    setPage(1);
  };

  const deleteRegistration = async () => {
    if (!detail) return;
    const deletedId = detail._id;
    try {
      await apiJson(`/api/admin/registrations/${deletedId}`, { method: 'DELETE', token });
      onToast('Registration deleted', 'success');
      setDetailId(null);
      setDetail(null);
      setList((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((r) => r._id !== deletedId), total: prev.total - 1 }
          : prev
      );
      // Refresh stats and list from server (skip detail fetch since it was deleted)
      try {
        const [s, l] = await Promise.all([
          apiJson<StatsResponse>('/api/admin/registrations/stats', { token }),
          apiJson<ListResponse>(
            `/api/admin/registrations?${new URLSearchParams({
              page: String(page),
              limit: String(limit),
              sortBy,
              sortDir,
              ...Object.fromEntries(Object.entries(filters).filter(([, v]) => Boolean(v))),
            }).toString()}`,
            { token }
          ),
        ]);
        setStats(s);
        setList(l);
      } catch (refreshErr) {
        if (!handleAuthError(refreshErr)) onToast((refreshErr as Error).message, 'error');
      }
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    }
  };

  const requestDelete = useCallback(() => {
    if (!detail) return;
    setConfirmDialog({
      title: 'Delete Registration',
      description: `Delete registration for ${detail.fullName || 'this attendee'}? This action cannot be undone.`,
      confirmLabel: 'Delete Registration',
      tone: 'danger',
      onConfirm: async () => {
        await deleteRegistration();
      },
    });
  }, [detail]);

  const requestLogout = useCallback(() => {
    setConfirmDialog({
      title: 'Log Out',
      description: 'End the current admin session now? You will need to sign in again to continue managing registrations.',
      confirmLabel: 'Log Out',
      tone: 'default',
      onConfirm: () => {
        onLogout();
      },
    });
  }, [onLogout]);

  const buildExcelRows = (items: Registration[]) =>
    items.map((r) => ({
      'Submitted At': r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
      'Full Name': r.fullName || '',
      'Age': r.age ?? '',
      'WhatsApp': r.whatsappNumber || '',
      'Email': r.email || '',
      'District': r.district || '',
      'Accompanying Infants (0-5)': r.accompanyingInfants ?? 0,
      'Accompanying Children (5-12)': r.accompanyingChildren ?? 0,
      'Accompanying Companions (12+)': r.accompanyingCompanions ?? 0,
      'Venture / Business': r.ventureName || '',
      'Industry': r.industry || '',
      'Business Stage': r.businessStage || '',
      'Business Scale': r.businessScale || '',
      'Payment Verified': r.paymentVerified ? 'Yes' : 'No',
      'Pass Generated': r.entryPassGenerated ? 'Yes' : 'No',
      'Pass ID': r.entryPassId || '',
      'Pass Sent At': r.entryPassSentAt ? new Date(r.entryPassSentAt).toLocaleString() : '',
    }));

  const fetchAllPages = async (extraParams: string) => {
    let allItems: Registration[] = [];
    let pg = 1;
    const lim = 200;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const data = await apiJson<ListResponse>(
        `/api/admin/registrations?page=${pg}&limit=${lim}&sortBy=createdAt&sortDir=desc${extraParams}`,
        { token }
      );
      allItems = [...allItems, ...data.items];
      if (allItems.length >= data.total || data.items.length === 0) break;
      pg++;
    }
    return allItems;
  };

  const fetchAllPagesWithFilters = async (customFilters: Filters, customSortBy: string, customSortDir: string) => {
    let allItems: Registration[] = [];
    let pg = 1;
    const lim = 200;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(lim),
        sortBy: customSortBy,
        sortDir: customSortDir,
        ...Object.fromEntries(Object.entries(customFilters).filter(([, v]) => Boolean(v))),
      });
      const data = await apiJson<ListResponse>(`/api/admin/registrations?${params.toString()}`, { token });
      allItems = [...allItems, ...data.items];
      if (allItems.length >= data.total || data.items.length === 0) break;
      pg++;
    }
    return allItems;
  };

  const onExportExcel = async () => {
    try {
      const allItems = await fetchAllPages('');
      const rows = buildExcelRows(allItems);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
      XLSX.writeFile(wb, `wes-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const onExportFilteredExcel = async () => {
    try {
      const allItems = await fetchAllPagesWithFilters(filters, sortBy, sortDir);
      const rows = buildExcelRows(allItems);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered');
      const suffix = filters.district
        ? `-${filters.district.toLowerCase().replace(/\s+/g, '-')}`
        : filters.industry
          ? `-${filters.industry.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          : '-filtered';
      XLSX.writeFile(wb, `wes-registrations${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    }
  };

  const onExportDistrictExcel = async () => {
    if (!filters.district) return;
    try {
      const allItems = await fetchAllPages(`&district=${encodeURIComponent(filters.district)}`);
      const rows = buildExcelRows(allItems);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, filters.district);
      const districtSlug = filters.district.toLowerCase().replace(/\s+/g, '-');
      XLSX.writeFile(wb, `wes-registrations-${districtSlug}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    }
  };

  const totalPages = list?.pages ?? 1;

  return (
    <section>
      <header className="border-b border-black/10 backdrop-blur-md bg-white/85 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="admin-display text-xl font-bold tracking-tight">WES Admin</div>
            <div className="text-xs text-foreground/50">Registration Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            {filters.district && (
              <button onClick={onExportDistrictExcel} className="pill pill-outline text-sm hidden md:inline-flex" title={`Export ${filters.district} registrations`}>
                Export {filters.district}
              </button>
            )}
            {hasActiveFilters && (
              <button
                onClick={onExportFilteredExcel}
                className="pill pill-outline text-sm hidden md:inline-flex"
                title={`Export ${list?.total ?? ''} filtered results`}
              >
                Export Filtered {list?.total != null ? `(${list.total})` : ''}
              </button>
            )}
            <button onClick={onExportExcel} className="pill pill-outline text-sm hidden md:inline-flex">
              Export Excel
            </button>
            <button onClick={requestLogout} className="pill pill-outline text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'registrations'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('payment-qr')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'payment-qr'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Payment QR
          </button>
          <button
            onClick={() => setActiveTab('check-ins')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'check-ins'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Check-ins
          </button>
          <button
            onClick={() => setActiveTab('check-outs')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'check-outs'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Check-outs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'feedback'
                ? 'border-[#e61980] text-[#e61980]'
                : 'border-transparent text-foreground/50 hover:text-foreground/70'
            }`}
          >
            Feedback
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeTab === 'registrations' ? (
          <>
            <StatsGrid stats={stats} />

            <FiltersBar
              key={filtersBarVersion}
              filters={filters}
              onFilterChange={setFilter}
              options={options}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortByChange={(v) => {
                setSortBy(v);
                setPage(1);
              }}
              onSortDirChange={(v) => {
                setSortDir(v);
                setPage(1);
              }}
              limit={limit}
              onLimitChange={(v) => {
                setLimit(v);
                setPage(1);
              }}
              resultCount={list?.total ?? null}
              onReset={resetFilters}
            />

            <DataTable
              items={list?.items ?? []}
              loading={listLoading}
              error={listError}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onColumnSort}
              onView={(id) => setDetailId(id)}
              page={list?.page ?? page}
              pages={totalPages}
              total={list?.total ?? 0}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </>
        ) : activeTab === 'payment-qr' ? (
          <PaymentQRManager token={token} onToast={onToast} onLogout={onLogout} />
        ) : activeTab === 'check-ins' ? (
          <CheckInsManager mode="check-in" token={token} onToast={onToast} onLogout={onLogout} />
        ) : activeTab === 'check-outs' ? (
          <CheckInsManager mode="check-out" token={token} onToast={onToast} onLogout={onLogout} />
        ) : activeTab === 'feedback' ? (
          <FeedbackManager token={token} onToast={onToast} onLogout={onLogout} />
        ) : (
          <SettingsManager token={token} onToast={onToast} onLogout={onLogout} />
        )}
      </main>

      {detailId && (
        <DetailModal
          detail={detail}
          onClose={() => setDetailId(null)}
          onDelete={requestDelete}
          token={token}
          onToast={onToast}
          onRefresh={refreshAfterMutation}
          onLogout={onLogout}
          options={options}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          tone={confirmDialog.tone}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </section>
  );
}

/* ----------------- STATS ----------------- */

function StatsGrid({ stats }: { stats: StatsResponse | null }) {
  const entrepreneurs = stats?.total ?? 0;
  const infants = stats?.totalInfants ?? 0;
  const children = stats?.totalChildren ?? 0;
  const companions = stats?.totalCompanions ?? 0;
  const totalAttendees = entrepreneurs + infants + children + companions;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="glass p-5">
        <div className="text-xs uppercase tracking-wider text-foreground/50">Total Attendees</div>
        <div className="admin-display text-3xl font-bold mt-2">{stats ? totalAttendees : '—'}</div>
        <div className="text-xs text-foreground/40 mt-1">Incl. accompanying</div>
      </div>
      <div className="glass p-5">
        <div className="text-xs uppercase tracking-wider text-foreground/50">Entrepreneurs</div>
        <div className="admin-display text-3xl font-bold mt-2">{stats ? entrepreneurs : '—'}</div>
        <div className="text-xs text-foreground/40 mt-1">Registered women</div>
      </div>
      <div className="glass p-5">
        <div className="text-xs uppercase tracking-wider text-foreground/50">Companions (12+)</div>
        <div className="admin-display text-3xl font-bold mt-2">{stats ? companions : '—'}</div>
        <div className="text-xs text-foreground/40 mt-1">Accompanying</div>
      </div>
      <div className="glass p-5">
        <div className="text-xs uppercase tracking-wider text-foreground/50">Children (5–12)</div>
        <div className="admin-display text-3xl font-bold mt-2">{stats ? children : '—'}</div>
        <div className="text-xs text-foreground/40 mt-1">Accompanying</div>
      </div>
      <div className="glass p-5">
        <div className="text-xs uppercase tracking-wider text-foreground/50">Infants (0–5)</div>
        <div className="admin-display text-3xl font-bold mt-2">{stats ? infants : '—'}</div>
        <div className="text-xs text-foreground/40 mt-1">Accompanying</div>
      </div>
    </div>
  );
}

/* ----------------- FILTERS ----------------- */

function FiltersBar({
  filters,
  onFilterChange,
  options,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  limit,
  onLimitChange,
  resultCount,
  onReset,
}: {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  options: OptionsResponse;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSortByChange: (v: string) => void;
  onSortDirChange: (v: 'asc' | 'desc') => void;
  limit: number;
  onLimitChange: (v: number) => void;
  resultCount: number | null;
  onReset: () => void;
}) {
  // local state for debounced text inputs
  const [search, setSearch] = useState(filters.search);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (search !== filters.search) {
        onFilterChange('search', search);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, filters.search, onFilterChange]);

  const isActive =
    !!filters.search ||
    !!filters.industry ||
    !!filters.businessStage ||
    !!filters.businessScale ||
    !!filters.district ||
    !!filters.hasAccompanying;

  return (
    <div className="glass p-5">
      {/* Toggle bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`pill pill-outline text-sm flex items-center gap-2 ${open || isActive ? 'border-[#e61980] text-[#e61980]' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {isActive && (
            <span className="rounded-full bg-[#e61980] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center leading-none">
              {[filters.search, filters.industry, filters.businessStage, filters.businessScale, filters.district, filters.hasAccompanying].filter(Boolean).length}
            </span>
          )}
        </button>
        <div className="text-sm text-foreground/50">
          {resultCount !== null && `${resultCount} result${resultCount === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Collapsible filter grid */}
      {open && (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Search
          </label>
          <input
            className="input"
            placeholder="Name, email, phone, district, business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Industry
          </label>
          <select
            className="input"
            value={filters.industry}
            onChange={(e) => onFilterChange('industry', e.target.value)}
          >
            <option value="">All</option>
            {options.industry.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Stage
          </label>
          <select
            className="input"
            value={filters.businessStage}
            onChange={(e) => onFilterChange('businessStage', e.target.value)}
          >
            <option value="">All</option>
            {options.businessStage.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Scale
          </label>
          <select
            className="input"
            value={filters.businessScale}
            onChange={(e) => onFilterChange('businessScale', e.target.value)}
          >
            <option value="">All</option>
            {options.businessScale.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            District
          </label>
          <select
            className="input"
            value={filters.district}
            onChange={(e) => onFilterChange('district', e.target.value)}
          >
            <option value="">Any</option>
            {KERALA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Accompanying
          </label>
          <select
            className="input"
            value={filters.hasAccompanying}
            onChange={(e) => onFilterChange('hasAccompanying', e.target.value)}
          >
            <option value="">Any</option>
            <option value="any">Has Any Accompanying</option>
            <option value="companions">Has Companions (12+)</option>
            <option value="children">Has Children (5–12)</option>
            <option value="infants">Has Infants (0–5)</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Sort by
          </label>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
          >
            {SORT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Direction
          </label>
          <select
            className="input"
            value={sortDir}
            onChange={(e) => onSortDirChange(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
            Per page
          </label>
          <select
            className="input"
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value, 10) || 20)}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="md:col-span-5 flex items-end gap-3">
          <button onClick={onReset} className="pill pill-outline text-sm">
            Reset
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

/* ----------------- TABLE ----------------- */

function DataTable({
  items,
  loading,
  error,
  sortBy,
  sortDir,
  onSort,
  onView,
  page,
  pages,
  total,
  onPrev,
  onNext,
}: {
  items: Registration[];
  loading: boolean;
  error: string | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  onView: (id: string) => void;
  page: number;
  pages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const headers: { sort?: string; label: string }[] = useMemo(
    () => [
      { sort: 'fullName', label: 'Full Name' },
      { sort: 'age', label: 'Age' },
      { label: 'Contact' },
      { sort: 'district', label: 'District' },
      { label: 'Children' },
      { label: 'Payment' },
      { label: 'Status' },
      { label: 'Venture' },
      { sort: 'industry', label: 'Industry' },
      { sort: 'createdAt', label: 'Submitted' },
      { label: '' },
    ],
    []
  );

  const arrowFor = (field?: string) => {
    if (!field) return '';
    if (field !== sortBy) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="glass overflow-hidden">
      <div className="scroll-x">
        <table className="data admin-data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={h.sort && h.sort === sortBy ? 'active' : ''}
                  onClick={h.sort ? () => onSort(h.sort!) : undefined}
                  style={{ cursor: h.sort ? 'pointer' : 'default' }}
                >
                  {h.label}
                  {h.sort && <span className="arrow"> {arrowFor(h.sort)}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-foreground/50">
                  <span className="spinner" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-red-300">
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-foreground/50">
                  No registrations match these filters.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it._id}>
                  <td>
                    <div className="admin-cell-name">{it.fullName || '—'}</div>
                  </td>
                  <td>{it.age ?? ''}</td>
                  <td>
                    <div className="admin-cell-contact">{it.email || '—'}</div>
                    <div className="admin-cell-subtle">{it.whatsappNumber || '—'}</div>
                  </td>
                  <td>
                    <div className="admin-cell-compact">{it.district || '—'}</div>
                  </td>
                  <td>
                    {(it.accompanyingInfants ?? 0) > 0 || (it.accompanyingChildren ?? 0) > 0 || (it.accompanyingCompanions ?? 0) > 0 ? (
                      <div className="flex flex-col gap-1">
                        {(it.accompanyingInfants ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-sky-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                            <span className="font-medium">{it.accompanyingInfants}</span>
                            <span className="text-foreground/40">0–5</span>
                          </div>
                        )}
                        {(it.accompanyingChildren ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-violet-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                            <span className="font-medium">{it.accompanyingChildren}</span>
                            <span className="text-foreground/40">5–12</span>
                          </div>
                        )}
                        {(it.accompanyingCompanions ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="font-medium">{it.accompanyingCompanions}</span>
                            <span className="text-foreground/40">12+</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    {it.paymentScreenshot ? (
                      it.paymentScreenshot.toLowerCase().endsWith('.pdf') ? (
                        <a
                          href={it.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                          PDF
                        </a>
                      ) : (
                        <a href={it.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                          <img
                            src={it.paymentScreenshot}
                            alt="Payment"
                            className="w-10 h-10 rounded object-cover border border-black/10 hover:opacity-80 transition"
                          />
                        </a>
                      )
                    ) : (
                      <span className="text-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    {it.entryPassSentAt ? (
                      <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30">Sent</span>
                    ) : it.entryPassGenerated ? (
                      <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/30">Pass Ready</span>
                    ) : it.paymentVerified ? (
                      <span className="badge bg-green-500/20 text-green-300 border-green-500/30">Verified</span>
                    ) : (
                      <span className="badge bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-cell-venture">{it.ventureName || '—'}</div>
                  </td>
                  <td>
                    <span className="badge admin-badge-fit">{it.industry || '—'}</span>
                  </td>
                  <td className="text-foreground/70 text-xs">{formatDate(it.createdAt)}</td>
                  <td>
                    <button
                      className="pill pill-outline admin-table-action text-xs"
                      onClick={() => onView(it._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-4 border-t border-black/10">
        <div className="text-sm text-foreground/50">
          {pages > 0 ? `Page ${page} of ${pages} · ${total} total` : '—'}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} disabled={page <= 1} className="pill pill-outline text-sm">
            Previous
          </button>
          <button onClick={onNext} disabled={page >= pages} className="pill pill-outline text-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- DETAIL MODAL ----------------- */

function DetailModal({
  detail,
  onClose,
  onDelete,
  token,
  onToast,
  onRefresh,
  onLogout,
  options,
}: {
  detail: Registration | null;
  onClose: () => void;
  onDelete: () => void;
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  options: OptionsResponse;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string | number>>({});

  // Populate edit form when detail loads
  useEffect(() => {
    if (detail) {
      setEditValues({
        fullName: detail.fullName ?? '',
        age: detail.age ?? '',
        whatsappNumber: detail.whatsappNumber ?? '',
        email: detail.email ?? '',
        district: detail.district ?? '',
        ventureName: detail.ventureName ?? '',
        industry: detail.industry ?? '',
        businessStage: detail.businessStage ?? '',
        businessScale: detail.businessScale ?? '',
        accompanyingInfants: detail.accompanyingInfants ?? 0,
        accompanyingChildren: detail.accompanyingChildren ?? 0,
        accompanyingCompanions: detail.accompanyingCompanions ?? 0,
      });
      setEditMode(false);
    }
  }, [detail?._id]);

  const handleSaveEdit = async () => {
    if (!detail) return;
    setEditSaving(true);
    try {
      await apiJson(`/api/admin/registrations/${detail._id}`, {
        method: 'PATCH',
        token,
        body: editValues,
      });
      onToast('Registration updated', 'success');
      setEditMode(false);
      await onRefresh();
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message || 'Failed to save changes', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const setField = (key: string, value: string | number) =>
    setEditValues((prev) => ({ ...prev, [key]: value }));

  const inputCls = 'w-full rounded-lg bg-black/[0.04] border border-black/12 text-foreground placeholder-foreground/30 px-3 py-2 text-sm outline-none focus:border-primary/50';
  const labelCls = 'block text-[10px] uppercase tracking-wider text-foreground/50 mb-1';

  const handleAction = async (action: string, method: string, path: string) => {
    if (!detail) return;
    setActionLoading(action);
    try {
      await apiJson(path, { method, token });
      onToast(
        action === 'verify' ? 'Payment verified' :
        action === 'generate' ? 'Entry pass generated' :
        'Entry pass sent via WhatsApp',
        'success'
      );
      await onRefresh();
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const fields: [string, unknown][] = detail
    ? [
        ['Age', detail.age],
        ['WhatsApp', detail.whatsappNumber],
        ['Email', detail.email],
        ['District', detail.district],
        ['Accompanying Infants (0–5)', detail.accompanyingInfants ?? 0],
        ['Accompanying Children (5–12)', detail.accompanyingChildren ?? 0],
        ['Accompanying Companions (12+)', detail.accompanyingCompanions ?? 0],
        ['Venture / Business', detail.ventureName],
        ['Industry / Sector', detail.industry],
        ['Business Stage', detail.businessStage],
        ['Business Scale', detail.businessScale],
        ['Submitted At', formatDate(detail.createdAt, true)],
      ]
    : [];

  const workflowStep = !detail
    ? null
    : detail.entryPassSentAt
      ? 'sent'
      : detail.entryPassGenerated
        ? 'generated'
        : detail.paymentVerified
          ? 'verified'
          : 'pending';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-strong admin-scrollbar-hide max-w-[58rem] w-[92%] max-h-[88vh] overflow-y-auto p-5 md:p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-foreground/50">Registration</div>
            <div className="admin-display text-xl md:text-2xl font-bold leading-tight pr-4">
              {detail?.fullName || (detail ? '—' : '')}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!detail ? (
          <div className="py-10 text-center text-foreground/50">
            <span className="spinner" />
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-black/10 bg-black/[0.03] p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-foreground/45">Workflow</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`badge ${workflowStep === 'pending' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' : ''}`}>
                      1. Verify Payment
                    </span>
                    <span className={`badge ${workflowStep === 'verified' || workflowStep === 'generated' || workflowStep === 'sent' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' : ''}`}>
                      2. Generate Pass
                    </span>
                    <span className={`badge ${workflowStep === 'sent' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : ''}`}>
                      3. Send Ticket
                    </span>
                  </div>
                </div>
                <div className="text-sm text-foreground/60 max-w-xs">
                  {workflowStep === 'pending' && 'Verify the payment first to unlock pass generation.'}
                  {workflowStep === 'verified' && 'Payment is verified. You can generate the attendee pass now.'}
                  {workflowStep === 'generated' && 'Pass is ready. Send it directly through WhatsApp from here.'}
                  {workflowStep === 'sent' && 'Ticket has been sent. You can resend it if the attendee requests another copy.'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
              <div>
                {editMode ? (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-4">
                    <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">Editing Registration</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name</label>
                        <input className={inputCls} value={editValues.fullName as string} onChange={(e) => setField('fullName', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Age</label>
                        <input type="number" className={inputCls} value={editValues.age as number} onChange={(e) => setField('age', Number(e.target.value))} min={10} max={120} />
                      </div>
                      <div>
                        <label className={labelCls}>WhatsApp Number</label>
                        <input className={inputCls} value={editValues.whatsappNumber as string} onChange={(e) => setField('whatsappNumber', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" className={inputCls} value={editValues.email as string} onChange={(e) => setField('email', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>District</label>
                        <select className={inputCls} value={editValues.district as string} onChange={(e) => setField('district', e.target.value)}>
                          {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Venture / Business Name</label>
                        <input className={inputCls} value={editValues.ventureName as string} onChange={(e) => setField('ventureName', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Industry / Sector</label>
                        <select className={inputCls} value={editValues.industry as string} onChange={(e) => setField('industry', e.target.value)}>
                          {options.industry.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Business Stage</label>
                        <select className={inputCls} value={editValues.businessStage as string} onChange={(e) => setField('businessStage', e.target.value)}>
                          {options.businessStage.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Business Scale</label>
                        <select className={inputCls} value={editValues.businessScale as string} onChange={(e) => setField('businessScale', e.target.value)}>
                          {options.businessScale.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Infants (0–5)</label>
                        <input type="number" className={inputCls} min={0} value={editValues.accompanyingInfants as number} onChange={(e) => setField('accompanyingInfants', Math.max(0, Number(e.target.value)))} />
                      </div>
                      <div>
                        <label className={labelCls}>Children (5–12)</label>
                        <input type="number" className={inputCls} min={0} value={editValues.accompanyingChildren as number} onChange={(e) => setField('accompanyingChildren', Math.max(0, Number(e.target.value)))} />
                      </div>
                      <div>
                        <label className={labelCls}>Companions (12+)</label>
                        <input type="number" className={inputCls} min={0} value={editValues.accompanyingCompanions as number} onChange={(e) => setField('accompanyingCompanions', Math.max(0, Number(e.target.value)))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {fields.map(([label, val]) => (
                      <div key={label} className="rounded-xl border border-black/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-xs uppercase tracking-wider text-foreground/50">{label}</div>
                        <div className="mt-1 break-words text-foreground/90">
                          {val === null || val === undefined || val === '' ? '—' : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detail.paymentScreenshot && (
                  <div className="mt-5">
                    <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">Payment Screenshot</div>
                    {detail.paymentScreenshot.toLowerCase().endsWith('.pdf') ? (
                      <a
                        href={detail.paymentScreenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <a href={detail.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                        <img
                          src={detail.paymentScreenshot}
                          alt="Payment screenshot"
                          className="max-w-full md:max-w-sm rounded-lg border border-black/10 hover:opacity-90 transition"
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4">
                <div className="text-xs uppercase tracking-wider text-foreground/50 mb-3">Actions</div>
                <div className="flex flex-col gap-2">
                  {!detail.paymentVerified && (
                    <button
                      onClick={() => handleAction('verify', 'PATCH', `/api/admin/registrations/${detail._id}/verify-payment`)}
                      disabled={actionLoading === 'verify'}
                      className="pill text-sm bg-green-600/80 text-white hover:bg-green-600 w-full"
                    >
                      {actionLoading === 'verify' ? <span className="spinner" /> : 'Verify Payment'}
                    </button>
                  )}
                  {detail.paymentVerified && !detail.entryPassGenerated && (
                    <button
                      onClick={() => handleAction('generate', 'POST', `/api/admin/registrations/${detail._id}/generate-pass`)}
                      disabled={actionLoading === 'generate'}
                      className="pill text-sm bg-purple-600/80 text-white hover:bg-purple-600 w-full"
                    >
                      {actionLoading === 'generate' ? <span className="spinner" /> : 'Generate Pass'}
                    </button>
                  )}
                  {detail.entryPassGenerated && (
                    <button
                      onClick={() => handleAction('send', 'POST', `/api/admin/registrations/${detail._id}/send-pass`)}
                      disabled={actionLoading === 'send'}
                      className="pill text-sm bg-blue-600/80 text-white hover:bg-blue-600 w-full"
                    >
                      {actionLoading === 'send' ? <span className="spinner" /> : detail.entryPassSentAt ? 'Resend Ticket' : 'Send Ticket'}
                    </button>
                  )}
                </div>

                {detail.entryPassUrl && (
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">Entry Pass</div>
                    <a href={detail.entryPassUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={detail.entryPassUrl}
                        alt="Entry pass"
                        className="w-full rounded-lg border border-black/10 hover:opacity-90 transition"
                      />
                    </a>
                    {detail.entryPassId && (
                      <div className="mt-2 text-xs text-foreground/50">
                        Pass ID: <span className="font-mono text-foreground/70">{detail.entryPassId}</span>
                      </div>
                    )}
                    {detail.entryPassSentAt && (
                      <div className="mt-1 text-xs text-foreground/50">
                        Sent: {formatDate(detail.entryPassSentAt, true)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onDelete} className="pill pill-outline pill-danger text-sm">
            Delete
          </button>
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="pill pill-outline text-sm">
              Edit
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} className="pill pill-outline text-sm" disabled={editSaving}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="pill pill-primary text-sm" disabled={editSaving}>
                {editSaving ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </>
          )}
          {!editMode && (
            <button onClick={onClose} className="pill pill-primary text-sm">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  tone = 'default',
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'pill pill-danger-solid text-sm'
      : 'pill pill-primary text-sm';

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="glass-strong w-[min(92vw,32rem)] p-7 md:p-8">
        <div className="mb-4 inline-flex rounded-full border border-black/12 bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
          Confirmation
        </div>
        <h3 className="admin-display text-2xl font-bold leading-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-foreground/60">{description}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="pill pill-outline text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={confirmClass}
          >
            {submitting ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- SETTINGS MANAGER ----------------- */

function SettingsManager({
  token,
  onToast,
  onLogout,
}: {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
}) {
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiJson<{ registrationEnabled: boolean }>(
          '/api/admin/settings',
          { token }
        );
        if (active) setRegistrationEnabled(data.registrationEnabled);
      } catch (e: unknown) {
        if (!active) return;
        const err = e as Error & { code?: number };
        if (err.code === 401) { onLogout(); return; }
        onToast('Failed to load settings', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, onLogout, onToast]);

  const toggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      const data = await apiJson<{ registrationEnabled: boolean }>(
        '/api/admin/settings',
        { token, method: 'PATCH', body: { registrationEnabled: enabled } }
      );
      setRegistrationEnabled(data.registrationEnabled);
      onToast(
        data.registrationEnabled
          ? 'Registrations are now OPEN — landing page button is visible.'
          : 'Registrations are now CLOSED — landing page button is hidden.',
        'success'
      );
    } catch (e: unknown) {
      const err = e as Error & { code?: number };
      if (err.code === 401) { onLogout(); return; }
      onToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 sm:p-8">
        <h2 className="admin-display text-xl font-semibold mb-1">Registration Settings</h2>
        <p className="text-sm text-foreground/50 mb-8">
          Toggle whether the public registration button and form are shown on the landing page.
          When disabled, the landing page shows &quot;Registrations are now closed&quot; and the server
          rejects any new submissions.
        </p>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-foreground/50">
            <span className="spinner" /> Loading settings…
          </div>
        ) : (
          <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div>
              <p className="font-medium text-foreground mb-0.5">Public Registration</p>
              <p className="text-sm text-foreground/50">
                {registrationEnabled
                  ? 'Currently OPEN — the Register button is visible on the landing page.'
                  : 'Currently CLOSED — the Register button is hidden on the landing page.'}
              </p>
            </div>

            <button
              onClick={() => toggle(!registrationEnabled)}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                registrationEnabled ? 'bg-emerald-500' : 'bg-white/20'
              }`}
              role="switch"
              aria-checked={registrationEnabled ?? false}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  registrationEnabled ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------- PAYMENT QR MANAGER ----------------- */

function PaymentQRManager({
  token,
  onToast,
  onLogout,
}: {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
}) {
  const [items, setItems] = useState<PaymentQRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editItem, setEditItem] = useState<PaymentQRItem | null>(null);
  const [editUpiId, setEditUpiId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editQrFile, setEditQrFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await apiJson<{ items: PaymentQRItem[] }>('/api/admin/payment-qr', { token });
      setItems(data.items);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, onToast, onLogout]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrFile || !upiId.trim() || !amount.trim()) {
      onToast('Please fill all fields and select a QR image', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('qrImage', qrFile);
      fd.append('upiId', upiId.trim());
      fd.append('amount', amount.trim());
      fd.append('label', label.trim());

      const res = await apiRequest('/api/admin/payment-qr', {
        method: 'POST',
        token,
        formData: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onToast('Payment QR added', 'success');
      setUpiId('');
      setAmount('');
      setLabel('');
      setQrFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadItems();
    } catch (err) {
      onToast((err as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const onActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await apiJson(`/api/admin/payment-qr/${id}/activate`, { method: 'PATCH', token });
      onToast('QR activated', 'success');
      await loadItems();
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const onDeactivate = async (id: string) => {
    setActionLoading(id);
    try {
      await apiJson(`/api/admin/payment-qr/${id}/deactivate`, { method: 'PATCH', token });
      onToast('QR deactivated', 'success');
      await loadItems();
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const onDeleteQR = async (id: string) => {
    setActionLoading(id);
    try {
      await apiJson(`/api/admin/payment-qr/${id}`, { method: 'DELETE', token });
      onToast('QR deleted', 'success');
      await loadItems();
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeleteQR = useCallback((item: PaymentQRItem) => {
    setConfirmDialog({
      title: 'Delete Payment QR',
      description: `Remove the payment QR for ${item.upiId}? Attendees will no longer be able to use this configuration once it is deleted.`,
      confirmLabel: 'Delete QR',
      tone: 'danger',
      onConfirm: async () => {
        await onDeleteQR(item._id);
      },
    });
  }, []);

  const openEditModal = useCallback((item: PaymentQRItem) => {
    setEditItem(item);
    setEditUpiId(item.upiId);
    setEditAmount(String(item.amount));
    setEditLabel(item.label ?? '');
    setEditQrFile(null);
    if (editFileRef.current) editFileRef.current.value = '';
  }, []);

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editUpiId.trim() || !editAmount.trim()) {
      onToast('UPI ID and amount are required', 'error');
      return;
    }
    setEditSaving(true);
    try {
      const fd = new FormData();
      fd.append('upiId', editUpiId.trim());
      fd.append('amount', editAmount.trim());
      fd.append('label', editLabel.trim());
      if (editQrFile) fd.append('qrImage', editQrFile);

      const res = await apiRequest(`/api/admin/payment-qr/${editItem._id}`, {
        method: 'PATCH',
        token,
        formData: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error(data.error || 'Update failed');

      onToast('Payment QR updated', 'success');
      setEditItem(null);
      await loadItems();
    } catch (err) {
      onToast((err as Error).message, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="glass p-6">
        <h3 className="admin-display text-lg font-bold mb-4">Add Payment QR</h3>
        <form onSubmit={onUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              QR Image *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setQrFile(e.target.files?.[0] || null)}
              className="input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-foreground/70 file:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              UPI ID *
            </label>
            <input
              type="text"
              className="input"
              placeholder="name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              Amount (₹) *
            </label>
            <input
              type="number"
              className="input"
              placeholder="500"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              Label (optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Primary UPI"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="pill pill-primary text-sm" disabled={uploading}>
              {uploading ? <span className="spinner" /> : 'Add QR'}
            </button>
          </div>
        </form>
      </div>

      {/* QR List */}
      <div className="glass p-6">
        <h3 className="admin-display text-lg font-bold mb-4">Payment QR Configs</h3>
        <p className="text-xs text-foreground/40 mb-4">Only one QR can be active at a time. The active QR is shown on the registration form.</p>

        {loading ? (
          <div className="text-center py-8">
            <span className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-foreground/50 text-sm">
            No payment QR configs yet. Add one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className={`rounded-xl border p-4 ${
                  item.isActive
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-black/10 bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.qrImage}
                    alt="QR"
                    className="w-20 h-20 rounded-lg object-contain bg-white p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isActive ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-foreground/50 border border-black/10">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-mono text-foreground/80 truncate">{item.upiId}</div>
                    <div className="text-sm text-foreground/60">₹{item.amount.toLocaleString('en-IN')}</div>
                    {item.label && (
                      <div className="text-xs text-foreground/40 mt-1">{item.label}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {item.isActive ? (
                    <button
                      onClick={() => onDeactivate(item._id)}
                      disabled={actionLoading === item._id}
                      className="pill pill-outline text-xs"
                    >
                      {actionLoading === item._id ? <span className="spinner" /> : 'Deactivate'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(item._id)}
                      disabled={actionLoading === item._id}
                      className="pill text-xs bg-green-600/80 text-white hover:bg-green-600"
                    >
                      {actionLoading === item._id ? <span className="spinner" /> : 'Activate'}
                    </button>
                  )}
                  <button
                    onClick={() => requestDeleteQR(item)}
                    disabled={actionLoading === item._id}
                    className="pill pill-outline pill-danger text-xs"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    disabled={actionLoading === item._id}
                    className="pill pill-outline text-xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          tone={confirmDialog.tone}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {editItem && (
        <div
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget && !editSaving) setEditItem(null); }}
        >
          <div className="glass-strong w-[min(92vw,36rem)] p-7 md:p-8">
            <div className="mb-4 inline-flex rounded-full border border-black/12 bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
              Edit QR
            </div>
            <h3 className="admin-display text-xl font-bold leading-tight mb-6">Edit Payment QR</h3>
            <form onSubmit={onSaveEdit} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
                  UPI ID *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="name@upi"
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="500"
                  min={1}
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
                  Label (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Primary UPI"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
                  Replace QR Image (optional)
                </label>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEditQrFile(e.target.files?.[0] || null)}
                  className="input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-foreground/70 file:text-sm"
                  disabled={editSaving}
                />
                <p className="text-xs text-foreground/40 mt-1">Leave empty to keep the existing QR image.</p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  disabled={editSaving}
                  className="pill pill-outline text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="pill pill-primary text-sm" disabled={editSaving}>
                  {editSaving ? <span className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- CHECK-INS MANAGER ----------------- */

type CheckInItem = {
  _id: string;
  fullName?: string;
  age?: number;
  email?: string;
  whatsappNumber?: string;
  district?: string;
  ventureName?: string;
  industry?: string;
  businessStage?: string;
  businessScale?: string;
  entryPassId?: string;
  accompanyingInfants?: number;
  accompanyingChildren?: number;
  accompanyingCompanions?: number;
  checkedInAt?: string;
  checkedInBy?: string;
  checkedOutAt?: string;
  checkedOutBy?: string;
};

type CheckInStatsResponse = {
  totalCheckedIn: number;
  totalWithPass: number;
  percentage: number;
  // check-out stats variant fields (same response shape, different keys)
  totalCheckedOut?: number;
};

type CheckOutStatsResponse = {
  totalCheckedOut: number;
  totalCheckedIn: number;
  percentage: number;
};

type CheckInListResponse = {
  items: CheckInItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

function CheckInsManager({
  mode,
  token,
  onToast,
  onLogout,
}: {
  mode: 'check-in' | 'check-out';
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
}) {
  const isCheckIn = mode === 'check-in';
  const listEndpoint = isCheckIn ? '/api/admin/check-ins' : '/api/admin/check-outs';
  const statsEndpoint = isCheckIn ? '/api/admin/check-ins/stats' : '/api/admin/check-outs/stats';
  const sortByField = isCheckIn ? 'checkedInAt' : 'checkedOutAt';
  const timestampKey: keyof CheckInItem = isCheckIn ? 'checkedInAt' : 'checkedOutAt';
  const byKey: keyof CheckInItem = isCheckIn ? 'checkedInBy' : 'checkedOutBy';
  const exportFilename = isCheckIn
    ? `wes-check-ins-${new Date().toISOString().slice(0, 10)}.xlsx`
    : `wes-check-outs-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const [stats, setStats] = useState<CheckInStatsResponse | null>(null);
  const [list, setList] = useState<CheckInListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const handleAuthError = useCallback(
    (err: unknown) => {
      const e = err as Error & { code?: number };
      if (e?.code === 401) {
        onLogout();
        return true;
      }
      return false;
    },
    [onLogout]
  );

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiJson<CheckInStatsResponse>(statsEndpoint, { token });
      setStats(data);
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    }
  }, [token, statsEndpoint, handleAuthError, onToast]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: sortByField,
        sortDir: 'desc',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const data = await apiJson<CheckInListResponse>(
        `${listEndpoint}?${params.toString()}`,
        { token }
      );
      setList(data);
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, debouncedSearch, handleAuthError, onToast, listEndpoint, sortByField]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onExportCheckIns = async () => {
    try {
      let allItems: CheckInItem[] = [];
      let pg = 1;
      const lim = 200;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const data = await apiJson<CheckInListResponse>(
          `${listEndpoint}?page=${pg}&limit=${lim}&sortBy=${sortByField}&sortDir=desc`,
          { token }
        );
        allItems = [...allItems, ...data.items];
        if (allItems.length >= data.total || data.items.length === 0) break;
        pg++;
      }

      const sheetName = isCheckIn ? 'Check-ins' : 'Check-outs';
      const actionLabel = isCheckIn ? 'Checked In' : 'Checked Out';
      const rows = allItems.map((ci) => ({
        [isCheckIn ? 'Checked In At' : 'Checked Out At']:
          (isCheckIn ? ci.checkedInAt : ci.checkedOutAt)
            ? new Date((isCheckIn ? ci.checkedInAt : ci.checkedOutAt) as string).toLocaleString()
            : '',
        'Full Name': ci.fullName || '',
        'Age': ci.age ?? '',
        'WhatsApp': ci.whatsappNumber || '',
        'Email': ci.email || '',
        'District': ci.district || '',
        'Venture / Business': ci.ventureName || '',
        'Industry': ci.industry || '',
        'Business Stage': ci.businessStage || '',
        'Business Scale': ci.businessScale || '',
        'Accompanying Infants (0-5)': ci.accompanyingInfants ?? 0,
        'Accompanying Children (5-12)': ci.accompanyingChildren ?? 0,
        'Accompanying Companions (12+)': ci.accompanyingCompanions ?? 0,
        'Pass ID': ci.entryPassId || '',
        [`${actionLabel} By`]: (isCheckIn ? ci.checkedInBy : ci.checkedOutBy) || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, exportFilename);
    } catch (err) {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return; }
      onToast(e.message, 'error');
    }
  };

  const totalPages = list?.pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isCheckIn ? (
          <>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Checked In</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats?.totalCheckedIn ?? '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Total Passes</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats?.totalWithPass ?? '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Attendance %</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats ? `${stats.percentage}%` : '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Remaining</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats ? (stats.totalWithPass ?? 0) - (stats.totalCheckedIn ?? 0) : '—'}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Checked Out</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {(stats as unknown as CheckOutStatsResponse)?.totalCheckedOut ?? '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Checked In (Total)</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {(stats as unknown as CheckOutStatsResponse)?.totalCheckedIn ?? '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Check-out %</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats ? `${stats.percentage}%` : '—'}
              </div>
            </div>
            <div className="glass p-5">
              <div className="text-xs uppercase tracking-wider text-foreground/50">Still Inside</div>
              <div className="admin-display text-3xl font-bold mt-2">
                {stats
                  ? (stats.totalCheckedIn ?? 0) - ((stats as unknown as CheckOutStatsResponse).totalCheckedOut ?? 0)
                  : '—'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="glass p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              Search
            </label>
            <input
              className="input"
              placeholder="Name, pass ID, venture, district…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-1.5">
              Per page
            </label>
            <select
              className="input"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10) || 20);
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            onClick={() => { loadStats(); loadList(); }}
            className="pill pill-outline text-sm"
          >
            Refresh
          </button>
          <button onClick={onExportCheckIns} className="pill pill-outline text-sm">
            Export Excel
          </button>
          <a href="/scanner" target="_blank" rel="noopener noreferrer" className="pill pill-primary text-sm">
            Open Scanner
          </a>
        </div>
        <div className="mt-2 text-sm text-foreground/50">
          {list
            ? `${list.total} ${isCheckIn ? 'checked-in' : 'checked-out'} attendee${list.total === 1 ? '' : 's'}`
            : ''}
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="scroll-x">
          <table className="data" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Venture</th>
                <th>District</th>
                <th>Pass ID</th>
                <th>{isCheckIn ? 'Checked In At' : 'Checked Out At'}</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-foreground/50">
                    <span className="spinner" />
                  </td>
                </tr>
              ) : !list || list.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-foreground/50">
                    {isCheckIn ? 'No check-ins yet.' : 'No check-outs yet.'}
                  </td>
                </tr>
              ) : (
                list.items.map((ci) => (
                  <tr key={ci._id}>
                    <td>
                      <div className="font-semibold">{ci.fullName || '—'}</div>
                    </td>
                    <td>{ci.ventureName || '—'}</td>
                    <td>{ci.district || '—'}</td>
                    <td>
                      <span className="font-mono text-xs">{ci.entryPassId || '—'}</span>
                    </td>
                    <td className="text-xs">{formatDate(ci[timestampKey] as string | undefined, true)}</td>
                    <td className="text-xs text-foreground/60">{(ci[byKey] as string) || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/10">
          <div className="text-sm text-foreground/50">
            {list && totalPages > 0
              ? `Page ${list.page} of ${totalPages} · ${list.total} total`
              : '—'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="pill pill-outline text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="pill pill-outline text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- FEEDBACK MANAGER ----------------- */

type FeedbackItem = {
  _id: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  overallRating: number;
  sessionQuality: number;
  venueRating: number;
  liked?: string;
  improvements?: string;
  recommend: string;
  comments?: string;
  createdAt?: string;
};

type FeedbackListResponse = {
  items: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-[13px] ${s <= value ? 'text-yellow-400' : 'text-foreground/20'}`}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-foreground/50">{value}/5</span>
    </span>
  );
}

function FeedbackManager({
  token,
  onToast,
  onLogout,
}: {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
}) {
  const [list, setList] = useState<FeedbackListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FeedbackItem | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleAuthError = useCallback(
    (err: unknown) => {
      const e = err as Error & { code?: number };
      if (e?.code === 401) { onLogout(); return true; }
      return false;
    },
    [onLogout]
  );

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<FeedbackListResponse>(
        `/api/feedback?page=${page}&limit=${limit}`,
        { token }
      );
      setList(data);
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, token, handleAuthError, onToast]);

  useEffect(() => { loadList(); }, [loadList]);

  const onDelete = async (item: FeedbackItem) => {
    try {
      await apiJson(`/api/feedback/${item._id}`, { method: 'DELETE', token });
      onToast('Feedback deleted', 'success');
      setDeleteConfirm(null);
      setExpanded(null);
      await loadList();
    } catch (err) {
      if (!handleAuthError(err)) onToast((err as Error).message, 'error');
    }
  };

  const onExportExcel = async () => {
    setExporting(true);
    try {
      const res = await apiRequest('/api/feedback/export', { token });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wes-feedback-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('Feedback exported', 'success');
    } catch (err) {
      onToast((err as Error).message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = list?.pages ?? 1;
  const avgOverall = list && list.items.length > 0
    ? (list.items.reduce((s, f) => s + f.overallRating, 0) / list.items.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Header + export */}
      <div className="glass p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="admin-display text-xl font-semibold">Feedback Responses</h2>
          <p className="text-sm text-foreground/50 mt-0.5">
            {list
              ? `${list.total} response${list.total === 1 ? '' : 's'}`
              : 'Loading…'}
            {avgOverall && (
              <span className="ml-2 text-yellow-400">
                · avg {avgOverall} ★ (this page)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadList}
            className="pill pill-outline text-sm"
          >
            Refresh
          </button>
          <button
            onClick={onExportExcel}
            disabled={exporting}
            className="pill pill-outline text-sm"
          >
            {exporting ? <span className="spinner" /> : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="scroll-x">
          <table className="data" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Overall</th>
                <th>Sessions</th>
                <th>Venue</th>
                <th>Recommend</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-foreground/50">
                    <span className="spinner" />
                  </td>
                </tr>
              ) : !list || list.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-foreground/50">
                    No feedback responses yet.
                  </td>
                </tr>
              ) : (
                list.items.map((fb) => (
                  <>
                    <tr key={fb._id}>
                      <td>
                        <div className="font-semibold">{fb.name || '—'}</div>
                      </td>
                      <td>{fb.whatsappNumber || '—'}</td>
                      <td>
                        <div className="text-xs text-foreground/70">{fb.email || '—'}</div>
                      </td>
                      <td><StarDisplay value={fb.overallRating} /></td>
                      <td><StarDisplay value={fb.sessionQuality} /></td>
                      <td><StarDisplay value={fb.venueRating} /></td>
                      <td>
                        <span className={`badge ${
                          fb.recommend === 'Yes'
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : fb.recommend === 'No'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }`}>
                          {fb.recommend}
                        </span>
                      </td>
                      <td className="text-xs text-foreground/60">{formatDate(fb.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpanded(expanded === fb._id ? null : fb._id)}
                            className="pill pill-outline admin-table-action text-xs"
                          >
                            {expanded === fb._id ? 'Collapse' : 'Details'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(fb)}
                            className="pill pill-outline pill-danger admin-table-action text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === fb._id && (
                      <tr key={`${fb._id}-expanded`} className="bg-black/[0.03]">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="rounded-xl border border-black/8 bg-white/[0.03] p-4">
                              <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">
                                What They Liked Most
                              </div>
                              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                                {fb.liked || <span className="italic text-foreground/35">Not provided</span>}
                              </p>
                            </div>
                            <div className="rounded-xl border border-black/8 bg-white/[0.03] p-4">
                              <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">
                                Improvements Suggested
                              </div>
                              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                                {fb.improvements || <span className="italic text-foreground/35">Not provided</span>}
                              </p>
                            </div>
                            <div className="rounded-xl border border-black/8 bg-white/[0.03] p-4">
                              <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">
                                Other Comments
                              </div>
                              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                                {fb.comments || <span className="italic text-foreground/35">Not provided</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-black/10">
          <div className="text-sm text-foreground/50">
            {list && totalPages > 0
              ? `Page ${list.page} of ${totalPages} · ${list.total} total`
              : '—'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="pill pill-outline text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="pill pill-outline text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Feedback"
          description={`Delete the feedback response from ${deleteConfirm.name}? This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => onDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
