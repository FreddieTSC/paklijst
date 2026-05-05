import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '@/hooks/useAuth';
import { AuthShell, AuthLink } from './AuthShell';

export function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error, data } = await signUp(email, pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (!data.session) {
      // Email confirmation enabled? Show a hint.
      setErr('Check je inbox om je email te bevestigen, en log dan in.');
      return;
    }
    nav('/onboarding', { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Aan de slag"
      title="Een nieuw account."
      prose="Maak je account aan; daarna stel je je huishouden samen — wie er meereist en hoe je je lijsten ordent."
      footer={<>Heb je al een account? <AuthLink to="/login">Inloggen.</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="block text-eyebrow mb-2">Email</span>
          <input type="email" required autoComplete="email"
                 value={email} onChange={e => setEmail(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-eyebrow mb-2">Wachtwoord (min. 8 tekens)</span>
          <input type="password" required minLength={8} autoComplete="new-password"
                 value={pw} onChange={e => setPw(e.target.value)} className="input" />
        </label>
        {err && <p className="text-sm text-accent2">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Bezig…' : 'Account maken'}
        </button>
      </form>
    </AuthShell>
  );
}
