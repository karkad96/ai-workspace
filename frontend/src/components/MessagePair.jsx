import BotMessage from './BotMessage';
import TypingIndicator from './TypingIndicator';
import { RetryIcon } from '../icons';
import styles from './MessagePair.module.css';

export default function MessagePair({ userMessage, botMessage, showTyping, isLast, onRetry }) {
  const showRetry = isLast && botMessage && !showTyping;

  return (
    <div className={styles.pair}>
      <div className={styles.rowUser}>
        <div className={styles.bubbleUser}>{userMessage}</div>
      </div>
      <div className={styles.rowBot}>
        <div className={styles.bubbleBot}>
          {botMessage
            ? <BotMessage content={botMessage} />
            : showTyping
              ? <TypingIndicator />
              : null}
        </div>
      </div>
      {showRetry && (
        <div className={styles.rowActions}>
          <button className={styles.retryBtn} onClick={onRetry} aria-label="Retry">
            <RetryIcon />
          </button>
        </div>
      )}
    </div>
  );
}
