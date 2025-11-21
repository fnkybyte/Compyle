import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Composer from './components/Composer';
import Message from './components/Message';

function App() {
  const [conversations, setConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const chatAreaRef = useRef(null);

  // Load conversations from local storage on initial render
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('compyle_conversations');
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      }
    } catch (error) {
      console.error('Failed to load conversations from localStorage', error);
    }
  }, []);

  // Save conversations to local storage when they change
  useEffect(() => {
    try {
      localStorage.setItem('compyle_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage', error);
    }
  }, [conversations]);

  // Auto-scroll to the bottom of the chat area when new messages are added
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [conversations, activeConversationId]);

  const handleSendMessage = async ({ message, model, options }) => {
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    let conversationId = activeConversationId;
    // Create a new conversation if one doesn't exist
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
    const [provider, modelName] = model.split('/');

    // Add a placeholder for the assistant's response
    setConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        messages: [...prev[conversationId].messages, { id: assistantMessageId, role: 'assistant', content: '', model: modelName }],
      },
    }));

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversations[conversationId]?.messages || [], userMessage],
          provider,
          model: modelName,
          options
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to fetch stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last, possibly incomplete, line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataString = line.substring(6);
            if (dataString === '[DONE]') {
              return;
            }
            try {
              const chunk = JSON.parse(dataString);
              if (chunk.choices && chunk.choices[0].delta.content) {
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
            } catch (e) {
              // JSON parsing error might happen with incomplete data, buffer handles this
            }
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
            msg.id === assistantMessageId
              ? { ...msg, content: 'Error: Could not get a response.' }
              : msg
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
        <button onClick={() => setActiveConversationId(null)}>+ New Chat</button>
        {Object.values(conversations).map(convo => (
          <div key={convo.id} onClick={() => setActiveConversationId(convo.id)} className={`conversation-item ${activeConversationId === convo.id ? 'active' : ''}`}>
            {convo.title}
          </div>
        ))}
      </aside>
      <main className="main-content">
        <header className="top-bar">Compyle</header>
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

export default App;
