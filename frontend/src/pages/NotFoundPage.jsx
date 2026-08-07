import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

export function NotFoundPage() {
  return (
    <AppShell>
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl">
          <span className="inline-block px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
            404 Error
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight font-heading">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            The page or route you are attempting to access does not exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all text-center"
            >
              Go to Homepage
            </Link>
            <Link
              to="/buyer"
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-center"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
