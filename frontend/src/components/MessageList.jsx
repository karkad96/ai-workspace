import { useEffect, useRef } from 'react';
import MessagePair from './MessagePair';
import styles from './MessageList.module.css';

export default function MessageList({ chat, isStreaming, onRetry }) {
  const containerRef = useRef(null);
  const anchorRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const anchor = anchorRef.current;
    const container = containerRef.current;
    if (!anchor || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isAtBottomRef.current = entry.isIntersecting; },
      { root: container, threshold: 0 }
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const newMessage = chat.length > prevLengthRef.current;
    prevLengthRef.current = chat.length;
    if (newMessage || isAtBottomRef.current) {
      anchorRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [chat]);

  return (
    <main className={styles.panel}>
      <div className={styles.list} ref={containerRef}>
        {chat.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Ask me anything</p>
            <p className={styles.emptyHint}>Type a message below to start the conversation.</p>
          </div>
        )}
        {chat.map((entry, i) => (
          <MessagePair
            key={i}
            userMessage={entry.user}
            botMessage={entry.bot}
            showTyping={isStreaming && i === chat.length - 1}
            isLast={i === chat.length - 1}
            onRetry={onRetry}
          />
        ))}
        <div ref={anchorRef} />
      </div>
    </main>
  );
}
