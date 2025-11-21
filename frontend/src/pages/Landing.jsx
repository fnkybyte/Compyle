// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="landing-page dark-hero">
            <nav className="lp-nav">
                <div className="lp-brand">
                    <img src="/gemini-color.png" alt="logo" className="lp-logo" />
                    <div className="lp-brand">Compyle</div>
                </div>

                <div className="lp-actions">
                    <Link to="/chat" className="lp-cta small">Open Chat</Link>
                </div>
            </nav>


            <header className="landing-hero">
                <div className="hero-inner">
                    <div className="hero-badge">Minimal • Fast • Multi-provider</div>
                    <h1 className="hero-title">
                        All Chat Models in One Simple Interface
                    </h1>

                    <p className="hero-sub">
                        Compyle connects multiple LLM providers  — Grok, Gemini, GLm, DeepSeek and OpenAI — in a single minimal chat.
                        No account required. Local chat history, fast streaming responses and model switching on the fly.
                    </p>

                    <div className="hero-cta">
                        <Link to="/chat" className="primary-btn">Open Chat — Try it now</Link>

                    </div>

                    <div className="hero-preview">
                        {/* Use the uploaded screenshots as preview montage */}
                        <img src="preview1.png" alt="Compyle preview 1" />
                        <img src="preview2.png" alt="Compyle preview 2" />
                    </div>
                </div>
            </header>

            <section id="features" className="features-grid">
                <div className="feature">
                    <h3>Multiple LLMs, one place</h3>
                    <p>Switch providers instantly — choose Grok, Gemini, Claude, DeepSeek or OpenAI through OpenRouter and compare outputs.</p>
                </div>

                <div className="feature">
                    <h3>Privacy-first</h3>
                    <p>Chats are stored locally (localStorage). No signup required — you control your conversations.</p>
                </div>

                <div className="feature">
                    <h3>Streaming answers</h3>
                    <p>Get partial replies as the model generates them, with safe markdown rendering and nice formatting.</p>
                </div>

                <div className="feature">
                    <h3>Developer friendly</h3>
                    <p>Small Node proxy + React frontend scaffold. Plug your OpenRouter key and you're ready to deploy.</p>
                </div>
            </section>

            <section className="trusted">
                <div className="trusted-inner">
                    <div className="trusted-title">Top AI Models by</div>
                    <div className="trusted-logos">
                        <img src="OpenAI_Logo.svg.png" alt="logo sample" />
                        <img src="Google-Gemini-Logo.png" alt="logo sample" />
                        <img src="DeepSeek_logo.svg.png" alt="logo sample" />
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="lp-brand">
                        <img src="/gemini-color.png" alt="logo" className="lp-logo" />
                        <div className="lp-brand">Compyle</div>
                    </div>
                    <div className="links">
                        <a href="#features">Features</a>
                        <a href="/chat">Open Chat</a>
                        <a href="#docs">Docs</a>
                    </div>
                    <div className="copyright">© {new Date().getFullYear()} Compyle</div>
                </div>
            </footer>
        </div>
    );
}
