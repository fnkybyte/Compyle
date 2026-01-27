# Compyl

A lightweight, full end to end login to Chat Data Storage AI-Chat bot to work with multiple large-language models via OpenRouter, connecting multiple model in a same chat base with previous context of chat.

## Features

-   **Local-First**: All conversation history is stored in your User Account in Supabase Database. No data is stored on the server.
-   **Multi-Model**: Switch between different LLM providers and models (OpenAI, Anthropic, Gemini, etc.) mid-conversation.
-   **Streaming Responses**: See the AI'''s response in real-time as it'''s being generated.
-   **Minimalist UI**: A clean, simple, and responsive chat interface.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Backend**: Node.js (Express)
-   **Auth & Database**: Supabase(It combines user auth with the data storaage along the chat space using uuid making each chat of the user seperate form each other and no other user has authority to acess to other user chat except admin.)

## Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Compyle
    ```

2.  **Install backend dependencies**:
    ```bash
    cd backend
    npm install
    ```

3.  **Install frontend dependencies**:
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Configure Environment Variables**:
    -   In the `/backend` directory, copy the `.env.example` file to a new file named `.env`.
    -   Open the `.env` file and add your OpenRouter API key:
        ```
        OPENROUTER_API_KEY=your_secret_key_here
        ```

## Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminal windows.

1.  **Run the backend server**:
    ```bash
    cd backend
    npm run dev
    ```
    The backend will typically run on `http://localhost:3001`.

2.  **Run the frontend server**:
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port specified by Vite).

## API Key Security

**IMPORTANT**: Your `OPENROUTER_API_KEY` is a secret and should never be exposed in the frontend code. This application is designed to keep the key secure on the backend. Do not commit your `.env` file to version control.
