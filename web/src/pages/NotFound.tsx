import { useSite } from '../lib/site';
import { Button, Container, GradientText } from '../components/Primitives';

export default function NotFound() {
  const { path, s, h } = useSite();
  return (
    <Container className="flex min-h-[55vh] flex-col items-center justify-center py-10 text-center sm:py-20">
      <span className="font-display text-5xl font-bold text-plum-200 sm:text-6xl">404</span>
      <h1 className="mt-3 font-display text-xl font-semibold sm:mt-5 sm:text-2xl"><GradientText>{h('notFoundTitle')}</GradientText></h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted sm:mt-3 sm:text-[15px]">{s('notFoundBody')}</p>
      <Button to={path('/')} className="mt-5 sm:mt-7">
        {s('backHome')}
      </Button>
    </Container>
  );
}
