import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsApi } from '../api';

const PENDING_JOIN_KEY = 'pendingJoinToken';

async function consumePendingJoin(): Promise<string | null> {
  const token = sessionStorage.getItem(PENDING_JOIN_KEY);
  if (!token) return null;
  sessionStorage.removeItem(PENDING_JOIN_KEY);
  const { ok, data } = await groupsApi.join(token);
  const d = data as { groupId?: string };
  return ok && d.groupId ? d.groupId : null;
}

interface AuthPageProps {
  viaInvite?: boolean;
}

export default function AuthPage({ viaInvite = false }: AuthPageProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    viaInvite ? 'register' : 'login',
  );
  const [error, setError] = useState('');

  const heroTitle = viaInvite
    ? 'Te invitaron a un grupo.'
    : 'Comparte gastos sin complicaciones.';
  const heroSub = viaInvite
    ? 'Inicia sesión o crea una cuenta para unirte al grupo.'
    : 'Registra lo que pagó cada persona y consulta al instante quién le debe a quién.';

  const handleAfterAuth = async () => {
    const groupId = await consumePendingJoin();
    if (groupId) {
      navigate(`/groups/${groupId}`, { replace: true });
    } else {
      navigate('/groups', { replace: true });
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const result = await login(
      fd.get('username') as string,
      fd.get('password') as string,
    );
    if (result.ok) {
      await handleAfterAuth();
    } else {
      setError(result.message ?? 'Error');
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const result = await register(
      fd.get('username') as string,
      fd.get('password') as string,
    );
    if (result.ok) {
      await handleAfterAuth();
    } else {
      setError(result.message ?? 'Error');
    }
  };

  return (
    <>
      <div className="hero fade-up">
        <h1>{heroTitle}</h1>
        <p>{heroSub}</p>
      </div>
      <div className="card fade-up">
        <div className="tabs" role="tablist">
          <button
            className={`tab${activeTab === 'login' ? ' active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Iniciar sesión
          </button>
          <button
            className={`tab${activeTab === 'register' ? ' active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            Registrarse
          </button>
        </div>

        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Usuario</label>
              <input
                name="username"
                placeholder="ej: maria"
                required
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Entrar →
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="field">
              <label>Usuario</label>
              <input
                name="username"
                placeholder="Elige un nombre de usuario"
                required
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                name="password"
                type="password"
                placeholder="Elige una contraseña"
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Crear cuenta →
            </button>
          </form>
        )}

        {error && <p className="msg">{error}</p>}
      </div>
    </>
  );
}
