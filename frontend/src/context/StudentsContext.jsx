import { createContext, useContext, useEffect, useMemo, useState } from "react";

const StudentsContext = createContext(null);

const ENV_API_URL = import.meta.env.VITE_API_URL || "";

function getApiCandidates() {
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  return Array.from(
    new Set(
      [ENV_API_URL, `http://${host}:3001`, "http://localhost:3001", "http://127.0.0.1:3001"].filter(Boolean)
    )
  );
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);

  const requestWithFallback = async (path, options) => {
    const candidates = [apiBase, ...getApiCandidates()].filter(
      (v, i, a) => v && a.indexOf(v) === i
    );
    let lastNetworkError = null;

    for (const base of candidates) {
      try {
        const res = await fetch(`${base}${path}`, options);
        setApiBase(base);
        return res;
      } catch (e) {
        lastNetworkError = e;
      }
    }

    throw new Error(
      `Cannot reach API server. Make sure backend is running on port 3001.${
        lastNetworkError instanceof Error ? ` (${lastNetworkError.message})` : ""
      }`
    );
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await requestWithFallback("/students");
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
      const url = new URL(`${apiBase}/students`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v === undefined || v === null || v === "") return;
          url.searchParams.set(k, String(v));
        });
      }
      const res = await requestWithFallback(`/students?${url.searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load students");
      const list = await res.json();
      setStudents(Array.isArray(list) ? list : []);
    };

    const addStudent = async (student) => {
      const res = await requestWithFallback("/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (!res.ok) {
        let message = "Failed to add student";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      // Re-fetch to guarantee consistent fields (e.g. studentNo)
      await res.json();
      await refresh();
    };

    const updateStudent = async (studentNo, updates) => {
      const res = await requestWithFallback(`/students/${encodeURIComponent(studentNo)}`, {
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
      const res = await requestWithFallback(`/students/by-id/${encodeURIComponent(String(studentId))}`, {
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
      const res = await requestWithFallback(`/students/${encodeURIComponent(studentNo)}`, {
        method: "DELETE",
      });
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
      const res = await requestWithFallback(`/students/by-id/${encodeURIComponent(String(studentId))}`, {
        method: "DELETE",
      });
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
      apiUrl: apiBase,
    };
  }, [students, loading, error, apiBase]);

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

