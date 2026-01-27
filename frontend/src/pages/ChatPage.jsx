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

    /* ---------- CREATE NEW CHAT ---------- */
    const createNewChat = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from("chats")
            .insert({
                user_id: user.id,
                title: "New Chat",
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating chat:", error);
            return;
        }

        setConversations(prev => ({
            [data.id]: { ...data, messages: [] },
            ...prev,
        }));

        setActiveConversationId(data.id);
    };

    /* ---------- LOAD CHATS ---------- */
    useEffect(() => {
        if (!user) return;

        const loadChats = async () => {
            const { data, error } = await supabase
                .from("chats")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading chats:", error);
                return;
            }

            const chatMap = {};
            data.forEach(chat => {
                chatMap[chat.id] = { ...chat, messages: [] };
            });

            setConversations(chatMap);

            const savedChatId = localStorage.getItem("compyle_active_chat");

            if (savedChatId && chatMap[savedChatId]) {
                setActiveConversationId(savedChatId);
            } else if (data.length > 0) {
                setActiveConversationId(data[0].id);
            }

        };

        loadChats();
    }, [user]);

    /* ---------- LOAD MESSAGES ---------- */
    useEffect(() => {
        if (!activeConversationId || !user) return;

        const loadMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", activeConversationId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Load messages error:", error);
                return;
            }

            setConversations(prev => ({
                ...prev,
                [activeConversationId]: {
                    ...prev[activeConversationId],
                    messages: data,
                },
            }));
        };

        loadMessages();
    }, [activeConversationId, user]);



    //   useEffect(() => {
    //   if (!activeConversationId && Object.keys(conversations).length > 0) {
    //     const firstChatId = Object.keys(conversations)[0];
    //     setActiveConversationId(firstChatId);
    //   }
    // }, [conversations, activeConversationId]);


    useEffect(() => {
        if (activeConversationId) {
            localStorage.setItem(
                "compyle_active_chat",
                activeConversationId
            );
        }
    }, [activeConversationId]);


    /* ---------- AUTO SCROLL ---------- */
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [conversations, activeConversationId]);


    useEffect(() => {
        const onFocus = () => {
            if (activeConversationId) {
                supabase
                    .from("messages")
                    .select("*")
                    .eq("chat_id", activeConversationId)
                    .order("created_at", { ascending: true })
                    .then(({ data }) => {
                        if (data) {
                            setConversations(prev => ({
                                ...prev,
                                [activeConversationId]: {
                                    ...prev[activeConversationId],
                                    messages: data,
                                },
                            }));
                        }
                    });
            }
        };

        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [activeConversationId]);


    /* ---------- LOGOUT ---------- */
    /* ---------- LOGOUT ---------- */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem("compyle_active_chat");
        window.location.href = "/";
    };


    /* ---------- SEND MESSAGE ---------- */
    const handleSendMessage = async ({ message, model, modelLabel, options }) => {
        let conversationId = activeConversationId;

        // ✅ Auto-create chat if none exists
        if (!conversationId) {
            const { data, error } = await supabase
                .from("chats")
                .insert({
                    user_id: user.id,
                    title: message.substring(0, 40),
                })
                .select()
                .single();

            if (error) {
                console.error("Auto-create chat failed:", error);
                return;
            }

            conversationId = data.id;

            setConversations(prev => ({
                [conversationId]: { ...data, messages: [] },
                ...prev,
            }));

            setActiveConversationId(conversationId);
        }

        const userMessage = {
            id: uuidv4(),
            role: "user",
            content: message,
            created_at: new Date().toISOString(),
        };

        // ✅ Save USER message
        await supabase.from("messages").insert({
            chat_id: conversationId,
            user_id: user.id,
            role: "user",
            content: message,
            model_used: model,
        });

        // ✅ Update title from first message
        const currentChat = conversations[conversationId];
        if (!currentChat?.title || currentChat.title === "New Chat") {
            const newTitle = message.substring(0, 40);

            await supabase
                .from("chats")
                .update({ title: newTitle })
                .eq("id", conversationId);

            setConversations(prev => ({
                ...prev,
                [conversationId]: {
                    ...prev[conversationId],
                    title: newTitle,
                },
            }));
        }

        // ✅ Add user message locally
        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                messages: [...prev[conversationId].messages, userMessage],
            },
        }));

        const assistantMessageId = uuidv4();
        let assistantText = "";

        // ✅ Assistant placeholder (model restored)
        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                messages: [
                    ...prev[conversationId].messages,
                    {
                        id: assistantMessageId,
                        role: "assistant",
                        content: "",
                        model,
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
                    messages: [...conversations[conversationId]?.messages, userMessage],
                    model,
                    options,
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error("Stream failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    const payload = line.replace("data: ", "").trim();
                    if (payload === "[DONE]") break;

                    try {
                        const json = JSON.parse(payload);
                        const token = json?.choices?.[0]?.delta?.content;

                        if (token) {
                            assistantText += token;

                            setConversations(prev => ({
                                ...prev,
                                [conversationId]: {
                                    ...prev[conversationId],
                                    messages: prev[conversationId].messages.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: msg.content + token }
                                            : msg
                                    ),
                                },
                            }));
                        }
                    } catch { }
                }
            }

            // ✅ Save assistant message
            await supabase.from("messages").insert({
                chat_id: conversationId,
                user_id: user.id,
                role: "assistant",
                content: assistantText,
                model_used: model,
            });

        } catch (error) {
            console.error("Streaming error:", error);
        }
    };

    const activeConversation =
        activeConversationId && conversations[activeConversationId]
            ? conversations[activeConversationId]
            : null;


    return (
        <div className="app-wrapper">
            <aside className="sidebar">
                <div className="sidebar-header">Conversations</div>
                <button className="new-chat-btn" onClick={createNewChat}>
                    + New Chat
                </button>

                {Object.values(conversations).map(convo => (
                    <div
                        key={convo.id}
                        className={`conversation-item ${activeConversationId === convo.id ? "active" : ""
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
                        <div className="lp-brand">
                            <img src="logo.png" alt="logo" className="lp-logo" />
                            <div>Compyl-AI</div>
                        </div>

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
                        activeConversation.messages.map(msg => (
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