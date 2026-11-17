import React from 'react';
import { UtensilsCrossed, ChevronLeft } from 'lucide-react';
import styles from './BackToMenuButton.module.css';

interface BackToMenuButtonProps {
  onClick: () => void;
  title?: string;
}

export const BackToMenuButton: React.FC<BackToMenuButtonProps> = ({
  onClick,
  title = 'Back to Menu',
}) => {
  return (
    <button
      type="button"
      className={styles.backBtn}
      onClick={onClick}
      title={title}
      aria-label="Back to Restaurant Menu"
    >
      <div className={styles.iconWrapper}>
        <ChevronLeft size={16} className={styles.chevron} />
        <UtensilsCrossed size={14} className={styles.restaurantIcon} />
      </div>
      <span className={styles.text}>Menu</span>
    </button>
  );
};
