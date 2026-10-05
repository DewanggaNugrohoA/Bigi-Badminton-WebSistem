import React from 'react';
import { useForm, Link } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-zinc-100 mb-6 text-center">Masuk ke Bigi Badminton</h2>
                
                <form onSubmit={submit} className="space-y-4">
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

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 font-semibold text-white rounded transition"
                    >
                        Masuk
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-zinc-400">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-purple-400 hover:underline">
                        Daftar
                    </Link>
                </div>
            </div>
        </div>
    );
}
