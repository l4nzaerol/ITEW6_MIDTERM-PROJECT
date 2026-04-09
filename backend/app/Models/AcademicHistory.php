<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicHistory extends Model
{
    protected $table = 'academic_history';
    protected $primaryKey = 'academic_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'term',
        'gpa',
        'standing',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
