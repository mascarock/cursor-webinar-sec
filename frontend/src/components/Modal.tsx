import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  const t = useT();
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.sheet} role="dialog" aria-modal="true">
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button
            className={styles.close}
            aria-label={t('modal.closeAria')}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
