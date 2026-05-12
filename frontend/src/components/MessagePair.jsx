import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BotMessage from './BotMessage';
import TypingIndicator from './TypingIndicator';
import { RetryIcon } from '../icons';
import styles from './MessagePair.module.css';

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <img
        className={styles.lightboxImg}
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
      <button className={styles.lightboxClose} onClick={onClose} aria-label="Close">×</button>
    </div>,
    document.body
  );
}

export default function MessagePair({ userMessage, userImages, botMessage, showTyping, isLast, onRetry }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const showRetry = isLast && botMessage && !showTyping;

  return (
    <div className={styles.pair}>
      <div className={styles.rowUser}>
        <div className={styles.bubbleUser}>
          {userImages?.length > 0 && (
            <div className={styles.userImageGrid}>
              {userImages.map((src, i) => (
                <img
                  key={i}
                  className={styles.userImage}
                  src={src}
                  alt=""
                  onClick={() => setLightboxSrc(src)}
                />
              ))}
            </div>
          )}
          {userMessage && <span>{userMessage}</span>}
        </div>
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
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
