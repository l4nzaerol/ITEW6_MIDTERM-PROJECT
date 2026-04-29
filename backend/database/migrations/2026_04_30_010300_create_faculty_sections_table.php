<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_sections', function (Blueprint $table) {
            $table->unsignedBigInteger('faculty_id');
            $table->string('section_code', 64);

            $table->primary(['faculty_id', 'section_code']);

            $table->foreign('faculty_id', 'fk_faculty_sections_faculty')
                ->references('faculty_id')
                ->on('faculties')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_sections');
    }
};
