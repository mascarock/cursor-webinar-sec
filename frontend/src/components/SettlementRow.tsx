import { type Settlement } from '../api';
import { formatMoney } from '../utils';
import { useT } from '../i18n';
import Avatar from './Avatar';
import styles from './SettlementRow.module.css';

interface SettlementListProps {
  settlements: Settlement[];
  groupCurrency: string;
}

export default function SettlementList({
  settlements,
  groupCurrency,
}: SettlementListProps) {
  const t = useT();
  if (!settlements.length) {
    return (
      <div className="card empty">
        <span className="empty-icon">✓</span>
        {t('settlements.empty')}
      </div>
    );
  }
  return (
    <div className="card">
      <p className="section-label">{t('settlements.title')}</p>
      {settlements.map((s, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.flow}>
            <Avatar name={s.fromName} />
            <span className={styles.name}>{s.fromName}</span>
            <span className={styles.arrow}>→</span>
            <Avatar name={s.toName} />
            <span className={styles.name}>{s.toName}</span>
          </div>
          <div className={styles.amount}>
            {formatMoney(s.amount, groupCurrency)}
          </div>
        </div>
      ))}
    </div>
  );
}
