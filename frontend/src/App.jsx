import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import styles from './App.module.css';

function loadUser() {
  try {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const messageListRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 80) el.scrollTop = el.scrollHeight;
  }, [chat]);

  // Restore session on mount and load history
  useEffect(() => {
    const stored = loadUser();
    if (!stored) return;

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored.token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setUser(stored);
        return fetch('/api/history', { headers: { Authorization: `Bearer ${stored.token}` } });
      })
      .then((r) => r.json())
      .then((history) => setChat(history))
      .catch(() => {
        localStorage.removeItem('auth');
      });
  }, []);

  const handleLoginSuccess = (data) => {
    const userData = { email: data.email, token: data.token };
    localStorage.setItem('auth', JSON.stringify(userData));
    setUser(userData);
    setShowAuth(false);

    fetch('/api/history', { headers: { Authorization: `Bearer ${data.token}` } })
      .then((r) => r.json())
      .then((history) => setChat(history));
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth');
    setUser(null);
    setChat([]);
  };

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
      const headers = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers,
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
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
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
      {showAuth && (
        <LoginModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
