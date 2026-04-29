<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('syllabi', function (Blueprint $table) {
            $table->string('syllabus_id', 255)->primary();
            $table->string('track', 16);
            $table->string('year_level', 32);
            $table->string('term_label', 32);
            $table->string('course_code', 64);
            $table->string('title', 255);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('syllabi');
    }
};
