import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useConversations } from './hooks/useConversations';
import styles from './App.module.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640);
  const [activeConvId, setActiveConvId] = useState(null);
  const messageListRef = useRef(null);

  const { user, login, logout } = useAuth();
  const { conversations, addConversation, removeConversation, bumpConversation } = useConversations(user);
  const { chat, message, setMessage, isStreaming, send, stop, loadConversation, newChat } = useChat(
    user,
    (conv) => { addConversation(conv); setActiveConvId(conv.id); },
    (id) => bumpConversation(id),
  );

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

  // Reset conversation state when user logs out
  useEffect(() => {
    if (!user) { setActiveConvId(null); setSidebarOpen(false); }
  }, [user]);

  const handleSelectConversation = (id) => {
    setActiveConvId(id);
    loadConversation(id);
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    newChat();
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    await removeConversation(id);
    if (activeConvId === id) { setActiveConvId(null); newChat(); }
  };

  const handleLoginSuccess = (data) => {
    login(data);
    setShowAuth(false);
    setSidebarOpen(window.innerWidth >= 640);
  };

  const handleLogout = () => {
    logout();
    newChat();
  };

  return (
    <div className={styles.shell}>
      {user && (
        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      <div className={styles.main}>
        <Header
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          user={user}
          onSignIn={() => setShowAuth(true)}
          onSignOut={handleLogout}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <MessageList chat={chat} isStreaming={isStreaming} listRef={messageListRef} />
        <Composer
          message={message}
          isStreaming={isStreaming}
          onChange={setMessage}
          onSend={send}
          onStop={stop}
        />
      </div>
      {showAuth && (
        <LoginModal onClose={() => setShowAuth(false)} onSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
