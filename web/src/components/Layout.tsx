import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router';
import { SiteProvider } from '../lib/site';
import Header from './Header';
import Footer from './Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Shell() {
  const { lang } = useParams();
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
      <Header />
      <main id="main" className="min-w-0 flex-1 overflow-x-clip">
        <Outlet />
      </main>
      <Footer key={lang} />
    </div>
  );
}

export default function Layout() {
  const { lang } = useParams();
  return (
    <SiteProvider key={lang}>
      <ScrollToTop />
      <Shell />
    </SiteProvider>
  );
}
