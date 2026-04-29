import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useStudents } from "../context/StudentsContext";
import { SYLLABI, useFaculty } from "../context/FacultyContext";

const SCHEDULES_STORAGE_KEY = "ccs_schedules_v1";

function readSchedules() {
  try {
    const raw = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toCsvValue(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function downloadCsv(filename, columns, rows) {
  const header = columns.map(toCsvValue).join(",");
  const body = rows
    .map((r) => columns.map((c) => toCsvValue(r?.[c] ?? "")).join(","))
    .join("\n");
  const csv = `${header}\n${body}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("students"); // students | faculty | instruction | scheduling
  const [mode, setMode] = useState("free"); // (students only) free | basketball | programming
  const { students } = useStudents();
  const { faculties } = useFaculty();

  const normalize = (value) => String(value || "").toLowerCase();

  const allStudents = students || [];
  const allSchedules = useMemo(() => readSchedules(), []);

  const freeStudentResults = allStudents.filter((s) => {
    const q = normalize(query);
    if (!q) return false;
    return (
      normalize(s.name).includes(q) ||
      normalize(s.course).includes(q) ||
      normalize(s.section).includes(q) ||
      normalize(s.year).includes(q) ||
      normalize(s.skills.join(" ")).includes(q) ||
      normalize(s.affiliations.join(" ")).includes(q)
    );
  });

  const basketballEligible = allStudents.filter(
    (s) =>
      s.skills.includes("basketball") &&
      (!s.violations || s.violations.length === 0)
  );

  const programmingEligible = allStudents.filter((s) => {
    const hasProgramming = s.skills.includes("programming");
    const term = s.academicHistory && s.academicHistory[0];
    const hasGoodGpa = term ? term.gpa <= 1.75 : false;
    return hasProgramming && hasGoodGpa;
  });

  const syllabusById = useMemo(() => new Map(SYLLABI.map((s) => [s.id, s])), []);

  const facultyResults = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return [];
    return (faculties || []).filter((f) => {
      const handled = (f.syllabusHandled || [])
        .map((id) => syllabusById.get(id))
        .filter(Boolean)
        .map((s) => `${s.code} ${s.title}`)
        .join(" ");
      const hay = `${f.name || ""} ${f.department || ""} ${f.specialization || ""} ${(f.sectionsHandled || []).join(" ")} ${handled}`.toLowerCase();
      return hay.includes(q);
    });
  }, [faculties, query, syllabusById]);

  const instructionRows = useMemo(() => {
    return SYLLABI.map((s) => {
      const assigned = (faculties || [])
        .filter((f) => (f.syllabusHandled || []).includes(s.id))
        .map((f) => f.name);
      return {
        id: s.id,
        track: s.track,
        yearLevel: s.yearLevel,
        term: s.term,
        code: s.code,
        title: s.title,
        faculty: assigned.length ? assigned.join("; ") : "Not assigned",
      };
    });
  }, [faculties]);

  const instructionResults = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return [];
    return instructionRows.filter((r) => {
      const hay = `${r.track} ${r.yearLevel} ${r.term} ${r.code} ${r.title} ${r.faculty}`.toLowerCase();
      return hay.includes(q);
    });
  }, [instructionRows, query]);

  const schedulingResults = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return [];
    return allSchedules.filter((s) => {
      const hay = `${s.course || ""} ${s.section || ""} ${s.faculty || ""} ${s.time || ""} ${s.room || ""} ${s.lab || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allSchedules, query]);

  let results = [];
  let description = "";

  if (category === "students") {
    if (mode === "basketball") {
      results = basketballEligible;
      description = "Students who qualify for basketball try-outs (basketball skill, no violations).";
    } else if (mode === "programming") {
      results = programmingEligible;
      description = "Students who qualify for programming contests (programming skill, GPA ≤ 1.75).";
    } else {
      results = freeStudentResults;
      description = "Search across name, course, section, year, skills, affiliations, and more.";
    }
  } else if (category === "faculty") {
    results = facultyResults;
    description = "Search across faculty name, department, specialization, assigned syllabi, and handled sections.";
  } else if (category === "instruction") {
    results = instructionResults;
    description = "Search across curriculum (track, year level, term, course code/title) plus assigned faculty.";
  } else {
    results = schedulingResults;
    description = "Search across schedules (course, section, faculty, time, room, lab).";
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <h1 className="pageTitle">Comprehensive Search & Reports</h1>

        <div className="searchLayout">
          <div className="searchControlsCard">
            <h3>Search Profiles</h3>
            <p className="mutedText">{description}</p>

            <div className="filtersRow" style={{ marginBottom: 10 }}>
              <div className="filterField">
                <span>Category</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setMode("free");
                    setQuery("");
                  }}
                >
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="instruction">Instruction</option>
                  <option value="scheduling">Scheduling</option>
                </select>
              </div>
            </div>

            <div className="searchInputRow">
              <input
                className="searchBar wide"
                placeholder="Search by name, course, section, year, skill, or affiliation"
                value={query}
                onChange={(e) => {
                  if (category === "students") setMode("free");
                  setQuery(e.target.value);
                }}
              />
            </div>

            {category === "students" && (
              <div className="quickFilters">
                <span>Quick reports:</span>
                <button
                  type="button"
                  className={mode === "basketball" ? "chip activeChip" : "chip"}
                  onClick={() => setMode("basketball")}
                >
                  Basketball try-outs
                </button>
                <button
                  type="button"
                  className={mode === "programming" ? "chip activeChip" : "chip"}
                  onClick={() => setMode("programming")}
                >
                  Programming contest
                </button>
              </div>
            )}

            <div className="quickFilters" style={{ marginTop: 10 }}>
              <span>Download:</span>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  if (category === "students") {
                    downloadCsv(
                      "students-report.csv",
                      ["studentNo", "name", "course", "year", "section", "skills", "affiliations", "violations"],
                      results.map((s) => ({
                        studentNo: s.studentNo || "",
                        name: s.name || "",
                        course: s.course || "",
                        year: s.year || "",
                        section: s.section || "",
                        skills: (s.skills || []).join("; "),
                        affiliations: (s.affiliations || []).join("; "),
                        violations: (s.violations || []).join("; "),
                      }))
                    );
                  } else if (category === "faculty") {
                    downloadCsv(
                      "faculty-report.csv",
                      ["name", "department", "specialization", "sectionsHandled", "syllabiHandled"],
                      results.map((f) => ({
                        name: f.name || "",
                        department: f.department || "",
                        specialization: f.specialization || "",
                        sectionsHandled: (f.sectionsHandled || []).join("; "),
                        syllabiHandled: (f.syllabusHandled || [])
                          .map((id) => syllabusById.get(id))
                          .filter(Boolean)
                          .map((s) => `${s.code} - ${s.title}`)
                          .join("; "),
                      }))
                    );
                  } else if (category === "instruction") {
                    downloadCsv(
                      "instruction-report.csv",
                      ["track", "yearLevel", "term", "code", "title", "faculty"],
                      results
                    );
                  } else {
                    downloadCsv(
                      "scheduling-report.csv",
                      ["course", "section", "faculty", "time", "room", "lab"],
                      results.map((s) => ({
                        course: s.course || "",
                        section: s.section || "",
                        faculty: s.faculty || "",
                        time: s.time || "",
                        room: s.room || "",
                        lab: s.lab || "",
                      }))
                    );
                  }
                }}
              >
                Download CSV
              </button>
            </div>
          </div>

          <div className="resultsCard">
            <h3>Results ({results.length})</h3>
            {results.length === 0 && (
              <p className="mutedText">
                No matching students. Type a query or choose a quick report.
              </p>
            )}

            <div className="resultsList">
              {category === "students" &&
                results.map((s) => (
                  <div key={s.id} className="studentCard">
                    <h3>{s.name}</h3>
                    <p>
                      <strong>Course:</strong> {s.course} ({s.year}) – {s.section}
                    </p>
                    <p>
                      <strong>Skills:</strong> {s.skills.join(", ")}
                    </p>
                    <p>
                      <strong>Affiliations:</strong>{" "}
                      {s.affiliations.length ? s.affiliations.join(", ") : "None"}
                    </p>
                    <p>
                      <strong>Violations:</strong>{" "}
                      {s.violations && s.violations.length
                        ? s.violations.join(", ")
                        : "None"}
                    </p>
                  </div>
                ))}

              {category === "faculty" &&
                results.map((f) => (
                  <div key={f.id} className="studentCard">
                    <h3>{f.name}</h3>
                    <p>
                      <strong>Department:</strong> {f.department}
                    </p>
                    <p>
                      <strong>Specialization:</strong> {f.specialization || "-"}
                    </p>
                    <p>
                      <strong>Sections:</strong>{" "}
                      {f.sectionsHandled?.length ? f.sectionsHandled.join(", ") : "None"}
                    </p>
                  </div>
                ))}

              {category === "instruction" &&
                results.map((r) => (
                  <div key={r.id} className="studentCard">
                    <h3>
                      {r.code} - {r.title}
                    </h3>
                    <p>
                      <strong>Track:</strong> {r.track} | <strong>Year:</strong> {r.yearLevel} |{" "}
                      <strong>Term:</strong> {r.term}
                    </p>
                    <p>
                      <strong>Faculty:</strong> {r.faculty}
                    </p>
                  </div>
                ))}

              {category === "scheduling" &&
                results.map((s) => (
                  <div key={s.id} className="studentCard">
                    <h3>
                      {s.course} - {s.section}
                    </h3>
                    <p>
                      <strong>Faculty:</strong> {s.faculty || "-"}
                    </p>
                    <p>
                      <strong>Time:</strong> {s.time || "-"} | <strong>Room:</strong> {s.room || "-"} |{" "}
                      <strong>Lab:</strong> {s.lab || "-"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;