import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FacultyContext = createContext(null);
const STORAGE_KEY = "ccs_faculty_v2";

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeFaculty);
    }
  } catch {
    // ignore
  }

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

export function FacultyProvider({ children }) {
  const [faculties, setFaculties] = useState(() => initialFaculty());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(faculties));
    } catch {
      // ignore
    }
  }, [faculties]);

  const api = useMemo(() => {
    const addFaculty = (payload) => {
      const next = normalizeFaculty({ ...payload, id: Date.now() });
      setFaculties((prev) => [next, ...prev]);
      return next;
    };

    const updateFaculty = (id, updates) => {
      setFaculties((prev) =>
        prev.map((f) => (String(f.id) === String(id) ? normalizeFaculty({ ...f, ...updates, id: f.id }) : f))
      );
    };

    const removeFaculty = (id) => {
      setFaculties((prev) => prev.filter((f) => String(f.id) !== String(id)));
    };

    return { faculties, addFaculty, updateFaculty, removeFaculty };
  }, [faculties]);

  return <FacultyContext.Provider value={api}>{children}</FacultyContext.Provider>;
}

export function useFaculty() {
  const ctx = useContext(FacultyContext);
  if (!ctx) throw new Error("useFaculty must be used within FacultyProvider");
  return ctx;
}

