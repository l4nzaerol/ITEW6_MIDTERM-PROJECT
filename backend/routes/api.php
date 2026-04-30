<?php

use App\Http\Controllers\DomainDataController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::get('/students', [DomainDataController::class, 'getStudents']);
Route::post('/students', [DomainDataController::class, 'createStudent']);
Route::put('/students/{studentNo}', [DomainDataController::class, 'updateStudent']);
Route::delete('/students/{studentNo}', [DomainDataController::class, 'deleteStudent']);
Route::put('/students/by-id/{id}', [DomainDataController::class, 'updateStudentById']);
Route::delete('/students/by-id/{id}', [DomainDataController::class, 'deleteStudentById']);

Route::get('/syllabi', [DomainDataController::class, 'getSyllabi']);

Route::get('/faculties', [DomainDataController::class, 'getFaculties']);
Route::post('/faculties', [DomainDataController::class, 'createFaculty']);
Route::put('/faculties/{id}', [DomainDataController::class, 'updateFaculty']);
Route::delete('/faculties/{id}', [DomainDataController::class, 'deleteFaculty']);

Route::get('/events', [DomainDataController::class, 'getEvents']);
Route::post('/events', [DomainDataController::class, 'createEvent']);
Route::put('/events/{id}', [DomainDataController::class, 'updateEvent']);
Route::delete('/events/{id}', [DomainDataController::class, 'deleteEvent']);

Route::get('/schedules', [DomainDataController::class, 'getSchedules']);
Route::post('/schedules', [DomainDataController::class, 'createSchedule']);
Route::put('/schedules/{id}', [DomainDataController::class, 'updateSchedule']);
Route::delete('/schedules/{id}', [DomainDataController::class, 'deleteSchedule']);

Route::post('/bootstrap/frontend-dummy', [DomainDataController::class, 'bootstrapFrontendDummy']);
