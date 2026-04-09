<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->bigIncrements('student_id');
            $table->string('student_no', 30)->nullable()->unique('uq_students_student_no');
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('middle_name', 80)->nullable();

            $table->string('course', 120)->nullable()->index('idx_students_course');
            $table->string('year_level', 30)->nullable()->index('idx_students_year_level');
            $table->string('section', 30)->nullable()->index('idx_students_section');

            $table->timestamps();

            $table->index(['last_name', 'first_name'], 'idx_students_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
