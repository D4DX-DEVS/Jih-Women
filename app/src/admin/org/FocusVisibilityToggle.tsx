import { useCallback, useEffect, useState } from 'react';
import { apiJson, describeError, isAuthError } from '../shared/api';
import { Spinner, Toggle } from '../shared/ui';
import type { CollectionExtraProps } from './CollectionManager';

const ENDPOINT = '/api/admin/cms/site-settings';

type SettingsDoc = { sections?: { focusAreas?: boolean } };

/**
 * ON/OFF switch for Focus on the public site: the home page strip and the About Us button.
 *
 * It edits the same `sections.focusAreas` flag as Site Settings → Home page
 * sections (there is no second setting). Only that one path is sent, so the other
 * section switches are left as they are, and the change is saved the moment the
 * switch is flipped.
 */
export default function FocusVisibilityToggle({ token, onToast, onLogout }: CollectionExtraProps) {
  const [visible, setVisible] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const doc = await apiJson<SettingsDoc>(ENDPOINT, { token });
      setVisible(doc.sections?.focusAreas !== false);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not load the Focus setting.'), 'error');
    }
  }, [token, onToast, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (next: boolean) => {
    if (visible === null || saving) return;
    const previous = visible;
    setVisible(next);
    setSaving(true);
    try {
      const doc = await apiJson<SettingsDoc>(ENDPOINT, {
        method: 'PATCH',
        body: { 'sections.focusAreas': next },
        token,
      });
      setVisible(doc.sections?.focusAreas !== false);
      onToast(next ? 'Focus is now shown on the website' : 'Focus is now hidden from the website');
    } catch (err) {
      setVisible(previous);
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not save the Focus setting. Please try again.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 p-3.5">
      <div className="min-w-0 flex-1 sm:min-w-[260px]">
        {visible === null ? (
          <Spinner />
        ) : (
          <Toggle
            label="Show Focus on the website"
            description="On: the Focus strip appears on the home page and the Focus button appears on the About Us page, in Malayalam and English. Off: both are hidden completely and leave no gap. Your focus areas are kept either way."
            checked={visible}
            onChange={change}
          />
        )}
      </div>
      {visible !== null && (
        <span className={`badge ${visible ? 'badge-success' : 'badge-muted'}`}>
          {saving ? 'Saving…' : visible ? 'ON' : 'OFF'}
        </span>
      )}
    </div>
  );
}
