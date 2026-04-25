import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupsApi, type GroupSummary } from '../api';
import { CURRENCIES, formatMoney } from '../utils';
import { useT, type TFn } from '../i18n';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import cardStyles from '../components/GroupCard.module.css';

function GroupCard({ g, t }: { g: GroupSummary; t: TFn }) {
  const bal = Number(g.myBalance) || 0;
  let label: string, cls: string, amount: string;
  if (Math.abs(bal) < 0.01) {
    label = t('groupCard.upToDate');
    cls = 'neutral';
    amount = formatMoney(0, g.currency);
  } else if (bal > 0) {
    label = t('groupCard.youAreOwed');
    cls = 'positive';
    amount = formatMoney(bal, g.currency);
  } else {
    label = t('groupCard.youOwe');
    cls = 'negative';
    amount = formatMoney(-bal, g.currency);
  }
  const meta = `${t('groupCard.members', { count: g.memberCount })} · ${t('groupCard.expenses', { count: g.expenseCount })} · ${g.currency}`;

  return (
    <Link to={`/groups/${g._id}`} className={cardStyles.card}>
      <Avatar name={g.name} size="lg" />
      <div className={cardStyles.info}>
        <div className={cardStyles.title}>{g.name}</div>
        <div className={cardStyles.meta}>{meta}</div>
      </div>
      <div className={cardStyles.balanceBox}>
        <div className="balance-label">{label}</div>
        <div className={`balance-amount ${cls}`}>{amount}</div>
      </div>
    </Link>
  );
}

function NewGroupForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const t = useT();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { ok, data } = await groupsApi.create(
      fd.get('name') as string,
      fd.get('currency') as string,
    );
    if (ok) {
      const d = data as { _id: string };
      onSuccess(d._id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>{t('groupsList.nameLabel')}</label>
        <input
          name="name"
          placeholder={t('groupsList.namePlaceholder')}
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label>{t('groupsList.currencyLabel')}</label>
        <select name="currency">
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {t(`currencies.${c.code}`)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        {t('groupsList.submit')}
      </button>
    </form>
  );
}

export default function GroupsListPage() {
  const t = useT();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    groupsApi.list().then(({ ok, data }) => {
      if (ok && Array.isArray(data)) setGroups(data as GroupSummary[]);
      setLoaded(true);
    });
  }, []);

  return (
    <>
      <div className="hero fade-up">
        <h1>{t('groupsList.heroTitle')}</h1>
        <p>{t('groupsList.heroSub')}</p>
      </div>

      <div className="fade-up">
        {loaded && groups.length === 0 ? (
          <div className="card empty">
            <span className="empty-icon">👥</span>
            {t('groupsList.emptyLine1')}
            <br />
            {(() => {
              const text = t('groupsList.emptyLine2', { plus: '%PLUS%' });
              const [before, after = ''] = text.split('%PLUS%');
              return (
                <>
                  {before}
                  <strong>+</strong>
                  {after}
                </>
              );
            })()}
          </div>
        ) : (
          <div className={cardStyles.list}>
            {groups.map((g) => (
              <GroupCard key={g._id} g={g} t={t} />
            ))}
          </div>
        )}
      </div>

      <button
        className="fab"
        aria-label={t('groupsList.fabAria')}
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {showModal && (
        <Modal title={t('groupsList.newGroupTitle')} onClose={() => setShowModal(false)}>
          <NewGroupForm
            onSuccess={(id) => {
              setShowModal(false);
              navigate(`/groups/${id}`);
            }}
          />
        </Modal>
      )}
    </>
  );
}
