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
      setError("Invalid username or password. Try admin / admin.");
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBrandPanel">
        <h1>CCS COMPREHENSIVE PROFILING SYSTEM</h1>
        <p>
          Profile students across academic, non-academic, skills, affiliations,
          and violations, and generate targeted reports for contests,
          try-outs, and events.
        </p>
      </div>

      <div className="loginCard">
        <h2>Administrator Login</h2>
        <p className="loginSubtitle">Sign in to access the profiling dashboard.</p>

        <form onSubmit={handleSubmit} className="loginForm">
          <label>
            <span>Username</span>
            <input
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
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