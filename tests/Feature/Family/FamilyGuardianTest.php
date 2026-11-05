<?php

test('guest can view family guardian toolkit and cheat sheets', function () {
    $response = $this->get(route('family.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('family/index')
        ->has('cheatSheets', 5)
        ->has('quizQuestions', 5)
    );
});

test('evaluates family quiz correctly for highly vigilant family', function () {
    $response = $this->postJson(route('family.quiz.submit'), [
        'answers' => [
            1 => 'B', // 20
            2 => 'A', // 20
            3 => 'A', // 20
            4 => 'B', // 20
            5 => 'A', // 20
        ],
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'score' => 100,
        'badgeColor' => 'safe',
    ]);
});

test('evaluates family quiz correctly for vulnerable family', function () {
    $response = $this->postJson(route('family.quiz.submit'), [
        'answers' => [
            1 => 'A', // 0
            2 => 'B', // 0
            3 => 'B', // 0
            4 => 'A', // 0
            5 => 'B', // 0
        ],
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'score' => 0,
        'badgeColor' => 'danger',
    ]);
});

test('submitting quiz validates required answers', function () {
    $response = $this->postJson(route('family.quiz.submit'), [
        'answers' => [],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['answers']);
});
