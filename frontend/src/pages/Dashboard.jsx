import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Dashboard() {
  // Filters for reports
  const programmingStudents = data.students.filter(s =>
    s.skills.includes("programming")
  );

  const basketballStudents = data.students.filter(s =>
    s.skills.includes("basketball")
  );

  const studentsWithViolations = data.students.filter(s => s.violations.length > 0);
  const studentsNoAffiliation = data.students.filter(s => s.affiliations.length === 0);

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

        <h1 className="pageTitle">Dashboard</h1>

        {/* Top Stat Cards */}
        <div className="cards">
        <div className="card">
            <h4><i className="fas fa-user-graduate"></i> Total Students</h4>
            <p>{data.students.length}</p>
        </div>
        <div className="card">
            <h4><i className="fas fa-chalkboard-teacher"></i> Total Faculty</h4>
            <p>{data.faculty.length}</p>
        </div>
        <div className="card">
            <h4><i className="fas fa-calendar-alt"></i> Total Events</h4>
            <p>{data.events.length}</p>
        </div>
        <div className="card">
            <h4><i className="fas fa-code"></i> Programming Students</h4>
            <p>{programmingStudents.length}</p>
        </div>
        <div className="card">
            <h4><i className="fas fa-basketball-ball"></i> Basketball Players</h4>
            <p>{basketballStudents.length}</p>
        </div>
        </div>

        {/* Main Grid */}
        <div className="dashboardGrid">
          {/* Upcoming Events */}
          <div className="infoCard">
            <h3>Upcoming Events</h3>
            {upcomingEvents.length ? (
              <ul>
                {upcomingEvents.map(ev => (
                  <li key={ev.id}>
                    <strong>{ev.name}</strong> – {new Date(ev.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })} ({ev.type})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No upcoming events.</p>
            )}
          </div>

          {/* Quick Alerts */}
          <div className="infoCard">
            <h3>Quick Alerts</h3>
            <ul>
              <li>{studentsWithViolations.length} students have violations</li>
              <li>{studentsNoAffiliation.length} students without affiliations</li>
              <li>{programmingStudents.length} students ready for programming contests</li>
              <li>{basketballStudents.length} students ready for basketball tryouts</li>
            </ul>
          </div>

          {/* Affiliations Overview */}
          <div className="infoCard">
            <h3>Active Affiliations</h3>
            {allAffiliations.length ? (
              <ul>
                {allAffiliations.map((aff, idx) => (
                  <li key={idx}>{aff}</li>
                ))}
              </ul>
            ) : (
              <p>No active affiliations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;