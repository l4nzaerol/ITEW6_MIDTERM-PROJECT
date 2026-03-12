import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const active = (path) => location.pathname === path ? "activeLink" : "";

  const handleLogout = () => {
    // You can replace this with your authentication logout logic
    alert("Logged out successfully!");
  };

  return (
    <div className="sidebar">
      <div className="logoSection">
        <img src="/logo.png" className="logo" alt="Logo"/>
        <div className="logoText">
          <h2>CCS</h2>
          <p>PROFILING</p>
        </div>
      </div>

      <div className="navMenu">
        <Link className={active("/dashboard")} to="/dashboard">Dashboard</Link>
        <Link className={active("/students")} to="/students">Students</Link>
        <Link className={active("/faculty")} to="/faculty">Faculty</Link>
        <Link className={active("/instruction")} to="/instruction">Instruction</Link>
        <Link className={active("/scheduling")} to="/scheduling">Scheduling</Link>
        <Link className={active("/events")} to="/events">Events</Link>
      </div>

      <div className="sidebarFooter">
        <button className="logoutBtn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Sidebar;