import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react';
import { uploadAsset } from './api';
import type { Attachment, Bullet, Localized, MediaItem, Person } from './types';
import { LANGUAGES, emptyLocalized } from './types';
import { flattenSections, isBlankHtml, newSectionId, parseSections, serializeSections } from './sections';
import type { Section, SectionsDraft } from './sections';

/* ---------------- primitives ---------------- */

export function Spinner() {
  return <span className="spinner" />;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="glass p-5">
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h3 className="admin-display text-[15px] font-semibold">{title}</h3>}
            {description && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/55">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="field-req">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/**
 * Recommended upload size, shown beside the picker it belongs to.
 *
 * Deliberately separate from `Field`'s `hint`: several fields already use the
 * hint for editorial guidance, and one must not clobber the other. Copy here
 * states pixels, aspect and any safe-area note — never a KB budget, because
 * the server re-encodes every raster upload to WebP (max 2000x2000), so the
 * stored size is not the editor's to control.
 */
export function UploadSpec({ children }: { children: ReactNode }) {
  return (
    <p className="upload-spec">
      <Info size={13} />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 text-foreground/50">
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full"
    >
      <span
        className={`relative mt-px h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#e6187e]' : 'bg-[#d3d7e4]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            checked ? 'left-[1.125rem]' : 'left-0.5'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-snug">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-foreground/50">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) {
    return <div className="text-sm text-foreground/50">{total} item{total === 1 ? '' : 's'}</div>;
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-foreground/50">
        Page {page} of {pages} · {total} item{total === 1 ? '' : 's'}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="pill pill-outline text-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="pill pill-outline text-sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------------- modals ---------------- */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'lg',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const width = size === 'md' ? 'max-w-lg' : size === 'xl' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`glass-strong flex w-full ${width} max-h-[92vh] flex-col`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e6e8f0] px-6 py-4">
          <div className="min-w-0">
            <h2 className="admin-display text-[17px] font-semibold">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/55">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="-me-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/40 transition hover:bg-black/5 hover:text-foreground"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <div className="slim-scroll flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-[#e6e8f0] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'default',
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}) {
  // Escape closes only this dialog: it can sit inside another modal (capture phase,
  // so that modal's own Escape handler never sees the key)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong w-full max-w-md p-6">
        <h2 className="admin-display text-[17px] font-semibold">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button className="pill pill-outline text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`pill text-sm ${tone === 'danger' ? 'pill-danger-solid' : 'pill-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- bilingual inputs ---------------- */

export function BilingualInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required = false,
  placeholder,
  hint,
  onlyLang,
}: {
  label: string;
  value: Localized | undefined;
  onChange: (v: Localized) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Show a single language's input; the other language's stored value is kept untouched */
  onlyLang?: (typeof LANGUAGES)[number]['code'];
}) {
  const current = value ?? emptyLocalized();
  const langs = onlyLang ? LANGUAGES.filter((l) => l.code === onlyLang) : LANGUAGES;
  return (
    <Field label={label} required={required} hint={hint}>
      <div className={`grid grid-cols-1 gap-2.5 ${langs.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {langs.map((lang) => (
          <div key={lang.code}>
            <div className="field-lang">
              {lang.label}
              {required && lang.required && <span className="field-req">*</span>}
            </div>
            {multiline ? (
              <textarea
                className="input"
                rows={rows}
                placeholder={placeholder}
                value={current[lang.code] ?? ''}
                onChange={(e) => onChange({ ...current, [lang.code]: e.target.value })}
              />
            ) : (
              <input
                className="input"
                placeholder={placeholder}
                value={current[lang.code] ?? ''}
                onChange={(e) => onChange({ ...current, [lang.code]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </Field>
  );
}

/* ---------------- rich text ---------------- */

const RICH_COMMANDS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'formatBlock', arg: '<h2>', label: 'H2', title: 'Heading 2' },
  { cmd: 'formatBlock', arg: '<h3>', label: 'H3', title: 'Heading 3' },
  { cmd: 'formatBlock', arg: '<p>', label: 'P', title: 'Paragraph' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bulleted list' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered list' },
  { cmd: 'formatBlock', arg: '<blockquote>', label: '❝', title: 'Quote' },
];

export function RichText({
  value,
  onChange,
  placeholder,
  compact = false,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Shorter editing area, for editors stacked inside a section list */
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Only write into the DOM when the incoming value diverges from what the
  // user has typed, otherwise the caret jumps to the start on every keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  // The box is height-capped: the toolbar stays put and only the text scrolls.
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-[#d3d7e4] bg-white ${
        compact ? 'max-h-[min(50vh,20rem)]' : 'max-h-[min(60vh,32rem)]'
      }`}
    >
      <div className="flex shrink-0 flex-wrap gap-0.5 border-b border-[#e6e8f0] bg-[#f8f9fc] p-1.5">
        {RICH_COMMANDS.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(c.cmd, c.arg)}
            className="rounded-md px-2 py-1 text-[11.5px] font-medium text-[#4a4f70] transition hover:bg-black/[0.06]"
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = window.prompt('Link URL');
            if (url) exec('createLink', url);
          }}
          className="rounded-md px-2 py-1 text-[11.5px] font-medium text-[#4a4f70] transition hover:bg-black/[0.06]"
        >
          Link
        </button>
        <button
          type="button"
          title="Remove formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('removeFormat')}
          className="rounded-md px-2 py-1 text-[11.5px] font-medium text-foreground/45 transition hover:bg-black/[0.06]"
        >
          Clear
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="admin-richtext slim-scroll min-h-[160px] flex-1 overflow-y-auto px-3.5 py-3 text-[13.5px] outline-none"
      />
    </div>
  );
}

function SectionsEditor({
  value,
  onChange,
}: {
  value: SectionsDraft;
  onChange: (next: SectionsDraft) => void;
}) {
  const { intro, sections } = value;
  const [deleting, setDeleting] = useState<Section | null>(null);
  const setSections = (next: Section[]) => onChange({ intro, sections: next });
  const patch = (id: string, change: Partial<Section>) =>
    setSections(sections.map((s) => (s.id === id ? { ...s, ...change } : s)));

  const move = (from: number, to: number) => {
    const next = [...sections];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setSections(next);
  };

  const removeSection = (section: Section) => setSections(sections.filter((s) => s.id !== section.id));
  // An empty section goes straight away; one with content asks first
  const remove = (section: Section) => (isBlankHtml(section.html) ? removeSection(section) : setDeleting(section));

  const iconBtn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/45 transition hover:bg-black/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#e6e8f0] bg-[#f8f9fc] p-3">
        <div className="mb-2">
          <div className="text-[12.5px] font-semibold text-foreground/70">Intro (optional)</div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/50">
            Shown above the section buttons and stays the same whichever section is open.
          </p>
        </div>
        <RichText compact value={intro} onChange={(html) => onChange({ intro: html, sections })} />
      </div>
      {sections.map((section, i) => (
        <div key={section.id} className="rounded-xl border border-[#e6e8f0] bg-[#f8f9fc] p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[12px] font-semibold text-[#e6187e] ring-1 ring-inset ring-[#e6e8f0]">
              {i + 1}
            </span>
            <input
              className="input min-w-0 flex-1"
              placeholder="Section title (shown as a button on the site)"
              value={section.title}
              onChange={(e) => patch(section.id, { title: e.target.value })}
            />
            <button type="button" className={iconBtn} aria-label="Move section up" disabled={i === 0} onClick={() => move(i, i - 1)}>
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className={iconBtn}
              aria-label="Move section down"
              disabled={i === sections.length - 1}
              onClick={() => move(i, i + 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button type="button" className={`${iconBtn} hover:!text-red-500`} aria-label="Delete section" onClick={() => remove(section)}>
              <Trash2 size={15} />
            </button>
          </div>
          <RichText compact value={section.html} onChange={(html) => patch(section.id, { html })} />
        </div>
      ))}
      <button
        type="button"
        className="pill pill-outline text-sm"
        onClick={() => setSections([...sections, { id: newSectionId(), title: '', html: '' }])}
      >
        + Add section
      </button>
      {deleting && (
        <ConfirmDialog
          title="Delete this section?"
          description={`${deleting.title.trim() ? `“${deleting.title.trim()}” and` : 'This section and'} everything written in it will be removed once you save.`}
          confirmLabel="Delete section"
          tone="danger"
          onConfirm={() => removeSection(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export function BilingualRichText({
  label,
  value,
  onChange,
  hint,
  allowSections = true,
}: {
  label: string;
  value: Localized | undefined;
  onChange: (v: Localized) => void;
  hint?: string;
  /** Offer the sectioned (button-per-section) layout; off for short single-block fields */
  allowSections?: boolean;
}) {
  const current = value ?? emptyLocalized();
  const [lang, setLang] = useState<keyof Localized>('ml');
  // Per language: the intro and section list while in sections mode, null for the plain editor.
  // Mode follows what is stored, so existing sectioned content opens as sections.
  const [drafts, setDrafts] = useState<Record<keyof Localized, SectionsDraft | null>>(() => ({
    ml: allowSections ? parseSections(current.ml ?? '') : null,
    en: allowSections ? parseSections(current.en ?? '') : null,
  }));
  const draft = drafts[lang];
  const [confirmSingle, setConfirmSingle] = useState(false);

  const setDraft = (next: SectionsDraft | null, html: string) => {
    setDrafts((d) => ({ ...d, [lang]: next }));
    onChange({ ...current, [lang]: html });
  };

  const enableSections = () => {
    const first: SectionsDraft = { intro: '', sections: [{ id: newSectionId(), title: '', html: current[lang] ?? '' }] };
    setDraft(first, serializeSections(first));
  };

  const flatten = () => draft && setDraft(null, flattenSections(draft));

  // Titled sections ask first: their titles become headings and the buttons on the site go away
  const disableSections = () => {
    if (draft?.sections.some((s) => s.title.trim())) setConfirmSingle(true);
    else flatten();
  };

  const segment = (active: boolean) =>
    `rounded-md px-3 py-1 text-[11.5px] font-medium transition ${
      active ? 'bg-white text-[#e6187e] shadow-sm' : 'text-foreground/55 hover:text-foreground'
    }`;

  return (
    <Field label={label} hint={hint}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex gap-1 rounded-lg bg-[#f1f2f7] p-1">
          {LANGUAGES.map((l) => (
            <button key={l.code} type="button" onClick={() => setLang(l.code)} className={segment(lang === l.code)}>
              {l.label}
            </button>
          ))}
        </div>
        {allowSections && (
          <div className="inline-flex gap-1 rounded-lg bg-[#f1f2f7] p-1" title="Advanced: split the content into sections">
            <button type="button" onClick={draft ? disableSections : undefined} className={segment(!draft)}>
              Single editor
            </button>
            <button type="button" onClick={draft ? undefined : enableSections} className={segment(!!draft)}>
              Sections
            </button>
          </div>
        )}
      </div>
      {draft ? (
        <>
          <p className="mb-2 text-[12px] leading-relaxed text-foreground/50">
            Each section becomes a button on the page; visitors pick one to read. Sections and intro are
            set up separately for each language.
          </p>
          <SectionsEditor key={lang} value={draft} onChange={(next) => setDraft(next, serializeSections(next))} />
        </>
      ) : (
        <RichText key={lang} value={current[lang] ?? ''} onChange={(html) => onChange({ ...current, [lang]: html })} />
      )}
      {confirmSingle && (
        <ConfirmDialog
          title="Switch back to a single editor?"
          description="Section titles become headings in one block of text, and the section buttons on the site go away."
          confirmLabel="Switch"
          onConfirm={flatten}
          onClose={() => setConfirmSingle(false)}
        />
      )}
    </Field>
  );
}

/* ---------------- asset upload ---------------- */

export function AssetPicker({
  label,
  value,
  onChange,
  folder,
  token,
  accept = 'image/*',
  hint,
  recommend,
  onError,
  preview = 'image',
  fit = 'cover',
  required = false,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  token: string;
  accept?: string;
  hint?: string;
  recommend?: ReactNode;
  onError?: (message: string) => void;
  preview?: 'image' | 'file';
  /** `contain` previews the whole image in a wider box (logos); `cover` crops a square */
  fit?: 'cover' | 'contain';
}) {
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadAsset(file, folder, token);
      onChange(res.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} required={required} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          preview === 'image' ? (
            <img
              src={value}
              alt=""
              className={`h-20 rounded-lg border border-[#e6e8f0] bg-white ${
                fit === 'contain' ? 'w-36 object-contain p-2' : 'w-20 object-cover'
              }`}
            />
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline break-all max-w-[260px] text-[#e61980]"
            >
              {value.split('/').pop()}
            </a>
          )
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-[#d3d7e4] text-[11px] text-foreground/35">
            No file
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              handle(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <label
            htmlFor={inputId}
            className="pill pill-outline !py-1.5 !text-[12.5px] cursor-pointer"
          >
            {busy ? <Spinner /> : value ? 'Replace' : 'Upload'}
          </label>
          {value && (
            <button
              type="button"
              className="pill pill-danger !py-1.5 !text-[12.5px]"
              onClick={() => onChange('')}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {recommend && <UploadSpec>{recommend}</UploadSpec>}
    </Field>
  );
}

/* ---------------- repeatable editors ---------------- */

function RepeatShell({
  label,
  count,
  onAdd,
  addLabel,
  children,
  hint,
}: {
  label: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <Field label={`${label} · ${count}`} hint={hint}>
      <div className="space-y-2.5">
        {children}
        <button type="button" className="pill pill-outline !py-1.5 !text-[12.5px]" onClick={onAdd}>
          + {addLabel}
        </button>
      </div>
    </Field>
  );
}

function RowShell({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <div className="field-group relative">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-foreground/30 transition hover:bg-red-50 hover:text-red-500"
        aria-label="Remove"
      >
        <span className="text-lg leading-none">&times;</span>
      </button>
      <div className="space-y-3 pr-7">{children}</div>
    </div>
  );
}

export function BulletEditor({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: Bullet[];
  onChange: (v: Bullet[]) => void;
  hint?: string;
}) {
  const items = value ?? [];
  const update = (i: number, next: Bullet) =>
    onChange(items.map((item, idx) => (idx === i ? next : item)));

  return (
    <RepeatShell
      label={label}
      count={items.length}
      hint={hint}
      addLabel="Add point"
      onAdd={() => onChange([...items, { text: emptyLocalized() }])}
    >
      {items.map((item, i) => (
        <RowShell key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
          <BilingualInput
            label={`Point ${i + 1}`}
            value={item.text}
            onChange={(text) => update(i, { text })}
            multiline
            rows={2}
          />
        </RowShell>
      ))}
    </RepeatShell>
  );
}

export function PeopleEditor({
  label,
  value,
  onChange,
  folder,
  token,
  onError,
  hint,
  recommend,
}: {
  label: string;
  value: Person[];
  onChange: (v: Person[]) => void;
  folder: string;
  token: string;
  onError?: (m: string) => void;
  hint?: string;
  recommend?: ReactNode;
}) {
  const items = value ?? [];
  const update = (i: number, patch: Partial<Person>) =>
    onChange(items.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <RepeatShell
      label={label}
      count={items.length}
      hint={hint}
      addLabel="Add person"
      onAdd={() =>
        onChange([...items, { name: emptyLocalized(), designation: emptyLocalized(), photo: '' }])
      }
    >
      {items.map((person, i) => (
        <RowShell key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
          <BilingualInput
            label="Name"
            value={person.name}
            onChange={(name) => update(i, { name })}
          />
          <BilingualInput
            label="Designation"
            value={person.designation}
            onChange={(designation) => update(i, { designation })}
          />
          <AssetPicker
            label="Photo"
            value={person.photo}
            onChange={(photo) => update(i, { photo })}
            folder={folder}
            token={token}
            onError={onError}
            recommend={recommend}
          />
        </RowShell>
      ))}
    </RepeatShell>
  );
}

export function AttachmentEditor({
  label,
  value,
  onChange,
  folder,
  token,
  onError,
  hint,
  recommend,
}: {
  label: string;
  value: Attachment[];
  onChange: (v: Attachment[]) => void;
  folder: string;
  token: string;
  onError?: (m: string) => void;
  hint?: string;
  recommend?: ReactNode;
}) {
  const items = value ?? [];
  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(items.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  return (
    <RepeatShell
      label={label}
      count={items.length}
      hint={hint}
      addLabel="Add file"
      onAdd={() =>
        onChange([...items, { title: emptyLocalized(), url: '', mimeType: '', sizeBytes: 0 }])
      }
    >
      {items.map((att, i) => (
        <RowShell key={i} onRemove={() => onChange(items.filter((_, idx) => idx !== i))}>
          <BilingualInput label="Title" value={att.title} onChange={(title) => update(i, { title })} />
          <AssetPicker
            label="File"
            value={att.url}
            onChange={(url) => update(i, { url })}
            folder={folder}
            token={token}
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            preview="file"
            onError={onError}
            recommend={recommend}
          />
        </RowShell>
      ))}
    </RepeatShell>
  );
}

export function GalleryEditor({
  label,
  value,
  onChange,
  folder,
  token,
  onError,
  hint,
  recommend,
  accept = 'image/*,video/*',
}: {
  label: string;
  value: MediaItem[];
  onChange: (v: MediaItem[]) => void;
  folder: string;
  token: string;
  onError?: (m: string) => void;
  hint?: string;
  recommend?: ReactNode;
  /** File types the picker offers (e.g. `image/*` for photo-only galleries) */
  accept?: string;
}) {
  const items = value ?? [];
  const [busy, setBusy] = useState(false);
  /* Upload progress while several files go up one after another */
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const inputId = useId();

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    const added: MediaItem[] = [];
    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });
    for (const [n, file] of list.entries()) {
      setProgress({ done: n, total: list.length });
      try {
        const res = await uploadAsset(file, folder, token);
        added.push({
          url: res.url,
          thumbnailUrl: res.thumbnailUrl || res.url,
          caption: emptyLocalized(),
          kind: res.kind === 'video' ? 'video' : 'image',
        });
      } catch (err) {
        onError?.(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
    if (added.length) onChange([...items, ...added]);
    setBusy(false);
    setProgress(null);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <Field label={`${label} · ${items.length}`} hint={hint}>
      <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-[#e6e8f0] bg-white">
            {item.kind === 'video' ? (
              <video src={item.url} className="w-full h-28 object-cover bg-black" muted />
            ) : (
              <img src={item.thumbnailUrl || item.url} alt="" className="w-full h-28 object-cover" />
            )}
            <div className="p-2 space-y-1.5">
              <input
                className="input !py-1.5 !text-xs"
                placeholder="Caption (Malayalam)"
                value={item.caption?.ml ?? ''}
                onChange={(e) =>
                  onChange(
                    items.map((it, idx) =>
                      idx === i
                        ? { ...it, caption: { ...(it.caption ?? emptyLocalized()), ml: e.target.value } }
                        : it
                    )
                  )
                }
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="px-1.5 text-xs text-foreground/40 hover:text-foreground"
                    onClick={() => move(i, i - 1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="px-1.5 text-xs text-foreground/40 hover:text-foreground"
                    onClick={() => move(i, i + 1)}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-500/70 hover:text-red-600"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        <label
          htmlFor={inputId}
          className="grid min-h-[128px] cursor-pointer place-items-center rounded-lg border border-dashed border-[#d3d7e4] text-[12px] text-foreground/45 transition hover:border-[#e6187e]/50 hover:bg-[#fdf2f8] hover:text-[#e6187e]"
        >
          {busy ? (
            <span className="flex flex-col items-center gap-2">
              <Spinner />
              {progress && progress.total > 1 && (
                <span>
                  Uploading {Math.min(progress.done + 1, progress.total)} of {progress.total}…
                </span>
              )}
            </span>
          ) : accept === 'image/*' ? (
            '+ Add photos'
          ) : (
            '+ Add media'
          )}
        </label>
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {recommend && <UploadSpec>{recommend}</UploadSpec>}
    </Field>
  );
}
