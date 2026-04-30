import { createContext, useContext, useEffect, useMemo, useState } from "react";

const StudentsContext = createContext(null);

const ENV_API_URL = import.meta.env.VITE_API_URL || "";

function getApiCandidates() {
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  const envBase = String(ENV_API_URL || "").trim().replace(/\/+$/, "");
  const envApiBase = envBase && !envBase.endsWith("/api") ? `${envBase}/api` : envBase;
  return Array.from(
    new Set(
      [
        `http://${host}:8000`,
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        `http://${host}:8000/api`,
        "http://localhost:8000/api",
        "http://127.0.0.1:8000/api",
        envBase,
        envApiBase,
      ].filter(Boolean)
    )
  );
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);

  const requestWithFallback = async (path, options = {}) => {
    const candidates = [apiBase, ...getApiCandidates()].filter(
      (v, i, a) => v && a.indexOf(v) === i
    );
    let lastNetworkError = null;
    let lastHttpResponse = null;
    const cleanPath = String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`;
    const pathVariants = cleanPath.startsWith("/api/")
      ? [cleanPath, cleanPath.replace(/^\/api/, "")]
      : [cleanPath, `/api${cleanPath}`];

    for (const base of candidates) {
      const cleanBase = String(base || "").replace(/\/+$/, "");
      const variants = cleanBase.endsWith("/api")
        ? [cleanBase, cleanBase.slice(0, -4)]
        : [cleanBase, `${cleanBase}/api`];

      for (const variant of variants) {
        for (const p of pathVariants) {
          try {
            const res = await fetch(`${variant}${p}`, options);
            const shouldTryNext = res.status >= 500 || res.status === 404 || res.status === 405;
            if (shouldTryNext) {
              lastHttpResponse = res;
              continue;
            }
            setApiBase(variant);
            return res;
          } catch (e) {
            lastNetworkError = e;
          }
        }
      }
    }

    if (lastHttpResponse) {
      return lastHttpResponse;
    }

    throw new Error(
      `Cannot reach API server. Make sure backend is running on port 8000.${
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
        const arr = Array.isArray(list) ? list : [];
        setStudents(arr);
      } catch (e) {
        setStudents([]);
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
        let message = `Failed to add student (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {
            // ignore
          }
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
      if (!res.ok) {
        let message = `Failed to update student (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {
            // ignore
          }
        }
        throw new Error(message);
      }
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
      if (!res.ok) {
        let message = `Failed to update student (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {
            // ignore
          }
        }
        throw new Error(message);
      }
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
        let message = `Failed to delete student (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {
            // ignore
          }
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
        let message = `Failed to delete student (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {
            // ignore
          }
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

