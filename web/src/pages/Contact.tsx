import { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { apiPost } from '../lib/api';
import { useSite } from '../lib/site';
import { whatsappHref } from '../lib/format';
import { OFFICE_ADDRESS, OFFICE_EMAIL, OFFICE_PHONE, telHref } from '../lib/contact';
import {
  Button,
  Container,
  GradientText,
  PageHeader,
  Section,
} from '../components/Primitives';

const EMPTY = { name: '', email: '', phone: '', district: '', subject: '', message: '' };

export default function Contact() {
  const { data, path, s, pageTitle } = useSite();
  const settings = data?.settings;
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await apiPost('/api/site/contact', form);
      setStatus('done');
      setForm(EMPTY);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to send');
    }
  };

  const details = [
    { Icon: MapPin, label: 'Office Address', value: OFFICE_ADDRESS, href: '' },
    { Icon: Phone, label: 'Phone', value: OFFICE_PHONE, href: telHref(OFFICE_PHONE) },
    { Icon: MessageCircle, label: 'WhatsApp', value: OFFICE_PHONE, href: whatsappHref(OFFICE_PHONE) },
    { Icon: Mail, label: 'Email', value: OFFICE_EMAIL, href: `mailto:${OFFICE_EMAIL}` },
  ];

  const field = (
    key: keyof typeof EMPTY,
    label: string,
    { required = false, type = 'text', rows = 0 } = {}
  ) => (
    <div className={rows ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-[12px] font-medium text-ink-muted">
        {label}
        {required ? <span className="ms-1 text-magenta-500">*</span> : (
          <span className="ms-1 text-ink-faint">(Optional)</span>
        )}
      </label>
      {rows ? (
        <textarea
          rows={rows}
          required={required}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-2xl border border-plum-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-magenta-500"
        />
      ) : (
        <input
          type={type}
          required={required}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-xl border border-plum-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-magenta-500"
        />
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title={pageTitle('contact')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('contact') }]}
      />
      <Section tone="mist">
        <Container>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-10">
            <div className="min-w-0 space-y-4">
              {details.map(({ Icon, label, value, href }) => (
                <div
                  key={label}
                  className="flex gap-4 rounded-3xl border border-plum-100 bg-white p-5 shadow-soft"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-magenta-50 text-magenta-600">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className="mt-1 block break-words text-[15px] font-medium text-ink transition hover:text-magenta-600"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink/85">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <div className="rounded-3xl border border-plum-100 bg-white p-5 shadow-soft sm:p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold"><GradientText>Write to Us</GradientText></h2>

                {status === 'done' ? (
                  <div className="mt-6 rounded-2xl border border-magenta-200 bg-magenta-50 p-6 text-center">
                    <p className="text-sm font-medium text-plum-800">{s('messageSent')}</p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-3 text-[13px] font-semibold text-magenta-600 underline underline-offset-4"
                    >
                      Write to Us
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    {field('name', 'Your Name', { required: true })}
                    {field('phone', 'Phone Number', { type: 'tel' })}
                    {field('email', 'Email Address', { type: 'email' })}
                    {field('district', 'District')}
                    {field('subject', 'Subject')}
                    {field('message', 'Message', { required: true, rows: 5 })}

                    {error && (
                      <p className="text-[13px] text-red-600 sm:col-span-2">{error}</p>
                    )}

                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={status === 'sending'}>
                        {status === 'sending' ? s('sending') : s('send')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {settings?.mapEmbedUrl && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-plum-100 shadow-soft">
                  <iframe
                    src={settings.mapEmbedUrl}
                    title="Map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-[320px] w-full border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
