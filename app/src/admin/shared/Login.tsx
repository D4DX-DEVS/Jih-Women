import { useState } from 'react';
import { apiJson, describeError } from './api';

export default function Login({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      onSuccess(data.token);
    } catch (err) {
      setError(describeError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-strong w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="admin-display text-3xl font-bold tracking-tight">Admin Console</div>
          <div className="text-foreground/60 text-sm mt-2">
            Women&rsquo;s Wing &mdash; Jamaat-e-Islami Kerala
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-2">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              className="input"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-foreground/60 mb-2">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button type="submit" className="pill pill-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
