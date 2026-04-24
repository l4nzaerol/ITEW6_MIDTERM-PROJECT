import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useMemo, useState } from "react";
import { CURRICULUM, SECTION_OPTIONS, SYLLABI, useFaculty } from "../context/FacultyContext";

function Faculty() {
  const { faculties, addFaculty, removeFaculty } = useFaculty();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    department: "Information Technology",
    specialization: "",
    syllabusHandled: [],
    sectionsHandled: [],
  });

  const syllabusOptions = useMemo(() => {
    const track = form.department === "Computer Science" ? "CS" : "IT";
    return SYLLABI.filter((s) => s.track === track);
  }, [form.department]);

  const sectionOptions = useMemo(() => {
    const prefix = form.department === "Computer Science" ? "CS" : "IT";
    return SECTION_OPTIONS.filter((s) => s.startsWith(prefix));
  }, [form.department]);

  const toggleFromList = (key, value) => {
    setForm((prev) => {
      const has = prev[key].includes(value);
      return {
        ...prev,
        [key]: has ? prev[key].filter((x) => x !== value) : [...prev[key], value],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addFaculty(form);
    setShowAdd(false);
    setForm({
      name: "",
      department: "Information Technology",
      specialization: "",
      syllabusHandled: [],
      sectionsHandled: [],
    });
  };

  const syllabusById = useMemo(
    () => new Map(SYLLABI.map((s) => [s.id, s])),
    []
  );

  const courseFacultyRows = useMemo(() => {
    return Object.entries(CURRICULUM).map(([track, years]) => ({
      track,
      label: track === "IT" ? "Information Technology" : "Computer Science",
      years: Object.entries(years).map(([yearLevel, sems]) => ({
        yearLevel,
        sems: Object.entries(sems).map(([term, courses]) => ({
          term,
          courses: courses.map(([code, title]) => {
            const meta = SYLLABI.find(
              (x) =>
                x.track === track &&
                x.yearLevel === yearLevel &&
                x.term === term &&
                x.code === code
            );
            const assigned = faculties
              .filter((f) => (f.syllabusHandled || []).includes(meta?.id))
              .map((f) => f.name);
            return { code, title, assigned };
          }),
        })),
      })),
    }));
  }, [faculties]);

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsTopRow">
          <div className="studentsHeader">
            <h1 className="pageTitle">Faculty</h1>
            <p className="mutedText">Add faculty and assign syllabi plus sections (1st to 4th year).</p>
          </div>
          <div className="studentsToolbar">
            <button type="button" className="chip addPrimaryBtn" onClick={() => setShowAdd(true)}>
              + Add Faculty
            </button>
          </div>
        </div>

        <div className="studentsGrid">
          {faculties.map((f) => (
            <div key={f.id} className="dashPanel">
              <div className="dashPanelHeader">
                <h3>{f.name}</h3>
                <span className="dashBadge">{f.department}</span>
              </div>
              <div className="infoItemMeta">
                <strong>Specialization:</strong> {f.specialization}
              </div>
              {f.syllabusHandled && f.syllabusHandled.length > 0 && (
                <div className="dashChips" style={{ marginTop: 10 }}>
                  {f.syllabusHandled.map((sid) => (
                    <span key={sid} className="dashChip">
                      <span className="dashChipName">
                        {syllabusById.get(sid)?.code || sid}
                      </span>
                      <span className="dashChipCount">Syllabus</span>
                    </span>
                  ))}
                </div>
              )}
              {f.sectionsHandled?.length > 0 && (
                <div className="dashChips" style={{ marginTop: 8 }}>
                  {f.sectionsHandled.map((sec) => (
                    <span key={sec} className="dashChip">
                      <span className="dashChipName">{sec}</span>
                      <span className="dashChipCount">Section</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="modalActions" style={{ paddingTop: 8 }}>
                <button
                  type="button"
                  className="chip dangerChip"
                  onClick={() => {
                    const ok = window.confirm("Remove this faculty?");
                    if (ok) removeFaculty(f.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="dashStack" style={{ marginTop: 16 }}>
          {courseFacultyRows.map((group) => (
            <div key={group.track} className="dashPanel">
              <div className="dashPanelHeader">
                <h3>{group.label} - Courses by Year</h3>
              </div>
              {group.years.map((y) => (
                <div key={`${group.track}-${y.yearLevel}`} className="modalFormSection" style={{ marginBottom: 10 }}>
                  <div className="infoItemTitle">{y.yearLevel}</div>
                  {y.sems.map((sem) => (
                    <div key={`${group.track}-${y.yearLevel}-${sem.term}`} style={{ marginTop: 8 }}>
                      <div className="infoItemMeta" style={{ marginBottom: 4 }}>
                        <strong>{sem.term}</strong>
                      </div>
                      <ul className="compactList">
                        {sem.courses.map((c) => (
                          <li key={`${group.track}-${y.yearLevel}-${sem.term}-${c.code}`}>
                            <strong>{c.code}</strong> - {c.title}
                            <div className="infoItemMeta">
                              Faculty: {c.assigned.length ? c.assigned.join(", ") : "Not assigned"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Modal title="Add Faculty" isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="modalFormSection">
            <div className="formGrid">
              <label className="span2">
                <span>Faculty name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label>
                <span>Department</span>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      department: e.target.value,
                      syllabusHandled: [],
                      sectionsHandled: [],
                    }))
                  }
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </label>
              <label>
                <span>Specialization</span>
                <input
                  required
                  value={form.specialization}
                  onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="modalFormSection">
            <div className="modalFormHint">Assign syllabi for selected department.</div>
            <div className="dashChips">
              {syllabusOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={form.syllabusHandled.includes(s.id) ? "chip activeChip" : "chip"}
                  onClick={() => toggleFromList("syllabusHandled", s.id)}
                >
                  {s.code} - {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="modalFormSection">
            <div className="modalFormHint">Assign sections from 1st year to 4th year.</div>
            <div className="dashChips">
              {sectionOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  className={form.sectionsHandled.includes(sec) ? "chip activeChip" : "chip"}
                  onClick={() => toggleFromList("sectionsHandled", sec)}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="modalActions">
            <button type="submit" className="primaryBtn">
              Save Faculty
            </button>
            <button type="button" className="chip" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Faculty;