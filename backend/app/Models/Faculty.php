<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Faculty extends Model
{
    protected $table = 'faculties';
    protected $primaryKey = 'faculty_id';

    protected $fillable = [
        'name',
        'department',
        'specialization',
    ];

    public function syllabi(): BelongsToMany
    {
        return $this->belongsToMany(
            Syllabus::class,
            'faculty_syllabi',
            'faculty_id',
            'syllabus_id',
            'faculty_id',
            'syllabus_id'
        );
    }
}
