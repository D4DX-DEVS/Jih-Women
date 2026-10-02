import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router';
import { SiteProvider } from '../lib/site';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';
import BottomNav from './BottomNav';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Shell() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const isHome = /^\/(ml|en)\/?$/.test(pathname);
  return (
    // Phones: bottom padding so the fixed bottom navigation never covers the end of a page
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main id="main" className="min-w-0 flex-1 overflow-x-clip">
        <Outlet />
      </main>
      {/* Phones show the footer on the home page only (the bottom navigation covers the
          rest); from md it is on every page. `contents` drops the wrapper so the footer
          lays out as a direct child of the page column. */}
      <div className={isHome ? 'contents' : 'hidden md:contents'}>
        <Footer key={lang} />
      </div>
      <BackToTop />
      <BottomNav />
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
