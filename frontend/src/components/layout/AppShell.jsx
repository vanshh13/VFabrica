import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/useAuthStore';
import { AIShoppingAssistant } from '../buyer/AIShoppingAssistant';

export function AppShell({ children }) {
    const { user } = useAuthStore();
    const roleStr = (user?.role || '').toLowerCase();
    const showAI = roleStr !== 'supplier' && roleStr !== 'admin';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
            {/* Modularized Top Navbar */}
            <Navbar />

            {/* Main Content Area */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* AI Fabric Sourcing Assistant for Buyers */}
            {showAI && <AIShoppingAssistant />}

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '32px 24px 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>VF</div>
                            <strong style={{ fontFamily: 'Space Grotesk, sans-serif' }}>VFabrica</strong>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>The leading verified B2B textile sourcing marketplace connecting suppliers and buyers globally.</p>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Platform</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Link to="/buyer" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Browse Fabrics</Link>
                            <Link to="/auth/supplier/register" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Become a Supplier</Link>
                            <Link to="/auth/buyer/register" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Buyer Registration</Link>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Support</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>help@vfabrica.dev</span>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Privacy Policy</span>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Terms of Service</span>
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: 1280, margin: '24px auto 0', paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>© {new Date().getFullYear()} VFabrica Marketplace. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}