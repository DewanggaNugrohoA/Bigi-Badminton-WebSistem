<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    
    protected $rootView = 'app';

    
    public function version(Request $request): ?string
    {
        $manifest = public_path('build/manifest.json');
        return file_exists($manifest) ? (string) filemtime($manifest) : parent::version($request);
    }

    
    public function share(Request $request): array
    {
        
        $isStaffArea = $request->is('admin*') || $request->is('kasir*');
        $user = $isStaffArea
            ? ($request->user('staff') ?: null)
            : ($request->user('web') ?: null);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id_user' => $user->id_user,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'role' => $user->role,
                    'foto' => $user->foto,
                ] : null,
            ],
            'config' => [
                'wa_admin_number' => config('bigi.wa_admin_number'),
                'wa_admin_number_secondary' => config('bigi.wa_admin_number_secondary'),
                'alamat' => config('bigi.alamat'),
                'instagram' => config('bigi.instagram'),
                'instagram_url' => config('bigi.instagram_url'),
                'maps_url' => config('bigi.maps_url'),
                'maps_embed_url' => config('bigi.maps_embed_url'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}