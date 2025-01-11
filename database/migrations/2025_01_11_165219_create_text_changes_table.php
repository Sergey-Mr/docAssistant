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
        Schema::create('text_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_text_id')->constrained('user_texts');
            $table->integer('start_index');
            $table->integer('end_index');
            $table->text('original_text');
            $table->text('updated_text');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('text_changes');
    }
};
