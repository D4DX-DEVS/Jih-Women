import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import { PageDetail, WhoWeAreIndex } from './pages/WhoWeAre';
import { DepartmentDetail, DepartmentsIndex } from './pages/Departments';
import { ProgramDetail, ProgramsIndex } from './pages/Programs';
import Leaders from './pages/Leaders';
import { EventDetail, EventsIndex } from './pages/Events';
import {
  AlbumDetail,
  AlbumsIndex,
  DownloadsPage,
  MediaDetail,
  MediaList,
  VideosPage,
} from './pages/Media';
import { PublicationDetail, PublicationsIndex } from './pages/Publications';
import CampaignDetail from './pages/CampaignDetail';
import Links from './pages/Links';
import Contact from './pages/Contact';
import Search from './pages/Search';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ml" replace />} />

      <Route path="/:lang" element={<Layout />}>
        <Route index element={<Home />} />

        <Route path="who-we-are" element={<WhoWeAreIndex />} />
        <Route path="who-we-are/:slug" element={<PageDetail />} />

        <Route path="departments" element={<DepartmentsIndex />} />
        <Route path="departments/:slug" element={<DepartmentDetail />} />

        <Route path="programs" element={<ProgramsIndex />} />
        <Route path="programs/:slug" element={<ProgramDetail />} />

        <Route path="leaders" element={<Leaders />} />

        <Route path="events" element={<EventsIndex />} />
        <Route path="events/:slug" element={<EventDetail />} />

        <Route path="campaigns/:slug" element={<CampaignDetail />} />

        {/* Static media routes must precede the dynamic :type route */}
        <Route path="media" element={<Navigate to="news" replace />} />
        <Route path="media/videos" element={<VideosPage kind="video" />} />
        <Route path="media/podcasts" element={<VideosPage kind="podcast" />} />
        <Route path="media/gallery" element={<AlbumsIndex />} />
        <Route path="media/gallery/:slug" element={<AlbumDetail />} />
        <Route path="media/downloads" element={<DownloadsPage />} />
        <Route path="media/:type" element={<MediaList />} />
        <Route path="media/:type/:slug" element={<MediaDetail />} />

        <Route path="publications" element={<PublicationsIndex />} />
        <Route path="publications/:slug" element={<PublicationDetail />} />

        <Route path="links" element={<Links />} />
        <Route path="contact" element={<Contact />} />
        <Route path="search" element={<Search />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<Navigate to="/ml" replace />} />
    </Routes>
  );
}
