<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Faculty;
use App\Models\Schedule;
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
        $syllabi = is_array($payload['syllabi'] ?? null) ? $payload['syllabi'] : [];
        $faculties = is_array($payload['faculties'] ?? null) ? $payload['faculties'] : [];
        $events = is_array($payload['events'] ?? null) ? $payload['events'] : [];
        $schedules = is_array($payload['schedules'] ?? null) ? $payload['schedules'] : [];

        $result = [
            'seeded' => [
                'syllabi' => 0,
                'faculties' => 0,
                'events' => 0,
                'schedules' => 0,
            ],
        ];

        DB::transaction(function () use ($syllabi, $faculties, $events, $schedules, &$result) {
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
}
