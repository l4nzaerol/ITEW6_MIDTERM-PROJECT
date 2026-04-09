<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    protected $table = 'skills';
    protected $primaryKey = 'skill_id';
    public $timestamps = false;

    protected $fillable = ['skill_name'];

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            Student::class,
            'student_skills',
            'skill_id',
            'student_id',
            'skill_id',
            'student_id'
        );
    }
}
