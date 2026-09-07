import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiJson, describeError, isAuthError } from '../shared/api';
import type { ListResponse } from '../shared/types';
import { ConfirmDialog, EmptyState, Modal, Pagination, Spinner } from '../shared/ui';
import { getPath, renderField } from './fields';
import { canPreviewRecord, recordPreviewUrl, sectionPreviewUrl } from './preview';
import type { Doc, FieldDef } from './fields';

export type ColumnDef = {
  label: string;
  render: (row: Doc) => ReactNode;
  className?: string;
};

export type FilterDef = {
  param: string;
  label: string;
  options: { value: string; label: string }[];
};

export type CollectionConfig = {
  key: string;
  endpoint: string;
  label: string;
  singular: string;
  description?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  blank: () => Doc;
  filters?: FilterDef[];
  searchable?: boolean;
  reorderable?: boolean;
  limit?: number;
};

type Props = {
  config: CollectionConfig;
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

/** Walks nested field definitions and returns the required ones that are empty. */
function missingRequired(fields: FieldDef[], doc: Doc): string[] {
  const missing: string[] = [];

  for (const field of fields) {
    if (field.kind === 'row') {
      missing.push(...missingRequired(field.fields, doc));
      continue;
    }
    if (field.kind === 'heading' || !('required' in field) || !field.required) continue;

    const value = getPath(doc, field.path);

    if (field.kind === 'localized') {
      const ml = (value as { ml?: string } | undefined)?.ml;
      if (!ml || !ml.trim()) missing.push(`${field.label} (Malayalam)`);
      continue;
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(field.label);
    }
  }

  return missing;
}

/**
 * Per-record preview. Rendered only for collections whose records have a public
 * page; shown disabled for drafts, because the public API filters on
 * `published: true` and the link would land on Not Found.
 */
function RowPreview({ sectionKey, row }: { sectionKey: string; row: Doc }) {
  const url = recordPreviewUrl(sectionKey, row);
  if (!url) return null;

  if (!canPreviewRecord(row)) {
    return (
      <span
        className="preview-row"
        aria-disabled="true"
        title="Publish this first — drafts are not visible on the website"
      >
        <ExternalLink size={14} />
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="preview-row"
      title="Preview on the website"
      aria-label="Preview on the website"
    >
      <ExternalLink size={14} />
    </a>
  );
}

export default function CollectionManager({ config, token, onToast, onLogout }: Props) {
  const [list, setList] = useState<ListResponse<Doc> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const limit = config.limit ?? 25;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset view state whenever the manager switches to another collection
  useEffect(() => {
    setPage(1);
    setSearch('');
    setDebouncedSearch('');
    setFilterValues({});
    setList(null);
  }, [config.key]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    for (const [k, v] of Object.entries(filterValues)) {
      if (v) params.set(k, v);
    }
    return params.toString();
  }, [page, limit, debouncedSearch, filterValues]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<ListResponse<Doc>>(`${config.endpoint}?${query}`, { token });
      setList(data);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      setError(describeError(err, `We could not load the ${config.label.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.label, query, token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setFormError(null);
    setEditing(config.blank());
  };

  const openEdit = (row: Doc) => {
    setFormError(null);
    setEditing({ ...row });
  };

  const save = async () => {
    if (!editing) return;

    const missing = missingRequired(config.fields, editing);
    if (missing.length) {
      const message =
        missing.length === 1
          ? `${missing[0]} is required.`
          : `Please fill in ${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}.`;
      setFormError(message);
      onToast(message, 'error');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const id = editing._id as string | undefined;
      const payload = { ...editing };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      if (id) {
        await apiJson(`${config.endpoint}/${id}`, { method: 'PATCH', body: payload, token });
        onToast(`${config.singular} saved`);
      } else {
        await apiJson(config.endpoint, { method: 'POST', body: payload, token });
        onToast(`${config.singular} created`);
      }
      setEditing(null);
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      const message = describeError(err, 'We could not save this. Please try again.');
      setFormError(message);
      onToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: Doc) => {
    setConfirm({
      title: `Delete this ${config.singular.toLowerCase()}?`,
      description: 'It will disappear from the website straight away. This cannot be undone.',
      onConfirm: async () => {
        try {
          await apiJson(`${config.endpoint}/${row._id}`, { method: 'DELETE', token });
          onToast(`${config.singular} deleted`);
          await load();
        } catch (err) {
          if (isAuthError(err)) return onLogout();
          onToast(describeError(err, 'We could not delete this. Please try again.'), 'error');
        }
      },
    });
  };

  const togglePublished = async (row: Doc) => {
    try {
      await apiJson(`${config.endpoint}/${row._id}`, {
        method: 'PATCH',
        body: { published: !row.published },
        token,
      });
      onToast(row.published ? 'Moved to draft' : 'Published');
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not change the status.'), 'error');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!list) return;
    const target = index + direction;
    if (target < 0 || target >= list.items.length) return;
    const ids = list.items.map((i) => i._id as string);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);
    try {
      await apiJson(`${config.endpoint}/reorder`, { method: 'POST', body: { ids }, token });
      await load();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not reorder the list.'), 'error');
    }
  };

  const items = list?.items ?? [];
  const showToolbar = config.searchable !== false || Boolean(config.filters?.length);
  const colSpan = config.columns.length + (config.reorderable ? 3 : 2);
  const hasFilters = Boolean(debouncedSearch) || Object.values(filterValues).some(Boolean);
  const sectionUrl = sectionPreviewUrl(config.key);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="admin-display text-[22px] font-semibold leading-tight">{config.label}</h2>
          {config.description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-foreground/55">
              {config.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {sectionUrl && (
            <a href={sectionUrl} target="_blank" rel="noreferrer" className="preview-btn">
              <ExternalLink size={14} />
              Preview
            </a>
          )}
          <button className="pill pill-primary" onClick={openNew}>
            + New {config.singular.toLowerCase()}
          </button>
        </div>
      </div>

      {showToolbar && (
        <div className="glass flex flex-wrap items-end gap-3 p-3.5">
          {config.searchable !== false && (
            <div className="min-w-0 w-full flex-1 sm:min-w-[200px]">
              <label className="field-label">Search</label>
              <input
                className="input"
                placeholder={`Search ${config.label.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {config.filters?.map((f) => (
            <div key={f.param} className="w-full min-w-0 sm:w-[168px]">
              <label className="field-label">{f.label}</label>
              <select
                className="input"
                value={filterValues[f.param] ?? ''}
                onChange={(e) => {
                  setFilterValues((prev) => ({ ...prev, [f.param]: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {hasFilters && (
            <button
              className="pill pill-outline"
              onClick={() => {
                setSearch('');
                setFilterValues({});
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="glass overflow-hidden">
        <div className="scroll-x">
          <table className="data">
            <thead>
              <tr>
                {config.reorderable && <th className="w-[54px]">Order</th>}
                {config.columns.map((c) => (
                  <th key={c.label} className={c.className}>
                    {c.label}
                  </th>
                ))}
                <th className="w-[104px]">Status</th>
                <th className="w-[168px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="py-14 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={colSpan} className="py-12 text-center">
                    <p className="text-[13px] text-red-600">{error}</p>
                    <button className="pill pill-outline mt-3" onClick={load}>
                      Try again
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <EmptyState
                      message={
                        hasFilters
                          ? 'Nothing matches that search.'
                          : `No ${config.label.toLowerCase()} yet. Create the first one.`
                      }
                      action={
                        hasFilters ? undefined : (
                          <button className="pill pill-primary" onClick={openNew}>
                            + New {config.singular.toLowerCase()}
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((row, index) => (
                  <tr key={row._id as string}>
                    {config.reorderable && (
                      <td>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            className="text-[10px] leading-none text-foreground/30 transition hover:text-[#e6187e] disabled:opacity-25"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            ▲
                          </button>
                          <button
                            className="text-[10px] leading-none text-foreground/30 transition hover:text-[#e6187e] disabled:opacity-25"
                            onClick={() => move(index, 1)}
                            disabled={index === items.length - 1}
                            aria-label="Move down"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                    )}
                    {config.columns.map((c) => (
                      <td key={c.label} className={c.className}>
                        {c.render(row)}
                      </td>
                    ))}
                    <td>
                      <button
                        className={`badge ${row.published ? 'badge-success' : 'badge-muted'}`}
                        onClick={() => togglePublished(row)}
                        title={row.published ? 'Click to move to draft' : 'Click to publish'}
                      >
                        {row.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <RowPreview sectionKey={config.key} row={row} />
                        <button className="pill pill-outline !px-3 !py-1.5 !text-[12px]" onClick={() => openEdit(row)}>
                          Edit
                        </button>
                        <button
                          className="rounded-md px-2 py-1.5 text-[12px] font-medium text-red-500/80 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => remove(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {list && items.length > 0 && (
          <div className="border-t border-[#e6e8f0] px-4 py-3">
            <Pagination page={list.page} pages={list.pages} total={list.total} onPage={setPage} />
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={
            editing._id
              ? `Edit ${config.singular.toLowerCase()}`
              : `New ${config.singular.toLowerCase()}`
          }
          subtitle={config.description}
          size="xl"
          onClose={() => setEditing(null)}
          footer={
            <>
              {formError && (
                <p className="me-auto text-[12.5px] leading-snug text-red-600">{formError}</p>
              )}
              <button className="pill pill-outline" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="pill pill-primary" onClick={save} disabled={saving}>
                {saving ? <Spinner /> : 'Save'}
              </button>
            </>
          }
        >
          <p className="text-[12px] text-foreground/45">
            Fields marked <span className="field-req">*</span> are required. Images are
            re-compressed to WebP on upload and capped at 2000&times;2000px — upload the best
            quality source you have and let the server size it.
          </p>
          {config.fields.map((f, i) =>
            renderField(
              f,
              {
                doc: editing,
                onChange: setEditing,
                token,
                onError: (m) => onToast(m, 'error'),
              },
              i
            )
          )}
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          description={confirm.description}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
