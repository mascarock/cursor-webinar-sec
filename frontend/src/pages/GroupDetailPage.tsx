import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type FormEvent,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  groupsApi,
  membersApi,
  expensesApi,
  type GroupDetail,
  type Group,
} from '../api';
import {
  CURRENCIES,
  formatMoney,
  plural,
  convertAmount,
} from '../utils';
import Avatar from '../components/Avatar';
import MemberChips from '../components/MemberChip';
import ExpenseList from '../components/ExpenseRow';
import BalanceList from '../components/BalanceBar';
import SettlementList from '../components/SettlementRow';
import Modal from '../components/Modal';
import styles from './GroupDetailPage.module.css';

type Tab = 'expenses' | 'balances' | 'settle';
type ActiveModal = 'expense' | 'member' | 'invite' | null;

/* ─── New Expense Form ─── */
function NewExpenseForm({
  group,
  onSuccess,
}: {
  group: Group;
  onSuccess: () => void;
}) {
  const [fxHint, setFxHint] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLSelectElement>(null);

  const refreshHint = async () => {
    const amount = Number(amountRef.current?.value);
    const currency = currencyRef.current?.value ?? group.currency;
    if (!Number.isFinite(amount) || amount <= 0 || currency === group.currency) {
      setFxHint('');
      return;
    }
    const converted = await convertAmount(amount, currency, group.currency);
    if (converted == null) { setFxHint(''); return; }
    setFxHint(`≈ ${formatMoney(converted, group.currency)} en la moneda del grupo`);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const splitBetween = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="split"]:checked'),
    ).map((c) => c.value);
    if (!splitBetween.length) {
      alert('Seleccioná al menos un miembro');
      return;
    }
    const amount = Number(fd.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
    const { ok, data } = await expensesApi.add(group._id, {
      description: (fd.get('description') as string).trim(),
      amount,
      currency: fd.get('currency') as string,
      paidBy: fd.get('paidBy') as string,
      category: fd.get('category') as string,
      splitBetween,
    });
    if (!ok) {
      const d = data as { message?: string };
      alert(d.message ?? 'No se pudo guardar el gasto');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Descripción</label>
        <input name="description" placeholder="ej: Cena" required autoFocus />
      </div>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label>Monto</label>
          <input
            ref={amountRef}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            required
            inputMode="decimal"
            onChange={refreshHint}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Moneda</label>
          <select
            ref={currencyRef}
            name="currency"
            defaultValue={group.currency}
            onChange={refreshHint}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fxHint && <p className={styles.fxHint}>{fxHint}</p>}
      <div className="field">
        <label>Pagado por</label>
        <select name="paidBy" required>
          {group.members.map((m) => (
            <option key={m.memberId} value={m.memberId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Categoría</label>
        <select name="category">
          {['Mercado', 'Comida', 'Transporte', 'Hospedaje', 'Servicios', 'Salud', 'Ocio', 'Otros'].map(
            (cat) => (
              <option key={cat}>{cat}</option>
            ),
          )}
        </select>
      </div>
      <div className="field">
        <label>Dividido entre</label>
        <div className="split-list">
          {group.members.map((m) => (
            <label key={m.memberId} className="split-item">
              <input
                type="checkbox"
                name="split"
                value={m.memberId}
                defaultChecked
              />
              <Avatar name={m.name} size="sm" />
              <span>{m.name}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        Guardar gasto
      </button>
    </form>
  );
}

/* ─── Add Member Form ─── */
function AddMemberForm({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess: () => void;
}) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await membersApi.add(groupId, fd.get('name') as string);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Nombre</label>
        <input name="name" placeholder="ej: Juan" required autoFocus />
      </div>
      <p
        className="field"
        style={{
          fontSize: 12,
          color: 'var(--text-faint)',
          margin: '-4px 0 0',
          display: 'block',
        }}
      >
        No hace falta que tenga cuenta en la app.
      </p>
      <button type="submit" className="btn btn-primary btn-block">
        Agregar
      </button>
    </form>
  );
}

/* ─── Invite Modal Content ─── */
function InviteContent({ group }: { group: Group }) {
  const link = `${location.origin}${location.pathname}#/join/${group.inviteToken}`;
  const waText = encodeURIComponent(
    `Te invito a "${group.name}" en finfam: ${link}`,
  );
  const [copyMsg, setCopyMsg] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.querySelector<HTMLInputElement>('#inviteInput');
      el?.select();
      document.execCommand('copy');
    }
    setCopyMsg('✓ Link copiado');
  };

  return (
    <>
      <p className={styles.inviteInfo}>
        Comparte este enlace. Quien lo abra y se registre se une automáticamente
        a <strong>{group.name}</strong>.
      </p>
      <div className="field">
        <label>Link de invitación</label>
        <input
          id="inviteInput"
          value={link}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </div>
      <div className={styles.inviteActions}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, minWidth: 140 }}
          onClick={handleCopy}
        >
          Copiar enlace
        </button>
        <a
          className="btn btn-ghost"
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, minWidth: 140 }}
        >
          WhatsApp
        </a>
      </div>
      {copyMsg && <p className={styles.copyMsg}>{copyMsg}</p>}
    </>
  );
}

/* ─── Main page ─── */
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('expenses');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { ok, data } = await groupsApi.get(id);
    if (ok) setGroupData(data as GroupDetail);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setActiveModal(null);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!id) return;
    await expensesApi.delete(id, expenseId);
    load();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    const { ok, data } = await membersApi.remove(id, memberId);
    if (!ok) {
      const d = data as { message?: string };
      alert(d.message ?? 'No se pudo quitar al miembro');
      return;
    }
    load();
  };

  const handleDeleteGroup = async () => {
    if (!groupData) return;
    if (!confirm(`¿Eliminar "${groupData.group.name}" y todos sus gastos?`)) return;
    await groupsApi.delete(groupData.group._id);
    navigate('/groups', { replace: true });
  };

  if (loading) return <div className="empty">Cargando…</div>;
  if (!groupData) return <div className="card empty">No se pudo cargar el grupo.</div>;

  const { group, expenses, balances, settlements, total } = groupData;

  return (
    <>
      <Link to="/groups" className={`btn-icon ${styles.backLink}`}>
        ← Grupos
      </Link>

      <div className="fade-up">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Avatar name={group.name} size="lg" />
            <div className={styles.headerText}>
              <h1>{group.name}</h1>
              <div className={styles.meta}>
                {formatMoney(total, group.currency)} en total ·{' '}
                {plural(expenses.length, 'gasto', 'gastos')} · {group.currency}
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className="btn-icon"
              onClick={() => setActiveModal('invite')}
            >
              Invitar
            </button>
            <button className="btn-icon" onClick={handleDeleteGroup}>
              Eliminar
            </button>
          </div>
        </div>

        <MemberChips
          members={group.members}
          onRemove={handleRemoveMember}
          onAdd={() => setActiveModal('member')}
        />

        <div className="nav-tabs" style={{ marginTop: 24 }}>
          {(['expenses', 'balances', 'settle'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'expenses' ? 'Gastos' : t === 'balances' ? 'Balances' : 'Saldar'}
            </button>
          ))}
        </div>

        {tab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            members={group.members}
            groupCurrency={group.currency}
            onDelete={handleDeleteExpense}
          />
        )}
        {tab === 'balances' && (
          <BalanceList balances={balances} groupCurrency={group.currency} />
        )}
        {tab === 'settle' && (
          <SettlementList settlements={settlements} groupCurrency={group.currency} />
        )}
      </div>

      <button
        className="fab"
        aria-label="Agregar gasto"
        onClick={() => setActiveModal('expense')}
      >
        +
      </button>

      {activeModal === 'expense' && (
        <Modal title="Nuevo gasto" onClose={closeModal}>
          <NewExpenseForm
            group={group}
            onSuccess={() => { closeModal(); load(); }}
          />
        </Modal>
      )}

      {activeModal === 'member' && (
        <Modal title="Agregar miembro" onClose={closeModal}>
          <AddMemberForm
            groupId={group._id}
            onSuccess={() => { closeModal(); load(); }}
          />
        </Modal>
      )}

      {activeModal === 'invite' && (
        <Modal title="Invitar al grupo" onClose={closeModal}>
          <InviteContent group={group} />
        </Modal>
      )}
    </>
  );
}
