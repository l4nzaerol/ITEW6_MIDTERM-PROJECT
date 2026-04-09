<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Affiliation extends Model
{
    protected $table = 'affiliations';
    protected $primaryKey = 'affiliation_id';
    public $timestamps = false;

    protected $fillable = ['affiliation_name', 'affiliation_type'];

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            Student::class,
            'student_affiliations',
            'affiliation_id',
            'student_id',
            'affiliation_id',
            'student_id'
        );
    }
}
