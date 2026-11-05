<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

test('unauthenticated guests are redirected to login when accessing profile', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->get('/profile');

    $response->assertRedirect($loginUrl);
});

test('unauthenticated guests are redirected to login when accessing admin routes', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';

    // GET admin providers
    $response = $this->get('/admin/llm-providers');
    $response->assertRedirect($loginUrl);

    // POST / PUT admin endpoints
    $response = $this->post('/admin/llm-providers', [
        'name' => 'Test Provider',
    ]);
    $response->assertRedirect($loginUrl);

    $response = $this->put('/admin/llm-providers/1', [
        'name' => 'Updated Provider',
    ]);
    $response->assertRedirect($loginUrl);

    $response = $this->post('/admin/llm-providers/1/activate');
    $response->assertRedirect($loginUrl);
});

test('unauthenticated guests cannot perform logout', function () {
    $loginUrl = Route::has('login') ? route('login') : '/login';
    $logoutUrl = Route::has('logout') ? route('logout') : '/logout';

    $response = $this->post($logoutUrl);

    $response->assertRedirect($loginUrl);
});
test('authenticated regular non-admin users receive 403 forbidden when accessing admin routes', function () {
    $attributes = [];
    if (Schema::hasColumn('users', 'is_admin')) {
        $attributes['is_admin'] = false;
    }
    $regularUser = User::factory()->create($attributes);

    // Regular user attempting to view admin panel
    $response = $this->actingAs($regularUser)->get('/admin/llm-providers');
    $response->assertForbidden();

    // Regular user attempting to mutate admin provider
    $response = $this->actingAs($regularUser)->put('/admin/llm-providers/1', [
        'model' => 'malicious-model',
    ]);
    $response->assertForbidden();

    $response = $this->actingAs($regularUser)->post('/admin/llm-providers/1/activate');
    $response->assertForbidden();
});

test('authenticated users can access profile route without redirect to login', function () {
    $user = User::factory()->create();

    $loginUrl = Route::has('login') ? route('login') : '/login';

    $response = $this->actingAs($user)->get('/profile');

    // Should not redirect to login page
    if ($response->isRedirect()) {
        expect($response->headers->get('Location'))->not->toBe($loginUrl);
    } else {
        $response->assertOk();
    }
});
