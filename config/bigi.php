<?php

return [
    'nama' => 'Bigi Badminton',
    'deskripsi' => 'Sistem Reservasi dan Informasi Open Mabar Bigi Badminton (2 Lapangan)',
    'wa_admin_number' => env('WA_ADMIN_NUMBER', '6281234567890'),
    'alamat' => 'Jl. Universitas Bengkulu No. 1, Kota Bengkulu',
    'instagram' => '@bigibadminton',
    'jam_operasional' => '08:00 - 23:00 WIB',
    'fasilitas' => [
        '2 Lapangan Karpet Vinyl Premium',
        'Penerangan LED Standard Turnamen',
        'Kantin / POS Snack & Minuman',
        'Area Parkir Luas & Aman',
        'Toilet & Kamar Ganti Clean',
        'Free Wi-Fi High Speed',
    ],
    'wa_gateway_provider' => env('WA_GATEWAY_PROVIDER', 'fonnte'),
    'wa_gateway_url' => env('WA_GATEWAY_URL', 'https://api.fonnte.com/send'),
    'wa_gateway_token' => env('WA_GATEWAY_TOKEN', ''),
];
