import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupsApi, type GroupSummary } from '../api';
import { CURRENCIES, formatMoney, plural } from '../utils';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import cardStyles from '../components/GroupCard.module.css';

function GroupCard({ g }: { g: GroupSummary }) {
  const bal = Number(g.myBalance) || 0;
  let label: string, cls: string, amount: string;
  if (Math.abs(bal) < 0.01) {
    label = 'Estás al día';
    cls = 'neutral';
    amount = formatMoney(0, g.currency);
  } else if (bal > 0) {
    label = 'Te deben';
    cls = 'positive';
    amount = formatMoney(bal, g.currency);
  } else {
    label = 'Debes';
    cls = 'negative';
    amount = formatMoney(-bal, g.currency);
  }
  const meta = `${plural(g.memberCount, 'miembro', 'miembros')} · ${plural(g.expenseCount, 'gasto', 'gastos')} · ${g.currency}`;

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
        <label>Nombre del grupo</label>
        <input
          name="name"
          placeholder="ej: Viaje a Cartagena"
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label>Moneda</label>
        <select name="currency">
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        Crear grupo
      </button>
    </form>
  );
}

export default function GroupsListPage() {
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
        <h1>Tus grupos.</h1>
        <p>Cada grupo es una cuenta compartida con tu familia, tu viaje o tus amigos.</p>
      </div>

      <div className="fade-up">
        {loaded && groups.length === 0 ? (
          <div className="card empty">
            <span className="empty-icon">👥</span>
            Aún no tienes grupos.
            <br />
            Pulsa <strong>+</strong> para crear el primero.
          </div>
        ) : (
          <div className={cardStyles.list}>
            {groups.map((g) => (
              <GroupCard key={g._id} g={g} />
            ))}
          </div>
        )}
      </div>

      <button
        className="fab"
        aria-label="Nuevo grupo"
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {showModal && (
        <Modal title="Nuevo grupo" onClose={() => setShowModal(false)}>
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
