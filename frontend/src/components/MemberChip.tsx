import { type Member } from '../api';
import { colorFor, initials } from '../utils';
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
              title="Quitar"
              onClick={() => {
                if (confirm('¿Quitar a este miembro?')) onRemove(m.memberId);
              }}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <button className={styles.addBtn} onClick={onAdd}>
        + Agregar miembro
      </button>
    </div>
  );
}
