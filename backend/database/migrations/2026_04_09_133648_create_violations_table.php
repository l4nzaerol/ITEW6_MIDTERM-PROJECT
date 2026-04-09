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
        Schema::create('violations', function (Blueprint $table) {
            $table->bigIncrements('violation_id');
            $table->unsignedBigInteger('student_id')->index('idx_violations_student');
            $table->string('violation_text', 255);
            $table->date('violation_date')->nullable();
            $table->enum('severity', ['minor', 'major'])->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('student_id', 'fk_violations_student')
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
        Schema::dropIfExists('violations');
    }
};
