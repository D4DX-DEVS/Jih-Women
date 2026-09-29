import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import gsap from 'gsap'
import './index.css'
import App from './App.tsx'

// Respect the OS-level reduced-motion preference: every GSAP tween on the
// site (entrance timelines, ScrollTrigger reveals, looping float animations)
// still runs exactly as authored, just ~50x faster, so it settles into its
// final state almost instantly instead of playing a visible animation.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(50)
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
