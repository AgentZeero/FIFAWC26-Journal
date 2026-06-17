import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glass">
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <Trophy className="auth-icon" />
          </div>
          <h1>{mode === "login" ? "Welcome Back" : "Join the Journal"}</h1>
          <p>{mode === "login" ? "Log in to continue your campaign tracking." : "Create an account to track your personal 2026 World Cup campaign."}</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="e.g. karthik" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <Loader2 className="spin" /> : mode === "login" ? "Sign In" : "Create Account"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <p>New here? <a onClick={() => navigate("/register")}>Create an account</a></p>
          ) : (
            <p>Already have an account? <a onClick={() => navigate("/login")}>Sign in</a></p>
          )}
        </div>
      </div>
    </div>
  );
}
