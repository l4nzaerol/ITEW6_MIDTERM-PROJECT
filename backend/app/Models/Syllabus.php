<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Syllabus extends Model
{
    protected $table = 'syllabi';
    protected $primaryKey = 'syllabus_id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'syllabus_id',
        'track',
        'year_level',
        'term_label',
        'course_code',
        'title',
    ];
}
