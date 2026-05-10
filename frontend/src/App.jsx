import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import styles from './App.module.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');
  const [showAuth, setShowAuth] = useState(false);
  const messageListRef = useRef(null);

  const { user, login, logout } = useAuth();
  const { chat, message, setMessage, isStreaming, send, stop } = useChat(user);

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

  const handleLoginSuccess = (data) => {
    login(data);
    setShowAuth(false);
  };

  return (
    <div className={styles.shell}>
      <Header
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={logout}
      />
      <MessageList chat={chat} isStreaming={isStreaming} listRef={messageListRef} />
      <Composer
        message={message}
        isStreaming={isStreaming}
        onChange={setMessage}
        onSend={send}
        onStop={stop}
      />
      {showAuth && (
        <LoginModal onClose={() => setShowAuth(false)} onSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
