import { useEffect, useRef, useState } from 'react';

export function useChat(user, onConversationCreated, onConversationBumped) {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const convIdRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!user) {
      convIdRef.current = null;
      setChat([]);
      setMessage('');
    }
  }, [user]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const loadConversation = (id) => {
    if (isStreaming) stop();
    convIdRef.current = id;
    setMessage('');
    if (!id || !user) { setChat([]); return; }
    fetch(`/api/conversations/${id}/messages`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then(setChat)
      .catch(() => setChat([]));
  };

  const newChat = () => {
    if (isStreaming) stop();
    convIdRef.current = null;
    setChat([]);
    setMessage('');
  };

  const retry = async () => {
    if (isStreaming || chat.length === 0) return;

    const lastEntry = chat[chat.length - 1];
    const outgoing = lastEntry.user;
    const historyWithoutLast = chat.slice(0, -1);
    const currentConvId = convIdRef.current;

    if (user && currentConvId) {
      await fetch(`/api/conversations/${currentConvId}/messages/last`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
    }

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const currentIndex = chat.length - 1;
    setChat((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { user: outgoing, bot: '' };
      return updated;
    });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: outgoing, conversation_id: currentConvId, history: historyWithoutLast, use_client_history: true }),
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
          if (currentIndex >= 0 && currentIndex < updated.length)
            updated[currentIndex] = { ...updated[currentIndex], bot: botText };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  const send = async () => {
    if (!message.trim()) return;
    if (isStreaming) stop();

    const outgoing = message.trim();
    setMessage('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const currentConvId = convIdRef.current;

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
        body: JSON.stringify({ message: outgoing, conversation_id: currentConvId, history: chat }),
        signal: controller.signal,
      });

      const returnedId = res.headers.get('X-Conversation-Id');
      if (returnedId) {
        const id = parseInt(returnedId, 10);
        if (!currentConvId) {
          convIdRef.current = id;
          onConversationCreated?.({
            id,
            title: outgoing.slice(0, 80),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          onConversationBumped?.(currentConvId);
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });
        setChat((prev) => {
          const updated = [...prev];
          if (currentIndex >= 0 && currentIndex < updated.length)
            updated[currentIndex] = { ...updated[currentIndex], bot: botText };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  return { chat, message, setMessage, isStreaming, send, stop, retry, loadConversation, newChat };
}
