import { useEffect, useRef } from 'react';
import { SendIcon, StopIcon } from '../icons';
import styles from './Composer.module.css';

const MAX_HEIGHT = 200;

export default function Composer({ message, isStreaming, onChange, onSend, onStop }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = next + 'px';
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [message]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.composer}>
      <div className={styles.box}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
        />
        <div className={styles.toolbar}>
          {isStreaming ? (
            <button className={`${styles.iconButton} ${styles.stopButton}`} onClick={onStop} title="Stop">
              <StopIcon />
            </button>
          ) : (
            <button
              className={`${styles.iconButton} ${styles.sendButton}`}
              onClick={onSend}
              disabled={!message.trim()}
              title="Send"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
