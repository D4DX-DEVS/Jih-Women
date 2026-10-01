import { useParams } from 'react-router';
import { Calendar, Download, ExternalLink as ExternalLinkIcon, Images } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDateRange } from '../lib/format';
import {
  Button,
  Container,
  ContentPanel,
  DownloadList,
  ErrorState,
  Loading,
  PageHeader,
  PanelSection,
  RichText,
  Section,
} from '../components/Primitives';
import { GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { Campaign } from '../lib/types';

export default function CampaignDetail() {
  const { slug } = useParams();
  const { lang, path, s, h } = useSite();
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
        <Container className="max-w-4xl">
          {/* One content card: dates, poster and story, then downloads and photos */}
          <ContentPanel>
            <PanelSection>
              {(data.startDate || data.hashtag) && (
                <div className="mb-6 flex flex-wrap items-center gap-4 text-[13px] text-ink-muted">
                  {data.startDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-magenta-500" />
                      {formatDateRange(data.startDate, data.endDate, lang)}
                    </span>
                  )}
                  {data.hashtag && (
                    <span className="rounded-full bg-magenta-500/12 px-3 py-1 font-semibold text-magenta-500">{data.hashtag}</span>
                  )}
                </div>
              )}
              {data.posterImage && <img src={data.posterImage} alt="" className="mb-7 w-full rounded-xl" />}
              <RichText html={t(data.body, lang)} />
              {data.externalUrl && (
                <Button href={data.externalUrl} variant="outline" className="mt-7">
                  {s('visitWebsite')}
                  <ExternalLinkIcon size={15} />
                </Button>
              )}
            </PanelSection>

            {data.downloads?.length > 0 && (
              <PanelSection title={h('downloads')} icon={Download}>
                <DownloadList files={data.downloads} lang={lang} />
              </PanelSection>
            )}

            {data.gallery?.length > 0 && (
              <PanelSection title={h('gallery')} icon={Images}>
                <GalleryGrid items={data.gallery} />
              </PanelSection>
            )}
          </ContentPanel>
        </Container>
      </Section>
    </>
  );
}
