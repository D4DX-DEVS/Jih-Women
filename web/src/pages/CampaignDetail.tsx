import { useParams } from 'react-router';
import { Download, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes, formatDateRange } from '../lib/format';
import {
  Button,
  Container,
  ErrorState,
  Loading,
  PageHeader,
  RichText,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { Campaign } from '../lib/types';

export default function CampaignDetail() {
  const { slug } = useParams();
  const { lang, path, s } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Campaign>(
    slug ? `/api/site/campaigns/${slug}` : null
  );

  if (notFound) return <NotFound />;
  if (loading) return <Loading />;
  if (error) {
    return (
      <Container className="py-20">
        <ErrorState message={error} onRetry={reload} />
      </Container>
    );
  }
  if (!data) return null;

  return (
    <>
      <PageHeader
        title={t(data.title, lang)}
        description={t(data.summary, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('campaigns'), to: path('/') },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist">
        <Container className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-4 text-[13px] text-ink-muted">
            {data.startDate && <span>{formatDateRange(data.startDate, data.endDate, lang)}</span>}
            {data.hashtag && (
              <span className="rounded-full bg-magenta-500/12 px-3 py-1 font-semibold text-magenta-500">
                {data.hashtag}
              </span>
            )}
          </div>

          {data.posterImage && (
            <img
              src={data.posterImage}
              alt=""
              className="mb-8 w-full rounded-3xl border border-plum-100 shadow-soft"
            />
          )}

          <RichText html={t(data.body, lang)} />

          {data.externalUrl && (
            <Button href={data.externalUrl} variant="outline" className="mt-7">
              {s('visitWebsite')}
              <ExternalLinkIcon size={15} />
            </Button>
          )}

          {data.downloads?.length > 0 && (
            <div className="mt-10 rounded-3xl border border-plum-100 bg-white p-6 shadow-soft">
              <h3 className="mb-4 font-display text-base font-semibold">{s('downloads')}</h3>
              <ul className="space-y-2">
                {data.downloads.map((file, i) => (
                  <li key={i}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-magenta-50"
                    >
                      <Download size={15} className="shrink-0 text-magenta-600" />
                      <span className="min-w-0 flex-1 truncate">
                        {t(file.title, lang) || file.url.split('/').pop()}
                      </span>
                      {file.sizeBytes > 0 && (
                        <span className="shrink-0 text-[11px] text-ink-faint">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.gallery?.length > 0 && (
            <div className="mt-10">
              <SectionHeading eyebrow={s('media')} title={s('gallery')} />
              <GalleryGrid items={data.gallery} />
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
