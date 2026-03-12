import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Students() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [onlyWithViolations, setOnlyWithViolations] = useState(false);
  const [eligibilityFilter, setEligibilityFilter] = useState("all"); // all | programming | basketball

  const courses = useMemo(
    () => Array.from(new Set(data.students.map((s) => s.course).filter(Boolean))),
    []
  );
  const years = useMemo(
    () => Array.from(new Set(data.students.map((s) => s.year).filter(Boolean))),
    []
  );

  const filteredStudents = useMemo(() => {
    return data.students.filter((s) => {
      const q = search.toLowerCase().trim();

      if (q) {
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          (s.course || "").toLowerCase().includes(q) ||
          (s.section || "").toLowerCase().includes(q) ||
          (s.skills || []).join(" ").toLowerCase().includes(q) ||
          (s.affiliations || []).join(" ").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (courseFilter !== "all" && s.course !== courseFilter) return false;
      if (yearFilter !== "all" && s.year !== yearFilter) return false;
      if (onlyWithViolations && (!s.violations || s.violations.length === 0))
        return false;

      const firstTerm = s.academicHistory && s.academicHistory[0];
      const isProgrammingEligible =
        s.skills.includes("programming") && firstTerm && firstTerm.gpa <= 1.75;
      const isBasketballEligible =
        s.skills.includes("basketball") &&
        (!s.violations || s.violations.length === 0);

      if (eligibilityFilter === "programming" && !isProgrammingEligible) {
        return false;
      }
      if (eligibilityFilter === "basketball" && !isBasketballEligible) {
        return false;
      }

      return true;
    });
  }, [search, courseFilter, yearFilter, onlyWithViolations, eligibilityFilter]);

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <h1 className="pageTitle">Student Information</h1>

        <div className="filtersRow">
          <div className="filterField">
            <label>
              <span>Search</span>
              <input
                type="text"
                placeholder="Name, course, section, skill, affiliation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="filterField">
            <label>
              <span>Course</span>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="all">All</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterField">
            <label>
              <span>Year Level</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterField">
            <span>Eligibility</span>
            <div className="quickFilters">
              <button
                type="button"
                className={
                  eligibilityFilter === "all" ? "chip activeChip" : "chip"
                }
                onClick={() => setEligibilityFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={
                  eligibilityFilter === "programming"
                    ? "chip activeChip"
                    : "chip"
                }
                onClick={() => setEligibilityFilter("programming")}
              >
                Programming contest
              </button>
              <button
                type="button"
                className={
                  eligibilityFilter === "basketball"
                    ? "chip activeChip"
                    : "chip"
                }
                onClick={() => setEligibilityFilter("basketball")}
              >
                Basketball try-outs
              </button>
            </div>
          </div>

          <div className="filterField checkboxField">
            <label>
              <input
                type="checkbox"
                checked={onlyWithViolations}
                onChange={(e) => setOnlyWithViolations(e.target.checked)}
              />
              <span>Show only students with violations</span>
            </label>
          </div>
        </div>

        <p className="mutedText">
          Showing {filteredStudents.length} of {data.students.length} profiled
          students.
        </p>

        {filteredStudents.map((s) => (
          <div className="studentCard" key={s.id}>
            <h3>{s.name}</h3>
            <p>
              <strong>Course / Year / Section:</strong> {s.course} – {s.year} (
              {s.section})
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

            {s.academicHistory && s.academicHistory.length > 0 && (
              <div className="historySection">
                <strong>Academic History:</strong>
                <ul>
                  {s.academicHistory.map((rec, idx) => (
                    <li key={idx}>
                      {rec.term} – GPA {rec.gpa} ({rec.standing})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {s.nonAcademicHistory && s.nonAcademicHistory.length > 0 && (
              <div className="historySection">
                <strong>Non-academic Participation:</strong>
                <ul>
                  {s.nonAcademicHistory.map((rec, idx) => (
                    <li key={idx}>
                      {rec.activity} – {rec.role}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Students;