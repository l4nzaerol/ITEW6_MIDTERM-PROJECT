import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Faculty() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <h1 className="pageTitle">Faculty Information</h1>

        {data.faculty.map((f) => (
          <div key={f.id} className="card">
            <h3>{f.name}</h3>
            <p>
              <strong>Department:</strong> {f.department}
            </p>
            <p>
              <strong>Specialization:</strong> {f.specialization}
            </p>
            {f.coursesHandled && f.coursesHandled.length > 0 && (
              <p>
                <strong>Courses Handled:</strong> {f.coursesHandled.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Faculty;