import React from 'react';
import { useNavigate } from 'react-router-dom';
import { sendAIChatMessage } from '../../services/aiService';
import { useCartStore } from '../../store/useCartStore';
import { useCartAuthorization } from '../../hooks/useCartAuthorization';
import {
    Sparkles,
    Bot,
    Send,
    X,
    RefreshCw,
    ShoppingCart,
    Eye,
    ChevronDown,
    IndianRupee,
    MessageSquare,
    Zap,
    Scale,
    Search,
    BrainCircuit
} from 'lucide-react';

const QUICK_PROMPTS = [
    "✨ Suggest breathable cotton fabric for summer shirts",
    "🧵 What fabric is best for heavy outerwear & blazers?",
    "💰 Show luxury silk fabrics under ₹1,000/m",
    "📦 How does wholesale bulk ordering & MOQ work?"
];

const AI_ACTION_CHIPS = [
    { label: '🔍 Find Similar', prompt: 'Find similar fabrics in catalog with comparable GSM & weave' },
    { label: '⚖️ Compare Specs', prompt: 'Compare Cotton vs Linen fabric durability, GSM, and lead times' },
    { label: '🤖 Ask Recommendation', prompt: 'Recommend top selling fabrics for high-end boutique apparel' }
];

export function AIShoppingAssistant() {
    const navigate = useNavigate();
    const { addToCart } = useCartStore();
    const { handleAddToCart: authorizeAndAddToCart } = useCartAuthorization();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isDismissed, setIsDismissed] = React.useState(false);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [messages, setMessages] = React.useState([
        {
            role: 'assistant',
            content: "Hello! 👋 I'm VFabrica AI, your personal fabric sourcing & shopping assistant powered by Llama 3.3. How can I help you with fabric selection, GSM, wholesale pricing, or catalog recommendations today?",
            recommendedProducts: []
        }
    ]);

    const chatEndRef = React.useRef(null);

    const handleSend = async (userText = input) => {
        const text = userText.trim();
        if (!text || loading) return;

        const newMessages = [
            ...messages,
            { role: 'user', content: text }
        ];

        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const history = newMessages.slice(1, -1).map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await sendAIChatMessage({
                message: text,
                history
            });

            if (res.success && res.data) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: res.data.reply,
                        recommendedProducts: res.data.recommendedProducts || []
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: "I'm having trouble connecting right now. Please try asking again in a moment!",
                        recommendedProducts: []
                    }
                ]);
            }
        } catch (err) {
            console.error('AI Error:', err);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "An unexpected error occurred while consulting VFabrica AI.",
                    recommendedProducts: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Global listener supporting context query prompts (e.g. order tracking, product specs)
    React.useEffect(() => {
        const handleOpen = (e) => {
            setIsOpen(true);
            setIsDismissed(false);
            if (e.detail?.prompt) {
                setTimeout(() => {
                    handleSend(e.detail.prompt);
                }, 100);
            }
        };
        window.addEventListener('open-ai-assistant', handleOpen);
        return () => window.removeEventListener('open-ai-assistant', handleOpen);
    }, [messages]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleProductClick = (productId) => {
        setIsOpen(false);
        navigate(`/buyer/product/${productId}`);
    };

    const handleQuickAddToCart = (e, product) => {
        e.stopPropagation();
        authorizeAndAddToCart(product);
    };

    return (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 max-w-[calc(100vw-2rem)]">
            {/* Floating Trigger Badge */}
            {!isOpen && !isDismissed && (
                <div className="group relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4.5 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-semibold shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300 border border-white/25">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 text-left cursor-pointer"
                    >
                        <div className="relative">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-ping" />
                        </div>
                        <span className="text-xs sm:text-sm tracking-wide font-bold">Ask AI Sourcing Assistant</span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDismissed(true);
                        }}
                        className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-1 cursor-pointer"
                        title="Dismiss floating badge"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {!isOpen && isDismissed && (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setIsDismissed(false);
                    }}
                    className="p-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl hover:scale-110 transition-all cursor-pointer border border-white/20"
                    title="Open AI Fabric Assistant"
                >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[calc(100vw-2rem)] sm:w-[420px] h-[480px] sm:h-[560px] max-h-[75vh] bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-3xl shadow-2xl border theme-border-color flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base leading-tight">VFabrica AI Assistant</h3>
                                    <span className="text-[10px] bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                        Live
                                    </span>
                                </div>
                                <p className="text-xs text-amber-100 font-medium">Llama 3.3 • Fabric & Order Assistant</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/90 hover:text-white cursor-pointer"
                                title="Minimize"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/90 hover:text-white cursor-pointer"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick AI Action Chips Row */}
                    <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {AI_ACTION_CHIPS.map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(chip.prompt)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-600 hover:text-white transition-all whitespace-nowrap shadow-2xs cursor-pointer"
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-950/40 text-sm">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-start gap-2 max-w-[88%]">
                                    {m.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`p-3.5 rounded-2xl ${
                                            m.role === 'user'
                                                ? 'bg-amber-600 text-white rounded-br-none shadow-md shadow-amber-600/10'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700/80 shadow-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                                        {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/70 space-y-2">
                                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Zap className="w-3.5 h-3.5" />
                                                    Recommended Products ({m.recommendedProducts.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {m.recommendedProducts.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => handleProductClick(p.id)}
                                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all hover:shadow-md group/card"
                                                        >
                                                            {p.primary_image ? (
                                                                <img
                                                                    src={p.primary_image}
                                                                    alt={p.name}
                                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                                    <Bot className="w-5 h-5" />
                                                                </div>
                                                            )}

                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400">
                                                                    {p.name}
                                                                </h4>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                                    {p.category_name || 'Fabric'} • MOQ: {p.minimum_order_quantity || 1}{p.unit_symbol || 'm'}
                                                                </p>
                                                                <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-0.5">
                                                                    <IndianRupee className="w-3 h-3" />
                                                                    {Number(p.base_price || 0).toFixed(2)}/{p.unit_symbol || 'm'}
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={(e) => handleQuickAddToCart(e, p)}
                                                                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex-shrink-0 shadow-sm cursor-pointer"
                                                                title="Add to Cart"
                                                            >
                                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div className="pt-2 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
                                    Suggested questions:
                                </p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(prompt)}
                                            className="text-left text-xs p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 hover:border-amber-500 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-xs cursor-pointer"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs p-2 bg-white dark:bg-gray-800 rounded-xl w-fit border border-gray-200 dark:border-gray-700 shadow-sm">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                <span>VFabrica AI is analyzing data...</span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Input Bar */}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask AI about fabrics, order status, specs..."
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
