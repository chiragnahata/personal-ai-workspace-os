import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat');
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'message' && data.message) {
          setMessages((m) => [...m, data.message]);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: 'temp-' + Date.now(), role: 'user', content: input }]);
    wsRef.current?.send(JSON.stringify({ message: input }));
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{msg.role}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask or command..."
        />
        <button onClick={send} style={{ padding: '8px 14px' }}>
          Send
        </button>
      </div>
    </div>
  );
};
