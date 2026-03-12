import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {

  const nav = useNavigate();

  const [user,setUser] = useState("");
  const [pass,setPass] = useState("");

  const login = () => {

    if(user === "admin" && pass === "admin"){
      nav("/dashboard");
    }else{
      alert("Invalid login");
    }

  };

  return (

    <div className="loginPage">

      <h1>CCS Profiling System</h1>

      <input
        placeholder="Username"
        onChange={(e)=>setUser(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPass(e.target.value)}
      />

      <button onClick={login}>Login</button>

    </div>
  );
}

export default Login;