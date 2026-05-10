import { useEffect, useRef, useState } from 'react';

export function useChat(user) {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!user) { setChat([]); return; }
    fetch('/api/history', { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then(setChat);
  }, [user]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const send = async () => {
    if (!message.trim()) return;
    if (isStreaming) stop();

    const outgoing = message.trim();
    setMessage('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

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

  return { chat, message, setMessage, isStreaming, send, stop };
}
