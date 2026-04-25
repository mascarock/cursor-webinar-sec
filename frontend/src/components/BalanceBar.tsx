import { type Balance } from '../api';
import { formatMoney } from '../utils';
import Avatar from './Avatar';
import styles from './BalanceBar.module.css';

interface BalanceListProps {
  balances: Balance[];
  groupCurrency: string;
}

export default function BalanceList({ balances, groupCurrency }: BalanceListProps) {
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.balance)));

  return (
    <div className="card">
      <p className="section-label">Balance por miembro</p>
      {balances.map((b) => {
        const pct = (Math.abs(b.balance) / max) * 50;
        const isPositive = b.balance > 0.01;
        const isNegative = b.balance < -0.01;
        const sign = isPositive ? '+' : isNegative ? '−' : '';
        const amountCls = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';

        return (
          <div key={b.memberId} className={styles.row}>
            <Avatar name={b.name} />
            <div className={styles.info}>
              <div className={styles.name}>{b.name}</div>
              <div className={styles.bar}>
                {isPositive && (
                  <div
                    className={styles.barFillPositive}
                    style={{ width: `${pct}%` }}
                  />
                )}
                {isNegative && (
                  <div
                    className={styles.barFillNegative}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
            <div className={`balance-amount ${amountCls}`}>
              {sign}
              {formatMoney(Math.abs(b.balance), groupCurrency)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
