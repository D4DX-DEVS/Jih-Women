import type { ReactNode } from 'react';
import {
  AssetPicker,
  AttachmentEditor,
  BilingualInput,
  BilingualRichText,
  BulletEditor,
  Field,
  GalleryEditor,
  PeopleEditor,
  Toggle,
} from '../shared/ui';
import { emptyLocalized } from '../shared/types';
import type { Attachment, Bullet, Localized, MediaItem, Person } from '../shared/types';

export type Doc = Record<string, unknown>;

export type FieldDef =
  | { kind: 'localized'; path: string; label: string; required?: boolean; multiline?: boolean; rows?: number; hint?: string }
  | { kind: 'rich'; path: string; label: string; hint?: string }
  | { kind: 'text'; path: string; label: string; placeholder?: string; hint?: string; required?: boolean }
  | { kind: 'number'; path: string; label: string; hint?: string; required?: boolean }
  | { kind: 'date'; path: string; label: string; hint?: string; required?: boolean }
  | { kind: 'select'; path: string; label: string; options: { value: string; label: string }[]; hint?: string; required?: boolean }
  | { kind: 'toggle'; path: string; label: string; description?: string }
  | { kind: 'asset'; path: string; label: string; folder: string; accept?: string; preview?: 'image' | 'file'; hint?: string; recommend?: string; required?: boolean }
  | { kind: 'gallery'; path: string; label: string; folder: string; hint?: string; recommend?: string }
  | { kind: 'attachments'; path: string; label: string; folder: string; hint?: string; recommend?: string }
  | { kind: 'bullets'; path: string; label: string; hint?: string }
  | { kind: 'people'; path: string; label: string; folder: string; hint?: string; recommend?: string }
  | { kind: 'tags'; path: string; label: string; hint?: string }
  | {
      kind: 'object-list';
      path: string;
      label: string;
      addLabel: string;
      blank: () => Doc;
      fields: FieldDef[];
      hint?: string;
    }
  | { kind: 'row'; fields: FieldDef[] }
  | { kind: 'heading'; label: string; hint?: string };

/* ---------------- nested path access ---------------- */

export function getPath(obj: Doc, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Doc)[key];
    return undefined;
  }, obj);
}

export function setPath(obj: Doc, path: string, value: unknown): Doc {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  const child = (obj[head] && typeof obj[head] === 'object' ? obj[head] : {}) as Doc;
  return { ...obj, [head]: setPath(child, rest.join('.'), value) };
}

function toDateInput(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------------- renderer ---------------- */

export type FieldContext = {
  doc: Doc;
  onChange: (next: Doc) => void;
  token: string;
  onError: (message: string) => void;
};

export function renderField(def: FieldDef, ctx: FieldContext, key: string | number): ReactNode {
  const { doc, onChange, token, onError } = ctx;
  const set = (path: string, value: unknown) => onChange(setPath(doc, path, value));

  switch (def.kind) {
    case 'heading':
      return (
        <div key={key} className="pt-2">
          <h4 className="admin-display text-sm font-bold uppercase tracking-wider text-foreground/70">
            {def.label}
          </h4>
          {def.hint && <p className="text-xs text-foreground/45 mt-1">{def.hint}</p>}
          <div className="h-px bg-black/10 mt-2" />
        </div>
      );

    case 'row':
      return (
        <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {def.fields.map((f, i) => renderField(f, ctx, `${key}-${i}`))}
        </div>
      );

    case 'localized':
      return (
        <BilingualInput
          key={key}
          label={def.label}
          required={def.required}
          multiline={def.multiline}
          rows={def.rows}
          hint={def.hint}
          value={(getPath(doc, def.path) as Localized) ?? emptyLocalized()}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'rich':
      return (
        <BilingualRichText
          key={key}
          label={def.label}
          hint={def.hint}
          value={(getPath(doc, def.path) as Localized) ?? emptyLocalized()}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'text':
      return (
        <Field key={key} label={def.label} required={def.required} hint={def.hint}>
          <input
            className="input"
            placeholder={def.placeholder}
            value={(getPath(doc, def.path) as string) ?? ''}
            onChange={(e) => set(def.path, e.target.value)}
          />
        </Field>
      );

    case 'number':
      return (
        <Field key={key} label={def.label} required={def.required} hint={def.hint}>
          <input
            className="input"
            type="number"
            value={(getPath(doc, def.path) as number | undefined) ?? ''}
            onChange={(e) => set(def.path, e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Field>
      );

    case 'date':
      return (
        <Field key={key} label={def.label} required={def.required} hint={def.hint}>
          <input
            className="input"
            type="date"
            value={toDateInput(getPath(doc, def.path))}
            onChange={(e) => set(def.path, e.target.value || undefined)}
          />
        </Field>
      );

    case 'select':
      return (
        <Field key={key} label={def.label} required={def.required} hint={def.hint}>
          <select
            className="input"
            value={(getPath(doc, def.path) as string) ?? ''}
            onChange={(e) => set(def.path, e.target.value)}
          >
            {def.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      );

    case 'toggle':
      return (
        <div key={key} className="py-1">
          <Toggle
            label={def.label}
            description={def.description}
            checked={Boolean(getPath(doc, def.path))}
            onChange={(v) => set(def.path, v)}
          />
        </div>
      );

    case 'asset':
      return (
        <AssetPicker
          key={key}
          label={def.label}
          required={def.required}
          hint={def.hint}
          recommend={def.recommend}
          folder={def.folder}
          token={token}
          accept={def.accept}
          preview={def.preview}
          onError={onError}
          value={(getPath(doc, def.path) as string) ?? ''}
          onChange={(url) => set(def.path, url)}
        />
      );

    case 'gallery':
      return (
        <GalleryEditor
          key={key}
          label={def.label}
          hint={def.hint}
          recommend={def.recommend}
          folder={def.folder}
          token={token}
          onError={onError}
          value={(getPath(doc, def.path) as MediaItem[]) ?? []}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'attachments':
      return (
        <AttachmentEditor
          key={key}
          label={def.label}
          hint={def.hint}
          recommend={def.recommend}
          folder={def.folder}
          token={token}
          onError={onError}
          value={(getPath(doc, def.path) as Attachment[]) ?? []}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'bullets':
      return (
        <BulletEditor
          key={key}
          label={def.label}
          hint={def.hint}
          value={(getPath(doc, def.path) as Bullet[]) ?? []}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'people':
      return (
        <PeopleEditor
          key={key}
          label={def.label}
          hint={def.hint}
          recommend={def.recommend}
          folder={def.folder}
          token={token}
          onError={onError}
          value={(getPath(doc, def.path) as Person[]) ?? []}
          onChange={(v) => set(def.path, v)}
        />
      );

    case 'tags': {
      const tags = ((getPath(doc, def.path) as string[]) ?? []).join(', ');
      return (
        <Field key={key} label={def.label} hint={def.hint ?? 'Separate with commas'}>
          <input
            className="input"
            value={tags}
            onChange={(e) =>
              set(
                def.path,
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
          />
        </Field>
      );
    }

    case 'object-list': {
      const rows = ((getPath(doc, def.path) as Doc[]) ?? []) as Doc[];
      const replace = (next: Doc[]) => set(def.path, next);

      return (
        <Field key={key} label={`${def.label} (${rows.length})`} hint={def.hint}>
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-white/60 p-4 relative">
                <button
                  type="button"
                  onClick={() => replace(rows.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-3 text-foreground/30 hover:text-red-500 text-xl leading-none"
                  aria-label="Remove"
                >
                  &times;
                </button>
                <div className="space-y-3 pr-6">
                  {def.fields.map((f, fi) =>
                    renderField(
                      f,
                      {
                        ...ctx,
                        doc: row,
                        onChange: (nextRow) =>
                          replace(rows.map((r, idx) => (idx === i ? nextRow : r))),
                      },
                      `${key}-${i}-${fi}`
                    )
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="pill pill-outline text-sm"
              onClick={() => replace([...rows, def.blank()])}
            >
              + {def.addLabel}
            </button>
          </div>
        </Field>
      );
    }

    default:
      return null;
  }
}
