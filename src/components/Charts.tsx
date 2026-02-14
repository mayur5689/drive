'use client';

import React from 'react';

// --- BurnUp Chart ---
export const BurnUpChart: React.FC = () => {
    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full h-[240px] relative">
                <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[1, 2, 3, 4].map((i) => (
                        <line key={i} x1="0" y1={240 - i * 60} x2="1000" y2={240 - i * 60} stroke="#1E1E22" strokeWidth="1" />
                    ))}

                    {/* Area Fills */}
                    <path d="M0,240 L100,220 L200,210 L300,180 L400,160 L500,140 L600,120 L700,90 L800,70 L900,50 L1000,40 L1000,240 Z" fill="rgba(124, 134, 255, 0.1)" />
                    <path d="M0,240 L100,230 L200,225 L300,210 L400,200 L500,190 L600,180 L700,170 L800,165 L900,160 L1000,155 L1000,240 Z" fill="rgba(81, 162, 255, 0.2)" />
                    <path d="M0,240 L100,235 L200,232 L300,225 L400,220 L500,218 L600,215 L700,212 L800,210 L900,208 L1000,205 L1000,240 Z" fill="rgba(43, 127, 255, 0.3)" />

                    {/* Lines */}
                    <path d="M0,240 L100,220 L200,210 L300,180 L400,160 L500,140 L600,120 L700,90 L800,70 L900,50 L1000,40" fill="none" stroke="#7C86FF" strokeWidth="2" />
                    <path d="M0,240 L100,230 L200,225 L300,210 L400,200 L500,190 L600,180 L700,170 L800,165 L900,160 L1000,155" fill="none" stroke="#51A2FF" strokeWidth="2" />
                    <path d="M0,240 L100,235 L200,232 L300,225 L400,220 L500,218 L600,215 L700,212 L800,210 L900,208 L1000,205" fill="none" stroke="#2B7FFF" strokeWidth="2" />
                </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2B7FFF] shrink-0" />
                    <span className="text-[11px] font-medium text-santas-gray uppercase tracking-widest">Open</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#51A2FF] shrink-0" />
                    <span className="text-[11px] font-medium text-santas-gray uppercase tracking-widest">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#7C86FF] shrink-0" />
                    <span className="text-[11px] font-medium text-santas-gray uppercase tracking-widest">Done</span>
                </div>
            </div>
        </div>
    );
};

// --- Main Charts Wrapper ---
const Charts: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-iron uppercase tracking-widest">Request Burn-up</h3>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 rounded-md bg-shark text-[10px] text-santas-gray font-bold">DAILY</div>
                    <div className="px-2 py-0.5 rounded-md bg-[#7C86FF]/10 text-[#7C86FF] text-[10px] font-bold">MONTHLY</div>
                </div>
            </div>
            <BurnUpChart />
        </div>
    );
};

export default Charts;
