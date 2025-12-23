// src/components/Login.jsx
import { supabase } from "../supabase";
import "./login.css";

export default function Login() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    
    <div className="login-container">
        
        
      <div className="login-card">
        <h1 className="login-title">Welcome to Compyle AI</h1>
        <p className="login-subtitle">
          Sign in with Google to continue
        </p>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://img.icons8.com/color/48/google-logo.png"
            alt="Google"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}