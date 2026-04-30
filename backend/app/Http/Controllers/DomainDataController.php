<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Faculty;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Syllabus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DomainDataController extends Controller
{
    public function getSyllabi(): JsonResponse
    {
        $rows = Syllabus::query()
            ->orderBy('track')
            ->orderBy('year_level')
            ->orderBy('term_label')
            ->orderBy('course_code')
            ->get();

        return response()->json($rows->map(fn ($r) => [
            'id' => $r->syllabus_id,
            'track' => $r->track,
            'yearLevel' => $r->year_level,
            'term' => $r->term_label,
            'code' => $r->course_code,
            'title' => $r->title,
        ]));
    }

    public function getStudents(Request $request): JsonResponse
    {
        $query = Student::query()->with(['skills', 'affiliations', 'violations', 'academicHistory', 'nonAcademicActivities']);

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('student_no', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('course', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%");
            });
        }

        $course = trim((string) $request->query('course', ''));
        if ($course !== '') {
            $query->where('course', $course);
        }

        $yearLevel = trim((string) ($request->query('yearLevel', $request->query('year', ''))));
        if ($yearLevel !== '') {
            $query->where('year_level', $yearLevel);
        }

        $section = trim((string) $request->query('section', ''));
        if ($section !== '') {
            $query->where('section', $section);
        }

        $rows = $query->orderBy('student_id')->get();

        return response()->json($rows->map(fn (Student $student) => $this->mapStudent($student)));
    }

    public function createStudent(Request $request): JsonResponse
    {
        $payload = $this->normalizeStudent($request->all());
        if ($payload['firstName'] === '' || $payload['lastName'] === '') {
            return response()->json(['message' => 'First name and last name are required.'], 422);
        }

        if ($payload['studentNo'] !== '' && Student::query()->where('student_no', $payload['studentNo'])->exists()) {
            return response()->json(['message' => 'Student number already exists.'], 409);
        }

        $student = DB::transaction(function () use ($payload) {
            $row = Student::query()->create([
                'student_no' => $payload['studentNo'] !== '' ? $payload['studentNo'] : null,
                'first_name' => $payload['firstName'],
                'middle_name' => $payload['middleName'] !== '' ? $payload['middleName'] : null,
                'last_name' => $payload['lastName'],
                'course' => $payload['course'] !== '' ? $payload['course'] : null,
                'year_level' => $payload['yearLevel'] !== '' ? $payload['yearLevel'] : null,
                'section' => $payload['section'] !== '' ? $payload['section'] : null,
            ]);

            $this->syncStudentRelations($row, $payload);
            return $row->fresh(['skills', 'affiliations', 'violations', 'academicHistory', 'nonAcademicActivities']);
        });

        return response()->json($this->mapStudent($student), 201);
    }

    public function updateStudent(Request $request, string $studentNo): JsonResponse
    {
        $row = Student::query()->where('student_no', $studentNo)->first();
        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return $this->performStudentUpdate($row, $request->all());
    }

    public function updateStudentById(Request $request, int $id): JsonResponse
    {
        $row = Student::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return $this->performStudentUpdate($row, $request->all());
    }

    public function deleteStudent(string $studentNo): JsonResponse
    {
        $deleted = Student::query()->where('student_no', $studentNo)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([], 204);
    }

    public function deleteStudentById(int $id): JsonResponse
    {
        $deleted = Student::query()->where('student_id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([], 204);
    }

    public function getFaculties(): JsonResponse
    {
        $rows = Faculty::query()->orderBy('name')->get();
        if ($rows->isEmpty()) {
            return response()->json([]);
        }

        $ids = $rows->pluck('faculty_id')->all();
        $syllabiRows = DB::table('faculty_syllabi')
            ->whereIn('faculty_id', $ids)
            ->get(['faculty_id', 'syllabus_id']);
        $sectionRows = DB::table('faculty_sections')
            ->whereIn('faculty_id', $ids)
            ->get(['faculty_id', 'section_code']);

        $syllabiMap = [];
        foreach ($syllabiRows as $row) {
            $k = (string) $row->faculty_id;
            $syllabiMap[$k] = $syllabiMap[$k] ?? [];
            $syllabiMap[$k][] = $row->syllabus_id;
        }

        $sectionsMap = [];
        foreach ($sectionRows as $row) {
            $k = (string) $row->faculty_id;
            $sectionsMap[$k] = $sectionsMap[$k] ?? [];
            $sectionsMap[$k][] = $row->section_code;
        }

        return response()->json($rows->map(fn ($r) => [
            'id' => (int) $r->faculty_id,
            'name' => $r->name,
            'department' => $r->department,
            'specialization' => $r->specialization ?? '',
            'syllabusHandled' => $syllabiMap[(string) $r->faculty_id] ?? [],
            'sectionsHandled' => $sectionsMap[(string) $r->faculty_id] ?? [],
        ]));
    }

    public function createFaculty(Request $request): JsonResponse
    {
        $payload = $this->normalizeFaculty($request->all());

        $row = DB::transaction(function () use ($payload) {
            $faculty = Faculty::query()->create([
                'name' => $payload['name'],
                'department' => $payload['department'],
                'specialization' => $payload['specialization'] ?: null,
            ]);

            foreach ($payload['syllabusHandled'] as $sid) {
                DB::table('faculty_syllabi')->insertOrIgnore([
                    'faculty_id' => $faculty->faculty_id,
                    'syllabus_id' => $sid,
                ]);
            }

            foreach ($payload['sectionsHandled'] as $sec) {
                DB::table('faculty_sections')->insertOrIgnore([
                    'faculty_id' => $faculty->faculty_id,
                    'section_code' => $sec,
                ]);
            }

            return $faculty;
        });

        return response()->json([
            'id' => (int) $row->faculty_id,
            ...$payload,
        ], 201);
    }

    public function updateFaculty(Request $request, int $id): JsonResponse
    {
        $payload = $this->normalizeFaculty($request->all());
        $row = Faculty::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        DB::transaction(function () use ($row, $id, $payload) {
            $row->update([
                'name' => $payload['name'],
                'department' => $payload['department'],
                'specialization' => $payload['specialization'] ?: null,
            ]);

            DB::table('faculty_syllabi')->where('faculty_id', $id)->delete();
            DB::table('faculty_sections')->where('faculty_id', $id)->delete();

            foreach ($payload['syllabusHandled'] as $sid) {
                DB::table('faculty_syllabi')->insertOrIgnore([
                    'faculty_id' => $id,
                    'syllabus_id' => $sid,
                ]);
            }

            foreach ($payload['sectionsHandled'] as $sec) {
                DB::table('faculty_sections')->insertOrIgnore([
                    'faculty_id' => $id,
                    'section_code' => $sec,
                ]);
            }
        });

        return response()->json(['id' => $id, ...$payload]);
    }

    public function deleteFaculty(int $id): JsonResponse
    {
        $deleted = Faculty::query()->where('faculty_id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([], 204);
    }

    public function getEvents(): JsonResponse
    {
        $rows = Event::query()->orderBy('event_date')->orderBy('event_id')->get();
        return response()->json($rows->map(fn ($r) => [
            'id' => (int) $r->event_id,
            'name' => $r->name,
            'type' => $r->type,
            'date' => $r->event_date ? (string) $r->event_date : '',
        ]));
    }

    public function createEvent(Request $request): JsonResponse
    {
        $payload = $this->normalizeEvent($request->all());
        $row = Event::query()->create([
            'name' => $payload['name'],
            'type' => $payload['type'],
            'event_date' => $payload['date'] ?: null,
        ]);

        return response()->json(['id' => (int) $row->event_id, ...$payload], 201);
    }

    public function updateEvent(Request $request, int $id): JsonResponse
    {
        $payload = $this->normalizeEvent($request->all());
        $row = Event::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $row->update([
            'name' => $payload['name'],
            'type' => $payload['type'],
            'event_date' => $payload['date'] ?: null,
        ]);

        return response()->json(['id' => $id, ...$payload]);
    }

    public function deleteEvent(int $id): JsonResponse
    {
        $deleted = Event::query()->where('event_id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([], 204);
    }

    public function getSchedules(): JsonResponse
    {
        $rows = Schedule::query()->orderBy('section_code')->orderBy('course_code')->get();
        return response()->json($rows->map(fn ($r) => [
            'id' => (int) $r->schedule_id,
            'course' => $r->course_code ?? '',
            'section' => $r->section_code ?? '',
            'room' => $r->room ?? '',
            'lab' => $r->lab ?? '',
            'faculty' => $r->faculty_name ?? '',
            'time' => $r->time_slot ?? '',
        ]));
    }

    public function createSchedule(Request $request): JsonResponse
    {
        $payload = $this->normalizeSchedule($request->all());
        $row = Schedule::query()->create([
            'course_code' => $payload['course'],
            'section_code' => $payload['section'],
            'room' => $payload['room'] ?: null,
            'lab' => $payload['lab'] ?: null,
            'faculty_name' => $payload['faculty'] ?: null,
            'time_slot' => $payload['time'] ?: null,
        ]);

        return response()->json(['id' => (int) $row->schedule_id, ...$payload], 201);
    }

    public function updateSchedule(Request $request, int $id): JsonResponse
    {
        $payload = $this->normalizeSchedule($request->all());
        $row = Schedule::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $row->update([
            'course_code' => $payload['course'],
            'section_code' => $payload['section'],
            'room' => $payload['room'] ?: null,
            'lab' => $payload['lab'] ?: null,
            'faculty_name' => $payload['faculty'] ?: null,
            'time_slot' => $payload['time'] ?: null,
        ]);

        return response()->json(['id' => $id, ...$payload]);
    }

    public function deleteSchedule(int $id): JsonResponse
    {
        $deleted = Schedule::query()->where('schedule_id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([], 204);
    }

    public function bootstrapFrontendDummy(Request $request): JsonResponse
    {
        $payload = $request->all();
        $seedDefaults = (bool) ($payload['seedDefaults'] ?? false);
        $seedStudents = (bool) ($payload['seedStudents'] ?? false);

        $syllabi = is_array($payload['syllabi'] ?? null) ? $payload['syllabi'] : [];
        $faculties = is_array($payload['faculties'] ?? null) ? $payload['faculties'] : [];
        $events = is_array($payload['events'] ?? null) ? $payload['events'] : [];
        $schedules = is_array($payload['schedules'] ?? null) ? $payload['schedules'] : [];
        $students = is_array($payload['students'] ?? null) ? $payload['students'] : [];

        if ($seedDefaults) {
            if (empty($syllabi)) {
                $syllabi = $this->defaultSyllabi();
            }
            if (empty($faculties)) {
                $faculties = $this->defaultFaculties();
            }
            if (empty($events)) {
                $events = $this->defaultEvents();
            }
            if (empty($schedules)) {
                $schedules = $this->defaultSchedules();
            }
            if ($seedStudents && empty($students)) {
                $students = $this->defaultStudents();
            }
        }

        $result = [
            'seeded' => [
                'syllabi' => 0,
                'faculties' => 0,
                'events' => 0,
                'schedules' => 0,
                'students' => 0,
            ],
        ];

        DB::transaction(function () use ($syllabi, $faculties, $events, $schedules, $students, $seedStudents, &$result) {
            if (! empty($syllabi)) {
                foreach ($syllabi as $raw) {
                    $id = trim((string) ($raw['id'] ?? ''));
                    if ($id === '') {
                        continue;
                    }
                    Syllabus::query()->updateOrCreate(
                        ['syllabus_id' => $id],
                        [
                            'track' => trim((string) ($raw['track'] ?? '')),
                            'year_level' => trim((string) ($raw['yearLevel'] ?? '')),
                            'term_label' => trim((string) ($raw['term'] ?? '')),
                            'course_code' => trim((string) ($raw['code'] ?? '')),
                            'title' => trim((string) ($raw['title'] ?? '')),
                        ]
                    );
                    $result['seeded']['syllabi']++;
                }
            }

            if (! empty($faculties) && Faculty::query()->count() === 0) {
                foreach ($faculties as $raw) {
                    $f = $this->normalizeFaculty($raw);
                    if ($f['name'] === '') {
                        continue;
                    }
                    $row = Faculty::query()->create([
                        'name' => $f['name'],
                        'department' => $f['department'],
                        'specialization' => $f['specialization'] ?: null,
                    ]);

                    foreach ($f['syllabusHandled'] as $sid) {
                        DB::table('faculty_syllabi')->insertOrIgnore([
                            'faculty_id' => $row->faculty_id,
                            'syllabus_id' => $sid,
                        ]);
                    }
                    foreach ($f['sectionsHandled'] as $sec) {
                        DB::table('faculty_sections')->insertOrIgnore([
                            'faculty_id' => $row->faculty_id,
                            'section_code' => $sec,
                        ]);
                    }
                    $result['seeded']['faculties']++;
                }
            }

            if (! empty($events) && Event::query()->count() === 0) {
                foreach ($events as $raw) {
                    $e = $this->normalizeEvent($raw);
                    if ($e['name'] === '') {
                        continue;
                    }
                    Event::query()->create([
                        'name' => $e['name'],
                        'type' => $e['type'],
                        'event_date' => $e['date'] ?: null,
                    ]);
                    $result['seeded']['events']++;
                }
            }

            if (! empty($schedules) && Schedule::query()->count() === 0) {
                foreach ($schedules as $raw) {
                    $s = $this->normalizeSchedule($raw);
                    if ($s['course'] === '' || $s['section'] === '') {
                        continue;
                    }
                    Schedule::query()->create([
                        'course_code' => $s['course'],
                        'section_code' => $s['section'],
                        'room' => $s['room'] ?: null,
                        'lab' => $s['lab'] ?: null,
                        'faculty_name' => $s['faculty'] ?: null,
                        'time_slot' => $s['time'] ?: null,
                    ]);
                    $result['seeded']['schedules']++;
                }
            }

            if (! empty($students) && $seedStudents && Student::query()->count() === 0) {
                foreach ($students as $raw) {
                    $s = $this->normalizeStudent(is_array($raw) ? $raw : []);
                    if ($s['firstName'] === '' || $s['lastName'] === '') {
                        continue;
                    }

                    if ($s['studentNo'] !== '' && Student::query()->where('student_no', $s['studentNo'])->exists()) {
                        continue;
                    }

                    $row = Student::query()->create([
                        'student_no' => $s['studentNo'] !== '' ? $s['studentNo'] : null,
                        'first_name' => $s['firstName'],
                        'middle_name' => $s['middleName'] !== '' ? $s['middleName'] : null,
                        'last_name' => $s['lastName'],
                        'course' => $s['course'] !== '' ? $s['course'] : null,
                        'year_level' => $s['yearLevel'] !== '' ? $s['yearLevel'] : null,
                        'section' => $s['section'] !== '' ? $s['section'] : null,
                    ]);

                    $this->syncStudentRelations($row, $s);
                    $result['seeded']['students']++;
                }
            }
        });

        return response()->json($result);
    }

    private function normalizeFaculty(array $payload): array
    {
        return [
            'name' => trim((string) ($payload['name'] ?? '')),
            'department' => trim((string) ($payload['department'] ?? 'Information Technology')) ?: 'Information Technology',
            'specialization' => trim((string) ($payload['specialization'] ?? '')),
            'syllabusHandled' => array_values(array_filter(
                array_map(fn ($v) => trim((string) $v), is_array($payload['syllabusHandled'] ?? null) ? $payload['syllabusHandled'] : []),
                fn ($v) => $v !== ''
            )),
            'sectionsHandled' => array_values(array_filter(
                array_map(fn ($v) => trim((string) $v), is_array($payload['sectionsHandled'] ?? null) ? $payload['sectionsHandled'] : []),
                fn ($v) => $v !== ''
            )),
        ];
    }

    private function normalizeEvent(array $payload): array
    {
        return [
            'name' => trim((string) ($payload['name'] ?? '')),
            'type' => trim((string) ($payload['type'] ?? 'Academic')) ?: 'Academic',
            'date' => trim((string) ($payload['date'] ?? '')),
        ];
    }

    private function normalizeSchedule(array $payload): array
    {
        return [
            'course' => trim((string) ($payload['course'] ?? '')),
            'section' => trim((string) ($payload['section'] ?? '')),
            'room' => trim((string) ($payload['room'] ?? '')),
            'lab' => trim((string) ($payload['lab'] ?? '')),
            'faculty' => trim((string) ($payload['faculty'] ?? '')),
            'time' => trim((string) ($payload['time'] ?? '')),
        ];
    }

    private function mapStudent(Student $student): array
    {
        $name = trim(implode(' ', array_filter([
            $student->first_name,
            $student->middle_name,
            $student->last_name,
        ])));

        return [
            'id' => (int) $student->student_id,
            'studentNo' => $student->student_no ?? '',
            'firstName' => $student->first_name,
            'middleName' => $student->middle_name ?? '',
            'lastName' => $student->last_name,
            'name' => $name,
            'course' => $student->course ?? '',
            'year' => $student->year_level ?? '',
            'yearLevel' => $student->year_level ?? '',
            'section' => $student->section ?? '',
            'skills' => $student->skills->pluck('skill_name')->values()->all(),
            'affiliations' => $student->affiliations->pluck('affiliation_name')->values()->all(),
            'violations' => $student->violations->pluck('violation_text')->values()->all(),
            'academicHistory' => $student->academicHistory
                ->sortByDesc('created_at')
                ->map(fn ($a) => [
                    'term' => $a->term,
                    'gpa' => is_null($a->gpa) ? '' : (float) $a->gpa,
                    'standing' => $a->standing ?? '',
                ])->values()->all(),
            'nonAcademicHistory' => $student->nonAcademicActivities
                ->sortByDesc('created_at')
                ->map(fn ($n) => [
                    'activity' => $n->activity,
                    'role' => $n->role ?? '',
                ])->values()->all(),
        ];
    }

    private function normalizeStudent(array $payload): array
    {
        $yearLevel = trim((string) ($payload['yearLevel'] ?? $payload['year'] ?? ''));
        $firstName = trim((string) ($payload['firstName'] ?? ''));
        $lastName = trim((string) ($payload['lastName'] ?? ''));
        $legacyName = trim((string) ($payload['name'] ?? ''));
        if (($firstName === '' || $lastName === '') && $legacyName !== '') {
            $parts = preg_split('/\s+/', $legacyName) ?: [];
            if ($firstName === '' && ! empty($parts)) {
                $firstName = (string) array_shift($parts);
            }
            if ($lastName === '' && ! empty($parts)) {
                $lastName = implode(' ', $parts);
            }
        }

        $skills = array_values(array_unique(array_filter(array_map(
            fn ($v) => trim((string) $v),
            is_array($payload['skills'] ?? null) ? $payload['skills'] : []
        ))));

        $affiliations = array_values(array_unique(array_filter(array_map(
            fn ($v) => trim((string) $v),
            is_array($payload['affiliations'] ?? null) ? $payload['affiliations'] : []
        ))));

        $violations = array_values(array_filter(array_map(
            fn ($v) => trim((string) $v),
            is_array($payload['violations'] ?? null) ? $payload['violations'] : []
        )));

        $academicHistory = [];
        foreach (is_array($payload['academicHistory'] ?? null) ? $payload['academicHistory'] : [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $term = trim((string) ($row['term'] ?? ''));
            if ($term === '') {
                continue;
            }
            $gpaValue = $row['gpa'] ?? null;
            $gpa = is_numeric($gpaValue) ? round((float) $gpaValue, 2) : null;
            $academicHistory[] = [
                'term' => $term,
                'gpa' => $gpa,
                'standing' => trim((string) ($row['standing'] ?? '')),
            ];
        }

        $nonAcademicHistory = [];
        foreach (is_array($payload['nonAcademicHistory'] ?? null) ? $payload['nonAcademicHistory'] : [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $activity = trim((string) ($row['activity'] ?? ''));
            if ($activity === '') {
                continue;
            }
            $nonAcademicHistory[] = [
                'activity' => $activity,
                'role' => trim((string) ($row['role'] ?? '')),
            ];
        }

        return [
            'studentNo' => trim((string) ($payload['studentNo'] ?? '')),
            'firstName' => $firstName,
            'middleName' => trim((string) ($payload['middleName'] ?? '')),
            'lastName' => $lastName,
            'course' => trim((string) ($payload['course'] ?? '')),
            'yearLevel' => $yearLevel,
            'section' => trim((string) ($payload['section'] ?? '')),
            'skills' => $skills,
            'affiliations' => $affiliations,
            'violations' => $violations,
            'academicHistory' => $academicHistory,
            'nonAcademicHistory' => $nonAcademicHistory,
        ];
    }

    private function performStudentUpdate(Student $row, array $rawPayload): JsonResponse
    {
        $payload = $this->normalizeStudent($rawPayload);
        if ($payload['firstName'] === '' || $payload['lastName'] === '') {
            return response()->json(['message' => 'First name and last name are required.'], 422);
        }

        if ($payload['studentNo'] !== '') {
            $exists = Student::query()
                ->where('student_no', $payload['studentNo'])
                ->where('student_id', '!=', $row->student_id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Student number already exists.'], 409);
            }
        }

        $updated = DB::transaction(function () use ($row, $payload) {
            $row->update([
                'student_no' => $payload['studentNo'] !== '' ? $payload['studentNo'] : null,
                'first_name' => $payload['firstName'],
                'middle_name' => $payload['middleName'] !== '' ? $payload['middleName'] : null,
                'last_name' => $payload['lastName'],
                'course' => $payload['course'] !== '' ? $payload['course'] : null,
                'year_level' => $payload['yearLevel'] !== '' ? $payload['yearLevel'] : null,
                'section' => $payload['section'] !== '' ? $payload['section'] : null,
            ]);

            $this->syncStudentRelations($row, $payload);
            return $row->fresh(['skills', 'affiliations', 'violations', 'academicHistory', 'nonAcademicActivities']);
        });

        return response()->json($this->mapStudent($updated));
    }

    private function syncStudentRelations(Student $student, array $payload): void
    {
        $skillIds = [];
        foreach ($payload['skills'] as $skillName) {
            $sid = DB::table('skills')->where('skill_name', $skillName)->value('skill_id');
            if (! $sid) {
                $sid = DB::table('skills')->insertGetId(['skill_name' => $skillName]);
            }
            $skillIds[] = (int) $sid;
        }
        $student->skills()->sync($skillIds);

        $affIds = [];
        foreach ($payload['affiliations'] as $name) {
            $aid = DB::table('affiliations')->where('affiliation_name', $name)->value('affiliation_id');
            if (! $aid) {
                $type = str_contains(strtolower($name), 'sport') ? 'sports' : 'org';
                $aid = DB::table('affiliations')->insertGetId([
                    'affiliation_name' => $name,
                    'affiliation_type' => $type,
                ]);
            }
            $affIds[] = (int) $aid;
        }
        $student->affiliations()->sync($affIds);

        DB::table('violations')->where('student_id', $student->student_id)->delete();
        foreach ($payload['violations'] as $text) {
            DB::table('violations')->insert([
                'student_id' => $student->student_id,
                'violation_text' => $text,
                'severity' => 'minor',
                'created_at' => now(),
            ]);
        }

        DB::table('academic_history')->where('student_id', $student->student_id)->delete();
        foreach ($payload['academicHistory'] as $item) {
            DB::table('academic_history')->insert([
                'student_id' => $student->student_id,
                'term' => $item['term'],
                'gpa' => $item['gpa'],
                'standing' => $item['standing'] !== '' ? $item['standing'] : null,
                'created_at' => now(),
            ]);
        }

        DB::table('non_academic_activities')->where('student_id', $student->student_id)->delete();
        foreach ($payload['nonAcademicHistory'] as $item) {
            DB::table('non_academic_activities')->insert([
                'student_id' => $student->student_id,
                'activity' => $item['activity'],
                'role' => $item['role'] !== '' ? $item['role'] : null,
                'created_at' => now(),
            ]);
        }
    }

    private function defaultSyllabi(): array
    {
        return [
            ['id' => 'IT-1st Year-1st Sem-CCS101', 'track' => 'IT', 'yearLevel' => '1st Year', 'term' => '1st Sem', 'code' => 'CCS101', 'title' => 'Introduction to Computing'],
            ['id' => 'IT-1st Year-1st Sem-CCS102', 'track' => 'IT', 'yearLevel' => '1st Year', 'term' => '1st Sem', 'code' => 'CCS102', 'title' => 'Computer Programming 1'],
            ['id' => 'IT-2nd Year-1st Sem-ITEW1', 'track' => 'IT', 'yearLevel' => '2nd Year', 'term' => '1st Sem', 'code' => 'ITEW1', 'title' => 'Electronic Commerce'],
            ['id' => 'IT-3rd Year-1st Sem-ITEW3', 'track' => 'IT', 'yearLevel' => '3rd Year', 'term' => '1st Sem', 'code' => 'ITEW3', 'title' => 'Server Side Scripting'],
            ['id' => 'CS-1st Year-1st Sem-CS101', 'track' => 'CS', 'yearLevel' => '1st Year', 'term' => '1st Sem', 'code' => 'CS101', 'title' => 'Computer Programming 1'],
            ['id' => 'CS-2nd Year-1st Sem-CS201', 'track' => 'CS', 'yearLevel' => '2nd Year', 'term' => '1st Sem', 'code' => 'CS201', 'title' => 'Object-Oriented Programming'],
            ['id' => 'CS-3rd Year-1st Sem-CS302', 'track' => 'CS', 'yearLevel' => '3rd Year', 'term' => '1st Sem', 'code' => 'CS302', 'title' => 'Database Systems'],
            ['id' => 'CS-4th Year-1st Sem-CS401', 'track' => 'CS', 'yearLevel' => '4th Year', 'term' => '1st Sem', 'code' => 'CS401', 'title' => 'Capstone Project 1'],
        ];
    }

    private function defaultFaculties(): array
    {
        return [
            [
                'name' => 'Dr. Maria Smith',
                'department' => 'Computer Science',
                'specialization' => 'Algorithms and AI',
                'syllabusHandled' => ['CS-1st Year-1st Sem-CS101', 'CS-2nd Year-1st Sem-CS201'],
                'sectionsHandled' => ['CS1A', 'CS2A'],
            ],
            [
                'name' => 'Prof. Jonathan Johnson',
                'department' => 'Information Technology',
                'specialization' => 'Web and Mobile Development',
                'syllabusHandled' => ['IT-2nd Year-1st Sem-ITEW1', 'IT-3rd Year-1st Sem-ITEW3'],
                'sectionsHandled' => ['IT2A', 'IT3B'],
            ],
            [
                'name' => 'Prof. Angela Reyes',
                'department' => 'Information Technology',
                'specialization' => 'Networking and Security',
                'syllabusHandled' => ['IT-1st Year-1st Sem-CCS101'],
                'sectionsHandled' => ['IT1A', 'IT4A'],
            ],
            [
                'name' => 'Dr. Carlo Dizon',
                'department' => 'Computer Science',
                'specialization' => 'Software Engineering',
                'syllabusHandled' => ['CS-3rd Year-1st Sem-CS302', 'CS-4th Year-1st Sem-CS401'],
                'sectionsHandled' => ['CS3A', 'CS4A'],
            ],
            [
                'name' => 'Prof. Liza Mendoza',
                'department' => 'Information Technology',
                'specialization' => 'Information Management',
                'syllabusHandled' => ['IT-1st Year-1st Sem-CCS102'],
                'sectionsHandled' => ['IT1B', 'IT3A'],
            ],
        ];
    }

    private function defaultEvents(): array
    {
        return [
            ['name' => 'Basketball Tryouts', 'type' => 'Sports', 'date' => '2026-03-07'],
            ['name' => 'Programming Contest', 'type' => 'Academic', 'date' => '2026-03-10'],
            ['name' => 'Coding Workshop', 'type' => 'Academic', 'date' => '2026-03-12'],
            ['name' => 'Science Fair', 'type' => 'Academic', 'date' => '2026-03-15'],
            ['name' => 'Hackathon', 'type' => 'Academic', 'date' => '2026-03-20'],
            ['name' => 'Sports Festival', 'type' => 'Sports', 'date' => '2026-03-25'],
        ];
    }

    private function defaultSchedules(): array
    {
        return [
            ['course' => 'CS101', 'section' => 'CS2A', 'room' => 'Room 201', 'lab' => 'Lab 3', 'faculty' => 'Dr. Maria Smith', 'time' => 'MWF 9:00-10:00'],
            ['course' => 'ITEW1', 'section' => 'IT3B', 'room' => 'Room 305', 'lab' => 'Lab 1', 'faculty' => 'Prof. Jonathan Johnson', 'time' => 'TTh 1:00-2:30'],
        ];
    }

    private function defaultStudents(): array
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
                'studentNo' => $studentNo,
                'firstName' => $firstName,
                'middleName' => '',
                'lastName' => $lastName,
                'course' => $course,
                'yearLevel' => $yearLevel,
                'section' => $section,
                'skills' => array_values(array_unique([$skill1, $skill2, $skill3])),
                'affiliations' => [$affiliationPool[$i % 2]],
                'violations' => [],
                'academicHistory' => [],
                'nonAcademicHistory' => [],
            ];
        }

        return $rows;
    }
}
