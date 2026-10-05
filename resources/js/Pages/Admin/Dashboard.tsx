import React from 'react';
import { useForm } from '@inertiajs/react';

interface Props {
    user: {
        nama: string;
        email: string;
        role: string;
    };
}

export default function AdminDashboard({ user }: Props) {
    const { post } = useForm();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
            <header className="flex justify-between items-center pb-6 border-b border-zinc-800">
                <h1 className="text-2xl font-bold text-purple-500">Panel Admin</h1>
                <div className="flex items-center space-x-4">
                    <span>Admin: {user?.nama}</span>
                    <button
                        onClick={() => post('/logout')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                        Keluar
                    </button>
                </div>
            </header>
            <main className="py-10">
                <p className="text-zinc-400">Selamat datang di Panel Admin Bigi Badminton!</p>
            </main>
        </div>
    );
}
