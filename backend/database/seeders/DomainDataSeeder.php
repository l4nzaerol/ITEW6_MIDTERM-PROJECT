<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Faculty;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Syllabus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DomainDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->seedSyllabi();
            $this->seedFaculties();
            $this->seedEvents();
            $this->seedSchedules();
            $this->seedStudents();
        });
    }

    private function seedSyllabi(): void
    {
        $rows = [
            ['id' => 'IT-1st Year-1st Sem-CCS101', 'track' => 'IT', 'year_level' => '1st Year', 'term_label' => '1st Sem', 'course_code' => 'CCS101', 'title' => 'Introduction to Computing'],
            ['id' => 'IT-1st Year-1st Sem-CCS102', 'track' => 'IT', 'year_level' => '1st Year', 'term_label' => '1st Sem', 'course_code' => 'CCS102', 'title' => 'Computer Programming 1'],
            ['id' => 'IT-2nd Year-1st Sem-ITEW1', 'track' => 'IT', 'year_level' => '2nd Year', 'term_label' => '1st Sem', 'course_code' => 'ITEW1', 'title' => 'Electronic Commerce'],
            ['id' => 'IT-3rd Year-1st Sem-ITEW3', 'track' => 'IT', 'year_level' => '3rd Year', 'term_label' => '1st Sem', 'course_code' => 'ITEW3', 'title' => 'Server Side Scripting'],
            ['id' => 'CS-1st Year-1st Sem-CS101', 'track' => 'CS', 'year_level' => '1st Year', 'term_label' => '1st Sem', 'course_code' => 'CS101', 'title' => 'Computer Programming 1'],
            ['id' => 'CS-2nd Year-1st Sem-CS201', 'track' => 'CS', 'year_level' => '2nd Year', 'term_label' => '1st Sem', 'course_code' => 'CS201', 'title' => 'Object-Oriented Programming'],
            ['id' => 'CS-3rd Year-1st Sem-CS302', 'track' => 'CS', 'year_level' => '3rd Year', 'term_label' => '1st Sem', 'course_code' => 'CS302', 'title' => 'Database Systems'],
            ['id' => 'CS-4th Year-1st Sem-CS401', 'track' => 'CS', 'year_level' => '4th Year', 'term_label' => '1st Sem', 'course_code' => 'CS401', 'title' => 'Capstone Project 1'],
        ];

        foreach ($rows as $row) {
            Syllabus::query()->updateOrCreate(
                ['syllabus_id' => $row['id']],
                [
                    'track' => $row['track'],
                    'year_level' => $row['year_level'],
                    'term_label' => $row['term_label'],
                    'course_code' => $row['course_code'],
                    'title' => $row['title'],
                ]
            );
        }
    }

    private function seedFaculties(): void
    {
        $rows = [
            [
                'name' => 'Dr. Maria Smith',
                'department' => 'Computer Science',
                'specialization' => 'Algorithms and AI',
                'syllabus_ids' => ['CS-1st Year-1st Sem-CS101', 'CS-2nd Year-1st Sem-CS201'],
                'sections' => ['CS1A', 'CS2A'],
            ],
            [
                'name' => 'Prof. Jonathan Johnson',
                'department' => 'Information Technology',
                'specialization' => 'Web and Mobile Development',
                'syllabus_ids' => ['IT-2nd Year-1st Sem-ITEW1', 'IT-3rd Year-1st Sem-ITEW3'],
                'sections' => ['IT2A', 'IT3B'],
            ],
            [
                'name' => 'Prof. Angela Reyes',
                'department' => 'Information Technology',
                'specialization' => 'Networking and Security',
                'syllabus_ids' => ['IT-1st Year-1st Sem-CCS101'],
                'sections' => ['IT1A', 'IT4A'],
            ],
            [
                'name' => 'Dr. Carlo Dizon',
                'department' => 'Computer Science',
                'specialization' => 'Software Engineering',
                'syllabus_ids' => ['CS-3rd Year-1st Sem-CS302', 'CS-4th Year-1st Sem-CS401'],
                'sections' => ['CS3A', 'CS4A'],
            ],
            [
                'name' => 'Prof. Liza Mendoza',
                'department' => 'Information Technology',
                'specialization' => 'Information Management',
                'syllabus_ids' => ['IT-1st Year-1st Sem-CCS102'],
                'sections' => ['IT1B', 'IT3A'],
            ],
        ];

        foreach ($rows as $row) {
            $faculty = Faculty::query()->updateOrCreate(
                ['name' => $row['name']],
                [
                    'department' => $row['department'],
                    'specialization' => $row['specialization'],
                ]
            );

            DB::table('faculty_syllabi')->where('faculty_id', $faculty->faculty_id)->delete();
            foreach ($row['syllabus_ids'] as $sid) {
                DB::table('faculty_syllabi')->insertOrIgnore([
                    'faculty_id' => $faculty->faculty_id,
                    'syllabus_id' => $sid,
                ]);
            }

            DB::table('faculty_sections')->where('faculty_id', $faculty->faculty_id)->delete();
            foreach ($row['sections'] as $sec) {
                DB::table('faculty_sections')->insertOrIgnore([
                    'faculty_id' => $faculty->faculty_id,
                    'section_code' => $sec,
                ]);
            }
        }
    }

    private function seedEvents(): void
    {
        $rows = [
            ['name' => 'Basketball Tryouts', 'type' => 'Sports', 'event_date' => '2026-03-07'],
            ['name' => 'Programming Contest', 'type' => 'Academic', 'event_date' => '2026-03-10'],
            ['name' => 'Coding Workshop', 'type' => 'Academic', 'event_date' => '2026-03-12'],
            ['name' => 'Science Fair', 'type' => 'Academic', 'event_date' => '2026-03-15'],
            ['name' => 'Hackathon', 'type' => 'Academic', 'event_date' => '2026-03-20'],
            ['name' => 'Sports Festival', 'type' => 'Sports', 'event_date' => '2026-03-25'],
        ];

        foreach ($rows as $row) {
            Event::query()->updateOrCreate(
                ['name' => $row['name'], 'event_date' => $row['event_date']],
                ['type' => $row['type']]
            );
        }
    }

    private function seedSchedules(): void
    {
        $rows = [
            ['course_code' => 'CS101', 'section_code' => 'CS2A', 'room' => 'Room 201', 'lab' => 'Lab 3', 'faculty_name' => 'Dr. Maria Smith', 'time_slot' => 'MWF 9:00-10:00'],
            ['course_code' => 'ITEW1', 'section_code' => 'IT3B', 'room' => 'Room 305', 'lab' => 'Lab 1', 'faculty_name' => 'Prof. Jonathan Johnson', 'time_slot' => 'TTh 1:00-2:30'],
        ];

        foreach ($rows as $row) {
            Schedule::query()->updateOrCreate(
                ['course_code' => $row['course_code'], 'section_code' => $row['section_code']],
                [
                    'room' => $row['room'],
                    'lab' => $row['lab'],
                    'faculty_name' => $row['faculty_name'],
                    'time_slot' => $row['time_slot'],
                ]
            );
        }
    }

    private function seedStudents(): void
    {
        $firstNames = [
            'Adrian', 'Bianca', 'Carlo', 'Diana', 'Ethan', 'Faith', 'Gabriel', 'Hannah', 'Ivan', 'Julia',
            'Kyle', 'Lara', 'Marco', 'Nina', 'Owen', 'Paula', 'Quinn', 'Rafael', 'Sophia', 'Tristan',
            'Uma', 'Vince', 'Wendy', 'Xander', 'Yasmin', 'Zach',
        ];
        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Ramos', 'Castro', 'Navarro', 'Flores',
            'Bautista', 'Morales', 'Aquino', 'Villanueva', 'Herrera', 'Dela Cruz',
        ];
        $yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        $courses = ['BSIT', 'BSCS'];
        $skillsPool = ['programming', 'basketball', 'web development', 'database design', 'networking'];
        $affiliationPool = ['Sites', 'Association of Computer Science Students'];

        $rows = [];
        for ($i = 0; $i < 1200; $i++) {
            $firstName = $firstNames[$i % count($firstNames)];
            $lastName = $lastNames[($i * 3) % count($lastNames)];
            $course = $courses[$i % count($courses)];
            $yearLevel = $yearLevels[$i % count($yearLevels)];
            $sectionPrefix = $course === 'BSIT' ? 'IT' : 'CS';
            $section = $sectionPrefix.(($i % 4) + 1).chr(65 + ($i % 3));
            $studentNo = '2026-'.str_pad((string) ($i + 1), 5, '0', STR_PAD_LEFT);

            $skill1 = $skillsPool[$i % count($skillsPool)];
            $skill2 = $skillsPool[($i + 7) % count($skillsPool)];
            $skill3 = $skillsPool[($i + 14) % count($skillsPool)];

            $rows[] = [
                'student_no' => $studentNo,
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'course' => $course,
                'year_level' => $yearLevel,
                'section' => $section,
                'skills' => array_values(array_unique([$skill1, $skill2, $skill3])),
                'affiliations' => [$affiliationPool[$i % 2]],
                'violations' => [],
            ];
        }

        foreach ($rows as $row) {
            $student = Student::query()->updateOrCreate(
                ['student_no' => $row['student_no']],
                [
                    'first_name' => $row['first_name'],
                    'middle_name' => $row['middle_name'],
                    'last_name' => $row['last_name'],
                    'course' => $row['course'],
                    'year_level' => $row['year_level'],
                    'section' => $row['section'],
                ]
            );

            $skillIds = [];
            foreach ($row['skills'] as $skill) {
                $id = DB::table('skills')->where('skill_name', $skill)->value('skill_id');
                if (! $id) {
                    $id = DB::table('skills')->insertGetId(['skill_name' => $skill]);
                }
                $skillIds[] = (int) $id;
            }
            $student->skills()->sync($skillIds);

            $affIds = [];
            foreach ($row['affiliations'] as $affiliation) {
                $id = DB::table('affiliations')->where('affiliation_name', $affiliation)->value('affiliation_id');
                if (! $id) {
                    $id = DB::table('affiliations')->insertGetId([
                        'affiliation_name' => $affiliation,
                        'affiliation_type' => 'org',
                    ]);
                }
                $affIds[] = (int) $id;
            }
            $student->affiliations()->sync($affIds);

            DB::table('violations')->where('student_id', $student->student_id)->delete();
            foreach ($row['violations'] as $violationText) {
                DB::table('violations')->insert([
                    'student_id' => $student->student_id,
                    'violation_text' => $violationText,
                    'severity' => 'minor',
                    'created_at' => now(),
                ]);
            }
        }
    }
}
