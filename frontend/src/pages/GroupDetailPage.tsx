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
import { CURRENCIES, formatMoney, convertAmount } from '../utils';
import { useT, type TFn } from '../i18n';
import Avatar from '../components/Avatar';
import MemberChips from '../components/MemberChip';
import ExpenseList from '../components/ExpenseRow';
import BalanceList from '../components/BalanceBar';
import SettlementList from '../components/SettlementRow';
import Modal from '../components/Modal';
import styles from './GroupDetailPage.module.css';

type Tab = 'expenses' | 'balances' | 'settle';
type ActiveModal = 'expense' | 'member' | 'invite' | null;

const CATEGORY_KEYS = [
  'Mercado',
  'Comida',
  'Transporte',
  'Hospedaje',
  'Servicios',
  'Salud',
  'Ocio',
  'Otros',
] as const;

/* ─── New Expense Form ─── */
function NewExpenseForm({
  group,
  onSuccess,
}: {
  group: Group;
  onSuccess: () => void;
}) {
  const t = useT();
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
    setFxHint(t('newExpense.fxHint', { amount: formatMoney(converted, group.currency) }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const splitBetween = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="split"]:checked'),
    ).map((c) => c.value);
    if (!splitBetween.length) {
      alert(t('newExpense.selectMember'));
      return;
    }
    const amount = Number(fd.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert(t('newExpense.amountInvalid'));
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
      alert(d.message ?? t('newExpense.saveFailed'));
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>{t('newExpense.description')}</label>
        <input
          name="description"
          placeholder={t('newExpense.descriptionPlaceholder')}
          required
          autoFocus
        />
      </div>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label>{t('newExpense.amount')}</label>
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
          <label>{t('newExpense.currency')}</label>
          <select
            ref={currencyRef}
            name="currency"
            defaultValue={group.currency}
            onChange={refreshHint}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {t(`currencies.${c.code}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fxHint && <p className={styles.fxHint}>{fxHint}</p>}
      <div className="field">
        <label>{t('newExpense.paidBy')}</label>
        <select name="paidBy" required>
          {group.members.map((m) => (
            <option key={m.memberId} value={m.memberId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>{t('newExpense.category')}</label>
        <select name="category">
          {CATEGORY_KEYS.map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>{t('newExpense.splitBetween')}</label>
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
        {t('newExpense.save')}
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
  const t = useT();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await membersApi.add(groupId, fd.get('name') as string);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>{t('addMember.name')}</label>
        <input
          name="name"
          placeholder={t('addMember.namePlaceholder')}
          required
          autoFocus
        />
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
        {t('addMember.hint')}
      </p>
      <button type="submit" className="btn btn-primary btn-block">
        {t('addMember.submit')}
      </button>
    </form>
  );
}

/* ─── Invite Modal Content ─── */
function InviteContent({ group, t }: { group: Group; t: TFn }) {
  const link = `${location.origin}${location.pathname}#/join/${group.inviteToken}`;
  const waText = encodeURIComponent(
    t('invite.whatsappMessage', { group: group.name, link }),
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
    setCopyMsg(t('invite.copied'));
  };

  const infoTemplate = t('invite.info', { group: '%GROUP%' });
  const [infoBefore, infoAfter = ''] = infoTemplate.split('%GROUP%');

  return (
    <>
      <p className={styles.inviteInfo}>
        {infoBefore}
        <strong>{group.name}</strong>
        {infoAfter}
      </p>
      <div className="field">
        <label>{t('invite.linkLabel')}</label>
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
          {t('invite.copy')}
        </button>
        <a
          className="btn btn-ghost"
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, minWidth: 140 }}
        >
          {t('invite.whatsapp')}
        </a>
      </div>
      {copyMsg && <p className={styles.copyMsg}>{copyMsg}</p>}
    </>
  );
}

/* ─── Main page ─── */
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
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
      alert(d.message ?? t('memberChips.removeFailed'));
      return;
    }
    load();
  };

  const handleDeleteGroup = async () => {
    if (!groupData) return;
    if (!confirm(t('groupDetail.confirmDelete', { name: groupData.group.name }))) return;
    await groupsApi.delete(groupData.group._id);
    navigate('/groups', { replace: true });
  };

  if (loading) return <div className="empty">{t('groupDetail.loading')}</div>;
  if (!groupData) return <div className="card empty">{t('groupDetail.loadFailed')}</div>;

  const { group, expenses, balances, settlements, total } = groupData;

  const tabLabels: Record<Tab, string> = {
    expenses: t('groupDetail.tabExpenses'),
    balances: t('groupDetail.tabBalances'),
    settle: t('groupDetail.tabSettle'),
  };

  return (
    <>
      <Link to="/groups" className={`btn-icon ${styles.backLink}`}>
        {t('groupDetail.back')}
      </Link>

      <div className="fade-up">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Avatar name={group.name} size="lg" />
            <div className={styles.headerText}>
              <h1>{group.name}</h1>
              <div className={styles.meta}>
                {t('groupDetail.totalMeta', {
                  total: formatMoney(total, group.currency),
                })}
                {' · '}
                {t('groupDetail.expenses', { count: expenses.length })}
                {' · '}
                {group.currency}
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className="btn-icon"
              onClick={() => setActiveModal('invite')}
            >
              {t('groupDetail.invite')}
            </button>
            <button className="btn-icon" onClick={handleDeleteGroup}>
              {t('groupDetail.delete')}
            </button>
          </div>
        </div>

        <MemberChips
          members={group.members}
          onRemove={handleRemoveMember}
          onAdd={() => setActiveModal('member')}
        />

        <div className="nav-tabs" style={{ marginTop: 24 }}>
          {(['expenses', 'balances', 'settle'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              className={`nav-tab${tab === tabKey ? ' active' : ''}`}
              onClick={() => setTab(tabKey)}
            >
              {tabLabels[tabKey]}
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
        aria-label={t('groupDetail.fabAria')}
        onClick={() => setActiveModal('expense')}
      >
        +
      </button>

      {activeModal === 'expense' && (
        <Modal title={t('newExpense.title')} onClose={closeModal}>
          <NewExpenseForm
            group={group}
            onSuccess={() => { closeModal(); load(); }}
          />
        </Modal>
      )}

      {activeModal === 'member' && (
        <Modal title={t('addMember.title')} onClose={closeModal}>
          <AddMemberForm
            groupId={group._id}
            onSuccess={() => { closeModal(); load(); }}
          />
        </Modal>
      )}

      {activeModal === 'invite' && (
        <Modal title={t('invite.title')} onClose={closeModal}>
          <InviteContent group={group} t={t} />
        </Modal>
      )}
    </>
  );
}
