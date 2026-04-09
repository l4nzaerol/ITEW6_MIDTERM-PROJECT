<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Violation extends Model
{
    protected $table = 'violations';
    protected $primaryKey = 'violation_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'violation_text',
        'violation_date',
        'severity',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
