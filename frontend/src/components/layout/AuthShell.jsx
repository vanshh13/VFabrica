import React from 'react';
import { Navbar } from './Navbar';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// Category badge — small static label
// ─────────────────────────────────────────────────────────────────
const CATEGORY_SWATCH = {
    Cotton: '#ddd6fe',
    Linen: '#fde68a',
    Silk: '#f5d0fe',
    Denim: '#93c5fd',
};

const CategoryBadge = ({ label }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 dark:bg-gray-900/70 backdrop-blur-md border border-white/70 dark:border-white/10 shadow-sm">
        <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-black/5"
            style={{ backgroundColor: CATEGORY_SWATCH[label] }}
        />
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
            {label}
        </span>
    </div>
);

// ─────────────────────────────────────────────────────────────────
// Gradient Orbs (page-wide ambient background — unchanged)
// ─────────────────────────────────────────────────────────────────
function GradientOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute w-[450px] h-[450px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
                    top: '5%',
                    left: '-8%',
                }}
                animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -25, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute w-[380px] h-[380px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
                    bottom: '8%',
                    right: '-5%',
                }}
                animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0], y: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            />
        </div>
    );
}

export function AuthShell({ title, description, sideContent, children }) {
    const headline = typeof description === 'string'
        ? description
        : description?.title || 'Source Premium Textiles Worldwide';
    const subheadline = typeof description === 'string'
        ? null
        : description?.subtitle || 'Connect with verified textile manufacturers, mills, exporters, and wholesalers.';

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative overflow-hidden">
            {/* Background Effects */}
            <GradientOrbs />

            {/* Navbar */}
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 items-center relative z-10">

                {/* ─── Left Panel: Textile Showcase (real photo, static) ── */}
                <aside className="lg:col-span-5 flex flex-col justify-between space-y-8">
                    <div className="space-y-8">
                        {/* Badge */}
                        <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            {title || 'Global Textile Network'}
                        </span>

                        {/* Headline */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-[2.65rem] font-extrabold tracking-tight mb-3 leading-[1.08] text-gray-900 dark:text-white">
                                {headline}
                            </h1>
                            {subheadline && (
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                                    {subheadline}
                                </p>
                            )}
                        </div>

                        {/* Photo Showcase Card */}
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl shadow-indigo-900/10">
                            <img
                                src="https://images.openai.com/static-rsc-4/zKl-zpcNrnmj8aWK52SSmosvbxCMzlj9R_-kGIPTzbRNvzzUH9JP_4Li6czvxgyE6LGy1mKImni9w8tzWXgqHyIRIacTGGV7NIG2si_HiOURQaxmt_poWDHeV6vQoxxrGVhkW36rHQJSMzA49pTHujxQiWkclEHYAlqY4UvniD-LWVN2mpHyEV0UhaS_T1pd?purpose=fullsize"
                                alt="Stacked rolls of colorful textile fabric"
                                className="w-full h-72 lg:h-80 object-cover"
                                loading="lazy"
                            />

                            {/* readability gradient for the badges/caption */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                            {/* category badges, overlaid top-left */}
                            {/* <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[80%]">
                                <CategoryBadge label="Cotton" />
                                <CategoryBadge label="Linen" />
                                <CategoryBadge label="Silk" />
                                <CategoryBadge label="Denim" />
                            </div> */}

                            {/* caption */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                <strong className="block font-semibold mb-1 text-sm lg:text-base">
                                    Global Textile Sourcing Platform
                                </strong>
                                <p className="text-xs lg:text-sm text-white/80 leading-relaxed">
                                    Connect directly with verified fabric mills, compare specifications, and streamline your procurement process.
                                </p>
                            </div>
                        </div>
                    </div>

                    {sideContent && (
                        <div className="pt-4 border-t border-gray-200/60 dark:border-gray-800/60">
                            {sideContent}
                        </div>
                    )}
                </aside>

                {/* ─── Right Panel: Form Card ────────────────────────────── */}
                <main className="lg:col-span-7 flex justify-center">
                    <motion.div
                        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 transition-all relative overflow-hidden"
                        initial={{ opacity: 0, y: 25, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        whileHover={{ boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.2)' }}
                    >
                        {/* Animated gradient top bar */}
                        <motion.div
                            className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
                                backgroundSize: '200% 100%',
                            }}
                            animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />

                        {children}
                    </motion.div>
                </main>

            </div>
        </div>
    );
}