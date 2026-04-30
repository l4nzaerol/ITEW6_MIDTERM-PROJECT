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
        $rows = [
            [
                'student_no' => '2026-00001',
                'first_name' => 'Alice',
                'middle_name' => null,
                'last_name' => 'Santos',
                'course' => 'BSCS',
                'year_level' => '2nd Year',
                'section' => 'CS2A',
                'skills' => ['programming', 'algorithms'],
                'affiliations' => ['Association of Computer Science Students'],
                'violations' => [],
            ],
            [
                'student_no' => '2026-00002',
                'first_name' => 'Bob',
                'middle_name' => null,
                'last_name' => 'Reyes',
                'course' => 'BSIT',
                'year_level' => '3rd Year',
                'section' => 'IT3B',
                'skills' => ['web development', 'programming'],
                'affiliations' => ['Sites'],
                'violations' => ['Late submission in ITEW3'],
            ],
        ];

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
