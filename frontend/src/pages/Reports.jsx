import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";
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

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function compactFacultyCourses(faculty, syllabusById, limit = 8) {
  const courses = (faculty?.syllabusHandled || [])
    .map((id) => syllabusById.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));

  const shown = courses.slice(0, limit);
  const remaining = Math.max(0, courses.length - shown.length);
  return { shown, remaining, total: courses.length };
}

function Reports() {
  const { students } = useStudents();
  const { events } = useEvents();
  const { faculties } = useFaculty();

  const syllabusById = useMemo(() => new Map(SYLLABI.map((s) => [s.id, s])), []);

  const [tab, setTab] = useState("students"); // students | events | faculty | instruction | scheduling
  const [q, setQ] = useState("");

  // Student filters
  const [course, setCourse] = useState("all");
  const [section, setSection] = useState("all");
  const [skill, setSkill] = useState("all");
  const [affiliation, setAffiliation] = useState("all");

  // Event filters
  const [eventType, setEventType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Faculty filters
  const [facultyDept, setFacultyDept] = useState("all");

  // Instruction filters
  const [track, setTrack] = useState("all"); // IT | CS
  const [yearLevel, setYearLevel] = useState("all");
  const [term, setTerm] = useState("all");

  // Scheduling filters
  const [schedSection, setSchedSection] = useState("all");
  const [schedFaculty, setSchedFaculty] = useState("all");

  const schedules = useMemo(() => readSchedules(), []);

  const courseOptions = useMemo(() => {
    const set = new Set();
    (students || []).forEach((s) => {
      if (s.course) set.add(String(s.course).trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const sectionOptions = useMemo(() => {
    const set = new Set();
    (students || []).forEach((s) => {
      if (s.section) set.add(String(s.section).trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const skillOptions = useMemo(() => {
    const set = new Set();
    (students || []).forEach((s) => {
      (s.skills || []).forEach((sk) => {
        const k = normalize(sk);
        if (k) set.add(k);
      });
    });
    return Array.from(set).sort();
  }, [students]);

  const affiliationOptions = useMemo(() => {
    const set = new Set();
    (students || []).forEach((s) => {
      (s.affiliations || []).forEach((a) => {
        const k = String(a || "").trim();
        if (k) set.add(k);
      });
    });
    return Array.from(set).sort();
  }, [students]);

  const eventTypeOptions = useMemo(() => {
    const set = new Set();
    (events || []).forEach((e) => {
      if (e.type) set.add(String(e.type).trim());
    });
    return Array.from(set).sort();
  }, [events]);

  const filteredStudents = useMemo(() => {
    const query = normalize(q);
    return (students || []).filter((s) => {
      if (course !== "all" && String(s.course || "") !== course) return false;
      if (section !== "all" && String(s.section || "") !== section) return false;
      if (skill !== "all") {
        const has = (s.skills || []).some((x) => normalize(x) === skill);
        if (!has) return false;
      }
      if (affiliation !== "all") {
        const has = (s.affiliations || []).some((x) => String(x || "").trim() === affiliation);
        if (!has) return false;
      }
      if (!query) return true;
      const hay =
        `${s.studentNo || ""} ${s.name || ""} ${s.course || ""} ${s.section || ""} ${s.year || ""} ${(s.skills || []).join(" ")} ${(s.affiliations || []).join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [students, q, course, section, skill, affiliation]);

  const deptOptions = useMemo(() => {
    const set = new Set();
    (faculties || []).forEach((f) => {
      if (f.department) set.add(String(f.department).trim());
    });
    return Array.from(set).sort();
  }, [faculties]);

  const filteredFaculty = useMemo(() => {
    const query = normalize(q);
    return (faculties || []).filter((f) => {
      if (facultyDept !== "all" && String(f.department || "") !== facultyDept) return false;
      if (!query) return true;
      const handled = (f.syllabusHandled || [])
        .map((id) => syllabusById.get(id))
        .filter(Boolean)
        .map((s) => `${s.code} ${s.title}`)
        .join(" ");
      const hay = `${f.name || ""} ${f.department || ""} ${f.specialization || ""} ${(f.sectionsHandled || []).join(" ")} ${handled}`.toLowerCase();
      return hay.includes(query);
    });
  }, [faculties, q, facultyDept, syllabusById]);

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

  const instructionYearOptions = useMemo(() => {
    const set = new Set();
    SYLLABI.forEach((s) => set.add(s.yearLevel));
    return Array.from(set).sort();
  }, []);

  const instructionTermOptions = useMemo(() => {
    const set = new Set();
    SYLLABI.forEach((s) => set.add(s.term));
    return Array.from(set).sort();
  }, []);

  const filteredInstruction = useMemo(() => {
    const query = normalize(q);
    return instructionRows.filter((r) => {
      if (track !== "all" && String(r.track) !== track) return false;
      if (yearLevel !== "all" && String(r.yearLevel) !== yearLevel) return false;
      if (term !== "all" && String(r.term) !== term) return false;
      if (!query) return true;
      const hay = `${r.track} ${r.yearLevel} ${r.term} ${r.code} ${r.title} ${r.faculty}`.toLowerCase();
      return hay.includes(query);
    });
  }, [instructionRows, q, track, yearLevel, term]);

  const scheduleSectionOptions = useMemo(() => {
    const set = new Set();
    (schedules || []).forEach((s) => {
      if (s.section) set.add(String(s.section).trim());
    });
    return Array.from(set).sort();
  }, [schedules]);

  const scheduleFacultyOptions = useMemo(() => {
    const set = new Set();
    (schedules || []).forEach((s) => {
      if (s.faculty) set.add(String(s.faculty).trim());
    });
    return Array.from(set).sort();
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const query = normalize(q);
    return (schedules || [])
      .slice()
      .sort((a, b) => String(a.section || "").localeCompare(String(b.section || "")))
      .filter((s) => {
        if (schedSection !== "all" && String(s.section || "") !== schedSection) return false;
        if (schedFaculty !== "all" && String(s.faculty || "") !== schedFaculty) return false;
        if (!query) return true;
        const hay = `${s.course || ""} ${s.section || ""} ${s.faculty || ""} ${s.time || ""} ${s.room || ""} ${s.lab || ""}`.toLowerCase();
        return hay.includes(query);
      });
  }, [schedules, q, schedSection, schedFaculty]);

  const filteredEvents = useMemo(() => {
    const query = normalize(q);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return (events || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter((e) => {
        if (eventType !== "all" && String(e.type || "") !== eventType) return false;
        if (from) {
          const d = e.date ? new Date(e.date) : null;
          if (!d || d < from) return false;
        }
        if (to) {
          const d = e.date ? new Date(e.date) : null;
          if (!d || d > to) return false;
        }
        if (!query) return true;
        const hay = `${e.name || ""} ${e.type || ""} ${e.date || ""}`.toLowerCase();
        return hay.includes(query);
      });
  }, [events, q, eventType, dateFrom, dateTo]);

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsTopRow">
          <div className="studentsHeader">
            <h1 className="pageTitle">Search & Reports</h1>
            <p className="mutedText">
              Filter and generate quick reports across students and events.
            </p>
          </div>

          <div className="studentsToolbar">
            <input
              className="searchBar studentsSearch"
              placeholder="Search across selected tab..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="filtersRow">
          <div className="filterField">
            <span>Category</span>
            <select value={tab} onChange={(e) => setTab(e.target.value)}>
              <option value="students">Students</option>
              <option value="events">Events</option>
              <option value="faculty">Faculty</option>
              <option value="instruction">Instruction</option>
              <option value="scheduling">Scheduling</option>
            </select>
          </div>

          {tab === "students" ? (
            <>
              <div className="filterField">
                <span>Course</span>
                <select value={course} onChange={(e) => setCourse(e.target.value)}>
                  <option value="all">All</option>
                  {courseOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Section</span>
                <select value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="all">All</option>
                  {sectionOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Skill</span>
                <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                  <option value="all">All</option>
                  {skillOptions.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Affiliation</span>
                <select value={affiliation} onChange={(e) => setAffiliation(e.target.value)}>
                  <option value="all">All</option>
                  {affiliationOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : tab === "events" ? (
            <>
              <div className="filterField">
                <span>Type</span>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="all">All</option>
                  {eventTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Date from</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="filterField">
                <span>Date to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          ) : tab === "faculty" ? (
            <>
              <div className="filterField">
                <span>Department</span>
                <select value={facultyDept} onChange={(e) => setFacultyDept(e.target.value)}>
                  <option value="all">All</option>
                  {deptOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : tab === "instruction" ? (
            <>
              <div className="filterField">
                <span>Track</span>
                <select value={track} onChange={(e) => setTrack(e.target.value)}>
                  <option value="all">All</option>
                  <option value="IT">IT</option>
                  <option value="CS">CS</option>
                </select>
              </div>
              <div className="filterField">
                <span>Year level</span>
                <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}>
                  <option value="all">All</option>
                  {instructionYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Term</span>
                <select value={term} onChange={(e) => setTerm(e.target.value)}>
                  <option value="all">All</option>
                  {instructionTermOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="filterField">
                <span>Section</span>
                <select value={schedSection} onChange={(e) => setSchedSection(e.target.value)}>
                  <option value="all">All</option>
                  {scheduleSectionOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filterField">
                <span>Faculty</span>
                <select value={schedFaculty} onChange={(e) => setSchedFaculty(e.target.value)}>
                  <option value="all">All</option>
                  {scheduleFacultyOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="filterField">
            <span>Actions</span>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQ("");
                setCourse("all");
                setSection("all");
                setSkill("all");
                setAffiliation("all");
                setEventType("all");
                setDateFrom("");
                setDateTo("");
                setFacultyDept("all");
                setTrack("all");
                setYearLevel("all");
                setTerm("all");
                setSchedSection("all");
                setSchedFaculty("all");
              }}
            >
              Clear filters
            </button>
            <button
              type="button"
              className="chip"
              style={{ marginLeft: 8 }}
              onClick={() => {
                if (tab === "students") {
                  downloadCsv(
                    "students-report.csv",
                    ["studentNo", "name", "course", "year", "section", "skills", "affiliations"],
                    filteredStudents.map((s) => ({
                      studentNo: s.studentNo || "",
                      name: s.name || "",
                      course: s.course || "",
                      year: s.year || "",
                      section: s.section || "",
                      skills: (s.skills || []).join("; "),
                      affiliations: (s.affiliations || []).join("; "),
                    }))
                  );
                } else if (tab === "events") {
                  downloadCsv(
                    "events-report.csv",
                    ["date", "name", "type"],
                    filteredEvents.map((e) => ({
                      date: e.date || "",
                      name: e.name || "",
                      type: e.type || "",
                    }))
                  );
                } else if (tab === "faculty") {
                  const syllabusById = new Map(SYLLABI.map((s) => [s.id, s]));
                  downloadCsv(
                    "faculty-report.csv",
                    ["name", "department", "specialization", "sectionsHandled", "syllabiHandled"],
                    filteredFaculty.map((f) => ({
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
                } else if (tab === "instruction") {
                  downloadCsv(
                    "instruction-report.csv",
                    ["track", "yearLevel", "term", "code", "title", "faculty"],
                    filteredInstruction
                  );
                } else {
                  downloadCsv(
                    "scheduling-report.csv",
                    ["course", "section", "faculty", "time", "room", "lab"],
                    filteredSchedules.map((s) => ({
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

        {tab === "students" ? (
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Student results</h3>
              <span className="dashBadge">{filteredStudents.length} found</span>
            </div>
            <div className="tableShell">
              <table className="dataTable" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Student No.</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Skills</th>
                    <th>Affiliations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.studentNo || s.id}>
                      <td>{s.studentNo || "-"}</td>
                      <td className="strong">{s.name}</td>
                      <td>{s.course || "-"}</td>
                      <td>{s.year || "-"}</td>
                      <td>{s.section || "-"}</td>
                      <td className="mutedCell">
                        {s.skills?.length ? s.skills.map(titleCase).join(", ") : "-"}
                      </td>
                      <td className="mutedCell">
                        {s.affiliations?.length ? s.affiliations.join(", ") : "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td className="emptyCell" colSpan={7}>
                        No matching students for these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "events" ? (
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Event results</h3>
              <span className="dashBadge">{filteredEvents.length} found</span>
            </div>
            <div className="tableShell">
              <table className="dataTable" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date || "-"}</td>
                      <td className="strong">{e.name}</td>
                      <td>{e.type}</td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td className="emptyCell" colSpan={3}>
                        No matching events for these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "faculty" ? (
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Faculty results</h3>
              <span className="dashBadge">{filteredFaculty.length} found</span>
            </div>
            <div className="tableShell">
              <table className="dataTable" style={{ minWidth: 1120 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Specialization</th>
                    <th>Sections handled</th>
                    <th>Courses handled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => {
                    const { shown, remaining, total } = compactFacultyCourses(f, syllabusById);
                    return (
                      <tr key={f.id}>
                        <td className="strong">{f.name}</td>
                        <td>{f.department || "-"}</td>
                        <td>{f.specialization || "-"}</td>
                        <td className="mutedCell">
                          {f.sectionsHandled?.length ? f.sectionsHandled.join(", ") : "-"}
                        </td>
                        <td className="mutedCell">
                          {total ? (
                            <div className="dashChips" style={{ gap: 6 }}>
                              {shown.map((c) => (
                                <span key={c.id} className="dashChip" style={{ padding: "6px 9px" }}>
                                  <span className="dashChipName">{c.code}</span>
                                  <span className="dashChipCount">{c.yearLevel}</span>
                                </span>
                              ))}
                              {remaining > 0 && (
                                <span className="dashChip" style={{ padding: "6px 9px" }}>
                                  <span className="dashChipName">+{remaining}</span>
                                  <span className="dashChipCount">more</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFaculty.length === 0 && (
                    <tr>
                      <td className="emptyCell" colSpan={5}>
                        No matching faculty for these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "instruction" ? (
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Instruction results</h3>
              <span className="dashBadge">{filteredInstruction.length} found</span>
            </div>
            <div className="tableShell">
              <table className="dataTable" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Track</th>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Course</th>
                    <th>Title</th>
                    <th>Assigned faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstruction.map((r) => (
                    <tr key={r.id}>
                      <td>{r.track}</td>
                      <td>{r.yearLevel}</td>
                      <td>{r.term}</td>
                      <td className="strong">{r.code}</td>
                      <td>{r.title}</td>
                      <td className="mutedCell">{r.faculty}</td>
                    </tr>
                  ))}
                  {filteredInstruction.length === 0 && (
                    <tr>
                      <td className="emptyCell" colSpan={6}>
                        No matching instruction rows for these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Scheduling results</h3>
              <span className="dashBadge">{filteredSchedules.length} found</span>
            </div>
            <div className="tableShell">
              <table className="dataTable" style={{ minWidth: 940 }}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Faculty</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Lab</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((s) => (
                    <tr key={s.id}>
                      <td className="strong">{s.course}</td>
                      <td>{s.section}</td>
                      <td>{s.faculty || "-"}</td>
                      <td>{s.time || "-"}</td>
                      <td>{s.room || "-"}</td>
                      <td>{s.lab || "-"}</td>
                    </tr>
                  ))}
                  {filteredSchedules.length === 0 && (
                    <tr>
                      <td className="emptyCell" colSpan={6}>
                        No matching schedules for these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;

