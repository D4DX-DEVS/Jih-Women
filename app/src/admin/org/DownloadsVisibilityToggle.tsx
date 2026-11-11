import { useCallback, useEffect, useState } from 'react';
import { apiJson, describeError, isAuthError } from '../shared/api';
import { Spinner, Toggle } from '../shared/ui';
import type { CollectionExtraProps } from './CollectionManager';

const ENDPOINT = '/api/admin/cms/site-settings';

type SettingsDoc = { sections?: { downloads?: boolean } };

/**
 * ON/OFF switch for the Downloads link in the public site's menus (desktop Media
 * menu, tablet drawer and the phone "More" sheet).
 *
 * It edits the `sections.downloads` flag, the same one listed under Site Settings →
 * Home page sections. Only that one path is sent, so the other switches are left as
 * they are, and the change is saved the moment the switch is flipped. The Downloads
 * page and its files stay live either way.
 */
export default function DownloadsVisibilityToggle({ token, onToast, onLogout }: CollectionExtraProps) {
  const [visible, setVisible] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const doc = await apiJson<SettingsDoc>(ENDPOINT, { token });
      setVisible(doc.sections?.downloads !== false);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not load the Downloads setting.'), 'error');
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
        body: { 'sections.downloads': next },
        token,
      });
      setVisible(doc.sections?.downloads !== false);
      onToast(next ? 'Downloads is now shown in the website menu' : 'Downloads is now hidden from the website menu');
    } catch (err) {
      setVisible(previous);
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not save the Downloads setting. Please try again.'), 'error');
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
            label="Show Downloads in the website menu"
            description="On: the Downloads link (with its download icon) appears in the Media menu on desktop, tablet and phone. Off: the link is hidden everywhere. Your downloads are kept, and the Downloads page still opens from a direct link."
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
