import { Routes, Route } from 'react-router';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Scanner from './pages/Scanner';
import GalleryPage from './pages/Gallery';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  );
}
