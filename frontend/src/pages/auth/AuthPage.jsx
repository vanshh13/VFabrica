import React from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { login, register } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, AlertCircle, CheckCircle2, Search, ChevronDown, Globe } from 'lucide-react';

// ─── Validation Schemas ───────────────────────────────────────────

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address').transform(val => val.trim().toLowerCase()),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    companyName: z.string().max(200, 'Company name is too long').optional().or(z.literal('')),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address').transform(val => val.trim().toLowerCase()),
    phone: z.string().min(1, 'Phone number is required').min(7, 'Phone number must be at least 7 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

// ─── Phone Input with Dynamic Country Code (Fixed Keys, Search, Identity & A11y) ─

// Dial code + realistic digit-length range per country. Ranges are approximate —
// for airtight validation, swap this for libphonenumber-js, but this is far more
// honest than a single guessed maxLength for every country.
const PHONE_CODES = {
    IN: { code: '+91', len: [10, 10] }, US: { code: '+1', len: [10, 10] }, CA: { code: '+1', len: [10, 10] },
    GB: { code: '+44', len: [10, 10] }, CN: { code: '+86', len: [11, 11] }, JP: { code: '+81', len: [9, 10] },
    DE: { code: '+49', len: [10, 11] }, FR: { code: '+33', len: [9, 9] }, IT: { code: '+39', len: [9, 10] },
    AU: { code: '+61', len: [9, 9] }, BR: { code: '+55', len: [10, 11] }, AE: { code: '+971', len: [9, 9] },
    SG: { code: '+65', len: [8, 8] }, ES: { code: '+34', len: [9, 9] }, NL: { code: '+31', len: [9, 9] },
    SE: { code: '+46', len: [7, 9] }, NO: { code: '+47', len: [8, 8] }, DK: { code: '+45', len: [8, 8] },
    FI: { code: '+358', len: [9, 10] }, PL: { code: '+48', len: [9, 9] }, RU: { code: '+7', len: [10, 10] },
    KR: { code: '+82', len: [9, 10] }, MX: { code: '+52', len: [10, 10] }, AR: { code: '+54', len: [10, 10] },
    CL: { code: '+56', len: [9, 9] }, CO: { code: '+57', len: [10, 10] }, ZA: { code: '+27', len: [9, 9] },
    NG: { code: '+234', len: [10, 10] }, KE: { code: '+254', len: [9, 9] }, EG: { code: '+20', len: [10, 10] },
    SA: { code: '+966', len: [9, 9] }, TR: { code: '+90', len: [10, 10] }, PK: { code: '+92', len: [10, 10] },
    BD: { code: '+880', len: [10, 10] }, VN: { code: '+84', len: [9, 10] }, TH: { code: '+66', len: [9, 9] },
    ID: { code: '+62', len: [9, 12] }, PH: { code: '+63', len: [10, 10] }, MY: { code: '+60', len: [9, 10] },
    NZ: { code: '+64', len: [8, 10] }, PT: { code: '+351', len: [9, 9] }, IE: { code: '+353', len: [9, 9] },
    AT: { code: '+43', len: [10, 11] }, CH: { code: '+41', len: [9, 9] }, BE: { code: '+32', len: [9, 9] },
    GR: { code: '+30', len: [10, 10] }, CZ: { code: '+420', len: [9, 9] }, RO: { code: '+40', len: [9, 9] },
    HU: { code: '+36', len: [9, 9] }, UA: { code: '+380', len: [9, 9] }, IL: { code: '+972', len: [9, 9] },
    LK: { code: '+94', len: [9, 9] }, NP: { code: '+977', len: [10, 10] }, MM: { code: '+95', len: [8, 10] },
    KH: { code: '+855', len: [8, 9] }, LA: { code: '+856', len: [9, 10] },
};

// Built once, at module load — flags/names/lengths never change at runtime,
// so there's no reason to recompute them in a useEffect on every mount.
function buildCountryList() {
    const getFlagEmoji = (cca2) =>
        String.fromCodePoint(...cca2.toUpperCase().split('').map((c) => 127397 + c.charCodeAt()));
    let regionNames = null;
    try {
        regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch { /* Intl.DisplayNames unsupported — fall back below */ }

    return Object.entries(PHONE_CODES)
        .map(([cca2, { code, len }]) => ({
            id: cca2, // cca2 is already globally unique, no need to smash code+index together
            cca2,
            code,
            flag: regionNames ? getFlagEmoji(cca2) : '🏳️',
            name: (regionNames && regionNames.of(cca2)) || cca2,
            minLength: len[0],
            maxLength: len[1],
            placeholder: 'Phone number',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
const ALL_COUNTRIES = buildCountryList();
const DEFAULT_COUNTRY = ALL_COUNTRIES.find((c) => c.cca2 === 'IN') || ALL_COUNTRIES[0];

function PhoneInput({ label, icon: Icon, error, register: registerProp, defaultValue, ...props }) {
    // Track the actual country (cca2), not just the dial code — dial codes like
    // +1 (US/CA) or +44 aren't unique, so storing only the code loses identity.
    const [selectedCca2, setSelectedCca2] = React.useState(DEFAULT_COUNTRY.cca2);
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [highlightIndex, setHighlightIndex] = React.useState(0);

    // Separate refs per breakpoint — both layouts are mounted at once (CSS-hidden,
    // not unmounted), so a single shared ref would only ever point at one of them.
    const desktopWrapRef = React.useRef(null);
    const mobileWrapRef = React.useRef(null);
    const desktopSearchRef = React.useRef(null);
    const mobileSearchRef = React.useRef(null);
    const desktopListRef = React.useRef(null);
    const mobileListRef = React.useRef(null);

    const selectedCountry = ALL_COUNTRIES.find((c) => c.cca2 === selectedCca2) || DEFAULT_COUNTRY;

    // One-time parse of an incoming E.164-style defaultValue (e.g. "+14155551234")
    // into a country + local number, so the field can be pre-filled correctly.
    React.useEffect(() => {
        if (!defaultValue) return;
        const match = ALL_COUNTRIES
            .filter((c) => defaultValue.startsWith(c.code))
            .sort((a, b) => b.code.length - a.code.length)[0]; // longest code wins (+1 vs +91)
        if (match) {
            setSelectedCca2(match.cca2);
            setPhoneNumber(defaultValue.slice(match.code.length).replace(/\D/g, ''));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        if (!showDropdown) return;
        const t = setTimeout(() => {
            const input = desktopSearchRef.current?.offsetParent ? desktopSearchRef.current : mobileSearchRef.current;
            input?.focus();
        }, 100);
        return () => clearTimeout(t);
    }, [showDropdown]);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            const insideDesktop = desktopWrapRef.current?.contains(event.target);
            const insideMobile = mobileWrapRef.current?.contains(event.target);
            if (!insideDesktop && !insideMobile) {
                setShowDropdown(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = React.useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return ALL_COUNTRIES;
        return ALL_COUNTRIES.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.code.includes(searchTerm.trim()) ||
                c.cca2.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    React.useEffect(() => {
        setHighlightIndex(0);
    }, [searchTerm, showDropdown]);

    React.useEffect(() => {
        if (!showDropdown) return;
        const list = desktopListRef.current?.offsetParent ? desktopListRef.current : mobileListRef.current;
        list?.children[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }, [highlightIndex, showDropdown]);

    const emitChange = (code, number) => {
        if (!registerProp) return;
        registerProp.onChange({ target: { value: number ? `${code}${number}` : code, name: registerProp.name } });
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLength);
        setPhoneNumber(value);
        emitChange(selectedCountry.code, value);
    };

    const handleCountrySelect = (country) => {
        setSelectedCca2(country.cca2);
        setPhoneNumber('');
        setShowDropdown(false);
        setSearchTerm('');
        emitChange(country.code, '');
    };

    const handleDropdownToggle = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowDropdown((prev) => !prev);
        setSearchTerm('');
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, filteredCountries.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const country = filteredCountries[highlightIndex];
            if (country) handleCountrySelect(country);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowDropdown(false);
            setSearchTerm('');
        }
    };

    const isComplete = phoneNumber.length >= selectedCountry.minLength && phoneNumber.length <= selectedCountry.maxLength;

    // Wire the rest of react-hook-form's register() through — dropping ref/onBlur/name
    // breaks RHF's internal field tracking and blur-triggered validation.
    const registerRest = registerProp
        ? { name: registerProp.name, ref: registerProp.ref, onBlur: registerProp.onBlur }
        : {};

    const renderSearchBox = (searchRef) => (
        <div className="p-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Type to search country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls="country-listbox"
                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSearchTerm('');
                            searchRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );

    const renderList = (listRef, compact) => (
        <div ref={listRef} id="country-listbox" role="listbox" className={`${compact ? 'max-h-56' : 'max-h-52'} overflow-y-auto overscroll-contain`}>
            {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                    <p className="font-medium">No countries found</p>
                    <p className="text-xs mt-1 text-gray-400">Try a different search term</p>
                </div>
            ) : (
                filteredCountries.map((country, idx) => {
                    const isSelected = country.cca2 === selectedCca2;
                    const isHighlighted = idx === highlightIndex;
                    return (
                        <button
                            key={country.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCountrySelect(country);
                            }}
                            className={`w-full flex items-center gap-3 ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'} text-sm transition-colors text-left border-b border-gray-50 dark:border-gray-800 last:border-b-0 ${isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : isHighlighted
                                    ? 'bg-gray-50 dark:bg-gray-700/50'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            <span className={`text-xl flex-shrink-0 ${compact ? 'w-8 text-center' : ''}`}>{country.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{country.name}</p>
                                <p className="text-xs text-gray-400 truncate">{compact ? country.cca2 : country.code}</p>
                            </div>
                            {compact && <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 font-mono font-semibold">{country.code}</span>}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                        </button>
                    );
                })
            )}
        </div>
    );

    const phoneField = (
        <div className="relative flex-1">
            <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={selectedCountry.placeholder}
                maxLength={selectedCountry.maxLength}
                aria-invalid={!!error}
                {...registerRest}
                className={`w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-800/90 border ${error
                    ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                    : isComplete
                        ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'
                    } rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                {...props}
            />
            {isComplete && !error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
            )}
            {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-stretch gap-2">
                <div className="relative flex-shrink-0" ref={desktopWrapRef}>
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={showDropdown}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropdownToggle(e);
                        }}
                        className="h-full px-2.5 py-3 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all flex items-center gap-1.5 min-w-[100px] cursor-pointer select-none"
                    >
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="font-medium text-xs">{selectedCountry.code}</span>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div
                            className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {renderSearchBox(desktopSearchRef)}
                            {renderList(desktopListRef, true)}
                        </div>
                    )}
                </div>

                {phoneField}
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden space-y-2">
                <div className="relative" ref={mobileWrapRef}>
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={showDropdown}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropdownToggle(e);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-3 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer select-none"
                    >
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="font-medium">{selectedCountry.name}</span>
                        <span className="ml-auto text-gray-400 font-mono text-xs">{selectedCountry.code}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div
                            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {renderSearchBox(mobileSearchRef)}
                            {renderList(mobileListRef, false)}
                        </div>
                    )}
                </div>

                {phoneField}
            </div>

            {error && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
            {phoneNumber.length > 0 && !isComplete && !error && (
                <p className="text-xs text-gray-400 font-medium">
                    {phoneNumber.length < selectedCountry.minLength
                        ? `${selectedCountry.minLength - phoneNumber.length} digit${selectedCountry.minLength - phoneNumber.length === 1 ? '' : 's'} more`
                        : `Up to ${selectedCountry.maxLength} digits`}
                </p>
            )}
            {isComplete && !error && (
                <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Valid {selectedCountry.name} phone number
                </p>
            )}
        </div>
    );
}

// ─── Password Strength Indicator ───────────────────────────────────
function PasswordStrength({ password }) {
    const getStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++; if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++; if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++; if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
        if (score <= 5) return { score: 3, label: 'Good', color: 'bg-emerald-500' };
        return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
    };
    const strength = getStrength(password);
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>Password Strength: {strength.label}</p>
        </div>
    );
}

// ─── Password Input Component ──────────────────────────────────────
function PasswordField({ label, register, error, showPassword, onToggle, showStrength, password }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400"><Lock className="w-4 h-4" /></div>
                <input type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800/90 border ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder="••••••••" {...register} />
                <button type="button" onClick={onToggle} className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
            {showStrength && <PasswordStrength password={password} />}
        </div>
    );
}

// ─── Text Input with Icon ──────────────────────────────────────────
function IconInput({ label, icon: Icon, error, touched, isValid, ...props }) {
    const { register: registerProp, ...rest } = props;
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400"><Icon className="w-4 h-4" /></div>
                <input className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/90 border ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-500' : isValid ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    {...rest} {...(registerProp || {})} />
                {isValid && !error && <div className="absolute right-3 text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>}
                {error && <div className="absolute right-3 text-red-500"><AlertCircle className="w-4 h-4" /></div>}
            </div>
            {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        </div>
    );
}

// ─── Main Auth Page Component ──────────────────────────────────────
export function AuthPage({ mode: modeProp, role: roleProp }) {
    const { role: roleParam, mode: modeParam } = useParams();
    const currentRole = roleProp || roleParam || 'buyer';
    const currentMode = modeProp || modeParam || 'login';
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const schema = currentMode === 'login' ? loginSchema : registerSchema;
    const { isAuthenticated, user, hydrateAuth: setAuth } = useAuthStore();
    const [loading, setLoading] = React.useState(false);
    const [serverMessage, setServerMessage] = React.useState('');
    const [isSuccess, setIsSuccess] = React.useState(false);

    React.useEffect(() => {
        if (searchParams.get('message')) setServerMessage(searchParams.get('message'));
    }, [searchParams]);

    const form = useForm({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: { email: '', password: '', confirmPassword: '', fullName: '', phone: '', companyName: '' }
    });

    const { watch, formState: { errors, dirtyFields } } = form;
    const passwordValue = watch('password');

    if (isAuthenticated && user) {
        const userRole = (user.role || '').toUpperCase();
        if (userRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'SUPPLIER') return <Navigate to="/supplier" replace />;
        return <Navigate to="/buyer" replace />;
    }

    async function handleSubmit(values) {
        setLoading(true); setServerMessage(''); setIsSuccess(false);
        try {
            if (currentMode === 'login') {
                const response = await login({ email: values.email, password: values.password });
                setAuth(response); setIsSuccess(true);
                setServerMessage('Login successful! Redirecting...');
                setTimeout(() => {
                    const primaryRole = ((response.data?.roles?.[0]) || 'BUYER').toUpperCase();
                    navigate(primaryRole === 'ADMIN' ? '/admin/dashboard' : primaryRole === 'SUPPLIER' ? '/supplier' : '/buyer');
                }, 800);
            } else {
                await register({
                    email: values.email, phone: values.phone, password: values.password,
                    fullName: values.fullName, companyName: values.companyName || undefined,
                    roleName: currentRole.toUpperCase()
                });
                setIsSuccess(true);
                setServerMessage('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/auth/login?message=' + encodeURIComponent('Registration successful! Please sign in.'));
                }, 1200);
            }
        } catch (error) {
            setIsSuccess(false);
            setServerMessage(error?.response?.data?.error || error?.message || 'Something went wrong.');
        } finally { setLoading(false); }
    }

    const shellRole = currentMode === 'login' ? 'buyer' : currentRole;
    const shellTitle = currentMode === 'login' ? 'VFabrica Portal' : `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Registration`;
    const shellDescription = currentMode === 'login'
        ? { title: 'Welcome Back', subtitle: 'Access the global VFabrica B2B textile sourcing directory.' }
        : { title: 'Join the Marketplace', subtitle: `Register as a certified ${currentRole} to request and submit quotes.` };

    return (
        <AuthShell role={shellRole} mode={currentMode} title={shellTitle} description={shellDescription}
            sideContent={<div className="text-xs text-gray-500 dark:text-gray-400">{currentMode === 'login' ? <p className="m-0">Sign in to connect with verified fabric mills, textile exporters, and chemical wholesalers.</p> : <p className="m-0">Gain access to wholesale volume rates, secure trade communication channels, and logistics tracking tools.</p>}</div>}>
            <div className="w-full max-w-xl mx-auto space-y-5">
                <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">{currentMode === 'login' ? 'Member Access' : 'Account Setup'}</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{currentMode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{currentMode === 'login' ? 'Enter your credentials to access your sourcing workspace.' : 'Fill in the details below to join the global textile marketplace.'}</p>
                </div>

                {currentMode === 'register' && (
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60">
                        {[{ value: 'buyer', label: 'Buyer', desc: 'Source fabrics' }, { value: 'supplier', label: 'Supplier', desc: 'Sell products' }].map(entry => (
                            <Link key={entry.value} to={`/auth/${entry.value}/register`} className={`text-center py-2.5 px-3 rounded-lg transition-all ${entry.value === currentRole ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                                <div className="text-sm font-semibold">{entry.label}</div>
                                <div className={`text-xs ${entry.value === currentRole ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>{entry.desc}</div>
                            </Link>
                        ))}
                    </div>
                )}

                <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                    {currentMode === 'login' && (
                        <div className="space-y-4">
                            <IconInput label="Email Address" icon={Mail} type="email" placeholder="name@company.com" register={form.register('email')} error={errors.email?.message} touched={dirtyFields.email} isValid={dirtyFields.email && !errors.email} />
                            <PasswordField label="Password" register={form.register('password')} error={errors.password?.message} showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                            <div className="flex items-center justify-between text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><span>Remember Me</span></label>
                                <Link to="/auth/forgot-password" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot Password?</Link>
                            </div>
                        </div>
                    )}

                    {currentMode === 'register' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <IconInput label="Full Name *" icon={User} placeholder="Vansh Rathod" register={form.register('fullName')} error={errors.fullName?.message} touched={dirtyFields.fullName} isValid={dirtyFields.fullName && !errors.fullName} />
                                <IconInput label="Business Name" icon={Building2} placeholder="VF Textiles Ltd (Optional)" register={form.register('companyName')} error={errors.companyName?.message} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <IconInput label="Email Address *" icon={Mail} type="email" placeholder="name@company.com" register={form.register('email')} error={errors.email?.message} touched={dirtyFields.email} isValid={dirtyFields.email && !errors.email} />
                                <PhoneInput label="Phone Number *" icon={Phone} register={form.register('phone')} error={errors.phone?.message} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PasswordField label="Password *" register={form.register('password')} error={errors.password?.message} showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} showStrength={true} password={passwordValue} />
                                <PasswordField label="Confirm Password *" register={form.register('confirmPassword')} error={errors.confirmPassword?.message} showPassword={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                            </div>
                        </div>
                    )}

                    {serverMessage && (
                        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 ${isSuccess ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
                            {isSuccess ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}<span>{serverMessage}</span>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <button type="submit" disabled={loading} className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</> : currentMode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                        <div className="text-center pt-1 text-xs text-gray-500 dark:text-gray-400">
                            {currentMode === 'login' ? <>Don't have an account? <Link to="/auth/buyer/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Register here</Link></> : <>Already have an account? <Link to="/auth/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link></>}
                        </div>
                    </div>
                </form>
            </div>
        </AuthShell>
    );
}