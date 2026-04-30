import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CREDENTIALS_KEY = "ccs_admin_credentials";
const FALLBACK_ADMIN = {
  username: "admin",
  email: "admin@ccs.local",
  password: "admin123",
};

function getApiCandidates() {
  return [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000/api",
    "http://localhost:8000/api",
  ];
}

async function requestAuth(path, options) {
  const cleanPath = String(path).startsWith("/") ? String(path) : `/${String(path)}`;
  const pathVariants = cleanPath.startsWith("/api/")
    ? [cleanPath, cleanPath.replace(/^\/api/, "")]
    : [cleanPath, `/api${cleanPath}`];
  let lastError = null;

  for (const base of getApiCandidates()) {
    const cleanBase = String(base || "").replace(/\/+$/, "");
    const baseVariants = cleanBase.endsWith("/api")
      ? [cleanBase, cleanBase.slice(0, -4)]
      : [cleanBase, `${cleanBase}/api`];
    for (const variant of baseVariants) {
      for (const p of pathVariants) {
        try {
          const res = await fetch(`${variant}${p}`, options);
          if (res.status === 404 || res.status === 405 || res.status >= 500) continue;
          return res;
        } catch (err) {
          lastError = err;
        }
      }
    }
  }

  throw new Error(
    `Cannot reach auth server on port 8000${
      lastError instanceof Error ? ` (${lastError.message})` : ""
    }`
  );
}

function readStoredCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.username || !parsed?.password) return null;
    return {
      username: String(parsed.username),
      password: String(parsed.password),
    };
  } catch {
    return null;
  }
}

function getActiveCredentials() {
  return readStoredCredentials() || FALLBACK_ADMIN;
}

function credentialsMatch(usernameOrEmail, password, credentials) {
  const login = String(usernameOrEmail || "").trim().toLowerCase();
  const savedUsername = String(credentials?.username || "").trim().toLowerCase();
  const savedEmail = String(credentials?.email || "").trim().toLowerCase();
  const savedPassword = String(credentials?.password || "");
  return (login === savedUsername || login === savedEmail) && String(password || "") === savedPassword;
}

function persistCredentials(username, password) {
  localStorage.setItem(
    CREDENTIALS_KEY,
    JSON.stringify({
      username: String(username || "").trim(),
      email: FALLBACK_ADMIN.email,
      password: String(password || ""),
    })
  );
}

function authenticateLocally(username) {
  localStorage.setItem("ccs_isAuthenticated", "true");
  localStorage.setItem(
    "ccs_user",
    JSON.stringify({
      username: String(username || "").trim() || "admin",
      source: "local-storage",
    })
  );
}

function Login() {
  const nav = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const activeCredentials = getActiveCredentials();
  const [user, setUser] = useState(activeCredentials.username || activeCredentials.email || "");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState(activeCredentials.password || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const normalizedUser = String(user || "").trim();
      const enteredPassword = String(pass || "");

      if (isRegister) {
        persistCredentials(normalizedUser, enteredPassword);

        const registerRes = await requestAuth("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: normalizedUser,
            email: String(email || "").trim(),
            password: enteredPassword,
          }),
        });
        if (!registerRes.ok) {
          let message = "Registration failed.";
          try {
            const body = await registerRes.json();
            message = body?.message || Object.values(body?.errors || {})?.[0]?.[0] || message;
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }
      }

      const localCredentials = getActiveCredentials();
      if (credentialsMatch(normalizedUser, enteredPassword, localCredentials)) {
        authenticateLocally(normalizedUser);
        nav("/dashboard");
        return;
      }

      const loginRes = await requestAuth("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: normalizedUser,
          password: enteredPassword,
        }),
      });
      if (!loginRes.ok) {
        let message = "Invalid username/email or password.";
        try {
          const body = await loginRes.json();
          message = body?.message || Object.values(body?.errors || {})?.[0]?.[0] || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }
      const authUser = await loginRes.json();
      persistCredentials(normalizedUser, enteredPassword);
      localStorage.setItem("ccs_isAuthenticated", "true");
      localStorage.setItem("ccs_user", JSON.stringify(authUser));
      nav("/dashboard");
    } catch (err) {
      const localCredentials = getActiveCredentials();
      const normalizedUser = String(user || "").trim();
      const enteredPassword = String(pass || "");
      if (credentialsMatch(normalizedUser, enteredPassword, localCredentials)) {
        authenticateLocally(normalizedUser);
        nav("/dashboard");
        return;
      }
      setError(
        err instanceof Error
          ? `${err.message} (Use admin@ccs.local / admin123 for Vercel frontend-only login.)`
          : "Authentication failed."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginLogoWrap" aria-hidden="true">
          <div className="loginLogoGlow" />
          <img className="loginLogo" src="/logo.png" alt="" />
        </div>

        <h2 className="loginTitle">CCS Profiling</h2>
        <p className="loginSubtitle">{isRegister ? "Create administrator account" : "Administrator sign in"}</p>

        <form onSubmit={handleSubmit} className="loginForm">
          <label>
            <span>Username</span>
            <input
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
            />
          </label>

          {isRegister && (
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          )}

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder={isRegister ? "Minimum 8 characters" : "Enter password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <div className="loginError">{error}</div>}

          <button type="submit" className="primaryBtn" disabled={saving}>
            {saving ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>

          <button
            type="button"
            className="chip"
            onClick={() => {
              setIsRegister((v) => !v);
              setError("");
            }}
          >
            {isRegister ? "Already have an account? Login" : "Create new account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;