import Sidebar from "../components/Sidebar";

function Scheduling() {
  const courseSchedules = [
    {
      course: "CS101",
      section: "CS2A",
      room: "Room 201",
      lab: "Lab 3",
      faculty: "Dr. Maria Smith",
      time: "MWF 9:00–10:00",
    },
    {
      course: "IT210",
      section: "IT3B",
      room: "Room 305",
      lab: "Lab 1",
      faculty: "Prof. Jonathan Johnson",
      time: "TTh 1:00–2:30",
    },
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsHeader">
          <h1 className="pageTitle">Scheduling</h1>
          <p className="mutedText">Course schedules and room assignments.</p>
        </div>

        <div className="scheduleGrid">
          {courseSchedules.map((s, idx) => (
            <div className="scheduleCard" key={idx}>
              <h3>
                {s.course} – {s.section}
              </h3>
              <p>
                <strong>Room:</strong> {s.room}
              </p>
              <p>
                <strong>Lab:</strong> {s.lab}
              </p>
              <p>
                <strong>Faculty:</strong> {s.faculty}
              </p>
              <p>
                <strong>Time:</strong> {s.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Scheduling;