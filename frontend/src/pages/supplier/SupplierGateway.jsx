import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../store/useAuthStore';
import { getSupplierProfile, onboardSupplier } from '../../services/supplierService';
import { Clock, Building2, CheckCircle2, ShieldCheck, ArrowRight, FileText, Globe, MapPin } from 'lucide-react';

// Approval pending screen
function ApprovalPending({ profile }) {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto my-16 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-6 shadow-xl shadow-amber-500/10">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          Application Under Review
        </h1>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
          Your supplier account for <strong className="text-gray-900 dark:text-white">{profile?.company_name || 'your company'}</strong> has been submitted and is currently being reviewed by our team. You'll receive full access once an admin approves your application.
        </p>

        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl text-left mb-6 shadow-md">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            What happens next?
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Our admin team reviews your supplier profile & business information</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Verification usually takes 1–2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Once approved, unlock complete warehouse & catalog features</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Application Status</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 capitalize">
            {profile?.approval_status || 'Pending'}
          </span>
        </div>
      </div>
    </AppShell>
  );
}

// Onboarding form for new supplier (no profile yet)
function SupplierOnboardingForm({ onComplete }) {
  const [form, setForm] = React.useState({ companyName: '', companyDescription: '', website: '', minimumOrderQuantity: '', addressLine1: '', landmark: '', zipcode: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await onboardSupplier({ ...form, minimumOrderQuantity: parseInt(form.minimumOrderQuantity) || 1 });
      onComplete();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Onboarding failed');
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto my-10 px-4">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-200 dark:border-indigo-800/60 mb-2">
            Supplier Onboarding
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Set Up Your Supplier Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tell us about your business. Your profile will be reviewed by our admin team before you gain full access.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-300 text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Business Information
            </h3>
            <div className="space-y-4">
              <Field label="Company Name *" value={form.companyName} onChange={f('companyName')} placeholder="e.g. Global Textiles Ltd." required />
              <Field label="Company Description" value={form.companyDescription} onChange={f('companyDescription')} placeholder="What fabrics do you specialize in?" as="textarea" rows={3} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Website" value={form.website} onChange={f('website')} placeholder="https://yourdomain.com" type="url" />
                <Field label="Min. Order Qty (meters)" value={form.minimumOrderQuantity} onChange={f('minimumOrderQuantity')} placeholder="e.g. 100" type="number" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Business Address
            </h3>
            <div className="space-y-4">
              <Field label="Address Line 1" value={form.addressLine1} onChange={f('addressLine1')} placeholder="Street address, building" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Landmark" value={form.landmark} onChange={f('landmark')} placeholder="Near..." />
                <Field label="Zip / Postal Code" value={form.zipcode} onChange={f('zipcode')} placeholder="e.g. 110001" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.companyName}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            {loading ? 'Submitting Application…' : (
              <>
                <span>Submit for Review</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, as, ...props }) {
  const Tag = as || 'input';
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
      <Tag {...props} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400" />
    </div>
  );
}

// Main entry — checks profile (with localStorage caching) → onboarding / pending / dashboard
export function SupplierGateway({ children }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('vf_supplier_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const cachedProfile = getCachedProfile();
  const [profileState, setProfileState] = React.useState({
    loading: !cachedProfile,
    profile: cachedProfile,
    fullData: null,
    error: null
  });

  const checkProfile = React.useCallback(async (silent = false) => {
    if (!silent && !cachedProfile) {
      setProfileState(p => ({ ...p, loading: true }));
    }
    try {
      const res = await getSupplierProfile();
      const profileData = res.data?.profile || res.data;
      localStorage.setItem('vf_supplier_profile', JSON.stringify(profileData));
      setProfileState({ loading: false, profile: profileData, fullData: res.data, error: null });
    } catch (err) {
      if (err?.response?.status === 404) {
        localStorage.removeItem('vf_supplier_profile');
        setProfileState({ loading: false, profile: null, fullData: null, error: 'no_profile' });
      } else {
        // If we have a cached profile, preserve it on transient network errors
        if (cachedProfile) {
          setProfileState({ loading: false, profile: cachedProfile, fullData: null, error: null });
        } else {
          setProfileState({ loading: false, profile: null, fullData: null, error: err?.message || 'Failed' });
        }
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) { navigate('/auth/login?message=Please log in as a Supplier'); return; }
    // Fetch in background if cached, or show loading if not cached
    checkProfile(!!cachedProfile);
  }, [isAuthenticated]);

  if (profileState.loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading your workspace…</p>
        </div>
      </AppShell>
    );
  }

  // No profile → show onboarding form
  if (profileState.error === 'no_profile') {
    return <SupplierOnboardingForm onComplete={checkProfile} />;
  }

  // Profile exists but pending approval
  if (profileState.profile && profileState.profile.approval_status === 'pending') {
    return <ApprovalPending profile={profileState.profile} />;
  }

  // Rejected
  if (profileState.profile && profileState.profile.approval_status === 'rejected') {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✕</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Application Not Approved</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Your supplier application was not approved. Please contact support at <span className="font-semibold text-indigo-600 dark:text-indigo-400">help@vfabrica.dev</span> for more information.
          </p>
        </div>
      </AppShell>
    );
  }

  // Approved → render dashboard
  return children(profileState.profile, profileState.fullData);
}
