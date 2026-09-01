import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarCheck, Globe } from 'lucide-react';
import './admin.css';
import { TOKEN_KEY } from '../admin/shared/api';
import Login from '../admin/shared/Login';
import { ConfirmDialog } from '../admin/shared/ui';
import type { Toast } from '../admin/shared/types';
import WesWorkspace from '../admin/wes/WesWorkspace';
import OrgWorkspace from '../admin/org/OrgWorkspace';

type Workspace = 'org' | 'wes';

const WORKSPACE_KEY = 'admin_workspace';

const WORKSPACES: {
  key: Workspace;
  label: string;
  hint: string;
  Icon: typeof Globe;
}[] = [
  { key: 'org', label: 'Organisation Site', hint: "Women's Wing website content", Icon: Globe },
  { key: 'wes', label: 'WES Event', hint: 'Summit registrations & attendance', Icon: CalendarCheck },
];

/**
 * Segmented workspace switcher. The active indicator is one absolutely
 * positioned element translated by index rather than a background swapped on
 * each option, so switching animates instead of cutting. Arrow keys move
 * between options, matching the tablist pattern the roles declare.
 */
function WorkspaceSwitch({
  value,
  onChange,
}: {
  value: Workspace;
  onChange: (next: Workspace) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  const index = Math.max(
    0,
    WORKSPACES.findIndex((w) => w.key === value)
  );

  /* The options are sized by their own labels, not split evenly — a flex item
     cannot shrink below its content — so the indicator is measured from the
     selected button rather than assumed to be 1/n of the track. */
  useLayoutEffect(() => {
    const track = listRef.current;
    if (!track) return;

    const measure = () => {
      const active = track.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      // offsetLeft is measured from the border box; `left` resolves against the
      // padding box, so the border width has to come off.
      setThumb({ left: active.offsetLeft - track.clientLeft, width: active.offsetWidth });
    };

    measure();

    // ResizeObserver is absent in some non-browser render targets (the jsdom
    // smoke harness among them). Referencing it unguarded throws inside the
    // layout effect and takes the whole console down, so fall back to a
    // window resize listener.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [value]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + WORKSPACES.length) % WORKSPACES.length;
    onChange(WORKSPACES[next].key);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Workspace"
      onKeyDown={onKeyDown}
      className="ws-switch no-scrollbar max-w-full overflow-x-auto"
    >
      {thumb && (
        <span
          aria-hidden="true"
          className="ws-switch-thumb"
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}
      {WORKSPACES.map((w) => {
        const selected = w.key === value;
        return (
          <button
            key={w.key}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            title={w.hint}
            onClick={() => onChange(w.key)}
            className="ws-switch-option"
          >
            <w.Icon size={15} strokeWidth={2.1} />
            {w.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [workspace, setWorkspace] = useState<Workspace>(
    () => (localStorage.getItem(WORKSPACE_KEY) as Workspace) || 'org'
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
    localStorage.setItem(WORKSPACE_KEY, workspace);
  }, [workspace]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const current = WORKSPACES.find((w) => w.key === workspace) ?? WORKSPACES[0];

  return (
    <div className="admin-shell">
      {token ? (
        <>
          <header
            className="sticky top-0 z-40 border-b border-[#e6e8f0] bg-white"
            style={{ height: 'var(--admin-header-h)' }}
          >
            <div className="mx-auto flex h-full max-w-[1560px] items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                  <img
                    src="/icon.png"
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-lg object-contain"
                  />
                  <div className="leading-tight">
                    <div className="admin-display text-[13.5px] font-semibold">Admin Console</div>
                    <div className="text-[11px] leading-tight text-foreground/45">{current.hint}</div>
                  </div>
                </div>

                <WorkspaceSwitch value={workspace} onChange={setWorkspace} />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {workspace === 'wes' && (
                  <a href="/scanner" className="pill pill-outline hidden md:inline-flex">
                    Scanner
                  </a>
                )}
                <button className="pill pill-outline" onClick={() => setConfirmLogout(true)}>
                  Logout
                </button>
              </div>
            </div>
          </header>

          {workspace === 'wes' ? (
            <WesWorkspace token={token} onLogout={handleLogout} onToast={showToast} />
          ) : (
            <OrgWorkspace token={token} onLogout={handleLogout} onToast={showToast} />
          )}
        </>
      ) : (
        <Login onSuccess={handleLogin} />
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="Log out"
          description="End the current admin session now? You will need to sign in again."
          confirmLabel="Log out"
          onConfirm={handleLogout}
          onClose={() => setConfirmLogout(false)}
        />
      )}

      {toast && (
        <div className={`toast ${toast.kind}`} key={toast.id}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
