import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Instruction() {
  const curriculumTracks = [
    {
      program: "BS Computer Science",
      focus: "Algorithms, Software Engineering, Systems Programming",
    },
    {
      program: "BS Information Technology",
      focus: "Web Systems, Networks, IT Infrastructure",
    },
  ];

  const sampleSyllabi = [
    { code: "CS101", title: "Introduction to Programming", term: "1st Sem" },
    { code: "IT210", title: "Web Systems", term: "2nd Sem" },
  ];

  const sampleLessons = [
    { course: "CS101", topic: "Control Structures", type: "Lecture" },
    { course: "IT210", topic: "RESTful APIs", type: "Lab" },
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <h1 className="pageTitle">Instruction</h1>

        <div className="dashboardGrid">
          <div className="infoCard">
            <h3>Curriculum Overview</h3>
            <ul>
              {curriculumTracks.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.program}</strong> – {c.focus}
                </li>
              ))}
            </ul>
          </div>

          <div className="infoCard">
            <h3>Sample Syllabi</h3>
            <ul>
              {sampleSyllabi.map((s) => (
                <li key={s.code}>
                  <strong>{s.code}</strong> – {s.title} ({s.term})
                </li>
              ))}
            </ul>
          </div>

          <div className="infoCard">
            <h3>Lesson Snapshots</h3>
            <ul>
              {sampleLessons.map((l, idx) => (
                <li key={idx}>
                  {l.course}: {l.topic} ({l.type})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Instruction;