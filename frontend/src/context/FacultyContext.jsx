import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FacultyContext = createContext(null);
const ENV_API_URL = import.meta.env.VITE_API_URL || "";

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
  return Array.from(
    new Set(
      [ENV_API_URL, `http://${host}:3001`, "http://localhost:3001", "http://127.0.0.1:3001"].filter(Boolean)
    )
  );
}

export function FacultyProvider({ children }) {
  const [faculties, setFaculties] = useState([]);
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);

  const requestWithFallback = async (path, options) => {
    const candidates = [apiBase, ...getApiCandidates()].filter((v, i, a) => v && a.indexOf(v) === i);
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
          setFaculties(rows.map(normalizeFaculty));
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
        setFaculties(Array.isArray(list) ? list.map(normalizeFaculty) : []);
      } catch {
        setFaculties(initialFaculty());
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async () => {
      const res = await requestWithFallback("/faculties");
      if (!res.ok) throw new Error("Failed to load faculties");
      const rows = await res.json();
      setFaculties(Array.isArray(rows) ? rows.map(normalizeFaculty) : []);
    };

    const addFaculty = async (payload) => {
      const res = await requestWithFallback("/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add faculty");
      await refresh();
      const next = await res.json();
      return next;
    };

    const updateFaculty = async (id, updates) => {
      const existing = faculties.find((f) => String(f.id) === String(id));
      const payload = normalizeFaculty({ ...(existing || {}), ...updates, id });
      const res = await requestWithFallback(`/faculties/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update faculty");
      await refresh();
    };

    const removeFaculty = async (id) => {
      const res = await requestWithFallback(`/faculties/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete faculty");
      await refresh();
    };

    return { faculties, addFaculty, updateFaculty, removeFaculty, refresh, apiUrl: apiBase };
  }, [faculties, apiBase]);

  return <FacultyContext.Provider value={api}>{children}</FacultyContext.Provider>;
}

export function useFaculty() {
  const ctx = useContext(FacultyContext);
  if (!ctx) throw new Error("useFaculty must be used within FacultyProvider");
  return ctx;
}

