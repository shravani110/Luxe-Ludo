import React from 'react';
import { HelpCircle, X, Shield, Zap, Target, Award } from 'lucide-react';
import styles from './RulesModal.module.css';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <HelpCircle size={20} className={styles.icon} />
            <h3 className={styles.title}>Ludo Rules & Guide</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.rulesList}>
          <div className={styles.ruleItem}>
            <div className={styles.ruleIconBox}>
              <Zap size={18} className={styles.zap} />
            </div>
            <div className={styles.ruleText}>
              <h4>Unlocking Tokens</h4>
              <p>Roll a <strong>6</strong> on the dice to release a token from your base to the starting tile. Rolling a 6 also awards an extra roll!</p>
            </div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIconBox}>
              <Target size={18} className={styles.target} />
            </div>
            <div className={styles.ruleText}>
              <h4>Capturing Opponents</h4>
              <p>Land exactly on an opponent's token to capture it and send it back to their base. Capturing also awards you an extra turn!</p>
            </div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIconBox}>
              <Shield size={18} className={styles.shield} />
            </div>
            <div className={styles.ruleText}>
              <h4>Safe Spots & Stars</h4>
              <p>Tiles marked with a <strong>Star</strong> or your color starting tile are safe zones. Tokens on safe zones cannot be captured.</p>
            </div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIconBox}>
              <Award size={18} className={styles.award} />
            </div>
            <div className={styles.ruleText}>
              <h4>Three Sixes Rule & Winning</h4>
              <p>Rolling 3 consecutive sixes cancels that turn. Lead all 4 tokens into the central home triangle to win the game!</p>
            </div>
          </div>
        </div>

        <button type="button" className={styles.gotItBtn} onClick={onClose}>
          Got It!
        </button>
      </div>
    </div>
  );
};
