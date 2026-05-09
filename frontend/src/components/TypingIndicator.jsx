import styles from './TypingIndicator.module.css';

const DELAYS = ['0ms', '200ms', '400ms'];

export default function TypingIndicator() {
  return (
    <span className={styles.indicator}>
      {DELAYS.map((delay) => (
        <span key={delay} className={styles.dot} style={{ animationDelay: delay }} />
      ))}
    </span>
  );
}
