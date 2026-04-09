import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const nav = useNavigate();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === "admin" && pass === "admin") {
      localStorage.setItem("ccs_isAuthenticated", "true");
      nav("/dashboard");
    } else {
      setError("Invalid username or password.");
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
        <p className="loginSubtitle">Administrator sign in</p>

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

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <div className="loginError">{error}</div>}

          <button type="submit" className="primaryBtn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;