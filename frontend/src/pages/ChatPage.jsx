// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import Composer from "../components/Composer";
import Message from "../components/Message";

import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const chatAreaRef = useRef(null);

  /* -------- LOAD LOCAL STORAGE -------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("compyle_conversations");
      if (saved) setConversations(JSON.parse(saved));
    } catch (e) {
      console.error("load localStorage", e);
    }
  }, []);

  /* -------- SAVE LOCAL STORAGE -------- */
  useEffect(() => {
    try {
      localStorage.setItem(
        "compyle_conversations",
        JSON.stringify(conversations)
      );
    } catch (e) {
      console.error("save localStorage", e);
    }
  }, [conversations]);

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [conversations, activeConversationId]);

  /* -------- LOGOUT -------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("compyle_conversations");
    window.location.href = "/";
  };

  /* -------- SEND MESSAGE (UNCHANGED) -------- */
  const handleSendMessage = async ({ message, model, modelLabel, options }) => {
    const userMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    let conversationId = activeConversationId;

    if (!conversationId) {
      conversationId = uuidv4();
      setActiveConversationId(conversationId);
      setConversations((prev) => ({
        ...prev,
        [conversationId]: {
          id: conversationId,
          title: message.substring(0, 30),
          createdAt: new Date().toISOString(),
          messages: [userMessage],
        },
      }));
    } else {
      setConversations((prev) => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: [...prev[conversationId].messages, userMessage],
        },
      }));
    }

    const assistantMessageId = uuidv4();
    const [provider, modelName] = (model || "").split("/");

    setConversations((prev) => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        messages: [
          ...prev[conversationId].messages,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            model: modelName || model,
            modelLabel,
          },
        ],
      },
    }));

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...(conversations[conversationId]?.messages || []),
            userMessage,
          ],
          provider,
          model: modelName || model,
          options,
        }),
      });

      if (!response.ok || !response.body)
        throw new Error("Failed to fetch stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataString = line.substring(6);
            if (dataString === "[DONE]") break;

            try {
              const chunk = JSON.parse(dataString);
              if (chunk?.choices?.[0]?.delta?.content) {
                setConversations((prev) => ({
                  ...prev,
                  [conversationId]: {
                    ...prev[conversationId],
                    messages: prev[conversationId].messages.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content:
                              msg.content +
                              chunk.choices[0].delta.content,
                          }
                        : msg
                    ),
                  },
                }));
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  const activeConversation = conversations[activeConversationId];

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">Conversations</div>
        <button
          className="new-chat-btn"
          onClick={() => setActiveConversationId(null)}
        >
          + New Chat
        </button>

        {Object.values(conversations).map((convo) => (
          <div
            key={convo.id}
            className={`conversation-item ${
              activeConversationId === convo.id ? "active" : ""
            }`}
            onClick={() => setActiveConversationId(convo.id)}
          >
            <span className="title">{convo.title || "Untitled"}</span>
          </div>
        ))}
      </aside>

      <main className="main-content">
        <header className="top-bar">
  <div className="top-bar-inner">
    {/* LEFT: Brand */}
    <div className="lp-brand">
      <img src="gemini-color.png" alt="logo" className="lp-logo" />
      <div>Compyle-AI</div>
    </div>

    {/* RIGHT: User info + actions */}
    <div className="top-bar-actions">
      <a href="/" className="top-bar-home">Home</a>

      <div className="user-chip">
        <img
          src={
            user?.user_metadata?.avatar_url ||
            user?.user_metadata?.picture ||
            "https://ui-avatars.com/api/?name=User"
          }
          alt="profile"
          className="user-avatar"
        />
        <span className="user-name">
          {user?.user_metadata?.full_name ||
           user?.user_metadata?.name ||
           "User"}
        </span>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  </div>
</header>


        <section className="chat-area" ref={chatAreaRef}>
          {activeConversation ? (
            activeConversation.messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))
          ) : (
            <div className="no-chat-selected">
              Select a conversation or start a new one.
            </div>
          )}
        </section>

        <Composer onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
}

