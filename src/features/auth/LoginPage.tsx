import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/hooks/useAuth';
import { AuthShell } from './AuthShell';

const USERS = ['Tiemen', 'An', 'Jakob', 'Charlotte'] as const;
type UserName = typeof USERS[number];

const SHARED_PW = 'inpaklijst2024';

function emailFor(name: UserName): string {
  return `${name.toLowerCase()}@namibia.app`;
}

export function LoginPage() {
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<UserName | null>(null);

  async function pick(name: UserName) {
    setLoading(name); setErr(null);
    const { error } = await signIn(emailFor(name), SHARED_PW);
    setLoading(null);
    if (error) { setErr('Inloggen mislukt — probeer opnieuw.'); return; }
    nav('/trips', { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Inloggen"
      title="Welkom terug."
      prose="Eén app voor de inpaklijst van het hele gezin, met afvinken op alle telefoons."
    >
      <div className="space-y-7">
        <div>
          <span className="block text-eyebrow mb-3">Wie ben jij?</span>
          <div className="grid grid-cols-2 gap-2">
            {USERS.map(u => (
              <button key={u} type="button" onClick={() => pick(u)}
                      disabled={loading !== null}
                      className={`px-4 py-4 text-left rounded-md border-2 transition-colors
                                 ${loading === u
                                   ? 'border-ink bg-ink text-paper'
                                   : 'border-rule bg-white text-ink hover:border-ink/40'}`}>
                <span className="text-h2 font-semibold tracking-tight">
                  {loading === u ? 'Bezig…' : u}
                </span>
              </button>
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-accent2">{err}</p>}
      </div>
    </AuthShell>
  );
}
