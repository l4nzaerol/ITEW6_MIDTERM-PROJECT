const data = {
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
          { term: "AY 2024-2025 1st Sem", gpa: 1.5, standing: "Dean's Lister" },
          { term: "AY 2024-2025 2nd Sem", gpa: 1.75, standing: "Good Standing" }
        ],
        nonAcademicHistory: [
          { activity: "Intramurals 3x3 Basketball", role: "Player" },
          { activity: "Inter-school Programming Contest", role: "Participant" }
        ]
      },
      {
        id: 2,
        name: "Bob Reyes",
        year: "3rd Year",
        course: "BS Information Technology",
        section: "IT3B",
        affiliations: ["CCS Student Council"],
        violations: ["Late submission in CMSC 101"],
        skills: ["programming", "web development"],
        academicHistory: [
          { term: "AY 2024-2025 1st Sem", gpa: 2.0, standing: "Good Standing" }
        ],
        nonAcademicHistory: [
          { activity: "Hackathon 2025", role: "Lead Developer" }
        ]
      },
      {
        id: 3,
        name: "Carla Dizon",
        year: "1st Year",
        course: "BS Information Systems",
        section: "IS1A",
        affiliations: ["Programming Society"],
        violations: [],
        skills: ["programming", "database design"],
        academicHistory: [
          { term: "AY 2025-2026 1st Sem", gpa: 1.75, standing: "Dean's Lister" }
        ],
        nonAcademicHistory: [
          { activity: "Campus Programming Bootcamp", role: "Participant" }
        ]
      },
      {
        id: 4,
        name: "Daryl Cruz",
        year: "2nd Year",
        course: "BS Computer Science",
        section: "CS2B",
        affiliations: ["Basketball Club"],
        violations: ["Unexcused absence in PE102"],
        skills: ["basketball"],
        academicHistory: [
          { term: "AY 2024-2025 1st Sem", gpa: 2.25, standing: "Good Standing" }
        ],
        nonAcademicHistory: [
          { activity: "Intramurals Basketball", role: "Team Captain" }
        ]
      }
    ],
    faculty: [
      {
        id: 1,
        name: "Dr. Maria Smith",
        department: "Computer Science",
        specialization: "Algorithms and Data Structures",
        coursesHandled: ["CS101 - Introduction to Programming", "CS201 - Data Structures"]
      },
      {
        id: 2,
        name: "Prof. Jonathan Johnson",
        department: "Information Technology",
        specialization: "Web and Mobile Development",
        coursesHandled: ["IT210 - Web Systems", "IT230 - Mobile Applications"]
      }
    ],
    events: [
      {
        id: 1,
        name: "Basketball Tryouts",
        type: "Sports",
        date: "2026-03-07",
        criteria: {
          requiredSkills: ["basketball"],
          allowedViolations: "minor-only"
        }
      },
      {
        id: 2,
        name: "Programming Contest",
        type: "Academic",
        date: "2026-03-10",
        criteria: {
          requiredSkills: ["programming"],
          minGpa: 1.75
        }
      },
      {
        id: 3,
        name: "Coding Workshop",
        type: "Academic",
        date: "2026-03-12"
      },
      {
        id: 4,
        name: "Science Fair",
        type: "Academic",
        date: "2026-03-15"
      },
      {
        id: 5,
        name: "Hackathon",
        type: "Academic",
        date: "2026-03-20"
      },
      {
        id: 6,
        name: "Sports Festival",
        type: "Sports",
        date: "2026-03-25"
      }
    ]
  };
  
  export default data;