import React from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { requestPasswordReset } from '../../services/authService';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

export function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const form = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  async function handleReset(values) {
    setMessage('');
    try {
      const response = await requestPasswordReset(values);
      setSent(true);
      setMessage(response.message || 'Password reset link sent to your email.');
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || 'Failed to send reset link.');
    }
  }

  return (
    <AuthShell
      role="buyer"
      mode="login"
      title="Password Recovery"
      description="Enter your account email and we will send reset instructions."
      sideContent={
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300">
          <strong className="block mb-1 font-semibold">Security Note</strong>
          <p className="m-0 leading-relaxed">Password reset links are single-use and expire after 60 minutes for security.</p>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
            Access Recovery
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your registered email address to receive reset instructions.
          </p>
        </div>

        {!sent ? (
          <form className="space-y-4" onSubmit={form.handleSubmit(handleReset)}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />

            {message && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
                {message}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Send Reset Instructions
              </button>
              <Link
                to="/auth/login"
                className="w-full block text-center py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <strong className="block text-base font-bold text-gray-900 dark:text-white">Reset Request Sent</strong>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
            <Link
              to="/auth/login"
              className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
