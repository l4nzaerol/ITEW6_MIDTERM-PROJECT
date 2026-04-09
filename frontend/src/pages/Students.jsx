import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useStudents } from "../context/StudentsContext";

const COURSES = ["BSIT", "BSCS"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function formatTitleCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatCourse(course) {
  const c = String(course || "").trim().toUpperCase();
  if (c === "BSIT") return "Bachelor of Science in Information Technology";
  if (c === "BSCS") return "Bachelor of Science in Computer Science";
  return String(course || "").trim() || "-";
}

function splitCommaList(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function Students() {
  const { students, addStudent, deleteStudent, deleteStudentById, updateStudent, updateStudentById } =
    useStudents();

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [onlyWithViolations, setOnlyWithViolations] = useState(false);
  const [skillFilter, setSkillFilter] = useState("all"); // all | programming | basketball
  const [showAdd, setShowAdd] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewingEdit, setIsViewingEdit] = useState(false);
  const [viewForm, setViewForm] = useState({
    studentNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    course: "",
    yearLevel: "",
    section: "",
    skills: "",
    affiliations: "",
    violations: "",
    latestTerm: "",
    latestGpa: "",
    latestStanding: "",
    nonAcademic: "",
  });
  const [newStudent, setNewStudent] = useState({
    studentNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    course: "",
    yearLevel: "",
    section: "",
    skills: "",
    affiliations: "",
    violations: "",
    latestTerm: "",
    latestGpa: "",
    latestStanding: "",
    nonAcademic: "",
  });

  const courses = useMemo(
    () => COURSES,
    []
  );
  const years = useMemo(
    () => YEAR_LEVELS,
    []
  );

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase().trim();

      if (q) {
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          (s.studentNo || "").toLowerCase().includes(q) ||
          (s.course || "").toLowerCase().includes(q) ||
          (s.section || "").toLowerCase().includes(q) ||
          (s.skills || []).join(" ").toLowerCase().includes(q) ||
          (s.affiliations || []).join(" ").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (courseFilter !== "all" && s.course !== courseFilter) return false;
      if (yearFilter !== "all" && s.year !== yearFilter) return false;
      if (onlyWithViolations && (!s.violations || s.violations.length === 0)) {
        return false;
      }

      const hasSkill = (name) =>
        (s.skills || []).some((x) => String(x || "").toLowerCase() === name);

      if (skillFilter === "programming" && !hasSkill("programming")) return false;
      if (skillFilter === "basketball" && !hasSkill("basketball")) return false;

      return true;
    });
  }, [
    students,
    search,
    courseFilter,
    yearFilter,
    onlyWithViolations,
    skillFilter,
  ]);

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const academicHistory = [];
    if (String(newStudent.latestTerm || "").trim()) {
      const gpaNumber =
        newStudent.latestGpa === ""
          ? ""
          : Number.parseFloat(String(newStudent.latestGpa));
      academicHistory.push({
        term: String(newStudent.latestTerm).trim(),
        gpa: Number.isFinite(gpaNumber) ? gpaNumber : "",
        standing: String(newStudent.latestStanding || "").trim(),
      });
    }

    const nonAcademicHistory = String(newStudent.nonAcademic || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [activity, role] = line.split(" - ").map((x) => x?.trim());
        return { activity: activity || line, role: role || "" };
      });

    const name = `${String(newStudent.firstName || "").trim()} ${String(
      newStudent.lastName || ""
    ).trim()}`.trim();

    try {
      await addStudent({
        studentNo: String(newStudent.studentNo || "").trim(),
        firstName: String(newStudent.firstName || "").trim(),
        middleName: String(newStudent.middleName || "").trim(),
        lastName: String(newStudent.lastName || "").trim(),
        name,
        course: newStudent.course,
        yearLevel: newStudent.yearLevel,
        year: newStudent.yearLevel,
        section: newStudent.section,
        skills: splitCommaList(String(newStudent.skills || "")),
        affiliations: splitCommaList(String(newStudent.affiliations || "")),
        violations: splitCommaList(String(newStudent.violations || "")),
        academicHistory,
        nonAcademicHistory,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add student");
      return;
    }

    setNewStudent({
      studentNo: "",
      firstName: "",
      middleName: "",
      lastName: "",
      course: "",
      yearLevel: "",
      section: "",
      skills: "",
      affiliations: "",
      violations: "",
      latestTerm: "",
      latestGpa: "",
      latestStanding: "",
      nonAcademic: "",
    });
    setShowAdd(false);
    setShowAdvanced(false);
  };

  const handleQuickDelete = async (student) => {
    const ok = window.confirm("Delete this student?");
    if (!ok) return;
    try {
      if (student?.studentNo) {
        await deleteStudent(student.studentNo);
      } else if (student?.id !== undefined && student?.id !== null) {
        await deleteStudentById(student.id);
      } else {
        throw new Error("Missing identifiers (studentNo / id).");
      }
      if (
        selectedStudent &&
        (String(selectedStudent.studentNo || "") === String(student?.studentNo || "") ||
          String(selectedStudent.id || "") === String(student?.id || ""))
      ) {
        setSelectedStudent(null);
        setIsViewingEdit(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete student");
    }
  };

  const openView = (student) => {
    setSelectedStudent(student);
    setIsViewingEdit(false);

    const latest = student.academicHistory?.[0];
    const fallbackFirst = student.firstName || (student.name || "").split(" ")[0] || "";
    const fallbackLast = student.lastName || (student.name || "").split(" ").slice(1).join(" ") || "";
    setViewForm({
      studentNo: student.studentNo || "",
      firstName: fallbackFirst,
      middleName: student.middleName || "",
      lastName: fallbackLast,
      course: student.course || "",
      yearLevel: student.year || "",
      section: student.section || "",
      skills: (student.skills || []).join(", "),
      affiliations: (student.affiliations || []).join(", "),
      violations: (student.violations || []).join(", "),
      latestTerm: latest?.term || "",
      latestGpa: latest?.gpa ?? "",
      latestStanding: latest?.standing || "",
      nonAcademic: (student.nonAcademicHistory || [])
        .map((x) => `${x.activity}${x.role ? ` - ${x.role}` : ""}`)
        .join("\n"),
    });
  };

  const handleViewSave = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const academicHistory = [];
    if (String(viewForm.latestTerm || "").trim()) {
      const gpaNumber =
        viewForm.latestGpa === ""
          ? ""
          : Number.parseFloat(String(viewForm.latestGpa));
      academicHistory.push({
        term: String(viewForm.latestTerm).trim(),
        gpa: Number.isFinite(gpaNumber) ? gpaNumber : "",
        standing: String(viewForm.latestStanding || "").trim(),
      });
    }

    const nonAcademicHistory = String(viewForm.nonAcademic || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [activity, role] = line.split(" - ").map((x) => x?.trim());
        return { activity: activity || line, role: role || "" };
      });

    const name = `${String(viewForm.firstName || "").trim()} ${String(
      viewForm.lastName || ""
    ).trim()}`.trim();

    const updates = {
      studentNo: String(viewForm.studentNo || "").trim(),
      firstName: String(viewForm.firstName || "").trim(),
      middleName: String(viewForm.middleName || "").trim(),
      lastName: String(viewForm.lastName || "").trim(),
      name,
      course: String(viewForm.course || "").trim(),
      yearLevel: String(viewForm.yearLevel || "").trim(),
      year: String(viewForm.yearLevel || "").trim(),
      section: String(viewForm.section || "").trim(),
      skills: splitCommaList(String(viewForm.skills || "")),
      affiliations: splitCommaList(String(viewForm.affiliations || "")),
      violations: splitCommaList(String(viewForm.violations || "")),
      academicHistory,
      nonAcademicHistory,
    };

    const updated = selectedStudent.studentNo
      ? await updateStudent(selectedStudent.studentNo, updates)
      : await updateStudentById(selectedStudent.id, updates);

    if (updated) setSelectedStudent(updated);
    setIsViewingEdit(false);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsTopRow">
          <div className="studentsHeader">
            <h1 className="pageTitle">Students Dashboard</h1>
            <p className="mutedText">
              Manage CCS student profiles, violations, and eligibility reports.
            </p>
          </div>

          <div className="studentsToolbar">
            <input
              className="searchBar studentsSearch"
              type="text"
              placeholder="Search: student no, name, course, section, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="chip addPrimaryBtn"
              onClick={() => setShowAdd(true)}
            >
              + Add Student
            </button>
          </div>
        </div>

        <Modal
          title="Add Student Profile"
          isOpen={showAdd}
          onClose={() => {
            setShowAdd(false);
            setShowAdvanced(false);
          }}
        >
          <form onSubmit={handleAddStudent} className="modalForm">
            <div className="modalFormSection">
              <div className="modalFormHint">
                Required fields: First Name and Last Name.
              </div>

              <div className="formGrid">
              <label>
                <span>Student No.</span>
                <input
                  required
                  placeholder="ex: 2026-0001"
                  value={newStudent.studentNo}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, studentNo: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>First Name</span>
                <input
                  required
                  value={newStudent.firstName}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Middle Name (optional)</span>
                <input
                  value={newStudent.middleName}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, middleName: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Last Name</span>
                <input
                  required
                  value={newStudent.lastName}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </label>

              <label>
                <span>Course</span>
                <select
                  value={newStudent.course}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, course: e.target.value }))
                  }
                >
                  <option value="">Select course</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Year Level</span>
                <select
                  value={newStudent.yearLevel}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, yearLevel: e.target.value }))
                  }
                >
                  <option value="">Select year level</option>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Section</span>
                <input
                  placeholder="ex: CS2A"
                  value={newStudent.section}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, section: e.target.value }))
                  }
                />
              </label>
            </div>
            </div>

            <div className="modalFormFooter">
              <button
                type="button"
                className={showAdvanced ? "chip activeChip" : "chip"}
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide profile details" : "Add profile details"}
              </button>
            </div>

            {showAdvanced && (
              <div className="modalFormSection">
                <div className="formGrid">
                  <label className="span2">
                    <span>Skills (comma-separated)</span>
                    <input
                      value={newStudent.skills}
                      onChange={(e) =>
                        setNewStudent((p) => ({ ...p, skills: e.target.value }))
                      }
                    />
                  </label>
                  <label className="span2">
                    <span>Affiliations (comma-separated)</span>
                    <input
                      value={newStudent.affiliations}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          affiliations: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="span2">
                    <span>Violations (comma-separated)</span>
                    <input
                      value={newStudent.violations}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          violations: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Latest Term</span>
                    <input
                      value={newStudent.latestTerm}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          latestTerm: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Latest GPA</span>
                    <input
                      value={newStudent.latestGpa}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          latestGpa: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Standing</span>
                    <input
                      value={newStudent.latestStanding}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          latestStanding: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="span2">
                    <span>Non-academic Activities (one per line: Activity - Role)</span>
                    <textarea
                      rows={5}
                      value={newStudent.nonAcademic}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          nonAcademic: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="modalActions">
              <button type="submit" className="primaryBtn">
                Save Student
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          title={selectedStudent ? selectedStudent.name : "Student Profile"}
          isOpen={Boolean(selectedStudent)}
          onClose={() => {
            setSelectedStudent(null);
            setIsViewingEdit(false);
          }}
        >
          {!selectedStudent ? null : !isViewingEdit ? (
            <div className="profileModal">
              <div className="profileModalTop">
                <div className="profileMeta">
                  <div className="profileName">{selectedStudent.name}</div>
                  <div className="profileSub">
                    {selectedStudent.studentNo ? `Student No: ${selectedStudent.studentNo}` : "Student No: -"}
                    {" • "}
                    {selectedStudent.course || "-"}
                    {" • "}
                    {selectedStudent.year || "-"}
                    {" • "}
                    {selectedStudent.section || "-"}
                  </div>
                </div>
                <div className="profileModalActions">
                  <button type="button" className="chip" onClick={() => setIsViewingEdit(true)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="chip dangerChip"
                    onClick={() => {
                      handleQuickDelete(selectedStudent);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="profileCardsGrid">
                <div className="profileCard">
                  <div className="profileCardTitle">Skills</div>
                  <div className="profileCardBody">
                    {selectedStudent.skills?.length
                      ? selectedStudent.skills.map(formatTitleCase).join(", ")
                      : "-"}
                  </div>
                </div>
                <div className="profileCard">
                  <div className="profileCardTitle">Affiliations</div>
                  <div className="profileCardBody">
                    {selectedStudent.affiliations?.length ? selectedStudent.affiliations.join(", ") : "-"}
                  </div>
                </div>
                <div className="profileCard">
                  <div className="profileCardTitle">Violations</div>
                  <div className="profileCardBody">
                    {selectedStudent.violations?.length ? selectedStudent.violations.join(", ") : "-"}
                  </div>
                </div>
                <div className="profileCard span2">
                  <div className="profileCardTitle">Academic History</div>
                  <div className="profileCardBody">
                    {selectedStudent.academicHistory?.length ? (
                      <ul className="compactList">
                        {selectedStudent.academicHistory.map((rec, idx) => (
                          <li key={idx}>
                            {rec.term} — GPA {rec.gpa} {rec.standing ? `(${rec.standing})` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div className="profileCard span2">
                  <div className="profileCardTitle">Non-academic Activities</div>
                  <div className="profileCardBody">
                    {selectedStudent.nonAcademicHistory?.length ? (
                      <ul className="compactList">
                        {selectedStudent.nonAcademicHistory.map((rec, idx) => (
                          <li key={idx}>
                            {rec.activity} {rec.role ? `— ${rec.role}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleViewSave} className="modalForm">
              <div className="profileModalTop">
                <div className="profileMeta">
                  <div className="profileName">
                    {String(viewForm.firstName || "").trim()}{" "}
                    {String(viewForm.lastName || "").trim()}
                  </div>
                  <div className="profileSub">
                    Student No: {viewForm.studentNo ? viewForm.studentNo : "-"}
                  </div>
                </div>
                <div className="profileModalActions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setIsViewingEdit(false)}
                  >
                    Back to view
                  </button>
                </div>
              </div>

              <div className="modalFormSection">
                <div className="modalFormHint">Edit student profile details.</div>
                <div className="formGrid">
                  <label>
                    <span>Student No.</span>
                    <input
                      value={viewForm.studentNo}
                      onChange={(e) => setViewForm((p) => ({ ...p, studentNo: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>First Name</span>
                    <input
                      required
                      value={viewForm.firstName}
                      onChange={(e) => setViewForm((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Middle Name</span>
                    <input
                      value={viewForm.middleName}
                      onChange={(e) => setViewForm((p) => ({ ...p, middleName: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Last Name</span>
                    <input
                      required
                      value={viewForm.lastName}
                      onChange={(e) => setViewForm((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Course</span>
                    <select
                      value={viewForm.course}
                      onChange={(e) =>
                        setViewForm((p) => ({ ...p, course: e.target.value }))
                      }
                    >
                      <option value="">Select course</option>
                      {COURSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Year Level</span>
                    <select
                      value={viewForm.yearLevel}
                      onChange={(e) =>
                        setViewForm((p) => ({ ...p, yearLevel: e.target.value }))
                      }
                    >
                      <option value="">Select year level</option>
                      {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Section</span>
                    <input
                      value={viewForm.section}
                      onChange={(e) => setViewForm((p) => ({ ...p, section: e.target.value }))}
                    />
                  </label>

                  <label className="span2">
                    <span>Skills (comma-separated)</span>
                    <input
                      value={viewForm.skills}
                      onChange={(e) => setViewForm((p) => ({ ...p, skills: e.target.value }))}
                    />
                  </label>
                  <label className="span2">
                    <span>Affiliations (comma-separated)</span>
                    <input
                      value={viewForm.affiliations}
                      onChange={(e) => setViewForm((p) => ({ ...p, affiliations: e.target.value }))}
                    />
                  </label>
                  <label className="span2">
                    <span>Violations (comma-separated)</span>
                    <input
                      value={viewForm.violations}
                      onChange={(e) => setViewForm((p) => ({ ...p, violations: e.target.value }))}
                    />
                  </label>

                  <label>
                    <span>Latest Term</span>
                    <input
                      value={viewForm.latestTerm}
                      onChange={(e) => setViewForm((p) => ({ ...p, latestTerm: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Latest GPA</span>
                    <input
                      value={viewForm.latestGpa}
                      onChange={(e) => setViewForm((p) => ({ ...p, latestGpa: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Standing</span>
                    <input
                      value={viewForm.latestStanding}
                      onChange={(e) => setViewForm((p) => ({ ...p, latestStanding: e.target.value }))}
                    />
                  </label>

                  <label className="span2">
                    <span>Non-academic Activities (one per line: Activity - Role)</span>
                    <textarea
                      rows={5}
                      value={viewForm.nonAcademic}
                      onChange={(e) => setViewForm((p) => ({ ...p, nonAcademic: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="modalActions">
                <button type="submit" className="primaryBtn">
                  Save Changes
                </button>
                <button type="button" className="chip" onClick={() => setIsViewingEdit(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>

        <div className="filtersRow">
          <div className="filterField">
            <label>
              <span>Course</span>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="all">All</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterField">
            <label>
              <span>Year Level</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterField">
            <span>Skill filter</span>
            <div className="segmented">
              <button
                type="button"
                className={skillFilter === "all" ? "segmentedBtn active" : "segmentedBtn"}
                onClick={() => setSkillFilter("all")}
              >
                All skills
              </button>
              <button
                type="button"
                className={skillFilter === "programming" ? "segmentedBtn active" : "segmentedBtn"}
                onClick={() => setSkillFilter("programming")}
              >
                Programming
              </button>
              <button
                type="button"
                className={skillFilter === "basketball" ? "segmentedBtn active" : "segmentedBtn"}
                onClick={() => setSkillFilter("basketball")}
              >
                Basketball
              </button>
            </div>
          </div>

          <div className="filterField checkboxField">
            <label>
              <input
                type="checkbox"
                checked={onlyWithViolations}
                onChange={(e) => setOnlyWithViolations(e.target.checked)}
              />
              <span>Only students with violations</span>
            </label>
          </div>
        </div>

        <p className="mutedText">
          Showing {filteredStudents.length} of {students.length} students.
        </p>

        <div className="tableShell">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Name</th>
                <th>Course</th>
                <th>Year</th>
                <th>Section</th>
                <th>Skills</th>
                <th>Violations</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <tr key={s.studentNo || s.id || `${s.name}-${idx}`}>
                  <td>{s.studentNo || "-"}</td>
                  <td className="strong">{s.name}</td>
                  <td>{formatCourse(s.course)}</td>
                  <td>{s.year || "-"}</td>
                  <td>{s.section || "-"}</td>
                  <td className="mutedCell">
                    {s.skills?.length ? s.skills.map(formatTitleCase).join(", ") : "-"}
                  </td>
                  <td className="mutedCell">
                    {s.violations?.length ? s.violations.join(", ") : "-"}
                  </td>
                  <td className="right">
                    <div className="rowActions">
                      <button
                        type="button"
                        className="chip"
                        onClick={() => openView(s)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="chip dangerChip"
                        onClick={() => {
                          handleQuickDelete(s);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="emptyCell">
                    No students found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Students;