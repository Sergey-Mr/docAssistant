<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tabs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('user_texts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('tab_id')->constrained()->onDelete('cascade');
            $table->text('text_content');
            $table->timestamps();
            $table->foreignId('previous_version_id')
                ->nullable()
                ->constrained('user_texts')
                ->nullOnDelete();
        });
        
        Schema::create('text_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_text_id')->constrained()->onDelete('cascade');
            $table->integer('start_index');
            $table->integer('end_index');
            $table->text('original_text');
            $table->text('updated_text');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_texts');
        Schema::dropIfExists('tabs');
        Schema::dropIfExists('text_changes');
    }
};