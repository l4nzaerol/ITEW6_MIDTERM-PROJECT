import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const raw = localStorage.getItem("ccs_user");
  const user = raw ? JSON.parse(raw) : null;
  const username = user?.username || "User";

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ccs_isAuthenticated");
    localStorage.removeItem("ccs_user");
    navigate("/", { replace: true });
  };

  return (
    <div className="userMenuWrap" ref={rootRef}>
      <button type="button" className="userMenuTrigger" onClick={() => setOpen((v) => !v)}>
        <span className="userMenuAvatar">{String(username).charAt(0).toUpperCase()}</span>
        <span className="userMenuName">{username}</span>
      </button>
      {open && (
        <div className="userMenuDropdown">
          <button type="button" className="userMenuItem danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

