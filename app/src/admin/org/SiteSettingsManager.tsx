import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiJson, isAuthError, describeError } from '../shared/api';
import { SectionCard, Spinner } from '../shared/ui';
import { sectionPreviewUrl } from './preview';
import { renderField } from './fields';
import type { Doc, FieldDef } from './fields';

const IDENTITY_FIELDS: FieldDef[] = [
  { kind: 'localized', path: 'siteName', label: 'Organisation name', required: true },
  { kind: 'localized', path: 'tagline', label: 'Tagline', multiline: true, rows: 2 },
  { kind: 'row', fields: [
    {
      kind: 'asset',
      path: 'logoUrl',
      label: 'Logo',
      folder: 'brand',
      recommend:
        'At least 200px tall, width proportional (up to about 1000px wide). Transparent PNG or SVG — it sits on a white plate in the footer.',
    },
    {
      kind: 'asset',
      path: 'faviconUrl',
      label: 'Favicon',
      folder: 'brand',
      recommend: '512×512px square. Transparent PNG or SVG.',
    },
  ] },
  {
    kind: 'localized',
    path: 'topBarText',
    label: 'Announcement bar text',
    hint: 'The slim strip above the header.',
  },
  { kind: 'row', fields: [
    { kind: 'localized', path: 'joinLabel', label: 'Header button label' },
    { kind: 'text', path: 'joinUrl', label: 'Header button link', placeholder: '/contact' },
  ] },
  { kind: 'localized', path: 'footerNote', label: 'Footer note', multiline: true, rows: 2 },
];

const PRESIDENT_FIELDS: FieldDef[] = [
  { kind: 'toggle', path: 'presidentMessage.enabled', label: 'Show on the home page' },
  { kind: 'localized', path: 'presidentMessage.heading', label: 'Section heading' },
  { kind: 'row', fields: [
    { kind: 'localized', path: 'presidentMessage.name', label: 'Name' },
    { kind: 'localized', path: 'presidentMessage.designation', label: 'Designation' },
  ] },
  {
    kind: 'asset',
    path: 'presidentMessage.photo',
    label: 'Photograph',
    folder: 'brand',
    recommend:
      '800×960px (5:6 portrait). The top of the frame is rounded into a tall arch and centre-cropped, so keep the face in the upper third.',
  },
  { kind: 'rich', path: 'presidentMessage.message', label: 'Message' },
  {
    kind: 'text',
    path: 'presidentMessage.linkUrl',
    label: 'Read more link',
    placeholder: '/who-we-are/our-legacy',
  },
];

const CONTACT_FIELDS: FieldDef[] = [
  { kind: 'localized', path: 'address', label: 'Office address', multiline: true, rows: 3 },
  { kind: 'row', fields: [
    { kind: 'text', path: 'phone', label: 'Phone' },
    { kind: 'text', path: 'whatsapp', label: 'WhatsApp' },
  ] },
  { kind: 'row', fields: [
    { kind: 'text', path: 'email', label: 'Email' },
    { kind: 'text', path: 'mapEmbedUrl', label: 'Google Maps embed URL' },
  ] },
  { kind: 'localized', path: 'workingHours', label: 'Working hours', multiline: true, rows: 2 },
];

const SOCIAL_FIELDS: FieldDef[] = [
  { kind: 'row', fields: [
    { kind: 'text', path: 'social.facebook', label: 'Facebook' },
    { kind: 'text', path: 'social.instagram', label: 'Instagram' },
  ] },
  { kind: 'row', fields: [
    { kind: 'text', path: 'social.youtube', label: 'YouTube' },
    { kind: 'text', path: 'social.twitter', label: 'X (Twitter)' },
  ] },
  { kind: 'text', path: 'social.whatsappChannel', label: 'WhatsApp channel' },
];

const SECTION_FIELDS: FieldDef[] = [
  { kind: 'toggle', path: 'sections.slider', label: 'Sliding images' },
  { kind: 'toggle', path: 'sections.programBanners', label: 'Programme banner strip' },
  { kind: 'toggle', path: 'sections.presidentMessage', label: "President's message" },
  { kind: 'toggle', path: 'sections.focusAreas', label: 'Focus areas' },
  { kind: 'toggle', path: 'sections.campaigns', label: 'Campaigns' },
  { kind: 'toggle', path: 'sections.updates', label: 'Updates' },
  { kind: 'toggle', path: 'sections.featuredArticles', label: 'Featured articles' },
  { kind: 'toggle', path: 'sections.upcomingEvents', label: 'Upcoming events' },
  { kind: 'toggle', path: 'sections.featuredVideos', label: 'Featured videos' },
  { kind: 'toggle', path: 'sections.publications', label: 'Publications' },
  { kind: 'toggle', path: 'sections.contact', label: 'Contact section' },
  { kind: 'toggle', path: 'sections.newsletter', label: 'Newsletter signup (footer)' },
];

type Props = {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

export default function SiteSettingsManager({ token, onToast, onLogout }: Props) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<Doc>('/api/admin/cms/site-settings', { token });
      setDoc(data);
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Failed to load settings'), 'error');
    } finally {
      setLoading(false);
    }
  }, [token, onToast, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const payload = { ...doc };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;
      const data = await apiJson<Doc>('/api/admin/cms/site-settings', {
        method: 'PATCH',
        body: payload,
        token,
      });
      setDoc(data);
      onToast('Site settings saved');
    } catch (err) {
      if (isAuthError(err)) return onLogout();
      onToast(describeError(err, 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="text-center py-16">
        <Spinner />
      </div>
    );
  }

  const siteUrl = sectionPreviewUrl('site-settings');

  const ctx = {
    doc,
    onChange: setDoc,
    token,
    onError: (m: string) => onToast(m, 'error'),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-display text-2xl font-bold">Site Settings</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Identity, contact details, social profiles and home page section visibility.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noreferrer" className="preview-btn">
              <ExternalLink size={14} />
              Preview
            </a>
          )}
          <button className="pill pill-primary text-sm" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Save changes'}
          </button>
        </div>
      </div>

      <SectionCard title="Identity">
        <div className="space-y-5">{IDENTITY_FIELDS.map((f, i) => renderField(f, ctx, `id-${i}`))}</div>
      </SectionCard>

      <SectionCard
        title="President's message"
        description="The message block shown between the programme strip and the focus areas."
      >
        <div className="space-y-5">{PRESIDENT_FIELDS.map((f, i) => renderField(f, ctx, `pm-${i}`))}</div>
      </SectionCard>

      <SectionCard title="Contact">
        <div className="space-y-5">{CONTACT_FIELDS.map((f, i) => renderField(f, ctx, `ct-${i}`))}</div>
      </SectionCard>

      <SectionCard title="Social media">
        <div className="space-y-5">{SOCIAL_FIELDS.map((f, i) => renderField(f, ctx, `sc-${i}`))}</div>
      </SectionCard>

      <SectionCard
        title="Home page sections"
        description="Turn individual home page sections on or off without deleting their content."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTION_FIELDS.map((f, i) => renderField(f, ctx, `sec-${i}`))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button className="pill pill-primary text-sm" onClick={save} disabled={saving}>
          {saving ? <Spinner /> : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
