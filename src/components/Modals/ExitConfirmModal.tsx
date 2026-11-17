import React from 'react';
import { UtensilsCrossed, ArrowLeft, Play } from 'lucide-react';
import styles from './ExitConfirmModal.module.css';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirmExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconCircle}>
          <UtensilsCrossed size={26} className={styles.icon} />
        </div>

        <h3 className={styles.title}>Return to Menu?</h3>
        <p className={styles.description}>
          Your current match is auto-saved locally. You can resume it anytime!
        </p>

        <div className={styles.buttonGroup}>
          <button type="button" className={styles.resumeBtn} onClick={onCancel}>
            <Play size={16} fill="currentColor" />
            <span>Keep Playing</span>
          </button>
          <button type="button" className={styles.exitBtn} onClick={onConfirmExit}>
            <ArrowLeft size={16} />
            <span>Exit to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
