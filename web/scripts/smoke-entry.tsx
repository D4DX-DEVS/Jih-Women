// Entry used only by the headless smoke test — not part of the site bundle.
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import App from '../src/App';

export function mount(el: HTMLElement, path: string) {
  const root = createRoot(el);
  root.render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  return root;
}
