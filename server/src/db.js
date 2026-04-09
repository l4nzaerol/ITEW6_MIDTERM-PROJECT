import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "data", "db.json");

const seed = {
  students: [
    {
      id: 1,
      name: "Alice Santos",
      year: "2nd Year",
      course: "BS Computer Science",
      section: "CS2A",
      affiliations: ["Basketball Club", "ACM Programming Guild"],
      violations: [],
      skills: ["programming", "basketball", "algorithms"],
      academicHistory: [
        { term: "AY 2024-2025 1st Sem", gpa: 1.5, standing: "Dean's Lister" }
      ],
      nonAcademicHistory: [
        { activity: "Intramurals 3x3 Basketball", role: "Player" }
      ]
    }
  ]
};

async function ensureDbFile() {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    await writeFile(join(dir, ".keep"), "", { flag: "w" });
  }
  if (!existsSync(DB_PATH)) {
    await writeFile(DB_PATH, JSON.stringify(seed, null, 2), { flag: "w" });
  }
}

export async function readDb() {
  await ensureDbFile();
  const raw = await readFile(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeDb(db) {
  await ensureDbFile();
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function nextId(items) {
  const maxId = items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  return maxId + 1;
}

