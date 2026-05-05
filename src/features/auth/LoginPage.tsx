import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/hooks/useAuth';
import { AuthShell, AuthLink } from './AuthShell';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await signIn(email, pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    nav('/trips', { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Inloggen"
      title="Welkom terug."
      prose="Eén app voor de inpaklijst van iedereen, met afvinken op alle telefoons. Log in om verder te gaan waar je was."
      footer={<>Nog geen account? <AuthLink to="/signup">Maak er één aan.</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email" id="email">
          <input id="email" type="email" required autoComplete="email"
                 value={email} onChange={e => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label="Wachtwoord" id="pw">
          <input id="pw" type="password" required autoComplete="current-password"
                 value={pw} onChange={e => setPw(e.target.value)} className="input" />
        </Field>
        {err && <p className="text-sm text-accent2">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-eyebrow mb-2">{label}</span>
      {children}
    </label>
  );
}
