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
        Schema::create('student_affiliations', function (Blueprint $table) {
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('affiliation_id');
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['student_id', 'affiliation_id']);
            $table->index('affiliation_id', 'idx_student_affiliations_aff');

            $table->foreign('student_id', 'fk_student_aff_student')
                ->references('student_id')
                ->on('students')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('affiliation_id', 'fk_student_aff_affiliation')
                ->references('affiliation_id')
                ->on('affiliations')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_affiliations');
    }
};
