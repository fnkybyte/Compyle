// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Landing from "./pages/Landing";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected route */}
        <Route
          path="/chat"
          element={user ? <ChatPage /> : <Navigate to="/login" />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}
