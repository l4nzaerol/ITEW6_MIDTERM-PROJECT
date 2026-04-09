import { useState } from "react";
import { useStudents } from "../context/StudentsContext";

function Topbar() {
  const [query, setQuery] = useState("");
  const { students } = useStudents();

  const results = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.course || "").toLowerCase().includes(q) ||
      (s.section || "").toLowerCase().includes(q) ||
      s.skills.join(" ").toLowerCase().includes(q) ||
      s.affiliations.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="topbar">
      <input
        className="searchBar simpleSearch"
        placeholder="Quick search: name, course, section, skill, affiliation"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && (
        <div className="searchResults">
          {results.map((s) => (
            <div key={s.id} className="resultItem">
              <strong>{s.name}</strong>
              <p>
                {s.course} • {s.section} • {s.skills.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Topbar;