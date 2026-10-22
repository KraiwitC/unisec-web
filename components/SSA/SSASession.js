import { useState } from "react";

export default function SSASession({ authenticated, login, logout }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const style = { padding: "8px 12px", background: "#1f2937", color: "white", borderRadius: 8 };
  if (authenticated) return <button style={style} onClick={logout}>Sign out of Admin</button>;
  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setError("");
      try { await login(password); setPassword(""); }
      catch (err) { setError(err.message || "Sign-in failed"); }
      finally { setPending(false); }
    }} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
      <label>Admin password <input aria-label="Admin password" type="password" autoComplete="current-password"
        value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024}
        style={{ ...style, border: "1px solid #64748b" }} /></label>
      <button type="submit" disabled={pending} style={style}>{pending ? "Signing in…" : "Sign in"}</button>
      {error && <span role="alert">{error}</span>}
    </form>
  );
}
