import React from 'react';
import { useForm, Link } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        email: '',
        no_whatsapp: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-zinc-100 mb-6 text-center">Daftar Akun Baru</h2>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-purple-500"
                            required
                        />
                        {errors.nama && <div className="text-red-500 text-sm mt-1">{errors.nama}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-purple-500"
                            required
                        />
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">No. WhatsApp</label>
                        <input
                            type="text"
                            value={data.no_whatsapp}
                            onChange={(e) => setData('no_whatsapp', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-purple-500"
                            required
                        />
                        {errors.no_whatsapp && <div className="text-red-500 text-sm mt-1">{errors.no_whatsapp}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-purple-500"
                            required
                        />
                        {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-purple-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 font-semibold text-white rounded transition"
                    >
                        Daftar
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-zinc-400">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-purple-400 hover:underline">
                        Masuk
                    </Link>
                </div>
            </div>
        </div>
    );
}
