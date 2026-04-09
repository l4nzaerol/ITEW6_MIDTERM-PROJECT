import { createContext, useContext, useEffect, useMemo, useState } from "react";

const StudentsContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/students`);
        if (!res.ok) throw new Error("Failed to load students");
        const list = await res.json();
        setStudents(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async (params) => {
      const url = new URL(`${API_URL}/students`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v === undefined || v === null || v === "") return;
          url.searchParams.set(k, String(v));
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load students");
      const list = await res.json();
      setStudents(Array.isArray(list) ? list : []);
    };

    const addStudent = async (student) => {
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (!res.ok) throw new Error("Failed to add student");
      // Re-fetch to guarantee consistent fields (e.g. studentNo)
      await res.json();
      await refresh();
    };

    const updateStudent = async (studentNo, updates) => {
      const res = await fetch(`${API_URL}/students/${encodeURIComponent(studentNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update student");
      const updated = await res.json();
      setStudents((prev) => prev.map((s) => (s.studentNo === studentNo ? updated : s)));
      // Re-fetch to avoid edge cases when studentNo changes or ids are missing.
      await refresh();
      return updated;
    };

    const updateStudentById = async (studentId, updates) => {
      const res = await fetch(`${API_URL}/students/by-id/${encodeURIComponent(String(studentId))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update student");
      const updated = await res.json();
      setStudents((prev) =>
        prev.map((s) =>
          String(s.id) === String(studentId) ? updated : s
        )
      );
      await refresh();
      return updated;
    };

    const deleteStudent = async (studentNo) => {
      const res = await fetch(`${API_URL}/students/${encodeURIComponent(studentNo)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        let message = "Failed to delete student";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      setStudents((prev) => prev.filter((s) => s.studentNo !== studentNo));
      // Re-fetch to ensure database and UI are in sync
      await refresh();
    };

    const deleteStudentById = async (studentId) => {
      const res = await fetch(`${API_URL}/students/by-id/${encodeURIComponent(String(studentId))}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        let message = "Failed to delete student";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      setStudents((prev) => prev.filter((s) => String(s.id) !== String(studentId)));
      await refresh();
    };

    const getStudentByNo = (studentNo) =>
      students.find((s) => s.studentNo === studentNo) || null;

    return {
      students,
      loading,
      error,
      refresh,
      addStudent,
      updateStudent,
      updateStudentById,
      deleteStudent,
      deleteStudentById,
      getStudentByNo,
      apiUrl: API_URL,
    };
  }, [students, loading, error]);

  return (
    <StudentsContext.Provider value={api}>{children}</StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within StudentsProvider");
  }
  return ctx;
}

