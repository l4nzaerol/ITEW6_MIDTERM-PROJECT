<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $table = 'schedules';
    protected $primaryKey = 'schedule_id';

    protected $fillable = [
        'course_code',
        'section_code',
        'room',
        'lab',
        'faculty_name',
        'time_slot',
    ];
}
