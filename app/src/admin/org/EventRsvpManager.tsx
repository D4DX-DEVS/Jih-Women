import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { apiJson, formatDate, isAuthError, describeError } from '../shared/api';
import type { ListResponse, Localized } from '../shared/types';
import { ConfirmDialog, EmptyState, Pagination, Spinner } from '../shared/ui';

type Rsvp = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  place: string;
  notes: string;
  createdAt: string;
  event?: { _id: string; title: Localized; slug: string; startDate: string };
};

type EventOption = { _id: string; title: Localized; startDate: string };

type Props = {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

export default function EventRsvpManager({ token, onToast, onLogout }: Props) {
  const [items, setItems] = useState<Rsvp[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<Rsvp | null>(null);

  useEffect(() => {
    apiJson<ListResponse<EventOption>>('/api/admin/cms/events?limit=200', { token })
      .then((d) => setEvents(d.items))
      .catch(() => { /* the filter simply stays empty */ });
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (eventId) params.set('event', eventId);
      const data = await apiJson<ListResponse<Rsvp>>(
        `/api/admin/cms/event-registrations?${params}`,
        { token }
      );
      setItems(data.items);
      setMeta({ total: data.total, page: data.page, pages: data.pages });
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Failed to load registrations'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, eventId, token, onToast, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row: Rsvp) => {
    try {
      await apiJson(`/api/admin/cms/event-registrations/${row._id}`, { method: 'DELETE', token });
      onToast('Registration deleted');
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Delete failed'), 'error');
    }
  };

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      if (eventId) params.set('event', eventId);
      const data = await apiJson<ListResponse<Rsvp>>(
        `/api/admin/cms/event-registrations?${params}`,
        { token }
      );
      const rows = data.items.map((r) => ({
        Registered: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
        Event: r.event?.title?.ml || r.event?.title?.en || '',
        Name: r.name,
        Phone: r.phone,
        Email: r.email,
        District: r.district,
        Place: r.place,
        Notes: r.notes,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
      XLSX.writeFile(wb, `event-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Export failed'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-display text-2xl font-bold">Event Registrations</h2>
          <p className="text-sm text-foreground/55 mt-1">
            RSVPs submitted on event pages where registration is enabled.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input !w-auto max-w-[280px]"
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title?.ml || ev.title?.en}
              </option>
            ))}
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
                <th>Registered</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Place</th>
                <th>Event</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Spinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="No registrations yet." />
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r._id}>
                    <td className="text-foreground/60">{formatDate(r.createdAt, true)}</td>
                    <td className="font-medium">{r.name}</td>
                    <td className="text-foreground/70">
                      <div>{r.phone}</div>
                      <div className="text-xs text-foreground/45">{r.email}</div>
                    </td>
                    <td className="text-foreground/70">
                      {[r.place, r.district].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="text-foreground/70">
                      {r.event?.title?.ml || r.event?.title?.en || '—'}
                    </td>
                    <td>
                      <button
                        className="text-red-500/70 hover:text-red-600 text-xs"
                        onClick={() => setConfirm(r)}
                      >
                        Delete
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
          title="Delete registration?"
          description={`Remove the RSVP from ${confirm.name}. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => remove(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
