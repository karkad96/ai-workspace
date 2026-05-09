import styles from './Composer.module.css';

export default function Composer({ message, isStreaming, onChange, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.composer}>
      <textarea
        className={styles.textarea}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        disabled={isStreaming}
        rows={2}
      />
      <button
        className={styles.sendButton}
        onClick={onSend}
        disabled={isStreaming || !message.trim()}
      >
        {isStreaming ? 'Streaming...' : 'Send'}
      </button>
    </div>
  );
}
