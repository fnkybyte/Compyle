// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Composer from './components/Composer';
import Message from './components/Message';
import Landing from './pages/landing';

function ChatPage() {
  const [conversations, setConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const chatAreaRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('compyle_conversations');
      if (saved) setConversations(JSON.parse(saved));
    } catch (e) { console.error('load localStorage', e); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('compyle_conversations', JSON.stringify(conversations)); }
    catch (e) { console.error('save localStorage', e); }
  }, [conversations]);

  useEffect(() => {
    if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [conversations, activeConversationId]);

  const handleSendMessage = async ({ message, model, modelLabel, options }) => {
    const userMessage = { id: uuidv4(), role: 'user', content: message, timestamp: new Date().toISOString() };

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = uuidv4();
      setActiveConversationId(conversationId);
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          id: conversationId,
          title: message.substring(0, 30),
          createdAt: new Date().toISOString(),
          messages: [userMessage],
        },
      }));
    } else {
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: [...prev[conversationId].messages, userMessage],
        },
      }));
    }

    const assistantMessageId = uuidv4();
    const [provider, modelName] = (model || '').split('/');

    setConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        messages: [
          ...prev[conversationId].messages,
          { id: assistantMessageId, role: 'assistant', content: '', model: modelName || model, modelLabel }
        ],
      },
    }));

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversations[conversationId]?.messages || [], userMessage],
          provider,
          model: modelName || model,
          options
        }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to fetch stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataString = line.substring(6);
            if (dataString === '[DONE]') { buffer = ''; break; }
            try {
              const chunk = JSON.parse(dataString);
              if (chunk.choices && chunk.choices[0].delta && chunk.choices[0].delta.content) {
                setConversations(prev => ({
                  ...prev,
                  [conversationId]: {
                    ...prev[conversationId],
                    messages: prev[conversationId].messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + chunk.choices[0].delta.content }
                        : msg
                    ),
                  },
                }));
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: prev[conversationId].messages.map(msg =>
            msg.id === assistantMessageId ? { ...msg, content: 'Error: Could not get a response.' } : msg
          ),
        },
      }));
    }
  };

  const activeConversation = conversations[activeConversationId];

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">Conversations</div>
        <button className="new-chat-btn" onClick={() => setActiveConversationId(null)}>+ New Chat</button>

        <div className="conversation-list">
          {Object.values(conversations).map(convo => (
            <div
              key={convo.id}
              onClick={() => setActiveConversationId(convo.id)}
              className={`conversation-item ${activeConversationId === convo.id ? 'active' : ''}`}
            >
              <span className="title">{convo.title || 'Untitled'}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div style={{display:'flex',justifyContent:'space-between',width:'100%',alignItems:'center'}}>
            <div className="lp-brand">
              <img src="/gemini-color.png" alt="logo" className="lp-logo" />
              <div className='' >Compyle-AI</div>
            </div>
            <div style={{fontSize:'.9rem'}}><Link to="/" style={{color:'#666', textDecoration:'none'}}>← Home</Link></div>
          </div>
        </header>

        <section className="chat-area" ref={chatAreaRef}>
          {activeConversation ? (
            activeConversation.messages.map(msg => <Message key={msg.id} message={msg} />)
          ) : (
            <div className="no-chat-selected">Select a conversation or start a new one.</div>
          )}
        </section>

        <Composer onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
