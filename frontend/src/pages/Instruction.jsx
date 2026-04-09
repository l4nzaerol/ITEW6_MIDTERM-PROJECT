import Sidebar from "../components/Sidebar";

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
        <div className="studentsHeader">
          <h1 className="pageTitle">Instruction</h1>
          <p className="mutedText">Curriculum overview, syllabi, and lesson snapshots.</p>
        </div>

        <div className="dashboardGrid">
          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Curriculum Overview</h3>
              <span className="dashBadge">{curriculumTracks.length} tracks</span>
            </div>
            <ul className="compactList">
              {curriculumTracks.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.program}</strong> — {c.focus}
                </li>
              ))}
            </ul>
          </div>

          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Sample Syllabi</h3>
              <span className="dashBadge">{sampleSyllabi.length} items</span>
            </div>
            <ul className="compactList">
              {sampleSyllabi.map((s) => (
                <li key={s.code}>
                  <strong>{s.code}</strong> — {s.title} <span className="mutedText">({s.term})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dashPanel">
            <div className="dashPanelHeader">
              <h3>Lesson Snapshots</h3>
              <span className="dashBadge">{sampleLessons.length} lessons</span>
            </div>
            <ul className="compactList">
              {sampleLessons.map((l, idx) => (
                <li key={idx}>
                  <strong>{l.course}</strong> — {l.topic} <span className="mutedText">({l.type})</span>
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