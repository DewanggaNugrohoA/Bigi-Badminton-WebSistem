<?php

return [
    'nama' => 'Bigi Badminton',
    'deskripsi' => 'Sistem Reservasi dan Informasi Open Mabar Bigi Badminton (2 Lapangan)',
    'wa_admin_number' => env('WA_ADMIN_NUMBER', '6285664943141'),
    'wa_admin_number_secondary' => env('WA_ADMIN_NUMBER_SECONDARY', '6282374236585'),
    'wa_numbers' => ['085664943141', '082374236585'],
    'alamat' => 'Lihat lokasi di peta',
    'maps_url' => 'https://maps.google.com/?q=-3.815252,102.293190',
    'maps_embed_url' => 'https://maps.google.com/maps?q=-3.815252,102.293190&z=16&output=embed',
    'instagram' => '@bigi_badminton',
    'instagram_url' => 'https://instagram.com/bigi_badminton',
    'jam_operasional' => '08:00 - 23:00 WIB',
    'fasilitas' => [
        '2 Lapangan Karpet Vinyl Premium',
        'Penerangan LED Standard Turnamen',
        'Kantin / POS Snack & Minuman',
        'Area Parkir Luas & Aman',
        'Toilet & Kamar Ganti Bersih',
        'Wi-Fi Gratis Berkecepatan Tinggi',
    ],
    'wa_gateway_provider' => env('WA_GATEWAY_PROVIDER', 'fonnte'),
    'wa_gateway_url' => env('WA_GATEWAY_URL', 'https://api.fonnte.com/send'),
    'wa_gateway_token' => env('WA_GATEWAY_TOKEN', ''),
];
