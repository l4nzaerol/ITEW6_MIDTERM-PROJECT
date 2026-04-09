import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./mysql.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.get("/debug/db", async (_req, res) => {
  try {
    const [[row]] = await pool.query(
      `
      SELECT
        DATABASE() AS dbName,
        @@hostname AS hostName,
        USER() AS userName
      `
    );
    const [[counts]] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN student_no IS NULL OR TRIM(student_no) = '' THEN 1 ELSE 0 END) AS missingStudentNo
      FROM students
      `
    );
    res.json({ connection: row, students: counts });
  } catch (e) {
    res.status(500).json({ message: "Failed to read DB info" });
  }
});

async function ensureStudentNoIntegrity() {
  // Repair legacy rows that were inserted without student_no.
  // We generate a deterministic unique value from student_id.
  try {
    await pool.query(
      `
      UPDATE students
      SET student_no = CONCAT('S-', LPAD(student_id, 6, '0'))
      WHERE student_no IS NULL OR TRIM(student_no) = ''
      `
    );
  } catch (e) {
    // Non-fatal: API can still operate; edit-by-id can fix rows later.
    console.warn("WARN: could not auto-repair blank student_no", e?.message || e);
  }
}

function parseName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Unnamed", last: "Student" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

async function loadStudentChildren(studentIds) {
  if (!studentIds.length) {
    return {
      skills: new Map(),
      affiliations: new Map(),
      violations: new Map(),
      academic: new Map(),
      nonAcademic: new Map(),
    };
  }

  const inClause = studentIds.map(() => "?").join(",");

  const [skills] = await pool.query(
    `
    SELECT ss.student_id, sk.skill_name
    FROM student_skills ss
    JOIN skills sk ON sk.skill_id = ss.skill_id
    WHERE ss.student_id IN (${inClause})
    `,
    studentIds
  );

  const [affiliations] = await pool.query(
    `
    SELECT sa.student_id, a.affiliation_name
    FROM student_affiliations sa
    JOIN affiliations a ON a.affiliation_id = sa.affiliation_id
    WHERE sa.student_id IN (${inClause})
    `,
    studentIds
  );

  const [violations] = await pool.query(
    `
    SELECT student_id, violation_text
    FROM violations
    WHERE student_id IN (${inClause})
    ORDER BY violation_id DESC
    `,
    studentIds
  );

  const [academic] = await pool.query(
    `
    SELECT student_id, term, gpa, standing
    FROM academic_history
    WHERE student_id IN (${inClause})
    ORDER BY academic_id DESC
    `,
    studentIds
  );

  const [nonAcademic] = await pool.query(
    `
    SELECT student_id, activity, role
    FROM non_academic_activities
    WHERE student_id IN (${inClause})
    ORDER BY activity_id DESC
    `,
    studentIds
  );

  const toMap = (rows, keyField, valueField, mapper) => {
    const m = new Map();
    rows.forEach((r) => {
      const k = String(r[keyField]);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(mapper ? mapper(r) : r[valueField]);
    });
    return m;
  };

  return {
    skills: toMap(skills, "student_id", "skill_name"),
    affiliations: toMap(affiliations, "student_id", "affiliation_name"),
    violations: toMap(violations, "student_id", "violation_text"),
    academic: toMap(academic, "student_id", null, (r) => ({
      term: r.term,
      gpa:
        r.gpa === null || r.gpa === undefined || r.gpa === ""
          ? null
          : Number(r.gpa),
      standing: r.standing,
    })),
    nonAcademic: toMap(nonAcademic, "student_id", null, (r) => ({
      activity: r.activity,
      role: r.role,
    })),
  };
}

app.get("/students", async (req, res) => {
  const search = String(req.query.search || "").toLowerCase().trim();
  const course = String(req.query.course || "");
  const year = String(req.query.year || "");
  const skill = String(req.query.skill || "").toLowerCase().trim();
  const affiliation = String(req.query.affiliation || "").toLowerCase().trim();
  const hasViolations = String(req.query.hasViolations || "");
  const eligible = String(req.query.eligible || "all");

  let sql = `
    SELECT DISTINCT st.student_id, st.student_no, st.first_name, st.last_name, st.middle_name,
      st.course, st.year_level, st.section
    FROM students st
    LEFT JOIN student_skills ss ON ss.student_id = st.student_id
    LEFT JOIN skills sk ON sk.skill_id = ss.skill_id
    LEFT JOIN student_affiliations sa ON sa.student_id = st.student_id
    LEFT JOIN affiliations af ON af.affiliation_id = sa.affiliation_id
    LEFT JOIN violations v ON v.student_id = st.student_id
    LEFT JOIN academic_history ah ON ah.student_id = st.student_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (
      LOWER(CONCAT(st.first_name,' ',st.last_name)) LIKE ?
      OR LOWER(st.student_no) LIKE ?
      OR LOWER(st.course) LIKE ?
      OR LOWER(st.section) LIKE ?
      OR LOWER(sk.skill_name) LIKE ?
      OR LOWER(af.affiliation_name) LIKE ?
    )`;
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  if (course) {
    sql += ` AND st.course = ?`;
    params.push(course);
  }
  if (year) {
    sql += ` AND st.year_level = ?`;
    params.push(year);
  }
  if (skill) {
    sql += ` AND LOWER(sk.skill_name) = ?`;
    params.push(skill);
  }
  if (affiliation) {
    sql += ` AND LOWER(af.affiliation_name) LIKE ?`;
    params.push(`%${affiliation}%`);
  }
  if (hasViolations === "true") {
    sql += ` AND v.violation_id IS NOT NULL`;
  }
  if (hasViolations === "false") {
    sql += ` AND v.violation_id IS NULL`;
  }
  if (eligible === "programming") {
    sql += ` AND EXISTS (
      SELECT 1 FROM student_skills xss
      JOIN skills xsk ON xsk.skill_id = xss.skill_id
      WHERE xss.student_id = st.student_id AND LOWER(xsk.skill_name) = 'programming'
    ) AND EXISTS (
      SELECT 1 FROM academic_history xah
      WHERE xah.student_id = st.student_id AND xah.gpa IS NOT NULL AND xah.gpa <= 1.75
    )`;
  }
  if (eligible === "basketball") {
    sql += ` AND EXISTS (
      SELECT 1 FROM student_skills xss
      JOIN skills xsk ON xsk.skill_id = xss.skill_id
      WHERE xss.student_id = st.student_id AND LOWER(xsk.skill_name) = 'basketball'
    ) AND NOT EXISTS (
      SELECT 1 FROM violations xv WHERE xv.student_id = st.student_id
    )`;
  }

  sql += ` ORDER BY st.last_name, st.first_name`;

  const [rows] = await pool.query(sql, params);
  const ids = rows.map((r) => String(r.student_id));
  const children = await loadStudentChildren(ids);

  const result = rows.map((r) => {
    const key = String(r.student_id);
    return {
      id: Number(r.student_id),
      studentNo: r.student_no || "",
      firstName: r.first_name || "",
      middleName: r.middle_name || "",
      lastName: r.last_name || "",
      name: `${r.first_name}${r.last_name ? ` ${r.last_name}` : ""}`.trim(),
      course: r.course || "",
      year: r.year_level || "",
      section: r.section || "",
      skills: children.skills.get(key) || [],
      affiliations: children.affiliations.get(key) || [],
      violations: children.violations.get(key) || [],
      academicHistory: children.academic.get(key) || [],
      nonAcademicHistory: children.nonAcademic.get(key) || [],
    };
  });

  res.json(result);
});

app.get("/students/:studentNo", async (req, res) => {
  const studentNo = String(req.params.studentNo);
  const [rows] = await pool.query(
    `SELECT student_id, student_no, first_name, last_name, middle_name, course, year_level, section
     FROM students WHERE student_no = ?`,
    [studentNo]
  );
  if (!rows.length) return res.status(404).json({ message: "Not found" });
  const r = rows[0];
  const studentId = String(r.student_id);
  const children = await loadStudentChildren([studentId]);
  res.json({
    id: Number(r.student_id),
    studentNo: r.student_no || "",
    firstName: r.first_name || "",
    middleName: r.middle_name || "",
    lastName: r.last_name || "",
    name: `${r.first_name}${r.last_name ? ` ${r.last_name}` : ""}`.trim(),
    course: r.course || "",
    year: r.year_level || "",
    section: r.section || "",
    skills: children.skills.get(studentId) || [],
    affiliations: children.affiliations.get(studentId) || [],
    violations: children.violations.get(studentId) || [],
    academicHistory: children.academic.get(studentId) || [],
    nonAcademicHistory: children.nonAcademic.get(studentId) || [],
  });
});

app.post("/students", async (req, res) => {
  const payload = req.body || {};
  const parsed = parseName(payload.name);
  const first =
    String(payload.first_name || payload.firstName || parsed.first || "").trim() ||
    "Unnamed";
  const last = String(payload.last_name || payload.lastName || parsed.last || "").trim();
  const middle = String(payload.middle_name || payload.middleName || "").trim() || null;
  const studentNo = String(payload.student_no || payload.studentNo || "").trim();
  const course = String(payload.course || "").trim();
  const yearLevel = String(payload.year_level || payload.yearLevel || payload.year || "").trim();
  const section = String(payload.section || "").trim();

  if (!studentNo) {
    return res.status(400).json({ message: "studentNo is required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.query(
      `INSERT INTO students (student_no, first_name, last_name, middle_name, course, year_level, section)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentNo,
        first,
        last,
        middle,
        course,
        yearLevel,
        section,
      ]
    );

    const studentId = ins.insertId;

    const skills = Array.isArray(payload.skills) ? payload.skills : [];
    for (const raw of skills) {
      const name = String(raw || "").trim().toLowerCase();
      if (!name) continue;
      await conn.query(
        `INSERT INTO skills (skill_name) VALUES (?)
         ON DUPLICATE KEY UPDATE skill_name = skill_name`,
        [name]
      );
      const [[skillRow]] = await conn.query(
        `SELECT skill_id FROM skills WHERE skill_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_skills (student_id, skill_id) VALUES (?, ?)`,
        [studentId, skillRow.skill_id]
      );
    }

    const affiliations = Array.isArray(payload.affiliations) ? payload.affiliations : [];
    for (const raw of affiliations) {
      const name = String(raw || "").trim();
      if (!name) continue;
      await conn.query(
        `INSERT INTO affiliations (affiliation_name, affiliation_type)
         VALUES (?, 'other')
         ON DUPLICATE KEY UPDATE affiliation_name = affiliation_name`,
        [name]
      );
      const [[affRow]] = await conn.query(
        `SELECT affiliation_id FROM affiliations WHERE affiliation_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_affiliations (student_id, affiliation_id) VALUES (?, ?)`,
        [studentId, affRow.affiliation_id]
      );
    }

    const violations = Array.isArray(payload.violations) ? payload.violations : [];
    for (const raw of violations) {
      const text = String(raw || "").trim();
      if (!text) continue;
      await conn.query(
        `INSERT INTO violations (student_id, violation_text) VALUES (?, ?)`,
        [studentId, text]
      );
    }

    const academicHistory = Array.isArray(payload.academicHistory) ? payload.academicHistory : [];
    for (const rec of academicHistory) {
      if (!rec || !rec.term) continue;
      await conn.query(
        `INSERT INTO academic_history (student_id, term, gpa, standing) VALUES (?, ?, ?, ?)`,
        [studentId, String(rec.term), rec.gpa ?? null, rec.standing ?? null]
      );
    }

    const nonAcademicHistory = Array.isArray(payload.nonAcademicHistory) ? payload.nonAcademicHistory : [];
    for (const rec of nonAcademicHistory) {
      if (!rec || !rec.activity) continue;
      await conn.query(
        `INSERT INTO non_academic_activities (student_id, activity, role) VALUES (?, ?, ?)`,
        [studentId, String(rec.activity), rec.role ?? null]
      );
    }

    await conn.commit();

    // Return full profile in frontend shape
    const children = await loadStudentChildren([String(studentId)]);
    res.status(201).json({
      id: Number(studentId),
      studentNo,
      firstName: first,
      middleName: middle || "",
      lastName: last,
      name: `${first}${last ? ` ${last}` : ""}`.trim(),
      course,
      year: yearLevel,
      section,
      skills: children.skills.get(String(studentId)) || [],
      affiliations: children.affiliations.get(String(studentId)) || [],
      violations: children.violations.get(String(studentId)) || [],
      academicHistory: children.academic.get(String(studentId)) || [],
      nonAcademicHistory: children.nonAcademic.get(String(studentId)) || [],
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to create student" });
  } finally {
    conn.release();
  }
});

app.put("/students/:studentNo", async (req, res) => {
  const studentNoParam = String(req.params.studentNo);
  const payload = req.body || {};
  const parsed = parseName(payload.name);
  const first =
    String(payload.first_name || payload.firstName || parsed.first || "").trim() ||
    "Unnamed";
  const last = String(payload.last_name || payload.lastName || parsed.last || "").trim();
  const middle = String(payload.middle_name || payload.middleName || "").trim() || null;
  const studentNo = String(payload.student_no || payload.studentNo || "").trim() || studentNoParam;
  const course = String(payload.course || "").trim();
  const yearLevel = String(payload.year_level || payload.yearLevel || payload.year || "").trim();
  const section = String(payload.section || "").trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.query(
      `SELECT student_id FROM students WHERE student_no = ?`,
      [studentNoParam]
    );
    if (!exists.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Not found" });
    }
    const studentId = String(exists[0].student_id);

    await conn.query(
      `UPDATE students SET student_no = ?, first_name = ?, last_name = ?, middle_name = ?, course = ?, year_level = ?, section = ?
       WHERE student_id = ?`,
      [
        studentNo,
        first,
        last,
        middle,
        course,
        yearLevel,
        section,
        studentId,
      ]
    );

    // Replace children for simplicity
    await conn.query(`DELETE FROM student_skills WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM student_affiliations WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM violations WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM academic_history WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM non_academic_activities WHERE student_id = ?`, [studentId]);

    const skills = Array.isArray(payload.skills) ? payload.skills : [];
    for (const raw of skills) {
      const name = String(raw || "").trim().toLowerCase();
      if (!name) continue;
      await conn.query(
        `INSERT INTO skills (skill_name) VALUES (?)
         ON DUPLICATE KEY UPDATE skill_name = skill_name`,
        [name]
      );
      const [[skillRow]] = await conn.query(
        `SELECT skill_id FROM skills WHERE skill_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_skills (student_id, skill_id) VALUES (?, ?)`,
        [studentId, skillRow.skill_id]
      );
    }

    const affiliations = Array.isArray(payload.affiliations) ? payload.affiliations : [];
    for (const raw of affiliations) {
      const name = String(raw || "").trim();
      if (!name) continue;
      await conn.query(
        `INSERT INTO affiliations (affiliation_name, affiliation_type)
         VALUES (?, 'other')
         ON DUPLICATE KEY UPDATE affiliation_name = affiliation_name`,
        [name]
      );
      const [[affRow]] = await conn.query(
        `SELECT affiliation_id FROM affiliations WHERE affiliation_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_affiliations (student_id, affiliation_id) VALUES (?, ?)`,
        [studentId, affRow.affiliation_id]
      );
    }

    const violations = Array.isArray(payload.violations) ? payload.violations : [];
    for (const raw of violations) {
      const text = String(raw || "").trim();
      if (!text) continue;
      await conn.query(
        `INSERT INTO violations (student_id, violation_text) VALUES (?, ?)`,
        [studentId, text]
      );
    }

    const academicHistory = Array.isArray(payload.academicHistory) ? payload.academicHistory : [];
    for (const rec of academicHistory) {
      if (!rec || !rec.term) continue;
      await conn.query(
        `INSERT INTO academic_history (student_id, term, gpa, standing) VALUES (?, ?, ?, ?)`,
        [studentId, String(rec.term), rec.gpa ?? null, rec.standing ?? null]
      );
    }

    const nonAcademicHistory = Array.isArray(payload.nonAcademicHistory) ? payload.nonAcademicHistory : [];
    for (const rec of nonAcademicHistory) {
      if (!rec || !rec.activity) continue;
      await conn.query(
        `INSERT INTO non_academic_activities (student_id, activity, role) VALUES (?, ?, ?)`,
        [studentId, String(rec.activity), rec.role ?? null]
      );
    }

    await conn.commit();

    const children = await loadStudentChildren([studentId]);
    res.json({
      id: Number(studentId),
      studentNo,
      firstName: first,
      middleName: middle || "",
      lastName: last,
      name: `${first}${last ? ` ${last}` : ""}`.trim(),
      course,
      year: yearLevel,
      section,
      skills: children.skills.get(studentId) || [],
      affiliations: children.affiliations.get(studentId) || [],
      violations: children.violations.get(studentId) || [],
      academicHistory: children.academic.get(studentId) || [],
      nonAcademicHistory: children.nonAcademic.get(studentId) || [],
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to update student" });
  } finally {
    conn.release();
  }
});

app.put("/students/by-id/:studentId", async (req, res) => {
  const studentIdParam = String(req.params.studentId);
  const payload = req.body || {};
  const parsed = parseName(payload.name);
  const first =
    String(payload.first_name || payload.firstName || parsed.first || "").trim() ||
    "Unnamed";
  const last = String(payload.last_name || payload.lastName || parsed.last || "").trim();
  const middle = String(payload.middle_name || payload.middleName || "").trim() || null;
  const studentNo = String(payload.student_no || payload.studentNo || "").trim();
  const course = String(payload.course || "").trim();
  const yearLevel = String(payload.year_level || payload.yearLevel || payload.year || "").trim();
  const section = String(payload.section || "").trim();

  if (!studentNo) {
    return res.status(400).json({ message: "studentNo is required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.query(
      `SELECT student_id FROM students WHERE student_id = ?`,
      [studentIdParam]
    );
    if (!exists.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Not found" });
    }
    const studentId = String(exists[0].student_id);

    await conn.query(
      `UPDATE students SET student_no = ?, first_name = ?, last_name = ?, middle_name = ?, course = ?, year_level = ?, section = ?
       WHERE student_id = ?`,
      [studentNo, first, last, middle, course, yearLevel, section, studentId]
    );

    // Replace children for simplicity
    await conn.query(`DELETE FROM student_skills WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM student_affiliations WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM violations WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM academic_history WHERE student_id = ?`, [studentId]);
    await conn.query(`DELETE FROM non_academic_activities WHERE student_id = ?`, [studentId]);

    const skills = Array.isArray(payload.skills) ? payload.skills : [];
    for (const raw of skills) {
      const name = String(raw || "").trim().toLowerCase();
      if (!name) continue;
      await conn.query(
        `INSERT INTO skills (skill_name) VALUES (?)
         ON DUPLICATE KEY UPDATE skill_name = skill_name`,
        [name]
      );
      const [[skillRow]] = await conn.query(
        `SELECT skill_id FROM skills WHERE skill_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_skills (student_id, skill_id) VALUES (?, ?)`,
        [studentId, skillRow.skill_id]
      );
    }

    const affiliations = Array.isArray(payload.affiliations) ? payload.affiliations : [];
    for (const raw of affiliations) {
      const name = String(raw || "").trim();
      if (!name) continue;
      await conn.query(
        `INSERT INTO affiliations (affiliation_name, affiliation_type)
         VALUES (?, 'other')
         ON DUPLICATE KEY UPDATE affiliation_name = affiliation_name`,
        [name]
      );
      const [[affRow]] = await conn.query(
        `SELECT affiliation_id FROM affiliations WHERE affiliation_name = ?`,
        [name]
      );
      await conn.query(
        `INSERT IGNORE INTO student_affiliations (student_id, affiliation_id) VALUES (?, ?)`,
        [studentId, affRow.affiliation_id]
      );
    }

    const violations = Array.isArray(payload.violations) ? payload.violations : [];
    for (const raw of violations) {
      const text = String(raw || "").trim();
      if (!text) continue;
      await conn.query(
        `INSERT INTO violations (student_id, violation_text) VALUES (?, ?)`,
        [studentId, text]
      );
    }

    const academicHistory = Array.isArray(payload.academicHistory) ? payload.academicHistory : [];
    for (const rec of academicHistory) {
      if (!rec || !rec.term) continue;
      await conn.query(
        `INSERT INTO academic_history (student_id, term, gpa, standing) VALUES (?, ?, ?, ?)`,
        [studentId, String(rec.term), rec.gpa ?? null, rec.standing ?? null]
      );
    }

    const nonAcademicHistory = Array.isArray(payload.nonAcademicHistory) ? payload.nonAcademicHistory : [];
    for (const rec of nonAcademicHistory) {
      if (!rec || !rec.activity) continue;
      await conn.query(
        `INSERT INTO non_academic_activities (student_id, activity, role) VALUES (?, ?, ?)`,
        [studentId, String(rec.activity), rec.role ?? null]
      );
    }

    await conn.commit();

    const children = await loadStudentChildren([studentId]);
    res.json({
      id: Number(studentId),
      studentNo,
      firstName: first,
      middleName: middle || "",
      lastName: last,
      name: `${first}${last ? ` ${last}` : ""}`.trim(),
      course,
      year: yearLevel,
      section,
      skills: children.skills.get(studentId) || [],
      affiliations: children.affiliations.get(studentId) || [],
      violations: children.violations.get(studentId) || [],
      academicHistory: children.academic.get(studentId) || [],
      nonAcademicHistory: children.nonAcademic.get(studentId) || [],
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to update student" });
  } finally {
    conn.release();
  }
});

app.delete("/students/by-id/:studentId", async (req, res) => {
  const [result] = await pool.query(`DELETE FROM students WHERE student_id = ?`, [
    String(req.params.studentId),
  ]);
  if (!result || result.affectedRows === 0) {
    return res.status(404).json({ message: "Student not found (studentId)." });
  }
  res.status(204).send();
});

app.delete("/students/:studentNo", async (req, res) => {
  const [result] = await pool.query(`DELETE FROM students WHERE student_no = ?`, [
    String(req.params.studentNo),
  ]);
  if (!result || result.affectedRows === 0) {
    return res.status(404).json({ message: "Student not found (studentNo)." });
  }
  res.status(204).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

// Best-effort one-time repair for existing NULL/blank student numbers.
// Runs after the server boots so it won't block listening.
ensureStudentNoIntegrity();

