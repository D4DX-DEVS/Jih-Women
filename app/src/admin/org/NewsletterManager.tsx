import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { apiJson, formatDate, isAuthError, describeError } from '../shared/api';
import type { ListResponse } from '../shared/types';
import { ConfirmDialog, EmptyState, Pagination, Spinner } from '../shared/ui';

type Subscriber = {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

export default function NewsletterManager({ token, onToast, onLogout }: Props) {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<Subscriber | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<ListResponse<Subscriber>>(
        `/api/admin/cms/newsletter?page=${page}&limit=50`,
        { token }
      );
      setItems(data.items);
      setMeta({ total: data.total, page: data.page, pages: data.pages });
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Failed to load subscribers'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, token, onToast, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row: Subscriber) => {
    try {
      await apiJson(`/api/admin/cms/newsletter/${row._id}`, { method: 'DELETE', token });
      onToast('Subscriber removed');
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Delete failed'), 'error');
    }
  };

  const exportExcel = async () => {
    try {
      const data = await apiJson<ListResponse<Subscriber>>(
        '/api/admin/cms/newsletter?page=1&limit=500',
        { token }
      );
      const rows = data.items.map((r) => ({
        Email: r.email,
        Subscribed: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
        Active: r.isActive ? 'Yes' : 'No',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subscribers');
      XLSX.writeFile(wb, `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Export failed'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-display text-2xl font-bold">Newsletter</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Email addresses collected from the website footer signup.
          </p>
        </div>
        <button className="pill pill-outline text-sm" onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <div className="glass overflow-hidden">
        <div className="scroll-x">
          <table className="data w-full">
            <thead>
              <tr>
                <th>Email</th>
                <th className="w-56">Subscribed</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <Spinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState message="No subscribers yet." />
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id}>
                    <td className="font-medium">{row.email}</td>
                    <td className="text-foreground/60">{formatDate(row.createdAt, true)}</td>
                    <td>
                      <button
                        className="text-red-500/70 hover:text-red-600 text-xs"
                        onClick={() => setConfirm(row)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-black/10">
          <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} />
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Remove subscriber?"
          description={`${confirm.email} will no longer receive the newsletter.`}
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => remove(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
