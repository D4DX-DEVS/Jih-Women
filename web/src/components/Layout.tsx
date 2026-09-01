import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
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

export default function Layout() {
  return (
    <SiteProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteProvider>
  );
}
