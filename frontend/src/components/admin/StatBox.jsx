import React from 'react';

export function StatBox({ title, value, icon: Icon, color = 'indigo', subtext, alert = false, onClick }) {
    const colorClasses = {
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20'
    };

    return (
        <div
            onClick={onClick}
            className={`theme-card p-5 transition duration-200 ${onClick ? 'cursor-pointer hover:border-[var(--primary)] hover:shadow-md' : ''
                } ${alert ? 'border-amber-500/50 ring-2 ring-amber-500/20' : ''}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider theme-text-subtle">
                    {title}
                </span>
                <div className={`p-2.5 rounded-xl border ${colorClasses[color] || colorClasses.indigo}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className="mt-3">
                <div className="text-2xl font-black theme-text-main tracking-tight font-sans">
                    {value}
                </div>
                {subtext && (
                    <p className="text-xs theme-text-subtle mt-1">
                        {subtext}
                    </p>
                )}
            </div>
        </div>
    );
}

