import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { BuyerOrdersModule } from '../../components/buyer/BuyerOrdersModule';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';

export function BuyerOrdersPage() {
    const navigate = useNavigate();
    const [message, setMessage] = React.useState('');

    return (
        <AppShell>
            <div className="min-h-screen theme-bg-page py-8">
                {/* Toast Notification */}
                {message && (
                    <div className="fixed top-20 right-4 z-50 animate-slide-in">
                        <div className="theme-card rounded-xl shadow-lg p-4 flex items-center gap-3 border theme-border-color">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm theme-text-main">{message}</p>
                            <button onClick={() => setMessage('')} className="ml-4 theme-text-subtle hover:theme-text-main">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <BuyerOrdersModule
                        onNavigateToCatalog={() => navigate('/buyer?tab=catalog')}
                        onNavigateToCart={() => navigate('/buyer?tab=cart')}
                        setMessage={setMessage}
                    />
                </div>
            </div>
        </AppShell>
    );
}
