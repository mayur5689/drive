'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, LogIn, Cloud, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000] flex items-center justify-center p-4 font-sans">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-[#6366f1]/[0.07] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-[#06b6d4]/[0.05] blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-[400px] animate-slide-up relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center mb-4 shadow-lg shadow-[#6366f1]/20">
                        <Cloud size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        AI Cloud Storage
                    </h1>
                    <p className="text-[#71717a] text-sm mt-1">
                        Your intelligent file manager
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
                        <p className="text-[#71717a] text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm p-3 rounded-xl flex items-center gap-2 animate-slide-down">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#a1a1aa]">
                                Email
                            </label>
                            <input
                                required
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all placeholder:text-[#3f3f46]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#a1a1aa]">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all placeholder:text-[#3f3f46]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#6366f1] text-white py-2.5 rounded-xl font-medium text-sm hover:bg-[#818cf8] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-[#6366f1]/20"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-sm text-[#71717a]">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-[#6366f1] hover:text-[#818cf8] transition-colors font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
