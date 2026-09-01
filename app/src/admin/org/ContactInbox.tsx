import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { apiJson, formatDate, isAuthError, describeError } from '../shared/api';
import { ConfirmDialog, EmptyState, Modal, Pagination, Spinner } from '../shared/ui';

type Message = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

export default function ContactInbox({ token, onToast, onLogout }: Props) {
  const [items, setItems] = useState<Message[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, unread: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'' | 'true' | 'false'>('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Message | null>(null);
  const [confirm, setConfirm] = useState<Message | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (filter) params.set('isRead', filter);
      const data = await apiJson<{
        items: Message[];
        total: number;
        page: number;
        pages: number;
        unread: number;
      }>(`/api/admin/cms/contact-messages?${params}`, { token });
      setItems(data.items);
      setMeta({ total: data.total, page: data.page, pages: data.pages, unread: data.unread });
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Failed to load messages'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filter, token, onToast, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (msg: Message, isRead: boolean) => {
    try {
      await apiJson(`/api/admin/cms/contact-messages/${msg._id}`, {
        method: 'PATCH',
        body: { isRead },
        token,
      });
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Update failed'), 'error');
    }
  };

  const remove = async (msg: Message) => {
    try {
      await apiJson(`/api/admin/cms/contact-messages/${msg._id}`, { method: 'DELETE', token });
      onToast('Message deleted');
      setOpen(null);
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Delete failed'), 'error');
    }
  };

  const exportExcel = async () => {
    try {
      const data = await apiJson<{ items: Message[] }>(
        '/api/admin/cms/contact-messages?limit=200&page=1',
        { token }
      );
      const rows = data.items.map((m) => ({
        Received: m.createdAt ? new Date(m.createdAt).toLocaleString() : '',
        Name: m.name,
        Phone: m.phone,
        Email: m.email,
        District: m.district,
        Subject: m.subject,
        Message: m.message,
        Read: m.isRead ? 'Yes' : 'No',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Messages');
      XLSX.writeFile(wb, `contact-messages-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Export failed'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-display text-2xl font-bold">
            Contact Messages
            {meta.unread > 0 && (
              <span className="ml-3 badge" style={{ background: '#e61980', color: '#fff' }}>
                {meta.unread} unread
              </span>
            )}
          </h2>
          <p className="text-sm text-foreground/55 mt-1">
            Enquiries submitted through the website contact form.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input !w-auto"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as '' | 'true' | 'false');
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <button className="pill pill-outline text-sm" onClick={exportExcel}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="scroll-x">
          <table className="data w-full">
            <thead>
              <tr>
                <th>Received</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Subject</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Spinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No messages yet." />
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m._id} className={m.isRead ? '' : 'font-medium'}>
                    <td className="text-foreground/60">{formatDate(m.createdAt, true)}</td>
                    <td>
                      {!m.isRead && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e61980] mr-2 align-middle" />}
                      {m.name}
                    </td>
                    <td className="text-foreground/70">
                      <div>{m.phone || '—'}</div>
                      <div className="text-xs text-foreground/45">{m.email || ''}</div>
                    </td>
                    <td className="text-foreground/70">{m.subject || '—'}</td>
                    <td>
                      <button
                        className="pill pill-outline text-xs"
                        onClick={() => {
                          setOpen(m);
                          if (!m.isRead) markRead(m, true);
                        }}
                      >
                        Read
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

      {open && (
        <Modal
          title={open.subject || 'Message'}
          subtitle={`${open.name} · ${formatDate(open.createdAt, true)}`}
          onClose={() => setOpen(null)}
          footer={
            <>
              <button className="pill pill-danger text-sm" onClick={() => setConfirm(open)}>
                Delete
              </button>
              <button
                className="pill pill-outline text-sm"
                onClick={() => {
                  markRead(open, false);
                  setOpen(null);
                }}
              >
                Mark unread
              </button>
              <button className="pill pill-primary text-sm" onClick={() => setOpen(null)}>
                Close
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">Phone</div>
              <div>{open.phone || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">Email</div>
              <div className="break-all">{open.email || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">District</div>
              <div>{open.district || '—'}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground/50 mb-1.5">Message</div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{open.message}</p>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete message?"
          description="This permanently removes the enquiry."
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => remove(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
