import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';
import { groupsApi } from '../api';
import AuthPage from './AuthPage';

const PENDING_JOIN_KEY = 'pendingJoinToken';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { currentUser, loading } = useAuth();
  const t = useT();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !token) return;

    if (!currentUser) {
      sessionStorage.setItem(PENDING_JOIN_KEY, token);
      return;
    }

    groupsApi.join(token).then(({ ok, data }) => {
      const d = data as { groupId?: string };
      if (ok && d.groupId) {
        navigate(`/groups/${d.groupId}`, { replace: true });
      } else {
        navigate('/groups', { replace: true });
      }
    });
  }, [loading, currentUser, token, navigate]);

  if (loading) return null;

  if (!currentUser) {
    return <AuthPage viaInvite />;
  }

  return <div className="empty">{t('join.joining')}</div>;
}
