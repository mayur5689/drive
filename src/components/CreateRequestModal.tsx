'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Layout,
    Type,
    AlignLeft,
    BarChart,
    CheckCircle2,
    Loader2,
    User,
    ChevronDown,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    profile_id?: string;
    full_name?: string;
    email: string;
    role: string;
    name?: string;
    organization?: string;
}

interface CreateRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [clients, setClients] = useState<Profile[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedClientId, setSelectedClientId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        setIsLoadingClients(true);
        try {
            // We'll fetch from a new endpoint or existing one if available
            // Assuming /api/clients returns the list
            const response = await fetch('/api/clients');
            const data = await response.json();
            if (response.ok) {
                // Map database clients to the profile structure if needed
                setClients(data);
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setIsLoadingClients(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && selectedClientId) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    client_id: selectedClientId,
                    priority,
                    status: 'Todo'
                })
            });

            if (response.ok) {
                const data = await response.json();
                onSuccess();
                onClose();
                router.push(`/requests/${data.id}`);
                // Reset form
                setStep(1);
                setSelectedClientId('');
                setTitle('');
                setDescription('');
                setPriority('Medium');
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Failed to create request:', error);
            alert("Failed to create request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-2xl bg-[#121214] border border-shark/50 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Step Indicator Sidebar/Top */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-12 z-20">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 1 ? 'bg-[#279da6] text-white' : 'bg-shark text-storm-gray'
                            }`}>
                            {step > 1 ? <CheckCircle2 size={16} /> : '1'}
                        </div>
                    </div>
                    <div className="w-12 h-0.5 bg-shark" />
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 2 ? 'bg-[#279da6] text-white' : 'bg-shark text-storm-gray'
                            }`}>
                            2
                        </div>
                    </div>
                </div>

                <div className="pt-24 pb-12 px-12">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Create Request</h2>
                            <p className="text-sm font-bold text-storm-gray mt-1 uppercase tracking-widest">Request information</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-shark/50 rounded-xl text-storm-gray transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-6 animate-slide-up">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] ml-1">
                                    Client <span className="text-rose-500">(Required)</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray group-focus-within:text-[#279da6] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <select
                                        className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-3 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 appearance-none cursor-pointer"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="">Select a client...</option>
                                        {clients.map(client => (
                                            <option
                                                key={client.id}
                                                value={client.profile_id || ''}
                                                disabled={!client.profile_id}
                                            >
                                                {client.full_name || client.name} ({client.organization || client.email}) {!client.profile_id ? '- (Account Not Activated)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-storm-gray pointer-events-none">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                                {isLoadingClients && (
                                    <p className="text-[10px] font-bold text-[#279da6] uppercase tracking-widest ml-1 animate-pulse">Loading clients...</p>
                                )}
                            </div>

                            <div className="pt-8 flex justify-between items-center">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3.5 rounded-2xl text-xs font-black text-iron hover:bg-shark transition-all uppercase tracking-widest"
                                >
                                    Exit
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!selectedClientId}
                                    className="bg-shark text-iron hover:bg-[#279da6] hover:text-white px-10 py-3.5 rounded-2xl text-xs font-black transition-all uppercase tracking-[0.2em] disabled:opacity-30 flex items-center gap-2 shadow-xl shadow-black/20"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-up">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] ml-1">
                                    Title <span className="text-rose-500">(Required)</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray group-focus-within:text-[#279da6] transition-colors">
                                        <Type size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter request title"
                                        className="w-full bg-[#18181B] border border-shark/60 rounded-2xl py-4 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] ml-1">
                                    Description <span className="text-rose-500">(Required)</span>
                                </label>
                                <div className="bg-[#18181B] border border-shark/60 rounded-2xl overflow-hidden focus-within:border-[#279da6]/50 transition-all">
                                    <div className="px-4 py-2 border-b border-shark bg-[#121214] flex items-center gap-4 text-storm-gray">
                                        <button type="button" className="hover:text-white transition-colors font-bold text-sm">B</button>
                                        <button type="button" className="hover:text-white transition-colors italic text-sm">I</button>
                                        <button type="button" className="hover:text-white transition-colors underline text-sm">U</button>
                                        <div className="w-px h-4 bg-shark" />
                                        <button type="button" className="hover:text-white transition-colors leading-none">
                                            <AlignLeft size={16} />
                                        </button>
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="I am looking to create a display for my website..."
                                        className="w-full bg-transparent p-4 text-sm text-iron focus:outline-none font-medium min-h-[160px] resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] ml-1">
                                    Priority
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray group-focus-within:text-[#279da6] transition-colors">
                                        <BarChart size={18} />
                                    </div>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-[#18181B] border border-shark/60 rounded-2xl py-4 pl-12 pr-12 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-storm-gray pointer-events-none">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    className="px-8 py-3.5 rounded-2xl text-xs font-black text-iron hover:bg-shark transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!title.trim() || !description.trim() || isSubmitting}
                                    className="bg-[#279da6] text-white hover:bg-[#279da6]/90 px-10 py-3.5 rounded-2xl text-xs font-black transition-all uppercase tracking-[0.2em] disabled:opacity-30 flex items-center gap-2 shadow-xl shadow-[#279da6]/20"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Create Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
