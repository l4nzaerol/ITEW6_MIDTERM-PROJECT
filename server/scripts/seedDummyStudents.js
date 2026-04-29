import { pool } from "../src/mysql.js";

const TOTAL = Number(process.argv[2] || 1200);
const IT_RATIO = 0.7; // BSIT should be greater than BSCS

const FIRST_NAMES = [
  "Adrian", "Bianca", "Carlo", "Diana", "Ethan", "Faith", "Gabriel", "Hannah",
  "Ivan", "Julia", "Kyle", "Lara", "Marco", "Nina", "Owen", "Paula", "Quinn",
  "Rafael", "Sophia", "Tristan", "Uma", "Vince", "Wendy", "Xander", "Yasmin", "Zach",
];

const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Dela Cruz", "Garcia", "Mendoza", "Torres", "Ramos",
  "Castro", "Navarro", "Flores", "Bautista", "Morales", "Aquino", "Villanueva", "Herrera",
];

const SECTIONS = {
  "1st Year": ["A", "B", "C", "D"],
  "2nd Year": ["A", "B", "C"],
  "3rd Year": ["A", "B", "C"],
  "4th Year": ["A", "B"],
};

const SKILLS_POOL = [
  "programming",
  "basketball",
  "web development",
  "database design",
  "networking",
  "ui ux",
  "cybersecurity",
  "mobile development",
  "data analytics",
  "public speaking",
];

// Requirement: affiliations must be Sites only or Association of Computer Science Students only.
const AFFILIATIONS_POOL = ["Sites", "Association of Computer Science Students"];

const NON_ACAD_POOL = [
  ["Hackathon", "Participant"],
  ["Coding Bootcamp", "Volunteer"],
  ["Intramurals", "Player"],
  ["Community Outreach", "Volunteer"],
  ["Tech Seminar", "Organizer"],
  ["Campus Workshop", "Facilitator"],
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function maybe(probability) {
  return Math.random() < probability;
}

function toYearLevel(i) {
  const mod = i % 4;
  if (mod === 0) return "1st Year";
  if (mod === 1) return "2nd Year";
  if (mod === 2) return "3rd Year";
  return "4th Year";
}

function toCourse(i) {
  return i < Math.floor(TOTAL * IT_RATIO) ? "BSIT" : "BSCS";
}

function makeStudentNo(i) {
  const year = 2026;
  return `${year}-${String(i + 1).padStart(5, "0")}`;
}

function randomGpa(yearLevel) {
  if (yearLevel === "2nd Year") return (1.5 + Math.random() * 1.1).toFixed(2);
  if (yearLevel === "3rd Year") return (1.4 + Math.random() * 1.2).toFixed(2);
  return (1.3 + Math.random() * 1.3).toFixed(2); // 4th
}

function standingFromGpa(gpa) {
  const n = Number(gpa);
  if (n <= 1.75) return "Dean's Lister";
  if (n <= 2.25) return "Good Standing";
  return "Probationary";
}

async function ensureMasterData(conn) {
  for (const skill of SKILLS_POOL) {
    await conn.query(
      `INSERT INTO skills (skill_name) VALUES (?)
       ON DUPLICATE KEY UPDATE skill_name = skill_name`,
      [skill]
    );
  }

  for (const aff of AFFILIATIONS_POOL) {
    const type = aff.toLowerCase().includes("basketball") ? "sports" : "org";
    await conn.query(
      `INSERT INTO affiliations (affiliation_name, affiliation_type)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE affiliation_name = affiliation_name`,
      [aff, type]
    );
  }
}

async function idMap(conn, table, idCol, nameCol) {
  const [rows] = await conn.query(`SELECT ${idCol} AS id, ${nameCol} AS name FROM ${table}`);
  const map = new Map();
  rows.forEach((r) => map.set(String(r.name), Number(r.id)));
  return map;
}

async function run() {
  console.log(`Seeding ${TOTAL} dummy students...`);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureMasterData(conn);

    const skillMap = await idMap(conn, "skills", "skill_id", "skill_name");
    const affMap = await idMap(conn, "affiliations", "affiliation_id", "affiliation_name");

    for (let i = 0; i < TOTAL; i++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const middle = maybe(0.6) ? `${String.fromCharCode(65 + (i % 26))}.` : null;
      const yearLevel = toYearLevel(i);
      const course = toCourse(i);
      const secCode = pick(SECTIONS[yearLevel]);
      const sectionPrefix = course === "BSIT" ? "IT" : "CS";
      const section = `${sectionPrefix}${yearLevel[0]}${secCode}`;
      const studentNo = makeStudentNo(i);

      const [ins] = await conn.query(
        `INSERT INTO students (student_no, first_name, last_name, middle_name, course, year_level, section)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentNo, first, last, middle, course, yearLevel, section]
      );
      const studentId = ins.insertId;

      const skills = pickN(SKILLS_POOL, 2, 4);
      for (const sk of skills) {
        const skillId = skillMap.get(sk);
        if (!skillId) continue;
        await conn.query(
          `INSERT IGNORE INTO student_skills (student_id, skill_id) VALUES (?, ?)`,
          [studentId, skillId]
        );
      }

      const affiliations = pickN(AFFILIATIONS_POOL, 1, 2);
      for (const aff of affiliations) {
        const affId = affMap.get(aff);
        if (!affId) continue;
        await conn.query(
          `INSERT IGNORE INTO student_affiliations (student_id, affiliation_id) VALUES (?, ?)`,
          [studentId, affId]
        );
      }

      // 1st year students: no latest term/GPA (no academic_history row)
      if (yearLevel !== "1st Year") {
        const term = "AY 2025-2026 1st Sem";
        const gpa = randomGpa(yearLevel);
        const standing = standingFromGpa(gpa);
        await conn.query(
          `INSERT INTO academic_history (student_id, term, gpa, standing) VALUES (?, ?, ?, ?)`,
          [studentId, term, gpa, standing]
        );
      }

      const nonAcadCount = maybe(0.8) ? 2 : 1;
      for (let n = 0; n < nonAcadCount; n++) {
        const [activity, role] = pick(NON_ACAD_POOL);
        await conn.query(
          `INSERT INTO non_academic_activities (student_id, activity, role) VALUES (?, ?, ?)`,
          [studentId, activity, role]
        );
      }

      if (maybe(0.2)) {
        const severity = maybe(0.8) ? "minor" : "major";
        const violationText = severity === "major" ? "Serious misconduct" : "Late submission";
        await conn.query(
          `INSERT INTO violations (student_id, violation_text, violation_date, severity)
           VALUES (?, ?, CURDATE(), ?)`,
          [studentId, violationText, severity]
        );
      }
    }

    await conn.commit();
    console.log(`Done. Inserted ${TOTAL} students with profile details.`);
    console.log(`BSIT target ratio: ${Math.round(IT_RATIO * 100)}% > BSCS`);
  } catch (e) {
    await conn.rollback();
    console.error("Seed failed:", e?.message || e);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();

