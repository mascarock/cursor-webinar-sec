import { type Expense, type Member } from '../api';
import { formatMoney, formatDate } from '../utils';
import Avatar from './Avatar';
import styles from './ExpenseRow.module.css';

interface ExpenseRowProps {
  expense: Expense;
  members: Member[];
  groupCurrency: string;
  onDelete: (id: string) => void;
}

function ExpenseRow({ expense: e, members, groupCurrency, onDelete }: ExpenseRowProps) {
  const payer = members.find((m) => m.memberId === e.paidBy);
  const payerName = payer ? payer.name : 'Alguien';
  const splitCount = e.splitBetween?.length ?? members.length;
  const splitLabel =
    splitCount === 1 ? 'sin dividir' : `dividido entre ${splitCount}`;
  const expCurrency = e.currency || groupCurrency;
  const showConversion =
    expCurrency !== groupCurrency && typeof e.convertedAmount === 'number';

  return (
    <li className={styles.row}>
      <Avatar name={payerName} />
      <div className={styles.info}>
        <div className={styles.desc}>
          {e.description || (
            <span style={{ color: 'var(--text-muted)' }}>(sin descripción)</span>
          )}
        </div>
        <div className={styles.meta}>
          {payerName} pagó · {e.category} · {splitLabel} · {formatDate(e.date)}
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
        aria-label="Eliminar"
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
  if (!expenses.length) {
    return (
      <div className="card empty">
        <span className="empty-icon">🧾</span>
        Aún no hay gastos. Pulsa <strong>+</strong> para agregar uno.
      </div>
    );
  }
  return (
    <div className="card">
      <p className="section-label">Historial</p>
      <ul className={styles.feed}>
        {expenses.map((e) => (
          <ExpenseRow
            key={e._id}
            expense={e}
            members={members}
            groupCurrency={groupCurrency}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
