import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import styles from './App.module.css';

export default function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');
  const messageListRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const el = messageListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isStreaming) stopStreaming();

    const outgoing = message.trim();
    setMessage('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let currentIndex = -1;
    setChat((prev) => {
      currentIndex = prev.length;
      return [...prev, { user: outgoing, bot: '' }];
    });

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: outgoing }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });
        setChat((prev) => {
          const updated = [...prev];
          if (currentIndex >= 0 && currentIndex < updated.length) {
            updated[currentIndex] = { ...updated[currentIndex], bot: botText };
          }
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  return (
    <div className={styles.shell}>
      <Header
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />
      <MessageList
        chat={chat}
        isStreaming={isStreaming}
        listRef={messageListRef}
      />
      <Composer
        message={message}
        isStreaming={isStreaming}
        onChange={setMessage}
        onSend={sendMessage}
        onStop={stopStreaming}
      />
    </div>
  );
}
