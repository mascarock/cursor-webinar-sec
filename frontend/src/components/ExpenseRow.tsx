import { type Expense, type Member } from '../api';
import { formatMoney, formatDate } from '../utils';
import { useT, type TFn } from '../i18n';
import Avatar from './Avatar';
import styles from './ExpenseRow.module.css';

interface ExpenseRowProps {
  expense: Expense;
  members: Member[];
  groupCurrency: string;
  onDelete: (id: string) => void;
  t: TFn;
}

function ExpenseRow({ expense: e, members, groupCurrency, onDelete, t }: ExpenseRowProps) {
  const payer = members.find((m) => m.memberId === e.paidBy);
  const payerName = payer ? payer.name : t('expenses.somebody');
  const splitCount = e.splitBetween?.length ?? members.length;
  const splitLabel =
    splitCount === 1
      ? t('expenses.notSplit')
      : t('expenses.splitBetween', { count: splitCount });
  const expCurrency = e.currency || groupCurrency;
  const showConversion =
    expCurrency !== groupCurrency && typeof e.convertedAmount === 'number';
  const categoryLabel = t(`categories.${e.category}`);

  return (
    <li className={styles.row}>
      <Avatar name={payerName} />
      <div className={styles.info}>
        <div className={styles.desc}>
          {e.description || (
            <span style={{ color: 'var(--text-muted)' }}>
              {t('expenses.noDescription')}
            </span>
          )}
        </div>
        <div className={styles.meta}>
          {t('expenses.paidByMeta', {
            payer: payerName,
            category: categoryLabel,
            split: splitLabel,
            date: formatDate(e.date),
          })}
        </div>
      </div>
      <div className={styles.amountWrap}>
        <div className={styles.amount}>{formatMoney(e.amount, expCurrency)}</div>
        {showConversion && (
          <div className={styles.amountConverted}>
            ≈ {formatMoney(e.convertedAmount!, groupCurrency)}
          </div>
        )}
      </div>
      <button
        className={styles.deleteBtn}
        aria-label={t('expenses.deleteAria')}
        onClick={() => onDelete(e._id)}
      >
        ×
      </button>
    </li>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  groupCurrency: string;
  onDelete: (id: string) => void;
}

export default function ExpenseList({
  expenses,
  members,
  groupCurrency,
  onDelete,
}: ExpenseListProps) {
  const t = useT();
  if (!expenses.length) {
    const text = t('expenses.empty', { plus: '%PLUS%' });
    const [before, after = ''] = text.split('%PLUS%');
    return (
      <div className="card empty">
        <span className="empty-icon">🧾</span>
        {before}
        <strong>+</strong>
        {after}
      </div>
    );
  }
  return (
    <div className="card">
      <p className="section-label">{t('expenses.historyLabel')}</p>
      <ul className={styles.feed}>
        {expenses.map((e) => (
          <ExpenseRow
            key={e._id}
            expense={e}
            members={members}
            groupCurrency={groupCurrency}
            onDelete={onDelete}
            t={t}
          />
        ))}
      </ul>
    </div>
  );
}
