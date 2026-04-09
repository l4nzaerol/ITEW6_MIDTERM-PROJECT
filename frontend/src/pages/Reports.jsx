import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";

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

function Reports() {
  const { students } = useStudents();
  const { events } = useEvents();

  const [tab, setTab] = useState("students"); // students | events
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
            <div className="segmented">
              <button
                type="button"
                className={tab === "students" ? "segmentedBtn active" : "segmentedBtn"}
                onClick={() => setTab("students")}
              >
                Students
              </button>
              <button
                type="button"
                className={tab === "events" ? "segmentedBtn active" : "segmentedBtn"}
                onClick={() => setTab("events")}
              >
                Events
              </button>
            </div>
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
          ) : (
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
              }}
            >
              Clear filters
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
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default Reports;

