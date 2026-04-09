<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $table = 'students';
    protected $primaryKey = 'student_id';

    protected $fillable = [
        'student_no',
        'first_name',
        'last_name',
        'middle_name',
        'course',
        'year_level',
        'section',
    ];

    public function academicHistory(): HasMany
    {
        return $this->hasMany(AcademicHistory::class, 'student_id', 'student_id');
    }

    public function nonAcademicActivities(): HasMany
    {
        return $this->hasMany(NonAcademicActivity::class, 'student_id', 'student_id');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class, 'student_id', 'student_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(
            Skill::class,
            'student_skills',
            'student_id',
            'skill_id',
            'student_id',
            'skill_id'
        );
    }

    public function affiliations(): BelongsToMany
    {
        return $this->belongsToMany(
            Affiliation::class,
            'student_affiliations',
            'student_id',
            'affiliation_id',
            'student_id',
            'affiliation_id'
        );
    }
}
