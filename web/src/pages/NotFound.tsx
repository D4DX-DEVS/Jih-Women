import { useSite } from '../lib/site';
import { Button, Container } from '../components/Primitives';

export default function NotFound() {
  const { path, s } = useSite();
  return (
    <Container className="flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <span className="font-display text-6xl font-bold text-plum-200">404</span>
      <h1 className="mt-5 font-display text-2xl font-semibold">{s('notFoundTitle')}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">{s('notFoundBody')}</p>
      <Button to={path('/')} className="mt-7">
        {s('backHome')}
      </Button>
    </Container>
  );
}
