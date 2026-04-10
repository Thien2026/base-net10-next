import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Huỷ",
    isDanger = false,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
            <div 
                className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-6 text-center animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
                    <AlertTriangle className={`w-8 h-8 ${isDanger ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <div className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    {message}
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
