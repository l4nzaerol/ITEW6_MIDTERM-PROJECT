import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useStudents } from "../context/StudentsContext";

function Search() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("free"); // free | basketball | programming
  const { students } = useStudents();

  const normalize = (value) => value.toLowerCase();

  const allStudents = students;

  const freeResults = allStudents.filter((s) => {
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

  let results = [];
  let description = "";

  if (mode === "basketball") {
    results = basketballEligible;
    description = "Students who qualify for basketball try-outs (basketball skill, no violations).";
  } else if (mode === "programming") {
    results = programmingEligible;
    description = "Students who qualify for programming contests (programming skill, GPA ≤ 1.75).";
  } else {
    results = freeResults;
    description =
      "Search across name, course, section, year, skills, affiliations, and more.";
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

            <div className="searchInputRow">
              <input
                className="searchBar wide"
                placeholder="Search by name, course, section, year, skill, or affiliation"
                value={query}
                onChange={(e) => {
                  setMode("free");
                  setQuery(e.target.value);
                }}
              />
            </div>

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
          </div>

          <div className="resultsCard">
            <h3>Results ({results.length})</h3>
            {results.length === 0 && (
              <p className="mutedText">
                No matching students. Type a query or choose a quick report.
              </p>
            )}

            <div className="resultsList">
              {results.map((s) => (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;