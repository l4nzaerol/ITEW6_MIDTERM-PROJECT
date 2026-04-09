<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NonAcademicActivity extends Model
{
    protected $table = 'non_academic_activities';
    protected $primaryKey = 'activity_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'activity',
        'role',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
