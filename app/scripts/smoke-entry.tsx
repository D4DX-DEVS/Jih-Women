// Entry used only by the headless admin smoke test.
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import Admin from '../src/pages/Admin';

export function mount(el: HTMLElement) {
  const root = createRoot(el);
  root.render(
    <MemoryRouter initialEntries={['/admin']}>
      <Admin />
    </MemoryRouter>
  );
  return root;
}
