<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Produk;

class ProdukGambarSeeder extends Seeder
{
    public function run(): void
    {
        $targetDir = storage_path('app/public/produk');
        $sourceDir = public_path('images/produk');
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        if (is_dir($sourceDir)) {
            foreach (glob($sourceDir . '/*') as $srcFile) {
                $destFile = $targetDir . '/' . basename($srcFile);
                if (!file_exists($destFile)) {
                    copy($srcFile, $destFile);
                }
            }
        }

        $mapping = [
            'Air Mineral' => [
                'gambar' => 'produk/air_mineral.jpg',
                'stok' => 50,
            ],
            'Teh Manis' => [
                'gambar' => 'produk/teh_manis.jpg',
                'stok' => 35,
            ],
            'Isotonik' => [
                'gambar' => 'produk/isotonik.jpg',
                'stok' => 25,
            ],
            'Mie Instan' => [
                'gambar' => 'produk/mie_instan.jpg',
                'stok' => 30,
            ],
            'Shuttlecock Yonex' => [
                'gambar' => 'produk/shuttlecock_yonex.jpg',
                'stok' => 15,
            ],
            'Shuttlecock Garuda' => [
                'gambar' => 'produk/shuttlecock_garuda.jpg',
                'stok' => 20,
            ],
            'Le Mineral' => [
                'gambar' => 'produk/QrtrLJaUwsCUmzM9JJS1b7x5cJ9twwoOk9PlzBlA.jpg',
                'stok' => 40,
            ],
            'ayam geprek' => [
                'gambar' => 'produk/ayam_geprek.jpg',
                'stok' => 25,
            ],
        ];

        foreach ($mapping as $nama => $data) {
            $prod = Produk::where('nama_produk', $nama)->first();
            if ($prod) {
                $prod->update([
                    'gambar' => $data['gambar'],
                    'stok' => max($prod->stok, $data['stok']),
                ]);
            }
        }
    }
}
