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
        Schema::create('academic_history', function (Blueprint $table) {
            $table->bigIncrements('academic_id');
            $table->unsignedBigInteger('student_id')->index('idx_academic_student');
            $table->string('term', 80);
            $table->decimal('gpa', 3, 2)->nullable();
            $table->string('standing', 80)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('student_id', 'fk_academic_student')
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
        Schema::dropIfExists('academic_history');
    }
};
