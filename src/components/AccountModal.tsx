'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const updates: any = { id: user.id };
            if (fullName !== profile?.full_name) updates.fullName = fullName;
            if (email !== profile?.email) {
                updates.email = email;
                updates.oldEmail = profile?.email;
            }
            if (password.length > 0) {
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setIsSaving(false);
                    return;
                }
                updates.password = password;
            }

            // Check if anything changed
            if (Object.keys(updates).length <= 1) {
                setError('No changes to save');
                setIsSaving(false);
                return;
            }

            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');

            setSuccess(true);
            setPassword('');
            await refreshProfile();
            setTimeout(() => setSuccess(false), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update account');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
                    <h2 className="text-lg font-semibold text-white">Account Settings</h2>
                    <button onClick={onClose} className="p-1.5 text-[#71717a] hover:text-white rounded-lg hover:bg-[#111] transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Avatar & Info */}
                <div className="px-6 pt-5 pb-2">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#06b6d4]/20 flex items-center justify-center text-lg font-bold text-white border border-[#1e1e1e]">
                            {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-[#71717a]">{profile?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="px-6 space-y-4">
                    {error && (
                        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm p-3 rounded-xl animate-slide-down">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm p-3 rounded-xl flex items-center gap-2 animate-slide-down">
                            <CheckCircle2 size={16} />
                            Account updated successfully
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#a1a1aa] flex items-center gap-1.5">
                            <User size={12} /> Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-[#3f3f46]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#a1a1aa] flex items-center gap-1.5">
                            <Mail size={12} /> Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-[#3f3f46]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#a1a1aa] flex items-center gap-1.5">
                            <Lock size={12} /> New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 px-4 pr-10 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-[#3f3f46]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#111] border border-[#1e1e1e] text-white text-sm font-medium hover:bg-[#181818] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
