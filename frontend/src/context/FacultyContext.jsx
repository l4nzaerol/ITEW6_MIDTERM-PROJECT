import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FacultyContext = createContext(null);
const ENV_API_URL = import.meta.env.VITE_API_URL || "";
const FACULTY_STORAGE_KEY = "ccs_faculty_data_v1";

export const CURRICULUM = {
  IT: {
    "1st Year": {
      "1st Sem": [
        ["CCS101", "Introduction to Computing"],
        ["CCS102", "Computer Programming 1"],
        ["ETH101", "Ethics"],
        ["MAT101", "Mathematics in the Modern World"],
        ["NSTP1", "National Service Training Program 1"],
        ["PED101", "Physical Education 1"],
        ["PSY100", "Understanding the Self"],
      ],
      "2nd Sem": [
        ["CCS103", "Computer Programming 2"],
        ["CCS104", "Discrete Structures 1"],
        ["CCS105", "Human Computer Interaction 1"],
        ["CCS106", "Social and Professional Issues"],
        ["COM101", "Purposive Communication"],
        ["GAD101", "Gender and Development"],
        ["NSTP2", "National Service Training Program 2"],
        ["PED102", "Physical Education 2"],
      ],
    },
    "2nd Year": {
      "1st Sem": [
        ["ACT101", "Principles of Accounting"],
        ["CCS107", "Data Structures and Algorithms 1"],
        ["CCS108", "Object-Oriented Programming"],
        ["CCS109", "System Analysis and Design"],
        ["ITEW1", "Electronic Commerce"],
        ["PED103", "Physical Education 3"],
        ["STS101", "Science, Technology and Society"],
      ],
      "2nd Sem": [
        ["CCS110", "Information Management 1"],
        ["CCS111", "Networking and Communication 1"],
        ["ENT101", "The Entrepreneurial Mind"],
        ["ITEW2", "Client Side Scripting"],
        ["ITP101", "Quantitative Methods"],
        ["ITP102", "Integrative Programming and Technologies"],
        ["PED104", "Physical Education 4"],
      ],
    },
    "3rd Year": {
      "1st Sem": [
        ["HIS101", "Readings in Philippine History"],
        ["ITEW3", "Server Side Scripting"],
        ["ITP103", "System Integration and Architecture"],
        ["ITP104", "Information Management 2"],
        ["ITP105", "Networking and Communication 2"],
        ["ITP106", "Human Computer Interaction 2"],
        ["SOC101", "The Contemporary World"],
        ["TEC101", "Technopreneurship"],
      ],
      "2nd Sem": [
        ["CCS112", "Applications Development and Emerging Technologies"],
        ["CCS113", "Information Assurance and Security"],
        ["HMN101", "Art Appreciation"],
        ["ITEW4", "Responsive Web Design"],
        ["ITP107", "Mobile Application Development"],
        ["ITP108", "Capstone Project 1"],
        ["ITP109", "Platform Technologies"],
      ],
    },
    "4th Year": {
      "1st Sem": [
        ["ENV101", "Environmental Science"],
        ["ITEW5", "Web Security and Optimization"],
        ["ITP110", "Web Technologies"],
        ["ITP111", "System Administration and Maintenance"],
        ["ITP112", "Capstone Project 2"],
        ["RIZ101", "Life and Works of Rizal"],
      ],
      "2nd Sem": [
        ["ITEW6", "Web Development Frameworks"],
        ["ITP113", "IT Practicum (500 hours)"],
      ],
    },
  },
  CS: {
    "1st Year": {
      "1st Sem": [
        ["CCS101", "Introduction to Computing"],
        ["CS101", "Computer Programming 1"],
        ["CS102", "Discrete Structures 1"],
        ["MAT101", "Mathematics in the Modern World"],
        ["PED101", "Physical Education 1"],
      ],
      "2nd Sem": [
        ["CS103", "Computer Programming 2"],
        ["CS104", "Data Structures and Algorithms"],
        ["CS105", "Computer Architecture and Organization"],
        ["COM101", "Purposive Communication"],
        ["PED102", "Physical Education 2"],
      ],
    },
    "2nd Year": {
      "1st Sem": [
        ["CS201", "Object-Oriented Programming"],
        ["CS202", "Algorithms and Complexity"],
        ["CS203", "Information Management"],
        ["CS204", "Operating Systems"],
        ["PED103", "Physical Education 3"],
      ],
      "2nd Sem": [
        ["CS205", "Software Engineering 1"],
        ["CS206", "Design and Analysis of Algorithms"],
        ["CS207", "Programming Languages"],
        ["CS208", "Automata Theory and Formal Languages"],
        ["PED104", "Physical Education 4"],
      ],
    },
    "3rd Year": {
      "1st Sem": [
        ["CS301", "Artificial Intelligence"],
        ["CS302", "Database Systems"],
        ["CS303", "Computer Networks"],
        ["CS304", "Human Computer Interaction"],
        ["CS305", "Web Systems and Technologies"],
      ],
      "2nd Sem": [
        ["CS306", "Software Engineering 2"],
        ["CS307", "Machine Learning"],
        ["CS308", "Information Assurance and Security"],
        ["CS309", "Research Methods in Computing"],
      ],
    },
    "4th Year": {
      "1st Sem": [
        ["CS401", "Capstone Project 1"],
        ["CS402", "Parallel and Distributed Computing"],
        ["CS403", "Elective 1 (Data Science/Cloud Computing)"],
      ],
      "2nd Sem": [
        ["CS404", "Capstone Project 2"],
        ["CS405", "CS Practicum (500 hours)"],
      ],
    },
  },
};

export const SYLLABI = Object.entries(CURRICULUM).flatMap(([track, years]) =>
  Object.entries(years).flatMap(([yearLevel, sems]) =>
    Object.entries(sems).flatMap(([term, courses]) =>
      courses.map(([code, title]) => ({
        id: `${track}-${yearLevel}-${term}-${code}`,
        code,
        title,
        term,
        yearLevel,
        track,
      }))
    )
  )
);

export const SECTION_OPTIONS = [
  "CS1A", "CS1B", "CS2A", "CS2B", "CS3A", "CS3B", "CS4A", "CS4B",
  "IT1A", "IT1B", "IT2A", "IT2B", "IT3A", "IT3B", "IT4A", "IT4B",
];

function normalizeFaculty(f) {
  return {
    id: Number(f?.id) || Date.now(),
    name: String(f?.name || "").trim(),
    department: String(f?.department || "Information Technology"),
    specialization: String(f?.specialization || "").trim(),
    syllabusHandled: Array.isArray(f?.syllabusHandled) ? f.syllabusHandled : [],
    sectionsHandled: Array.isArray(f?.sectionsHandled) ? f.sectionsHandled : [],
  };
}

function initialFaculty() {
  const base = [
    { id: 1, name: "Dr. Maria Smith", department: "Computer Science", specialization: "Algorithms and AI" },
    { id: 2, name: "Prof. Jonathan Johnson", department: "Information Technology", specialization: "Web and Mobile Development" },
    { id: 3, name: "Prof. Angela Reyes", department: "Information Technology", specialization: "Networking and Security" },
    { id: 4, name: "Dr. Carlo Dizon", department: "Computer Science", specialization: "Software Engineering" },
    { id: 5, name: "Prof. Liza Mendoza", department: "Information Technology", specialization: "Information Management" },
  ].map(normalizeFaculty);

  const withAssignments = base.map((f) => ({ ...f, syllabusHandled: [], sectionsHandled: [] }));

  ["IT", "CS"].forEach((track) => {
    const dept = track === "IT" ? "Information Technology" : "Computer Science";
    const pool = withAssignments.filter((f) => f.department === dept);
    const courses = SYLLABI.filter((s) => s.track === track);
    courses.forEach((course, idx) => {
      const target = pool[idx % pool.length];
      if (!target.syllabusHandled.includes(course.id)) {
        target.syllabusHandled.push(course.id);
      }
    });

    const sections = SECTION_OPTIONS.filter((s) => s.startsWith(track));
    sections.forEach((sec, idx) => {
      const target = pool[idx % pool.length];
      if (!target.sectionsHandled.includes(sec)) {
        target.sectionsHandled.push(sec);
      }
    });
  });

  return withAssignments;
}

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
        envBase,
        envApiBase,
        `http://${host}:3001`,
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        `http://${host}:8000`,
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        `http://${host}:8000/api`,
        "http://localhost:8000/api",
        "http://127.0.0.1:8000/api",
      ].filter(Boolean)
    )
  );
}

function readLocalFaculty() {
  try {
    const raw = localStorage.getItem(FACULTY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.map(normalizeFaculty) : [];
  } catch {
    return [];
  }
}

function writeLocalFaculty(list) {
  localStorage.setItem(FACULTY_STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function FacultyProvider({ children }) {
  const [faculties, setFaculties] = useState([]);
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);
  const [isOffline, setIsOffline] = useState(false);

  const requestWithFallback = async (path, options) => {
    const candidates = [apiBase, ...getApiCandidates()].filter((v, i, a) => v && a.indexOf(v) === i);
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
      `Cannot reach API server.${lastNetworkError instanceof Error ? ` (${lastNetworkError.message})` : ""}`
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await requestWithFallback("/faculties");
        if (!res.ok) throw new Error("Failed to load faculties");
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length) {
          const normalized = rows.map(normalizeFaculty);
          setFaculties(normalized);
          writeLocalFaculty(normalized);
          setIsOffline(false);
          return;
        }
        const defaults = initialFaculty();
        await requestWithFallback("/bootstrap/frontend-dummy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faculties: defaults, syllabi: SYLLABI }),
        });
        const refresh = await requestWithFallback("/faculties");
        if (!refresh.ok) throw new Error("Failed to load faculties");
        const list = await refresh.json();
        const normalized = Array.isArray(list) ? list.map(normalizeFaculty) : [];
        setFaculties(normalized);
        writeLocalFaculty(normalized);
        setIsOffline(false);
      } catch {
        const local = readLocalFaculty();
        const fallback = local.length ? local : initialFaculty();
        setFaculties(fallback);
        writeLocalFaculty(fallback);
        setIsOffline(true);
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async () => {
      if (isOffline) {
        setFaculties(readLocalFaculty());
        return;
      }
      try {
        const res = await requestWithFallback("/faculties");
        if (!res.ok) throw new Error("Failed to load faculties");
        const rows = await res.json();
        const normalized = Array.isArray(rows) ? rows.map(normalizeFaculty) : [];
        setFaculties(normalized);
        writeLocalFaculty(normalized);
      } catch {
        setIsOffline(true);
        setFaculties(readLocalFaculty());
      }
    };

    const addFaculty = async (payload) => {
      if (isOffline) {
        const local = readLocalFaculty();
        const maxId = local.reduce((acc, f) => Math.max(acc, Number(f?.id) || 0), 0);
        const next = normalizeFaculty({ ...payload, id: maxId + 1 });
        const updated = [next, ...local];
        setFaculties(updated);
        writeLocalFaculty(updated);
        return next;
      }
      try {
        const res = await requestWithFallback("/faculties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let message = "Failed to add faculty";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        const next = await res.json();
        await refresh();
        return next;
      } catch {
        setIsOffline(true);
        return addFaculty(payload);
      }
    };

    const updateFaculty = async (id, updates) => {
      const existing = faculties.find((f) => String(f.id) === String(id));
      const payload = normalizeFaculty({ ...(existing || {}), ...updates, id });
      if (isOffline) {
        const local = readLocalFaculty();
        const updated = local.map((f) => (String(f.id) === String(id) ? payload : f));
        setFaculties(updated);
        writeLocalFaculty(updated);
        return;
      }
      try {
        const res = await requestWithFallback(`/faculties/${encodeURIComponent(String(id))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let message = "Failed to update faculty";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        await refresh();
      } catch {
        setIsOffline(true);
        await updateFaculty(id, updates);
      }
    };

    const removeFaculty = async (id) => {
      if (isOffline) {
        const local = readLocalFaculty();
        const updated = local.filter((f) => String(f.id) !== String(id));
        setFaculties(updated);
        writeLocalFaculty(updated);
        return;
      }
      try {
        const res = await requestWithFallback(`/faculties/${encodeURIComponent(String(id))}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          let message = "Failed to delete faculty";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        await refresh();
      } catch {
        setIsOffline(true);
        await removeFaculty(id);
      }
    };

    return { faculties, addFaculty, updateFaculty, removeFaculty, refresh, apiUrl: apiBase, isOffline };
  }, [faculties, apiBase, isOffline]);

  return <FacultyContext.Provider value={api}>{children}</FacultyContext.Provider>;
}

export function useFaculty() {
  const ctx = useContext(FacultyContext);
  if (!ctx) throw new Error("useFaculty must be used within FacultyProvider");
  return ctx;
}

