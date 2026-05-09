import MessagePair from './MessagePair';
import styles from './MessageList.module.css';

export default function MessageList({ chat, isStreaming, listRef }) {
  return (
    <main className={styles.panel}>
      <div className={styles.list} ref={listRef}>
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
          />
        ))}
      </div>
    </main>
  );
}
