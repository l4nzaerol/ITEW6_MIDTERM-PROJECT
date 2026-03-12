import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Dashboard() {
  const programmingStudents = data.students.filter((s) =>
    s.skills.includes("programming")
  );

  const basketballStudents = data.students.filter((s) =>
    s.skills.includes("basketball")
  );

  const studentsWithViolations = data.students.filter(
    (s) => s.violations.length > 0
  );
  const studentsNoAffiliation = data.students.filter(
    (s) => s.affiliations.length === 0
  );

  const totalStudents = data.students.length;
  const totalFaculty = data.faculty.length;
  const totalEvents = data.events.length;

  // GPA and eligibility summaries
  const allGrades = data.students.flatMap((s) => s.academicHistory || []);
  const avgGpa = allGrades.length
    ? (allGrades.reduce((sum, rec) => sum + rec.gpa, 0) / allGrades.length).toFixed(2)
    : "N/A";

  const programmingContestEligible = data.students.filter((s) => {
    const hasProgramming = s.skills.includes("programming");
    const term = s.academicHistory && s.academicHistory[0];
    const hasGoodGpa = term ? term.gpa <= 1.75 : false;
    return hasProgramming && hasGoodGpa;
  }).length;

  const basketballTryoutEligible = data.students.filter(
    (s) => s.skills.includes("basketball") && (!s.violations || s.violations.length === 0)
  ).length;

  // Skills distribution
  const skillCounts = {};
  data.students.forEach((s) => {
    (s.skills || []).forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });
  const skillList = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  // Course breakdown
  const courseCounts = {};
  data.students.forEach((s) => {
    if (!s.course) return;
    courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
  });
  const courseList = Object.entries(courseCounts).map(([course, count]) => ({
    course,
    count,
  }));

  // Upcoming events - sorted by date
  const upcomingEvents = data.events
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Active affiliations summary
  const allAffiliations = [...new Set(data.students.flatMap(s => s.affiliations))];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <div className="dashboardHeader">
          <h1 className="pageTitle centeredTitle">CCS Comprehensive Profiling Dashboard</h1>
        </div>

        <div className="cards">
          <div className="card">
            <h4>Total Students</h4>
            <p>{totalStudents}</p>
          </div>
          <div className="card">
            <h4>Total Faculty</h4>
            <p>{totalFaculty}</p>
          </div>
          <div className="card">
            <h4>Total Events</h4>
            <p>{totalEvents}</p>
          </div>
          <div className="card">
            <h4>Avg. GPA (all terms)</h4>
            <p>{avgGpa}</p>
          </div>
          <div className="card">
            <h4>Programming Contest Eligible</h4>
            <p>{programmingContestEligible}</p>
          </div>
        </div>

        <div className="dashboardGrid">
          <div className="infoSection">
            <h3>Upcoming & Alerts</h3>
            {upcomingEvents.length ? (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="infoItem">
                  <div className="infoItemTitle">{ev.name}</div>
                  <div className="infoItemMeta">
                    {new Date(ev.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}{" "}
                    • {ev.type}
                  </div>
                </div>
              ))
            ) : (
              <div className="infoItem">
                <div className="infoItemTitle">No upcoming events</div>
              </div>
            )}

            <div className="infoItem">
              <div className="infoItemTitle">Eligibility & Alerts</div>
              <div className="infoItemMeta">
                {studentsWithViolations.length} with violations •{" "}
                {studentsNoAffiliation.length} without affiliations •{" "}
                {programmingContestEligible} programming-contest ready •{" "}
                {basketballTryoutEligible} basketball try-out ready
              </div>
            </div>
          </div>

          <div className="infoSection">
            <h3>Affiliations & Skills</h3>
            {allAffiliations.map((aff, idx) => (
              <div key={idx} className="infoItem">
                <div className="infoItemTitle">{aff}</div>
                <div className="infoItemMeta">Active student organization / club</div>
              </div>
            ))}

            {skillList.map((s) => (
              <div key={s.skill} className="infoItem">
                <div className="infoItemTitle">{s.skill}</div>
                <div className="infoItemMeta">{s.count} student(s) with this skill</div>
              </div>
            ))}

            {courseList.map((c) => (
              <div key={c.course} className="infoItem">
                <div className="infoItemTitle">{c.course}</div>
                <div className="infoItemMeta">{c.count} student(s) enrolled</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;