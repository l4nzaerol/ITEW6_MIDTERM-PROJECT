<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->bigIncrements('schedule_id');
            $table->string('course_code', 64);
            $table->string('section_code', 64);
            $table->string('room', 128)->nullable();
            $table->string('lab', 128)->nullable();
            $table->string('faculty_name', 255)->nullable();
            $table->string('time_slot', 128)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
