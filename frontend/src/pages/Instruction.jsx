import Sidebar from "../components/Sidebar";
import { CURRICULUM, SYLLABI, useFaculty } from "../context/FacultyContext";

function Instruction() {
  const { faculties } = useFaculty();
  const tracks = [
    { key: "IT", label: "Information Technology" },
    { key: "CS", label: "Computer Science" },
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsHeader">
          <h1 className="pageTitle">Instruction</h1>
          <p className="mutedText">
            Organized syllabus list by year with assigned faculty per course.
          </p>
        </div>

        <div className="dashStack">
          {tracks.map((track) => (
            <div key={track.key} className="dashPanel">
              <div className="dashPanelHeader">
                <h3>{track.label} Curriculum</h3>
                <span className="dashBadge">
                  {SYLLABI.filter((s) => s.track === track.key).length} courses
                </span>
              </div>

              {Object.entries(CURRICULUM[track.key] || {}).map(([yearLevel, sems]) => (
                <div key={`${track.key}-${yearLevel}`} className="modalFormSection" style={{ marginBottom: 10 }}>
                  <div className="infoItemTitle">{yearLevel}</div>
                  {Object.entries(sems).map(([term, courses]) => (
                    <div key={`${track.key}-${yearLevel}-${term}`} style={{ marginTop: 8 }}>
                      <div className="infoItemMeta" style={{ marginBottom: 4 }}>
                        <strong>{term}</strong>
                      </div>
                      <ul className="compactList">
                        {courses.map(([code, title]) => {
                          const meta = SYLLABI.find(
                            (s) =>
                              s.track === track.key &&
                              s.yearLevel === yearLevel &&
                              s.term === term &&
                              s.code === code
                          );
                          const assigned = faculties
                            .filter((f) => (f.syllabusHandled || []).includes(meta?.id))
                            .map((f) => f.name);
                          return (
                            <li key={`${track.key}-${yearLevel}-${term}-${code}`}>
                              <strong>{code}</strong> - {title}
                              <div className="infoItemMeta">
                                Faculty: {assigned.length ? assigned.join(", ") : "Not assigned"}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Instruction;