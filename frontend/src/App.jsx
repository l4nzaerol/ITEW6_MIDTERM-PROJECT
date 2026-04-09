import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Faculty from "./pages/Faculty";
import Instruction from "./pages/Instruction";
import Scheduling from "./pages/Scheduling";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import { StudentsProvider } from "./context/StudentsContext";
import { EventsProvider } from "./context/EventsContext";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("ccs_isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <StudentsProvider>
      <EventsProvider>
        <BrowserRouter>
          <Routes>
          <Route
            path="/"
            element={
              localStorage.getItem("ccs_isAuthenticated") === "true"
                ? <Navigate to="/dashboard" replace />
                : <Login />
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute>
                <Faculty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instruction"
            element={
              <ProtectedRoute>
                <Instruction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduling"
            element={
              <ProtectedRoute>
                <Scheduling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </EventsProvider>
    </StudentsProvider>
  );
}

export default App;