import { useEffect, useState } from 'react';
import { apiJson } from '../shared/api';
import { Field } from '../shared/ui';

type LinkGroup = { label: string; items: { label: string; path: string }[] };

const CUSTOM = '__custom__';

/**
 * Chooses where a button goes: any published page of the site (listed by the
 * backend, grouped by section) or a custom path / full URL. The value is stored
 * as a site path such as `/who-we-are/history`; the public site adds the
 * visitor's language prefix.
 */
export default function LinkPicker({
  label,
  hint,
  emptyLabel,
  value,
  token,
  onChange,
}: {
  label: string;
  hint?: string;
  /** What the empty choice means for this button */
  emptyLabel: string;
  value: string;
  token: string;
  onChange: (value: string) => void;
}) {
  const [groups, setGroups] = useState<LinkGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiJson<{ groups: LinkGroup[] }>('/api/admin/cms/link-targets', { token })
      .then((data) => !cancelled && setGroups(data.groups))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const known = groups?.some((g) => g.items.some((item) => item.path === value)) ?? false;
  // A saved value that is no longer in the list (page unpublished or deleted) shows as custom
  const isCustom = failed || custom || (Boolean(value) && groups !== null && !known);
  const selected = isCustom ? CUSTOM : value;

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {!failed && (
          <select
            className="input"
            value={selected}
            onChange={(e) => {
              const next = e.target.value;
              setCustom(next === CUSTOM);
              if (next !== CUSTOM) onChange(next);
            }}
          >
            <option value="">{emptyLabel}</option>
            {groups === null && value && <option value={value}>{value}</option>}
            {groups?.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.path} value={item.path}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM}>Custom link…</option>
          </select>
        )}
        {isCustom && (
          <input
            className="input"
            placeholder="/who-we-are/history or https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </Field>
  );
}
