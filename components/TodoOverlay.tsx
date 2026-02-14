import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    X,
    ListTodo,
    Eraser,
    ArrowLeftRight,
    Bot,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addDocument, updateDocument, deleteDocument, subscribeToCollection } from '../firebase/dbService';
import { serverTimestamp } from 'firebase/firestore';
import AIChatOverlay from './AIChatOverlay';

interface Todo {
    id: string;
    userId: string;
    text: string;
    completed: boolean;
    createdAt: any;
}

const TodoOverlay: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(false);

    // State to track which button is "active" (primary)
    // Mode can be 'todo' or 'ai'
    const [activeMode, setActiveMode] = useState<'todo' | 'ai'>('todo');

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = subscribeToCollection(
            'todos',
            (docs) => {
                const sortedTodos = (docs as Todo[]).sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
                setTodos(sortedTodos);
            },
            [{ field: 'userId', operator: '==', value: currentUser.uid }]
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleAddTodo = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newTodo.trim() || !currentUser || loading) return;

        setLoading(true);
        try {
            await addDocument('todos', {
                userId: currentUser.uid,
                text: newTodo.trim(),
                completed: false,
                createdAt: serverTimestamp(),
            });
            setNewTodo('');
        } catch (error) {
            console.error('Error adding todo:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTodo = async (todo: Todo) => {
        try {
            await updateDocument('todos', todo.id, {
                completed: !todo.completed,
            });
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleDeleteTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteDocument('todos', id);
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all tasks?')) return;

        try {
            const deletePromises = todos.map((todo) => deleteDocument('todos', todo.id));
            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error clearing todos:', error);
        }
    };

    const handleSwap = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMode(prev => prev === 'todo' ? 'ai' : 'todo');
        setIsOpen(false); // Close current panel on swap
    };

    if (!currentUser) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
            {/* 2-Button Swapping System */}
            <div className="relative w-14 h-14">
                <AnimatePresence mode="popLayout">
                    {activeMode === 'todo' ? (
                        <motion.button
                            key="todo-btn"
                            layoutId="primary-btn"
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -20, zIndex: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute inset-0 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-colors z-10 group"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <ListTodo className="w-6 h-6" />}
                            {!isOpen && todos.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                    {todos.filter(t => !t.completed).length}
                                </span>
                            )}
                            {/* Tooltip */}
                            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Todo List
                            </div>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="ai-btn"
                            layoutId="primary-btn"
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -20, zIndex: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute inset-0 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-colors z-10 group"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                            {!isOpen && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                                >
                                    <Sparkles className="w-2.5 h-2.5" />
                                </motion.div>
                            )}
                            {/* Tooltip */}
                            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Plan Advisor
                            </div>
                        </motion.button>
                    )}

                    {/* Secondary "Inactive" Button (The Swapper) */}
                    <motion.button
                        key="swap-btn"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.2, rotate: 180 }}
                        onClick={handleSwap}
                        className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 transition-colors z-0"
                    >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                    </motion.button>
                </AnimatePresence>
            </div>

            {/* Todo Panel */}
            <AnimatePresence>
                {isOpen && activeMode === 'todo' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        className="absolute bottom-20 right-0 w-[320px] sm:w-[380px] h-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Task List</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{todos.length} items total</p>
                            </div>
                            {todos.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                >
                                    <Eraser className="w-3.5 h-3.5" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleAddTodo} className="p-6 pt-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newTodo.trim()}
                                    className="absolute right-2 top-2 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        {/* Todo List */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
                            {todos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
                                        <ListTodo className="w-8 h-8" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium italic">No tasks yet.</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start by adding one above!</p>
                                </div>
                            ) : (
                                todos.map((todo) => (
                                    <motion.div
                                        key={todo.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => toggleTodo(todo)}
                                        className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${todo.completed
                                                ? 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-75'
                                                : 'bg-white dark:bg-gray-800 border-gray-100/50 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900/50'
                                            }`}
                                    >
                                        <button className="flex-shrink-0 transition-transform active:scale-90">
                                            {todo.completed ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-900/20" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-emerald-400" />
                                            )}
                                        </button>

                                        <span className={`flex-1 text-sm transition-all ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through decoration-emerald-500/50 decoration-2' : 'text-gray-700 dark:text-gray-200'
                                            }`}>
                                            {todo.text}
                                        </span>

                                        <button
                                            onClick={(e) => handleDeleteTodo(todo.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Chat Overlay */}
            <AnimatePresence>
                {isOpen && activeMode === 'ai' && (
                    <AIChatOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodoOverlay;
