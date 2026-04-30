import { createContext, useContext, useEffect, useMemo, useState } from "react";

const StudentsContext = createContext(null);

const ENV_API_URL = import.meta.env.VITE_API_URL || "";
const STUDENTS_STORAGE_KEY = "ccs_students_data_v1";
const SEEDED_FLAG_KEY = "ccs_students_seeded_v1";
const TOTAL_SEEDED_STUDENTS = 1200;

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

function createSeedStudent(index) {
  const id = index + 1;
  const course = index % 2 === 0 ? "BSIT" : "BSCS";
  const yearLevel = `${(index % 4) + 1}${(index % 10 === 0 || index % 10 > 3) ? "th" : index % 10 === 1 ? "st" : index % 10 === 2 ? "nd" : "rd"} Year`;
  const sectionPrefix = course === "BSIT" ? "IT" : "CS";
  const section = `${sectionPrefix}${(index % 4) + 1}${String.fromCharCode(65 + (index % 5))}`;
  const firstName = `Student${String(index + 1).padStart(4, "0")}`;
  const lastName = `CCS${String((index % 300) + 1).padStart(3, "0")}`;
  const name = `${firstName} ${lastName}`;
  const hasViolation = index % 7 === 0;
  const skills = index % 3 === 0 ? ["programming", "leadership"] : ["basketball", "teamwork"];
  const affiliations = index % 2 === 0 ? ["Sites"] : ["Association of Computer Science Students"];
  return {
    id,
    studentNo: `2026-${String(id).padStart(4, "0")}`,
    firstName,
    middleName: "",
    lastName,
    name,
    course,
    yearLevel,
    year: yearLevel,
    section,
    skills,
    affiliations,
    violations: hasViolation ? ["Late submission"] : [],
    academicHistory: [
      {
        term: "2025-2026 1st Sem",
        gpa: Number((1.5 + (index % 20) * 0.05).toFixed(2)),
        standing: "Regular",
      },
    ],
    nonAcademicHistory: [
      {
        activity: index % 2 === 0 ? "Hackathon" : "Department Event",
        role: index % 2 === 0 ? "Participant" : "Volunteer",
      },
    ],
  };
}

function generateSeedStudents(total = TOTAL_SEEDED_STUDENTS) {
  return Array.from({ length: total }, (_, i) => createSeedStudent(i));
}

function readLocalStudents() {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStudents(list) {
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

function ensureSeededStudents() {
  const seeded = localStorage.getItem(SEEDED_FLAG_KEY) === "true";
  const existing = readLocalStudents();
  if (!seeded || existing.length < TOTAL_SEEDED_STUDENTS) {
    const generated = generateSeedStudents();
    writeLocalStudents(generated);
    localStorage.setItem(SEEDED_FLAG_KEY, "true");
    return generated;
  }
  return existing;
}

function normalizeStudentForLocal(student, fallbackId) {
  const firstName = String(student?.firstName || "").trim();
  const lastName = String(student?.lastName || "").trim();
  const name =
    String(student?.name || "").trim() || `${firstName} ${lastName}`.trim() || "Unnamed Student";
  const year = String(student?.yearLevel || student?.year || "").trim();
  return {
    ...student,
    id: student?.id ?? fallbackId,
    studentNo: String(student?.studentNo || "").trim(),
    firstName,
    middleName: String(student?.middleName || "").trim(),
    lastName,
    name,
    course: String(student?.course || "").trim(),
    yearLevel: year,
    year,
    section: String(student?.section || "").trim(),
    skills: Array.isArray(student?.skills) ? student.skills : [],
    affiliations: Array.isArray(student?.affiliations) ? student.affiliations : [],
    violations: Array.isArray(student?.violations) ? student.violations : [],
    academicHistory: Array.isArray(student?.academicHistory) ? student.academicHistory : [],
    nonAcademicHistory: Array.isArray(student?.nonAcademicHistory) ? student.nonAcademicHistory : [],
  };
}

function applyLocalFilters(list, params) {
  if (!params) return list;
  return list.filter((s) =>
    Object.entries(params).every(([k, v]) => {
      if (v === undefined || v === null || v === "") return true;
      const value = String(v).toLowerCase();
      if (k === "q") {
        return (
          String(s?.name || "").toLowerCase().includes(value) ||
          String(s?.studentNo || "").toLowerCase().includes(value) ||
          String(s?.course || "").toLowerCase().includes(value) ||
          String(s?.section || "").toLowerCase().includes(value)
        );
      }
      return String(s?.[k] || "").toLowerCase() === value;
    })
  );
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);
  const [isOffline, setIsOffline] = useState(false);

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
        writeLocalStudents(arr);
        localStorage.setItem(SEEDED_FLAG_KEY, "true");
        setIsOffline(false);
      } catch (e) {
        const seeded = ensureSeededStudents();
        setStudents(seeded);
        setIsOffline(true);
        setError(
          e instanceof Error
            ? `${e.message} Showing local student dataset instead.`
            : "Using local student dataset."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async (params) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        setStudents(applyLocalFilters(local, params));
        return;
      }
      try {
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
        const normalized = Array.isArray(list) ? list : [];
        setStudents(normalized);
        writeLocalStudents(normalized);
      } catch {
        const local = ensureSeededStudents();
        setStudents(applyLocalFilters(local, params));
        setIsOffline(true);
      }
    };

    const addStudent = async (student) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        const maxId = local.reduce((acc, item) => Math.max(acc, Number(item?.id) || 0), 0);
        const newStudent = normalizeStudentForLocal(student, maxId + 1);
        const updated = [newStudent, ...local];
        writeLocalStudents(updated);
        setStudents(updated);
        return;
      }
      try {
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
        await res.json();
        await refresh();
      } catch {
        setIsOffline(true);
        await addStudent(student);
      }
    };

    const updateStudent = async (studentNo, updates) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        const updatedList = local.map((item) =>
          String(item?.studentNo || "") === String(studentNo || "")
            ? normalizeStudentForLocal({ ...item, ...updates }, item?.id)
            : item
        );
        writeLocalStudents(updatedList);
        setStudents(updatedList);
        return updatedList.find((s) => String(s?.studentNo || "") === String(updates?.studentNo || studentNo));
      }
      try {
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
        await refresh();
        return updated;
      } catch {
        setIsOffline(true);
        return updateStudent(studentNo, updates);
      }
    };

    const updateStudentById = async (studentId, updates) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        const updatedList = local.map((item) =>
          String(item?.id) === String(studentId)
            ? normalizeStudentForLocal({ ...item, ...updates }, item?.id)
            : item
        );
        writeLocalStudents(updatedList);
        setStudents(updatedList);
        return updatedList.find((s) => String(s?.id) === String(studentId)) || null;
      }
      try {
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
      } catch {
        setIsOffline(true);
        return updateStudentById(studentId, updates);
      }
    };

    const deleteStudent = async (studentNo) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        const updated = local.filter((s) => String(s?.studentNo || "") !== String(studentNo || ""));
        writeLocalStudents(updated);
        setStudents(updated);
        return;
      }
      try {
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
        await refresh();
      } catch {
        setIsOffline(true);
        await deleteStudent(studentNo);
      }
    };

    const deleteStudentById = async (studentId) => {
      if (isOffline) {
        const local = ensureSeededStudents();
        const updated = local.filter((s) => String(s?.id) !== String(studentId));
        writeLocalStudents(updated);
        setStudents(updated);
        return;
      }
      try {
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
      } catch {
        setIsOffline(true);
        await deleteStudentById(studentId);
      }
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
      isOffline,
    };
  }, [students, loading, error, apiBase, isOffline]);

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

