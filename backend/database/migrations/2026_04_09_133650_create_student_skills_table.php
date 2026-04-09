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
        Schema::create('student_skills', function (Blueprint $table) {
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('skill_id');
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['student_id', 'skill_id']);
            $table->index('skill_id', 'idx_student_skills_skill');

            $table->foreign('student_id', 'fk_student_skills_student')
                ->references('student_id')
                ->on('students')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('skill_id', 'fk_student_skills_skill')
                ->references('skill_id')
                ->on('skills')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_skills');
    }
};
