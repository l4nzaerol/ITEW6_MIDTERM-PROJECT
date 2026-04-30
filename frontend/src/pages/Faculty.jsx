import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useMemo, useState } from "react";
import { CURRICULUM, SECTION_OPTIONS, SYLLABI, useFaculty } from "../context/FacultyContext";

function Faculty() {
  const { faculties, addFaculty, updateFaculty, removeFaculty } = useFaculty();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
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

  const resetForm = () => {
    setEditingFacultyId(null);
    setForm({
      name: "",
      department: "Information Technology",
      specialization: "",
      syllabusHandled: [],
      sectionsHandled: [],
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (faculty) => {
    setEditingFacultyId(faculty.id);
    setForm({
      name: faculty.name || "",
      department: faculty.department || "Information Technology",
      specialization: faculty.specialization || "",
      syllabusHandled: Array.isArray(faculty.syllabusHandled) ? faculty.syllabusHandled : [],
      sectionsHandled: Array.isArray(faculty.sectionsHandled) ? faculty.sectionsHandled : [],
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFacultyId !== null) {
        await updateFaculty(editingFacultyId, form);
      } else {
        await addFaculty(form);
      }
      closeFormModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save faculty");
    }
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
            <button type="button" className="chip addPrimaryBtn" onClick={openAddModal}>
              + Add Faculty
            </button>
          </div>
        </div>

        <div className="studentsGrid">
          {faculties.map((f) => {
            const handledCourses = (f.syllabusHandled || [])
              .map((id) => syllabusById.get(id))
              .filter(Boolean)
              .sort((a, b) => String(a.code).localeCompare(String(b.code)));

            return (
            <div key={f.id} className="dashPanel facultyCardPanel">
              <div className="facultySimpleHeader">
                <div className="facultyAvatar">{String(f.name || "?").trim().charAt(0).toUpperCase()}</div>
                <div className="facultyNameWrap">
                  <h3>{f.name}</h3>
                  <div className="facultySubline">{f.specialization || "General faculty"}</div>
                </div>
                <span className="dashBadge">{f.department}</span>
              </div>
              <div className="facultyMetaRow">
                <div className="facultyMetaStats">
                  <span className="dashPill soft">
                    {(f.syllabusHandled || []).length} courses
                  </span>
                  <span className="dashPill soft">
                    {(f.sectionsHandled || []).length} sections
                  </span>
                </div>
              </div>

              <div className="facultyBlock">
                <div className="facultyBlockTitle">Handled courses</div>
                {handledCourses.length > 0 ? (
                  <div className="facultySimpleCourses">
                    {handledCourses.map((c) => (
                      <div key={c.id} className="facultySimpleCourseItem">
                        <span className="courseCode">{c.code}</span>
                        <span className="courseTitle">{c.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="emptyHint">No assigned courses yet.</div>
                )}
              </div>

              {f.sectionsHandled?.length > 0 && (
                <div className="facultyBlock">
                  <div className="facultyBlockTitle">Handled sections</div>
                  <div className="facultySimpleSections">
                    {f.sectionsHandled.map((sec) => (
                      <span key={sec} className="facultySectionTag">{sec}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="modalActions" style={{ paddingTop: 8 }}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => openEditModal(f)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="chip dangerChip"
                  onClick={() => {
                    const ok = window.confirm("Remove this faculty?");
                    if (!ok) return;
                    removeFaculty(f.id).catch((e) => {
                      alert(e instanceof Error ? e.message : "Failed to delete faculty");
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )})}
        </div>

        <div className="dashStack" style={{ marginTop: 16 }}>
          {courseFacultyRows.map((group) => (
            <div key={group.track} className="dashPanel">
              <div className="dashPanelHeader">
                <h3>{group.label} - Courses by Year</h3>
              </div>
              {group.years.map((y) => (
                <div key={`${group.track}-${y.yearLevel}`} className="yearBlock">
                  <div className="yearHeader">
                    <span className="dashPill">{y.yearLevel}</span>
                    <span className="dashPill soft">
                      {y.sems.reduce((sum, s) => sum + s.courses.length, 0)} courses
                    </span>
                  </div>

                  <div className="termColumns">
                    {y.sems.map((sem) => (
                      <div key={`${group.track}-${y.yearLevel}-${sem.term}`} className="termColumn">
                        <div className="termHeader">{sem.term}</div>
                        <div className="courseMiniList">
                          {sem.courses.map((c) => (
                            <div key={`${group.track}-${y.yearLevel}-${sem.term}-${c.code}`} className="courseMiniItem">
                              <div className="courseMiniTop">
                                <span className="courseCode">{c.code}</span>
                                <span className="courseTitle">{c.title}</span>
                              </div>
                              <div className="courseMiniMeta">
                                {c.assigned.length ? c.assigned.join(", ") : "Not assigned"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={editingFacultyId !== null ? "Edit Faculty" : "Add Faculty"}
        isOpen={showFormModal}
        onClose={closeFormModal}
      >
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
              {editingFacultyId !== null ? "Save Changes" : "Save Faculty"}
            </button>
            <button type="button" className="chip" onClick={closeFormModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Faculty;