import { useState } from 'react';
import { apiJson, describeError, isAuthError } from '../shared/api';
import type { CollectionExtraProps } from './CollectionManager';

type ImportResult = { found: number; added: number; skipped: number; failed: number };

/**
 * Adds a YouTube channel's newest uploads to the video library. Videos already
 * in the library are skipped, so it can be run again later to pick up new uploads.
 */
export default function YouTubeChannelImport({ token, onToast, onLogout, reload }: CollectionExtraProps) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    try {
      const r = await apiJson<ImportResult>('/api/admin/cms/videos/import-channel', {
        method: 'POST',
        body: { url: url.trim() },
        token,
      });
      const parts = [`${r.added} added`];
      if (r.skipped) parts.push(`${r.skipped} already in the library`);
      if (r.failed) parts.push(`${r.failed} unavailable`);
      onToast(`YouTube import: ${parts.join(', ')}.`);
      await reload();
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'We could not import that channel.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={run} className="glass flex flex-wrap items-end gap-3 p-3.5">
      <div className="min-w-0 w-full flex-1 sm:min-w-[260px]">
        <label className="field-label">Import from YouTube channel</label>
        <input
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channelname/videos"
        />
        <p className="mt-1 text-[11.5px] text-foreground/50">
          Adds the channel's newest videos (title, description, thumbnail and duration from YouTube). They are
          published but not featured — tick "Featured on home page" on up to three to show them on the home page.
        </p>
      </div>
      <button type="submit" className="pill pill-primary" disabled={busy || !url.trim()}>
        {busy ? 'Importing…' : 'Import videos'}
      </button>
    </form>
  );
}
