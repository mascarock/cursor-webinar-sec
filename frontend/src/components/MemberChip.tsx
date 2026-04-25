import { type Member } from '../api';
import { colorFor, initials } from '../utils';
import { useT } from '../i18n';
import styles from './MemberChip.module.css';

interface MemberChipsProps {
  members: Member[];
  onRemove: (memberId: string) => void;
  onAdd: () => void;
}

export default function MemberChips({
  members,
  onRemove,
  onAdd,
}: MemberChipsProps) {
  const t = useT();
  return (
    <div className={styles.chips}>
      {members.map((m) => (
        <span key={m.memberId} className={styles.chip}>
          <span
            className={styles.chipAvatar}
            style={{ background: colorFor(m.name) }}
          >
            {initials(m.name)}
          </span>
          {m.name}
          {!m.isUser && (
            <button
              className={styles.removeX}
              title={t('memberChips.removeTitle')}
              onClick={() => {
                if (confirm(t('memberChips.confirmRemove'))) onRemove(m.memberId);
              }}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <button className={styles.addBtn} onClick={onAdd}>
        {t('memberChips.addBtn')}
      </button>
    </div>
  );
}
