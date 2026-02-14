import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    Send,
    User,
    Bot,
    Plus,
    X,
    History,
    Sparkles,
    Loader2,
    ChevronRight,
    GripVertical,
    Maximize2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    addDocument,
    subscribeToCollection,
    updateDocument,
    getDocument
} from '../firebase/dbService';
import { serverTimestamp } from 'firebase/firestore';
import { getGeminiResponse } from '../firebase/geminiService';

interface ChatSession {
    id: string;
    userId: string;
    name: string;
    lastMessage: string;
    createdAt: any;
}

interface ChatMessage {
    id: string;
    chatId: string;
    role: 'user' | 'model';
    text: string;
    createdAt: any;
}

const AIChatOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const dragControls = useDragControls();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [isFetchingName, setIsFetchingName] = useState(true);

    // Resize & Drag state
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [dimensions, setDimensions] = useState({ width: 500, height: 600 });
    const [isResizing, setIsResizing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // To prevent clipping, handle viewport constraints
    const [constraints, setConstraints] = useState({ top: -1000, left: -2000, right: 0, bottom: 0 });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            // Calculate drag constraints to keep the window on screen
            // Assuming the window is absolute positioned bottom: 5rem, right: 0
            // dragConstraints are relative to the final position
            setConstraints({
                top: -(window.innerHeight - 150), // 150 is safety margin
                left: -(window.innerWidth - 100),
                right: 0,
                bottom: 20
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch user name from Firestore on load
    useEffect(() => {
        const fetchUserName = async () => {
            if (!currentUser) return;
            try {
                const userDoc = await getDocument('users', currentUser.uid);
                if (userDoc && userDoc.name) {
                    setUserName(userDoc.name);
                } else {
                    // Fallback to localStorage if Firestore is empty
                    const localName = localStorage.getItem('chat_user_name');
                    if (localName) setUserName(localName);
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
            } finally {
                setIsFetchingName(false);
            }
        };

        fetchUserName();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = subscribeToCollection(
            'ai_chats',
            (docs) => {
                const sorted = (docs as ChatSession[]).sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
                setSessions(sorted);
            },
            [{ field: 'userId', operator: '==', value: currentUser.uid }]
        );

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!activeSession || !currentUser) {
            setMessages([]);
            return;
        }

        // FIX: Added userId to query to match security rules and avoid 403 error
        const unsubscribe = subscribeToCollection(
            'ai_messages',
            (docs) => {
                const sorted = (docs as ChatMessage[]).sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return aTime - bTime;
                });
                setMessages(sorted);
            },
            [
                { field: 'chatId', operator: '==', value: activeSession.id },
                { field: 'userId', operator: '==', value: currentUser.uid }
            ]
        );

        return () => unsubscribe();
    }, [activeSession, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || !currentUser || isLoading) return;

        let currentSessionId = activeSession?.id;

        if (!currentSessionId) {
            const newSessionTitle = inputText.substring(0, 30) + (inputText.length > 30 ? '...' : '');
            const newId = await addDocument('ai_chats', {
                userId: currentUser.uid,
                name: newSessionTitle,
                lastMessage: inputText,
                createdAt: serverTimestamp(),
            });
            currentSessionId = newId;
            const newSession: ChatSession = {
                id: newId,
                userId: currentUser.uid,
                name: newSessionTitle,
                lastMessage: inputText,
                createdAt: null
            };
            setActiveSession(newSession);
        }

        const userMsg = inputText;
        setInputText('');
        setIsLoading(true);

        try {
            await addDocument('ai_messages', {
                chatId: currentSessionId,
                userId: currentUser.uid,
                role: 'user',
                text: userMsg,
                createdAt: serverTimestamp(),
            });

            await updateDocument('ai_chats', currentSessionId, {
                lastMessage: userMsg,
            });

            const history = messages.map(m => ({ role: m.role, content: m.text }));
            history.push({ role: 'user', content: userMsg });

            const aiResponseRaw = await getGeminiResponse(history, userName || undefined);
            
            // Post-processing: Strip any lingering markdown symbols (**, *) that the AI might include
            const aiResponse = aiResponseRaw.replace(/\*\*/g, '').replace(/\*/g, '');

            await addDocument('ai_messages', {
                chatId: currentSessionId,
                userId: currentUser.uid,
                role: 'model',
                text: aiResponse,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error in chat flow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveSession(null);
        setMessages([]);
        if (isMobile) setShowHistory(false);
    };

    const saveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempName.trim() || !currentUser) return;

        setIsLoading(true);
        try {
            // Save to Firestore users collection
            await updateDocument('users', currentUser.uid, {
                name: tempName.trim()
            });
            localStorage.setItem('chat_user_name', tempName.trim());
            setUserName(tempName.trim());
        } catch (error) {
            console.error('Error saving name:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Manual Resize logic
    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    };

    const resize = (e: MouseEvent) => {
        if (containerRef.current) {
            // Prevent resizing larger than viewport
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.8;

            const newWidth = Math.max(320, Math.min(maxWidth, window.innerWidth - e.clientX));
            const newHeight = Math.max(400, Math.min(maxHeight, window.innerHeight - e.clientY));

            setDimensions({
                width: newWidth,
                height: newHeight
            });
        }
    };

    const stopResizing = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            ref={containerRef}
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraints}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                width: isMobile ? '95vw' : dimensions.width,
                height: isMobile ? '70vh' : dimensions.height // Safer height for initial render
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
                position: 'fixed', // Changed to fixed for better global constraints
                bottom: '5rem',
                right: isMobile ? '2.5vw' : '1.5rem', // Added some right margin
                touchAction: 'none',
                maxHeight: '85vh',
                maxWidth: '95vw'
            }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex z-[9999]"
        >
            {/* Resize Handle (Desktop Only) */}
            {!isMobile && (
                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-[60] flex items-center justify-center hover:bg-emerald-500/10 transition-colors rounded-br-xl"
                >
                    <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
            )}

            {/* Sidebar - History */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ x: -250, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -250, opacity: 0 }}
                        className="absolute sm:relative z-20 w-[250px] h-full bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 flex flex-col"
                    >
                        <div className="p-6 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-4 h-4" /> History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="sm:hidden p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleNewChat}
                            className="mx-4 mb-4 flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm hover:shadow-md transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Chat
                        </button>

                        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
                            {sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        setActiveSession(session);
                                        if (isMobile) setShowHistory(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-2xl text-xs transition-all ${activeSession?.id === session.id
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <p className="font-bold truncate mb-1">{session.name}</p>
                                    <p className="opacity-60 truncate">{session.lastMessage}</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header / Drag Handle */}
                <div
                    onPointerDown={(e) => !isMobile && dragControls.start(e)}
                    className={`p-6 flex items-center justify-between border-b border-gray-100/50 dark:border-gray-800/50 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        {!isMobile && <GripVertical className="w-4 h-4 text-gray-400" />}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowHistory(!showHistory);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <History className={`w-5 h-5 ${showHistory ? 'text-emerald-500' : 'text-gray-400'}`} />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Plan Advisor <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                            </h3>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Gemini Pro</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isMobile && (
                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] text-gray-400">
                                <Maximize2 className="w-3 h-3" /> Drag Header
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {isFetchingName ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : !userName ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center text-center max-w-[280px] mx-auto"
                        >
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mb-6">
                                <Bot className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-bold dark:text-white mb-2">Hello there!</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">I'm your AI Plan Advisor. To get started, may I know your name?</p>
                            <form onSubmit={saveName} className="w-full relative group">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                                />
                                <button type="submit" disabled={isLoading} className="absolute right-2 top-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                                </button>
                            </form>
                        </motion.div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                            <Bot className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-sm dark:text-gray-400">Welcome, {userName}! <br /> Where are we traveling today?</p>
                            <div className="mt-8 grid grid-cols-2 gap-2 w-full">
                                {['Plan for Kedarnath', 'Packing for Bali', 'Weekend in Goa'].map(hint => (
                                    <button
                                        key={hint}
                                        onClick={() => {
                                            setInputText(hint);
                                        }}
                                        className="p-3 text-[10px] font-bold border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                                    >
                                        "{hint}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`relative max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-500/10 font-medium'
                                    : 'bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm font-normal'
                                    }`}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))
                    )}
                    {isLoading && messages.length > 0 && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {userName && (
                    <form onSubmit={handleSendMessage} className="p-6 pt-0">
                        <div className="relative group">
                            <input
                                disabled={isLoading}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask your plan advisor..."
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] px-6 py-4 pr-16 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-white transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputText.trim()}
                                className="absolute right-2 top-2 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </motion.div>
    );
};

export default AIChatOverlay;
