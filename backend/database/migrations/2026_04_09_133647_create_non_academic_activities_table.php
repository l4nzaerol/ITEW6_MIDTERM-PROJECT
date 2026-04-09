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
        Schema::create('non_academic_activities', function (Blueprint $table) {
            $table->bigIncrements('activity_id');
            $table->unsignedBigInteger('student_id')->index('idx_activity_student');
            $table->string('activity', 160);
            $table->string('role', 120)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('student_id', 'fk_activity_student')
                ->references('student_id')
                ->on('students')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('non_academic_activities');
    }
};
