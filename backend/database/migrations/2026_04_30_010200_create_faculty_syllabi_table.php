<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_syllabi', function (Blueprint $table) {
            $table->unsignedBigInteger('faculty_id');
            $table->string('syllabus_id', 255);

            $table->primary(['faculty_id', 'syllabus_id']);

            $table->foreign('faculty_id', 'fk_faculty_syllabi_faculty')
                ->references('faculty_id')
                ->on('faculties')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('syllabus_id', 'fk_faculty_syllabi_syllabus')
                ->references('syllabus_id')
                ->on('syllabi')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_syllabi');
    }
};
