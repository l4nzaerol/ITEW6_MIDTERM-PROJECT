import Sidebar from "../components/Sidebar";
import data from "../data/mockData";

function Faculty() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsHeader">
          <h1 className="pageTitle">Faculty</h1>
          <p className="mutedText">Department list and teaching specializations.</p>
        </div>

        <div className="studentsGrid">
          {data.faculty.map((f) => (
            <div key={f.id} className="dashPanel">
              <div className="dashPanelHeader">
                <h3>{f.name}</h3>
                <span className="dashBadge">{f.department}</span>
              </div>
              <div className="infoItemMeta">
                <strong>Specialization:</strong> {f.specialization}
              </div>
              {f.coursesHandled && f.coursesHandled.length > 0 && (
                <div className="dashChips" style={{ marginTop: 10 }}>
                  {f.coursesHandled.map((c) => (
                    <span key={c} className="dashChip">
                      <span className="dashChipName">{c}</span>
                      <span className="dashChipCount">Course</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Faculty;