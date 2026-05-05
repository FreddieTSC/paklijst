import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/hooks/useAuth';
import { AuthShell } from './AuthShell';

const USERS = ['Tiemen', 'An', 'Jakob', 'Charlotte'] as const;
type UserName = typeof USERS[number];

function emailFor(name: UserName): string {
  return `${name.toLowerCase()}@inpaklijst.local`;
}

export function LoginPage() {
  const nav = useNavigate();
  const [name, setName] = useState<UserName | null>(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (name) pwRef.current?.focus(); }, [name]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true); setErr(null);
    const { error } = await signIn(emailFor(name), pw);
    setLoading(false);
    if (error) { setErr('Wachtwoord klopt niet.'); return; }
    nav('/trips', { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Inloggen"
      title="Welkom terug."
      prose="Eén app voor de inpaklijst van het hele gezin, met afvinken op alle telefoons."
    >
      <form onSubmit={onSubmit} className="space-y-7">
        <div>
          <span className="block text-eyebrow mb-3">Wie ben jij?</span>
          <div className="grid grid-cols-2 gap-2">
            {USERS.map(u => (
              <button key={u} type="button" onClick={() => setName(u)}
                      className={`px-4 py-4 text-left rounded-md border-2 transition-colors
                                 ${name === u
                                   ? 'border-ink bg-ink text-paper'
                                   : 'border-rule bg-white text-ink hover:border-ink/40'}`}>
                <span className="text-h2 font-semibold tracking-tight">{u}</span>
              </button>
            ))}
          </div>
        </div>

        {name && (
          <label className="block">
            <span className="block text-eyebrow mb-2">Wachtwoord</span>
            <input ref={pwRef} type="password" required autoComplete="current-password"
                   value={pw} onChange={e => setPw(e.target.value)} className="input" />
          </label>
        )}

        {err && <p className="text-sm text-accent2">{err}</p>}

        <button disabled={!name || loading} className="btn-primary w-full">
          {loading ? 'Bezig…' : name ? `Inloggen als ${name}` : 'Kies eerst je naam'}
        </button>
      </form>
    </AuthShell>
  );
}
