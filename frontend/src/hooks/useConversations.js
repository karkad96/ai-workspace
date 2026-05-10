import { useEffect, useState } from 'react';

export function useConversations(user) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user) { setConversations([]); return; }
    fetch('/api/conversations', { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then(setConversations)
      .catch(() => {});
  }, [user]);

  const addConversation = (conv) =>
    setConversations((prev) => [conv, ...prev]);

  const removeConversation = async (id) => {
    await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const bumpConversation = (id) =>
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      const conv = { ...prev[idx], updated_at: new Date().toISOString() };
      return [conv, ...prev.filter((c) => c.id !== id)];
    });

  return { conversations, addConversation, removeConversation, bumpConversation };
}
