import Sidebar from "../components/Sidebar";
import data from "../data/mockData";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";

function Dashboard() {
  const { students } = useStudents();
  const { events } = useEvents();

  const formatTitleCase = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const formatCourse = (course) => {
    const c = String(course || "").trim().toUpperCase();
    if (c === "BSIT") return "Bachelor of Science in Information Technology";
    if (c === "BSCS") return "Bachelor of Science in Computer Science";
    return String(course || "").trim() || "-";
  };

  const hasSkill = (s, name) =>
    (s.skills || []).some((x) => String(x || "").toLowerCase() === name);

  const totalStudents = students.length;
  const programmingStudents = students.filter((s) => hasSkill(s, "programming"));
  const basketballStudents = students.filter((s) => hasSkill(s, "basketball"));
  const studentsWithViolations = students.filter((s) => (s.violations || []).length > 0);
  const studentsNoAffiliation = students.filter((s) => (s.affiliations || []).length === 0);

  // GPA and eligibility summaries
  const allGrades = students.flatMap((s) => s.academicHistory || []);
  const validGpas = allGrades
    .map((rec) => Number(rec?.gpa))
    .filter((n) => Number.isFinite(n));
  const avgGpa = validGpas.length
    ? (validGpas.reduce((sum, n) => sum + n, 0) / validGpas.length).toFixed(2)
    : "N/A";

  // Skills distribution
  const skillCounts = {};
  students.forEach((s) => {
    (s.skills || []).forEach((skill) => {
      const key = String(skill || "").toLowerCase().trim();
      if (!key) return;
      skillCounts[key] = (skillCounts[key] || 0) + 1;
    });
  });
  const skillList = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  // Course breakdown
  const courseCounts = {};
  students.forEach((s) => {
    if (!s.course) return;
    courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
  });
  const courseList = Object.entries(courseCounts).map(([course, count]) => ({
    course,
    count,
  }));

  // Upcoming events - sorted by date
  const upcomingEvents = (events || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Active affiliations summary
  const allAffiliations = [...new Set(students.flatMap(s => s.affiliations))];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content dashboardContent">
        <div className="dashboardHeader">
          <h1 className="pageTitle centeredTitle">College of Computing Studies Dashboard</h1>
        </div>

        <div className="cards dashboardCards">
          <div className="card statCard">
            <h4>Total Students</h4>
            <p>{totalStudents}</p>
          </div>
          <div className="card statCard">
            <h4>With Violations</h4>
            <p>{studentsWithViolations.length}</p>
          </div>
          <div className="card statCard">
            <h4>No Affiliations</h4>
            <p>{studentsNoAffiliation.length}</p>
          </div>
          <div className="card statCard">
            <h4>Avg. GPA (all terms)</h4>
            <p>{avgGpa}</p>
          </div>
          <div className="card statCard">
            <h4>Total Skills (unique)</h4>
            <p>{skillList.length}</p>
          </div>
        </div>

        <div className="dashboardGrid dashboardGridEnhanced">
          <div className="dashStack">
            <div className="dashPanel infoSection">
              <div className="dashPanelHeader">
                <h3>Upcoming Events</h3>
                <span className="dashBadge">{upcomingEvents.length} upcoming</span>
              </div>
              {upcomingEvents.length ? (
                upcomingEvents.map((ev) => (
                  <div key={ev.id} className="dashRow infoItem">
                    <div className="dashRowTop">
                      <div className="infoItemTitle">{ev.name}</div>
                      <span className="dashPill dashPillEvent">{ev.type}</span>
                    </div>
                    <div className="infoItemMeta">
                      {new Date(ev.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashRow infoItem">
                  <div className="infoItemTitle">No upcoming events</div>
                </div>
              )}
            </div>

            <div className="dashPanel infoSection">
              <div className="dashPanelHeader">
                <h3>Courses</h3>
                <span className="dashBadge">{courseList.length} programs</span>
              </div>
              <div className="dashBars">
                {courseList
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((c) => (
                    <div key={c.course} className="dashBarRow">
                      <div className="dashBarTop">
                        <div className="dashBarLabel">{formatCourse(c.course)}</div>
                        <div className="dashBarValue">{c.count}</div>
                      </div>
                      <div className="dashBarTrack">
                        <div
                          className="dashBarFill"
                          style={{
                            width: `${Math.round(
                              (c.count /
                                Math.max(1, ...courseList.map((x) => x.count))) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="dashStack">
            <div className="dashPanel infoSection">
              <div className="dashPanelHeader">
                <h3>Affiliations</h3>
                <span className="dashBadge">{allAffiliations.length} active</span>
              </div>
              {allAffiliations.length ? (
                allAffiliations.slice(0, 8).map((aff, idx) => (
                  <div key={idx} className="dashRow infoItem dashRowAff">
                    <div className="dashRowTop">
                      <div className="infoItemTitle">{aff}</div>
                      <span className="dashPill dashPillAff">Club</span>
                    </div>
                    <div className="infoItemMeta">Student organization / club</div>
                  </div>
                ))
              ) : (
                <div className="dashRow infoItem dashRowAff">
                  <div className="infoItemTitle">No affiliations recorded</div>
                  <div className="infoItemMeta">Add affiliations in a student profile to populate this section.</div>
                </div>
              )}
            </div>

            <div className="dashPanel infoSection">
              <div className="dashPanelHeader">
                <h3>Skills</h3>
                <span className="dashBadge">{skillList.length} total</span>
              </div>
              <div className="dashChips">
                {skillList.length ? (
                  skillList.slice(0, 12).map((s) => (
                    <div key={s.skill} className="dashChip">
                      <span className="dashChipName">{formatTitleCase(s.skill)}</span>
                      <span className="dashChipCount">{s.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="dashRow infoItem">
                    <div className="infoItemTitle">No skills recorded</div>
                    <div className="infoItemMeta">Add skills to student profiles to populate this section.</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;