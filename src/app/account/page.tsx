'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
    User,
    Mail,
    Lock,
    Shield,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X as CloseIcon,
    ArrowLeft,
    Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
    const { profile, refreshProfile } = useAuth();
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setEmail(profile.email || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    // Auto-hide status after 5 seconds
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => setStatus(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        if (password && password !== confirmPassword) {
            setStatus({ type: 'error', message: "Passwords do not match!" });
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: profile.id,
                    fullName: fullName !== profile.full_name ? fullName : undefined,
                    email: email !== profile.email ? email : undefined,
                    password: password || undefined,
                    avatarUrl: avatarUrl !== profile.avatar_url ? avatarUrl : undefined,
                    oldEmail: profile.email
                })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: "Account updated successfully!" });
                setPassword('');
                setConfirmPassword('');
                await refreshProfile();
            } else {
                const err = await response.json();
                setStatus({ type: 'error', message: err.error });
            }
        } catch (error) {
            console.error('Update failed:', error);
            setStatus({ type: 'error', message: "Failed to update account." });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            setStatus({ type: 'error', message: "Please select an image file." });
            return;
        }

        setIsUploading(true);
        setStatus({ type: 'success', message: "Uploading image..." });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const newAvatarUrl = data.url;
            setAvatarUrl(newAvatarUrl);

            // Persist immediately!
            const persistRes = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: profile.id,
                    avatarUrl: newAvatarUrl
                })
            });

            if (persistRes.ok) {
                setStatus({ type: 'success', message: "Profile image updated instantly!" });
                await refreshProfile();
            } else {
                throw new Error("Persistence failed");
            }
        } catch (error) {
            console.error('Upload/Sync error:', error);
            setStatus({ type: 'error', message: "Failed to update profile image." });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B]">
                <div className="flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r border-shark mt-6 mr-6 relative">

                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-8 bg-black/20 shrink-0 border-b border-shark/40">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/5 rounded-xl text-storm-gray hover:text-white transition-all flex items-center gap-2 font-bold text-xs"
                            >
                                <ArrowLeft size={16} />
                                <span>Back</span>
                            </button>
                            <div className="h-4 w-px bg-shark" />
                            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-3">
                                <Shield size={18} className="text-[#279da6]" />
                                Account Settings
                            </h1>
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto custom-scrollbar p-12">
                        {/* Status Notification */}
                        {status && (
                            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${status.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-xs font-black uppercase tracking-tight">{status.message}</span>
                                    <button onClick={() => setStatus(null)} className="ml-2 hover:opacity-70">
                                        <CloseIcon size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="max-w-4xl mx-auto space-y-12">
                            {/* Profile Header Card */}
                            <div className="bg-[#18181B] border border-shark/60 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform text-[#279da6]">
                                    <User size={160} />
                                </div>
                                <div className="flex items-center gap-8 relative z-10">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 rounded-full bg-shark flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br from-[#279da6]/40 via-[#279da6]/10 to-transparent ring-4 ring-shark/50 shadow-2xl relative group/avatar cursor-pointer overflow-hidden"
                                    >
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt="Profile"
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || profile?.email?.[0].toUpperCase() || 'U'
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-20">
                                            {isUploading ? (
                                                <Loader2 size={18} className="text-[#279da6] animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera size={18} className="text-white" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Change</span>
                                                </>
                                            )}
                                        </div>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                            {profile?.full_name || (profile?.role === 'super_admin' ? 'Super Admin' : 'User Account')}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em]">{profile?.role?.replace('_', ' ') || 'Guest Account'}</p>
                                            <div className="w-1 h-1 rounded-full bg-[#279da6]" />
                                            <p className="text-[10px] font-black text-[#279da6] uppercase tracking-[0.2em]">{profile?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Form Grid */}
                            <form onSubmit={handleUpdateAccount} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Identity Section */}
                                <div className="bg-[#18181B] border border-shark/60 rounded-[2.5rem] p-10 space-y-8 animate-fade-in shadow-xl">
                                    <h3 className="text-[11px] font-black text-storm-gray uppercase tracking-[0.3em] flex items-center gap-3">
                                        <User size={14} className="text-[#279da6]" /> Identity & Contact
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-storm-gray uppercase tracking-[0.25em] ml-2">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray" size={16} />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-[#09090B] border border-shark/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold"
                                                    placeholder={profile?.role === 'super_admin' ? "Super Admin" : "Enter your name"}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-storm-gray uppercase tracking-[0.25em] ml-2">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray" size={16} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-[#09090B] border border-shark/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold"
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <p className="text-[9px] text-storm-gray/60 ml-2 font-bold italic lowercase italic opacity-80">changing email requires logging in again.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Section */}
                                <div className="bg-[#18181B] border border-shark/60 rounded-[2.5rem] p-10 space-y-8 animate-fade-in shadow-xl">
                                    <h3 className="text-[11px] font-black text-storm-gray uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Lock size={14} className="text-[#279da6]" /> Security & Access
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-storm-gray uppercase tracking-[0.25em] ml-2">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-[#09090B] border border-shark/50 rounded-2xl py-4 pl-12 pr-12 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold"
                                                    placeholder={password ? "" : "Dontchangeme@01"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-storm-gray hover:text-white transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-storm-gray uppercase tracking-[0.25em] ml-2">Confirm Password</label>
                                            <div className="relative">
                                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-[#09090B] border border-shark/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Footer / Action */}
                                <div className="lg:col-span-2 flex items-center justify-between bg-shark/10 border border-shark/30 p-8 rounded-[2rem]">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-iron uppercase tracking-widest leading-none">Finalize Profile Update</p>
                                        <p className="text-[9px] text-storm-gray font-bold lowercase opacity-80">last synced: {new Date().toLocaleTimeString()}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="h-14 truncate px-10 bg-[#279da6] hover:bg-[#279da6]/90 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#279da6]/30 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                    >
                                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                                        {isUpdating ? 'Synchronizing...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
