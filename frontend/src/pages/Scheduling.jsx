import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { SECTION_OPTIONS, useFaculty } from "../context/FacultyContext";

const STORAGE_KEY = "ccs_schedules_v1";

const DEFAULT_SCHEDULES = [
  {
    id: 1,
    course: "CS101",
    section: "CS2A",
    room: "Room 201",
    lab: "Lab 3",
    faculty: "Dr. Maria Smith",
    time: "MWF 9:00-10:00",
  },
  {
    id: 2,
    course: "IT210",
    section: "IT3B",
    room: "Room 305",
    lab: "Lab 1",
    faculty: "Prof. Jonathan Johnson",
    time: "TTh 1:00-2:30",
  },
];

function readInitialSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SCHEDULES;
}

function Scheduling() {
  const { faculties } = useFaculty();
  const [schedules, setSchedules] = useState(() => readInitialSchedules());
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    course: "",
    section: "IT1A",
    room: "",
    lab: "",
    faculty: "",
    time: "",
  });

  const facultyNames = useMemo(
    () => faculties.map((f) => f.name).sort((a, b) => a.localeCompare(b)),
    [faculties]
  );

  const sortedSchedules = useMemo(
    () => schedules.slice().sort((a, b) => String(a.section).localeCompare(String(b.section))),
    [schedules]
  );

  const groupedByYear = useMemo(() => {
    const buckets = {
      "1st Year": [],
      "2nd Year": [],
      "3rd Year": [],
      "4th Year": [],
    };
    sortedSchedules.forEach((s) => {
      const sec = String(s.section || "");
      const yearNum = sec.match(/[A-Z]{2}([1-4])/i)?.[1];
      const key =
        yearNum === "1"
          ? "1st Year"
          : yearNum === "2"
          ? "2nd Year"
          : yearNum === "3"
          ? "3rd Year"
          : "4th Year";
      buckets[key].push(s);
    });
    return buckets;
  }, [sortedSchedules]);

  const persist = (next) => {
    setSchedules(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      course: "",
      section: "IT1A",
      room: "",
      lab: "",
      faculty: facultyNames[0] || "",
      time: "",
    });
    setShowEditor(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      course: s.course || "",
      section: s.section || "IT1A",
      room: s.room || "",
      lab: s.lab || "",
      faculty: s.faculty || "",
      time: s.time || "",
    });
    setShowEditor(true);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      persist(
        schedules.map((s) =>
          s.id === editingId
            ? { ...s, ...form }
            : s
        )
      );
    } else {
      persist([{ id: Date.now(), ...form }, ...schedules]);
    }
    setShowEditor(false);
    setEditingId(null);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsTopRow">
          <div className="studentsHeader">
            <h1 className="pageTitle">Scheduling</h1>
            <p className="mutedText">Organized schedules by section/year with editable entries.</p>
          </div>
          <div className="studentsToolbar">
            <button type="button" className="chip addPrimaryBtn" onClick={openAdd}>
              + Add Schedule
            </button>
          </div>
        </div>

        <div className="dashPanel">
          <div className="dashPanelHeader">
            <h3>Schedule List</h3>
            <span className="dashBadge">{sortedSchedules.length} total</span>
          </div>
          <div className="tableShell">
            <table className="dataTable" style={{ minWidth: 940 }}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Faculty</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Lab</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedules.map((s) => (
                  <tr key={s.id}>
                    <td className="strong">{s.course}</td>
                    <td>{s.section}</td>
                    <td>{s.faculty || "-"}</td>
                    <td>{s.time || "-"}</td>
                    <td>{s.room || "-"}</td>
                    <td>{s.lab || "-"}</td>
                    <td className="right">
                      <div className="rowActions">
                        <button type="button" className="chip" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="chip dangerChip"
                          onClick={() => {
                            const ok = window.confirm("Delete this schedule?");
                            if (ok) persist(schedules.filter((x) => x.id !== s.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedSchedules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      No schedules yet. Add one to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashPanel" style={{ marginTop: 16 }}>
          <div className="dashPanelHeader">
            <h3>Faculty by Section (1st–4th Year)</h3>
            <span className="dashBadge">{SECTION_OPTIONS.length} sections</span>
          </div>
          <div className="dashBars">
            {SECTION_OPTIONS.map((sec) => {
              const assigned = faculties
                .filter((f) => (f.sectionsHandled || []).includes(sec))
                .map((f) => f.name);
              return (
                <div key={sec} className="dashBarRow">
                  <div className="dashBarTop">
                    <div className="dashBarLabel">{sec}</div>
                    <div className="dashBarValue">{assigned.length} faculty</div>
                  </div>
                  <div className="infoItemMeta">
                    {assigned.length ? assigned.join(", ") : "No faculty assigned"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashPanel" style={{ marginTop: 16 }}>
          <div className="dashPanelHeader">
            <h3>Schedules by Year</h3>
          </div>
          <div className="dashboardGrid">
            {Object.entries(groupedByYear).map(([year, list]) => (
              <div key={year} className="dashPanel">
                <div className="dashPanelHeader">
                  <h3>{year}</h3>
                  <span className="dashBadge">{list.length}</span>
                </div>
                {list.length ? (
                  <ul className="compactList">
                    {list.map((s) => (
                      <li key={`${year}-${s.id}`}>
                        <strong>{s.course}</strong> - {s.section} - {s.time}
                        <div className="infoItemMeta">
                          {s.faculty || "-"} | {s.room || "-"} | {s.lab || "-"}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="infoItemMeta">No schedules.</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        title={editingId ? "Edit Schedule" : "Add Schedule"}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
      >
        <form className="modalForm" onSubmit={onSubmit}>
          <div className="modalFormSection">
            <div className="formGrid">
              <label>
                <span>Course Code</span>
                <input
                  required
                  value={form.course}
                  onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                />
              </label>
              <label>
                <span>Section</span>
                <select
                  value={form.section}
                  onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Faculty</span>
                <select
                  value={form.faculty}
                  onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))}
                >
                  <option value="">Select faculty</option>
                  {facultyNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Time</span>
                <input
                  placeholder="e.g. MWF 9:00-10:00"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                />
              </label>
              <label>
                <span>Room</span>
                <input
                  value={form.room}
                  onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                />
              </label>
              <label>
                <span>Lab</span>
                <input
                  value={form.lab}
                  onChange={(e) => setForm((p) => ({ ...p, lab: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="modalActions">
            <button type="submit" className="primaryBtn">
              Save Schedule
            </button>
            <button type="button" className="chip" onClick={() => setShowEditor(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Scheduling;