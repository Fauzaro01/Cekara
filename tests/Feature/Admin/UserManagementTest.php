<?php

use App\Models\User;

test('guest is redirected to login when accessing admin users page', function () {
    $response = $this->get('/admin/users');

    $response->assertRedirect('/login');
});

test('non-admin user receives 403 forbidden when accessing admin users page', function () {
    $regularUser = User::factory()->create(['is_admin' => false]);

    $response = $this->actingAs($regularUser)->get('/admin/users');

    $response->assertForbidden();
});

test('admin can view users list and metrics', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $user1 = User::factory()->create(['name' => 'Warga Digital', 'is_admin' => false]);

    $response = $this->actingAs($admin)->get('/admin/users');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users.data')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can toggle user role between admin and regular user', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $targetUser = User::factory()->create(['is_admin' => false]);

    $response = $this->actingAs($admin)->patch("/admin/users/{$targetUser->id}/role");

    $response->assertRedirect();
    expect($targetUser->fresh()->is_admin)->toBeTrue();

    // Toggle back
    $this->actingAs($admin)->patch("/admin/users/{$targetUser->id}/role");
    expect($targetUser->fresh()->is_admin)->toBeFalse();
});

test('admin cannot demote their own account', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->patch("/admin/users/{$admin->id}/role");

    $response->assertSessionHas('error');
    expect($admin->fresh()->is_admin)->toBeTrue();
});

test('admin can update user details and role', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $targetUser = User::factory()->create([
        'name' => 'Nama Lama',
        'email' => 'lama@example.com',
        'is_admin' => false,
    ]);

    $response = $this->actingAs($admin)->put("/admin/users/{$targetUser->id}", [
        'name' => 'Nama Baru Diperbarui',
        'email' => 'baru@example.com',
        'is_admin' => true,
    ]);

    $response->assertRedirect();
    $targetUser->refresh();
    expect($targetUser->name)->toBe('Nama Baru Diperbarui')
        ->and($targetUser->email)->toBe('baru@example.com')
        ->and($targetUser->is_admin)->toBeTrue();
});

test('admin cannot demote their own account via update', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->put("/admin/users/{$admin->id}", [
        'name' => $admin->name,
        'email' => $admin->email,
        'is_admin' => false,
    ]);

    $response->assertSessionHas('error');
    expect($admin->fresh()->is_admin)->toBeTrue();
});

test('admin can delete another user', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $targetUser = User::factory()->create();

    $response = $this->actingAs($admin)->delete("/admin/users/{$targetUser->id}");

    $response->assertRedirect();
    expect(User::find($targetUser->id))->toBeNull();
});

test('admin cannot delete their own account', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");

    $response->assertSessionHas('error');
    expect(User::find($admin->id))->not->toBeNull();
});

