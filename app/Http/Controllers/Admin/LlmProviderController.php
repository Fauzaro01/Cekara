<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LlmProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LlmProviderController extends Controller
{
    /**
     * Display a listing of LLM providers.
     */
    public function index(): Response
    {
        $providers = LlmProvider::query()
            ->orderBy('id')
            ->get()
            ->map(function (LlmProvider $provider) {
                return [
                    'id' => $provider->id,
                    'key' => $provider->key,
                    'name' => $provider->name,
                    'model' => $provider->model,
                    'base_url' => $provider->base_url,
                    'custom_headers' => $provider->custom_headers,
                    'is_active' => (bool) $provider->is_active,
                    'has_api_key' => $provider->hasApiKey(),
                    'masked_api_key' => $provider->getMaskedApiKey(),
                ];
            });

        return Inertia::render('admin/llm-providers', [
            'providers' => $providers,
        ]);
    }

    /**
     * Store a newly created provider in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'key' => ['required', 'string', 'max:50', 'unique:llm_providers,key'],
            'model' => ['required', 'string', 'max:255'],
            'base_url' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string'],
            'custom_headers' => ['nullable', 'array'],
        ]);

        LlmProvider::create([
            ...$validated,
            'is_active' => false,
        ]);

        return back()->with('status', 'Provider berhasil ditambahkan.');
    }

    /**
     * Update the specified provider credentials and settings.
     */
    public function update(Request $request, string|int $provider): RedirectResponse
    {
        $providerModel = LlmProvider::findOrFail($provider);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'base_url' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string'],
            'custom_headers' => ['nullable', 'array'],
        ]);

        if (isset($validated['name'])) {
            $providerModel->name = $validated['name'];
        }

        $providerModel->model = $validated['model'];

        if (array_key_exists('base_url', $validated)) {
            $providerModel->base_url = $validated['base_url'];
        }

        if (array_key_exists('custom_headers', $validated)) {
            $providerModel->custom_headers = $validated['custom_headers'];
        }

        if (! empty($validated['api_key'])) {
            $providerModel->api_key = $validated['api_key'];
        }

        $providerModel->save();

        return back()->with('status', "Provider {$providerModel->name} berhasil diperbarui.");
    }

    /**
     * Set the selected provider as active and deactivate all others.
     */
    public function activate(string|int $provider): RedirectResponse
    {
        $providerModel = LlmProvider::findOrFail($provider);

        DB::transaction(function () use ($providerModel) {
            LlmProvider::where('id', '!=', $providerModel->id)->update(['is_active' => false]);
            $providerModel->update(['is_active' => true]);
        });

        return back()->with('status', "Provider {$providerModel->name} aktif sebagai provider utama.");
    }
}
