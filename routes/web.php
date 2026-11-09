<?php

use App\Http\Controllers\Admin\LlmProviderController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CommunityRadarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmergencyActionController;
use App\Http\Controllers\FamilyGuardianController;
use App\Http\Controllers\SimulationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Pilar Bertindak: Emergency Response Action Center
Route::get('/tanggap-darurat', [EmergencyActionController::class, 'index'])->name('emergency.index');
Route::redirect('/act', '/tanggap-darurat');

// Radar Ancaman Komunitas (Community Threat Radar)
Route::get('/radar', [CommunityRadarController::class, 'index'])->name('radar.index');
Route::post('/radar/{pattern}/upvote', [CommunityRadarController::class, 'upvote'])->name('radar.upvote');
Route::post('/radar', [CommunityRadarController::class, 'store'])->name('radar.store');

// Toolkit Guardian untuk Orang Tua & Guru (Family & School Guardian)
Route::get('/panduan-keluarga', [FamilyGuardianController::class, 'index'])->name('family.index');
Route::post('/panduan-keluarga/kuis', [FamilyGuardianController::class, 'submitQuiz'])->name('family.quiz.submit');

// Interactive Simulation Routes (Pilar Learn)
Route::get('/simulasi', [SimulationController::class, 'index'])->name('simulations.index');
Route::middleware('auth')->group(function () {
    Route::get('/simulasi/{slug}', [SimulationController::class, 'show'])->name('simulations.show');
    Route::post('/simulasi/{slug}/submit', [SimulationController::class, 'submit'])->name('simulations.submit');
});
Route::post('/simulasi/kontribusi', [SimulationController::class, 'contribute'])->name('simulations.contribute');

// Chatbot Fraud Analysis Endpoints
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/chat/analyze', [ChatController::class, 'analyze'])->name('chat.analyze');
    Route::post('/api/chat/analyze', [ChatController::class, 'analyze'])->name('api.chat.analyze');
});

// Admin LLM Provider Management Routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/llm-providers', [LlmProviderController::class, 'index'])->name('llm-providers.index');
    Route::post('/llm-providers', [LlmProviderController::class, 'store'])->name('llm-providers.store');
    Route::put('/llm-providers/{provider}', [LlmProviderController::class, 'update'])->name('llm-providers.update');
    Route::post('/llm-providers/{provider}/activate', [LlmProviderController::class, 'activate'])->name('llm-providers.activate');
});

// Authenticated User Routes (Auth Gate)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::delete('/scans/{id}', [DashboardController::class, 'destroyScan'])
        ->whereNumber('id')
        ->name('scans.destroy');

    // Checklist state mutation (Auth Gated)
    Route::post('/tanggap-darurat/checklist/toggle', [EmergencyActionController::class, 'toggleChecklist'])
        ->name('emergency.checklist.toggle');
    Route::post('/tanggap-darurat/checklist/reset', [EmergencyActionController::class, 'resetChecklist'])
        ->name('emergency.checklist.reset');
});

require __DIR__.'/auth.php';
