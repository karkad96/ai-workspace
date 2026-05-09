import BotMessage from './BotMessage';
import TypingIndicator from './TypingIndicator';
import styles from './MessagePair.module.css';

export default function MessagePair({ userMessage, botMessage, showTyping }) {
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
    </div>
  );
}
