import React from 'react';
import { Link } from '@inertiajs/react';
import { APP_CONTENT } from '../lib/content';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6">
            <header className="flex justify-between items-center py-4 border-b border-zinc-800 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-purple-500">{APP_CONTENT.nama}</h1>
                <div className="space-x-4">
                    <Link href="/login" className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 font-semibold text-white">
                        Masuk
                    </Link>
                    <Link href="/register" className="px-4 py-2 rounded border border-zinc-700 hover:border-purple-500 font-semibold text-zinc-300">
                        Daftar
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto text-center py-20">
                <h2 className="text-4xl font-extrabold mb-4">{APP_CONTENT.deskripsi}</h2>
                <p className="text-zinc-400 text-lg mb-2">{APP_CONTENT.alamat}</p>
                <p className="text-purple-400 font-medium mb-8">Jam Operasional: {APP_CONTENT.jam_operasional}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                    {APP_CONTENT.fasilitas.map((f, i) => (
                        <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                            ✓ {f}
                        </div>
                    ))}
                </div>
            </main>

            <footer className="text-center py-6 text-zinc-600 border-t border-zinc-800">
                © {new Date().getFullYear()} {APP_CONTENT.nama}. All rights reserved.
            </footer>
        </div>
    );
}
